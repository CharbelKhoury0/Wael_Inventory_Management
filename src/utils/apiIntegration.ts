import type { Item, Movement, Transaction, Receipt, Alert } from '../store/inventoryStore';

export interface APIConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  webhookUrl?: string;
  enableRealTime: boolean;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  source: 'inventory' | 'movement' | 'transaction' | 'alert';
  warehouseId: string;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
  lastSync: string;
}

export interface ExternalSystemConfig {
  name: string;
  type: 'ERP' | 'WMS' | 'CRM' | 'ACCOUNTING' | 'ECOMMERCE';
  endpoint: string;
  apiKey: string;
  mappings: Record<string, string>;
  syncInterval: number; // minutes
  enabled: boolean;
}

class APIIntegrationService {
  private config: APIConfig;
  private eventListeners: Map<string, Function[]> = new Map();
  private syncQueue: Array<{ type: string; data: any; timestamp: string }> = [];
  private isOnline: boolean = navigator.onLine;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: APIConfig) {
    this.config = config;
    this.setupEventListeners();
    this.startPeriodicSync();
  }

  private setupEventListeners(): void {
    // Online/Offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Visibility change for background sync
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.processSyncQueue();
      }
    });
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    retryCount: number = 0
  ): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-Warehouse-ID': this.getWarehouseId()
      },
      signal: AbortSignal.timeout(this.config.timeout)
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (retryCount < this.config.retryAttempts) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(endpoint, method, data, retryCount + 1);
      }
      throw error;
    }
  }

  private getWarehouseId(): string {
    return localStorage.getItem('current-warehouse-id') || 'default';
  }

  private addToSyncQueue(type: string, data: any): void {
    this.syncQueue.push({
      type,
      data,
      timestamp: new Date().toISOString()
    });

    // Limit queue size
    if (this.syncQueue.length > 1000) {
      this.syncQueue = this.syncQueue.slice(-1000);
    }

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const batch = this.syncQueue.splice(0, 50); // Process in batches
    
    try {
      await this.makeRequest('/sync/batch', 'POST', { items: batch });
      this.emit('sync:success', { synced: batch.length });
    } catch (error) {
      // Put items back in queue for retry
      this.syncQueue.unshift(...batch);
      this.emit('sync:error', { error: error.message });
    }
  }

  private startPeriodicSync(): void {
    setInterval(() => {
      if (this.isOnline) {
        this.processSyncQueue();
      }
    }, 30000); // Sync every 30 seconds
  }

  // Event system
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Webhook functionality
  public async sendWebhook(payload: WebhookPayload): Promise<void> {
    if (!this.config.webhookUrl) return;

    try {
      await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': await this.generateWebhookSignature(payload)
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Webhook delivery failed:', error);
      // Queue for retry
      this.addToSyncQueue('webhook', payload);
    }
  }

  private async generateWebhookSignature(payload: WebhookPayload): Promise<string> {
    const message = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const key = encoder.encode(this.config.apiKey);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Item operations
  public async syncItems(items: Item[]): Promise<SyncResult> {
    try {
      const result = await this.makeRequest('/items/sync', 'POST', { items });
      
      // Send webhook notification
      if (this.config.enableRealTime) {
        await this.sendWebhook({
          event: 'items.synced',
          timestamp: new Date().toISOString(),
          data: { count: items.length },
          source: 'inventory',
          warehouseId: this.getWarehouseId()
        });
      }
      
      return {
        success: true,
        synced: result.synced || items.length,
        failed: result.failed || 0,
        errors: result.errors || [],
        lastSync: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        synced: 0,
        failed: items.length,
        errors: [error.message],
        lastSync: new Date().toISOString()
      };
    }
  }

  public async createItem(item: Omit<Item, 'id'>): Promise<Item> {
    const result = await this.makeRequest('/items', 'POST', item);
    
    if (this.config.enableRealTime) {
      await this.sendWebhook({
        event: 'item.created',
        timestamp: new Date().toISOString(),
        data: result,
        source: 'inventory',
        warehouseId: this.getWarehouseId()
      });
    }
    
    return result;
  }

  public async updateItem(id: string, updates: Partial<Item>): Promise<Item> {
    const result = await this.makeRequest(`/items/${id}`, 'PUT', updates);
    
    if (this.config.enableRealTime) {
      await this.sendWebhook({
        event: 'item.updated',
        timestamp: new Date().toISOString(),
        data: { id, updates, result },
        source: 'inventory',
        warehouseId: this.getWarehouseId()
      });
    }
    
    return result;
  }

  public async deleteItem(id: string): Promise<void> {
    await this.makeRequest(`/items/${id}`, 'DELETE');
    
    if (this.config.enableRealTime) {
      await this.sendWebhook({
        event: 'item.deleted',
        timestamp: new Date().toISOString(),
        data: { id },
        source: 'inventory',
        warehouseId: this.getWarehouseId()
      });
    }
  }

  // Movement operations
  public async createMovement(movement: Omit<Movement, 'id' | 'timestamp'>): Promise<Movement> {
    const result = await this.makeRequest('/movements', 'POST', movement);
    
    if (this.config.enableRealTime) {
      await this.sendWebhook({
        event: 'movement.created',
        timestamp: new Date().toISOString(),
        data: result,
        source: 'movement',
        warehouseId: this.getWarehouseId()
      });
    }
    
    return result;
  }

  public async updateMovementStatus(id: string, status: string): Promise<Movement> {
    const result = await this.makeRequest(`/movements/${id}/status`, 'PUT', { status });
    
    if (this.config.enableRealTime) {
      await this.sendWebhook({
        event: 'movement.status_updated',
        timestamp: new Date().toISOString(),
        data: { id, status, result },
        source: 'movement',
        warehouseId: this.getWarehouseId()
      });
    }
    
    return result;
  }

  // Transaction operations
  public async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const result = await this.makeRequest('/transactions', 'POST', transaction);
    
    if (this.config.enableRealTime) {
      await this.sendWebhook({
        event: 'transaction.created',
        timestamp: new Date().toISOString(),
        data: result,
        source: 'transaction',
        warehouseId: this.getWarehouseId()
      });
    }
    
    return result;
  }

  // Alert operations
  public async sendAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Promise<void> {
    await this.makeRequest('/alerts', 'POST', alert);
    
    if (this.config.enableRealTime) {
      await this.sendWebhook({
        event: 'alert.created',
        timestamp: new Date().toISOString(),
        data: alert,
        source: 'alert',
        warehouseId: this.getWarehouseId()
      });
    }
  }

  // External system integration
  public async integrateWithExternalSystem(config: ExternalSystemConfig): Promise<boolean> {
    try {
      // Test connection
      const testResponse = await fetch(`${config.endpoint}/health`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!testResponse.ok) {
        throw new Error(`Connection test failed: ${testResponse.statusText}`);
      }

      // Save configuration
      const savedConfigs = this.getExternalSystemConfigs();
      savedConfigs[config.name] = config;
      localStorage.setItem('external-system-configs', JSON.stringify(savedConfigs));

      // Start sync if enabled
      if (config.enabled) {
        this.startExternalSystemSync(config);
      }

      return true;
    } catch (error) {
      console.error(`Failed to integrate with ${config.name}:`, error);
      return false;
    }
  }

  private getExternalSystemConfigs(): Record<string, ExternalSystemConfig> {
    const saved = localStorage.getItem('external-system-configs');
    return saved ? JSON.parse(saved) : {};
  }

  private startExternalSystemSync(config: ExternalSystemConfig): void {
    const intervalId = setInterval(async () => {
      try {
        await this.syncWithExternalSystem(config);
      } catch (error) {
        console.error(`Sync failed for ${config.name}:`, error);
      }
    }, config.syncInterval * 60 * 1000);

    // Store interval ID for cleanup
    this.retryTimeouts.set(config.name, intervalId);
  }

  private async syncWithExternalSystem(config: ExternalSystemConfig): Promise<void> {
    // Get data from external system
    const response = await fetch(`${config.endpoint}/data`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    const externalData = await response.json();
    
    // Transform data using mappings
    const transformedData = this.transformExternalData(externalData, config.mappings);
    
    // Send to our API
    await this.makeRequest('/external-sync', 'POST', {
      source: config.name,
      type: config.type,
      data: transformedData
    });

    this.emit('external-sync:success', { system: config.name, records: transformedData.length });
  }

  private transformExternalData(data: any[], mappings: Record<string, string>): any[] {
    return data.map(item => {
      const transformed: any = {};
      
      for (const [ourField, theirField] of Object.entries(mappings)) {
        if (item[theirField] !== undefined) {
          transformed[ourField] = item[theirField];
        }
      }
      
      return transformed;
    });
  }

  // Real-time updates via WebSocket
  public setupRealTimeUpdates(): void {
    if (!this.config.enableRealTime) return;

    const wsUrl = this.config.baseUrl.replace('http', 'ws') + '/ws';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Real-time connection established');
      ws.send(JSON.stringify({
        type: 'auth',
        token: this.config.apiKey,
        warehouseId: this.getWarehouseId()
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleRealTimeMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Real-time connection closed, attempting to reconnect...');
      setTimeout(() => this.setupRealTimeUpdates(), 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private handleRealTimeMessage(message: any): void {
    switch (message.type) {
      case 'item_updated':
        this.emit('realtime:item_updated', message.data);
        break;
      case 'movement_created':
        this.emit('realtime:movement_created', message.data);
        break;
      case 'alert_triggered':
        this.emit('realtime:alert_triggered', message.data);
        break;
      case 'stock_level_changed':
        this.emit('realtime:stock_changed', message.data);
        break;
      default:
        console.log('Unknown real-time message type:', message.type);
    }
  }

  // Bulk operations
  public async bulkUpdateItems(updates: Array<{ id: string; data: Partial<Item> }>): Promise<SyncResult> {
    try {
      const result = await this.makeRequest('/items/bulk-update', 'POST', { updates });
      
      if (this.config.enableRealTime) {
        await this.sendWebhook({
          event: 'items.bulk_updated',
          timestamp: new Date().toISOString(),
          data: { count: updates.length },
          source: 'inventory',
          warehouseId: this.getWarehouseId()
        });
      }
      
      return {
        success: true,
        synced: result.updated || updates.length,
        failed: result.failed || 0,
        errors: result.errors || [],
        lastSync: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        synced: 0,
        failed: updates.length,
        errors: [error.message],
        lastSync: new Date().toISOString()
      };
    }
  }

  // Data export
  public async exportData(format: 'json' | 'csv' | 'xlsx', filters?: any): Promise<Blob> {
    const response = await fetch(`${this.config.baseUrl}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({ format, filters })
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  // Health check
  public async healthCheck(): Promise<{ status: string; latency: number; features: string[] }> {
    const start = Date.now();
    const result = await this.makeRequest('/health');
    const latency = Date.now() - start;
    
    return {
      status: result.status || 'unknown',
      latency,
      features: result.features || []
    };
  }

  // Cleanup
  public destroy(): void {
    // Clear all timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
    
    // Clear event listeners
    this.eventListeners.clear();
  }
}

// Factory function
export const createAPIIntegration = (config: APIConfig): APIIntegrationService => {
  return new APIIntegrationService(config);
};

// Default configuration
export const defaultAPIConfig: APIConfig = {
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  apiKey: process.env.REACT_APP_API_KEY || '',
  timeout: 30000,
  retryAttempts: 3,
  enableRealTime: true
};

// Webhook utilities
export const createWebhookPayload = (
  event: string,
  data: any,
  source: WebhookPayload['source'],
  warehouseId: string
): WebhookPayload => {
  return {
    event,
    timestamp: new Date().toISOString(),
    data,
    source,
    warehouseId
  };
};

// External system presets
export const externalSystemPresets: Record<string, Partial<ExternalSystemConfig>> = {
  'SAP': {
    type: 'ERP',
    mappings: {
      'sku': 'material_number',
      'name': 'material_description',
      'quantity': 'stock_quantity',
      'price': 'standard_price'
    },
    syncInterval: 60
  },
  'Oracle WMS': {
    type: 'WMS',
    mappings: {
      'sku': 'item_id',
      'location': 'location_code',
      'quantity': 'on_hand_qty'
    },
    syncInterval: 30
  },
  'Shopify': {
    type: 'ECOMMERCE',
    mappings: {
      'sku': 'sku',
      'name': 'title',
      'quantity': 'inventory_quantity',
      'price': 'price'
    },
    syncInterval: 15
  },
  'QuickBooks': {
    type: 'ACCOUNTING',
    mappings: {
      'sku': 'item_ref',
      'name': 'name',
      'price': 'unit_price'
    },
    syncInterval: 120
  }
};

export default APIIntegrationService;
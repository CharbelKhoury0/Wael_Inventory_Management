// API Service Layer for Production Implementation
// This provides a foundation for the backend integration

export interface APIResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
  timestamp: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

class APIServiceError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'APIServiceError';
  }
}

export class APIService {
  private baseURL: string;
  private authToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string = process.env.REACT_APP_API_URL || 'http://localhost:3001/api') {
    this.baseURL = baseURL;
    this.loadTokens();
  }

  private loadTokens(): void {
    this.authToken = localStorage.getItem('auth_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private saveTokens(authToken: string, refreshToken: string): void {
    this.authToken = authToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private clearTokens(): void {
    this.authToken = null;
    this.refreshToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401 && this.refreshToken) {
        // Try to refresh token
        const refreshed = await this.refreshAuthToken();
        if (refreshed) {
          // Retry original request with new token
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${this.authToken}`,
          };
          const retryResponse = await fetch(url, config);
          return this.handleResponse<T>(retryResponse);
        }
      }
      
      return this.handleResponse<T>(response);
    } catch (error) {
      throw new APIServiceError(
        0,
        'NETWORK_ERROR',
        'Network request failed',
        { originalError: error }
      );
    }
  }

  private async handleResponse<T>(response: Response): Promise<APIResponse<T>> {
    const contentType = response.headers.get('content-type');
    
    if (!contentType?.includes('application/json')) {
      throw new APIServiceError(
        response.status,
        'INVALID_RESPONSE',
        'Invalid response format'
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new APIServiceError(
        response.status,
        data.code || 'API_ERROR',
        data.message || 'API request failed',
        data.details
      );
    }

    return data;
  }

  private async refreshAuthToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.saveTokens(data.authToken, data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    this.clearTokens();
    return false;
  }

  // Authentication methods
  async login(email: string, password: string): Promise<APIResponse<{
    user: any;
    authToken: string;
    refreshToken: string;
  }>> {
    const response = await this.request<{
      user: any;
      authToken: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.status === 'success') {
      this.saveTokens(response.data.authToken, response.data.refreshToken);
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearTokens();
    }
  }

  // Items API
  async getItems(params?: {
    page?: number;
    limit?: number;
    category?: string;
    location?: string;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.location) queryParams.append('location', params.location);
    if (params?.search) queryParams.append('search', params.search);

    return this.request<any[]>(`/items?${queryParams}`);
  }

  async createItem(item: any): Promise<APIResponse<any>> {
    return this.request<any>('/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateItem(id: string, updates: any): Promise<APIResponse<any>> {
    return this.request<any>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteItem(id: string): Promise<APIResponse<void>> {
    return this.request<void>(`/items/${id}`, {
      method: 'DELETE',
    });
  }

  // Transactions API
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PaginatedResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

    return this.request<any[]>(`/transactions?${queryParams}`);
  }

  async createTransaction(transaction: any): Promise<APIResponse<any>> {
    return this.request<any>('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  // Movements API
  async getMovements(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<PaginatedResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);

    return this.request<any[]>(`/movements?${queryParams}`);
  }

  async createMovement(movement: any): Promise<APIResponse<any>> {
    return this.request<any>('/movements', {
      method: 'POST',
      body: JSON.stringify(movement),
    });
  }

  // Receipts API
  async getReceipts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    supplier?: string;
  }): Promise<PaginatedResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.supplier) queryParams.append('supplier', params.supplier);

    return this.request<any[]>(`/receipts?${queryParams}`);
  }

  async createReceipt(receipt: any): Promise<APIResponse<any>> {
    return this.request<any>('/receipts', {
      method: 'POST',
      body: JSON.stringify(receipt),
    });
  }

  async updateReceipt(id: string, updates: any): Promise<APIResponse<any>> {
    return this.request<any>(`/receipts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Analytics API
  async getAnalytics(params?: {
    dateFrom?: string;
    dateTo?: string;
    warehouse?: string;
  }): Promise<APIResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.warehouse) queryParams.append('warehouse', params.warehouse);

    return this.request<any>(`/analytics?${queryParams}`);
  }

  // File upload
  async uploadFile(file: File, type: 'item-image' | 'receipt-document'): Promise<APIResponse<{
    url: string;
    filename: string;
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      headers: {
        ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
      },
      body: formData,
    });

    return this.handleResponse(response);
  }
}

// Export singleton instance
export const apiService = new APIService();

// React hook for API operations
export const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<APIServiceError | null>(null);

  const execute = useCallback(async <T>(
    operation: () => Promise<APIResponse<T>>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await operation();
      return response.data;
    } catch (err) {
      const apiError = err instanceof APIServiceError ? err : new APIServiceError(
        500,
        'UNKNOWN_ERROR',
        'An unexpected error occurred'
      );
      setError(apiError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error };
};
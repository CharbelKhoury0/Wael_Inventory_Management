import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface Item {
  id: string;
  sku: string;
  name: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  location: string;
  category: string;
  minStock: number;
  barcode?: string;
  supplier?: string;
  lastUpdated?: string;
}

export interface Movement {
  id: string;
  type: 'Arrival' | 'Departure';
  transportType: 'Container' | 'Truck';
  truckPlate: string;
  containerId?: string;
  truckInfo?: {
    plateNumber: string;
    trailerInfo?: string;
    capacity?: string;
  };
  containerInfo?: {
    containerId: string;
    sealNumber?: string;
    size?: string;
    type?: string;
  };
  driverName: string;
  driverPhone?: string;
  driverEmail?: string;
  timestamp: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  notes?: string;
  products?: Product[];
  isLocked?: boolean;
  arrivalTime?: string;
  departureTime?: string;
  origin?: string;
  destination?: string;
}

export interface Product {
  id: string;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  condition: 'Good' | 'Damaged' | 'Excellent';
  value?: number;
  description?: string;
  barcode?: string;
}

export interface Transaction {
  id: string;
  type: 'Inbound' | 'Outbound';
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
  supplier?: string;
  customer?: string;
  notes?: string;
}

export interface Receipt {
  id: string;
  supplierName: string;
  type: 'Inbound' | 'Outbound';
  date: string;
  status: 'Pending' | 'Received' | 'Rejected';
  totalAmount: string;
  poNumber: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: string;
    total: string;
  }[];
  notes?: string;
}

export interface ContainerContents {
  containerId: string;
  products: Product[];
  isLocked: boolean;
  lastUpdated: string;
  totalValue: number;
  totalItems: number;
}

export interface Alert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'movement' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isResolved: boolean;
  itemId?: string;
  actionRequired: boolean;
}

export interface DeletedItem extends Item {
  deletedAt: string;
  deletedBy?: string;
}

// Store interface
interface InventoryStore {
  // State
  items: Item[];
  deletedItems: DeletedItem[];
  movements: Movement[];
  transactions: Transaction[];
  receipts: Receipt[];
  containerContents: ContainerContents[];
  alerts: Alert[];
  
  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  
  // Actions
  setItems: (items: Item[]) => void;
  addItem: (item: Item) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  restoreItem: (id: string) => void;
  permanentDeleteItem: (id: string) => void;
  setDeletedItems: (deletedItems: DeletedItem[]) => void;
  
  setMovements: (movements: Movement[]) => void;
  addMovement: (movement: Movement) => void;
  updateMovement: (id: string, updates: Partial<Movement>) => void;
  deleteMovement: (id: string) => void;
  
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  
  setReceipts: (receipts: Receipt[]) => void;
  addReceipt: (receipt: Receipt) => void;
  updateReceipt: (id: string, updates: Partial<Receipt>) => void;
  
  setContainerContents: (contents: ContainerContents[]) => void;
  addContainerContents: (contents: ContainerContents) => void;
  updateContainerContents: (containerId: string, updates: Partial<ContainerContents>) => void;
  
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  markAlertAsRead: (id: string) => void;
  markAlertAsResolved: (id: string) => void;
  
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  
  // Utility functions
  getItemById: (id: string) => Item | undefined;
  getMovementById: (id: string) => Movement | undefined;
  getContainerContents: (containerId: string) => ContainerContents | undefined;
  getUnreadAlertsCount: () => number;
  getLowStockItems: () => Item[];
  
  // Initialize with sample data
  initializeData: () => void;
}

// Create the store
export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      deletedItems: [],
      movements: [],
      transactions: [],
      receipts: [],
      containerContents: [],
      alerts: [],
      isLoading: false,
      isSubmitting: false,
      
      // Actions
      setItems: (items) => set({ items }),
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      updateItem: (id, updates) => set((state) => ({
        items: state.items.map(item => item.id === id ? { ...item, ...updates } : item)
      })),
      deleteItem: (id) => set((state) => {
        const itemToDelete = state.items.find(item => item.id === id);
        if (!itemToDelete) return state;
        
        const deletedItem: DeletedItem = {
          ...itemToDelete,
          deletedAt: new Date().toISOString(),
          deletedBy: 'Current User' // This could be dynamic based on auth
        };
        
        return {
          items: state.items.filter(item => item.id !== id),
          deletedItems: [...state.deletedItems, deletedItem]
        };
      }),
      restoreItem: (id) => set((state) => {
        const itemToRestore = state.deletedItems.find(item => item.id === id);
        if (!itemToRestore) return state;
        
        const { deletedAt, deletedBy, ...restoredItem } = itemToRestore;
        
        return {
          items: [...state.items, restoredItem],
          deletedItems: state.deletedItems.filter(item => item.id !== id)
        };
      }),
      permanentDeleteItem: (id) => set((state) => ({
        deletedItems: state.deletedItems.filter(item => item.id !== id)
      })),
      setDeletedItems: (deletedItems) => set({ deletedItems }),
      
      setMovements: (movements) => set({ movements }),
      addMovement: (movement) => set((state) => ({ movements: [...state.movements, movement] })),
      updateMovement: (id, updates) => set((state) => ({
        movements: state.movements.map(movement => movement.id === id ? { ...movement, ...updates } : movement)
      })),
      deleteMovement: (id) => set((state) => ({
        movements: state.movements.filter(movement => movement.id !== id)
      })),
      
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: (transaction) => set((state) => ({ transactions: [...state.transactions, transaction] })),
      updateTransaction: (id, updates) => set((state) => ({
        transactions: state.transactions.map(transaction => transaction.id === id ? { ...transaction, ...updates } : transaction)
      })),
      
      setReceipts: (receipts) => set({ receipts }),
      addReceipt: (receipt) => set((state) => ({ receipts: [...state.receipts, receipt] })),
      updateReceipt: (id, updates) => set((state) => ({
        receipts: state.receipts.map(receipt => receipt.id === id ? { ...receipt, ...updates } : receipt)
      })),
      
      setContainerContents: (contents) => set({ containerContents: contents }),
      addContainerContents: (contents) => set((state) => ({ containerContents: [...state.containerContents, contents] })),
      updateContainerContents: (containerId, updates) => set((state) => ({
        containerContents: state.containerContents.map(cc => cc.containerId === containerId ? { ...cc, ...updates } : cc)
      })),
      
      setAlerts: (alerts) => set({ alerts }),
      addAlert: (alert) => set((state) => ({ alerts: [...state.alerts, alert] })),
      markAlertAsRead: (id) => set((state) => ({
        alerts: state.alerts.map(alert => alert.id === id ? { ...alert, isRead: true } : alert)
      })),
      markAlertAsResolved: (id) => set((state) => ({
        alerts: state.alerts.map(alert => alert.id === id ? { ...alert, isResolved: true } : alert)
      })),
      
      setLoading: (loading) => set({ isLoading: loading }),
      setSubmitting: (submitting) => set({ isSubmitting: submitting }),
      
      // Utility functions
      getItemById: (id) => get().items.find(item => item.id === id),
      getMovementById: (id) => get().movements.find(movement => movement.id === id),
      getContainerContents: (containerId) => get().containerContents.find(cc => cc.containerId === containerId),
      getUnreadAlertsCount: () => get().alerts.filter(alert => !alert.isRead).length,
      getLowStockItems: () => get().items.filter(item => item.quantity <= item.minStock),
      
      // Initialize with sample data
      initializeData: () => {
        const sampleItems: Item[] = [
          {
            id: '1',
            sku: 'SFT-001',
            name: 'Industrial Safety Helmets',
            title: 'Heavy-Duty Safety Helmet - ANSI Certified',
            description: 'Professional-grade safety helmets designed for Lebanese port workers and industrial operations. Features advanced impact resistance, adjustable suspension system, and meets international safety standards.',
            price: 45.00,
            quantity: 250,
            location: 'BRT-A-01-05',
            category: 'Safety Equipment',
            minStock: 50
          },
          {
            id: '2',
            sku: 'CNT-002',
            name: 'Container Securing Chains',
            title: 'Heavy-Duty Container Chain Set - Marine Grade',
            description: 'High-strength marine-grade chains specifically designed for securing containers in Lebanese ports. Corrosion-resistant coating ensures durability in Mediterranean coastal conditions.',
            price: 120.00,
            quantity: 75,
            location: 'BRT-B-02-08',
            category: 'Container Equipment',
            minStock: 15
          }
        ];
        
        const sampleMovements: Movement[] = [
          {
            id: 'MOV-001',
            type: 'Arrival',
            transportType: 'Container',
            truckPlate: 'LB-123-456',
            containerId: 'CONT-001',
            containerInfo: {
              containerId: 'CONT-001',
              sealNumber: 'SEAL-12345',
              size: '40ft',
              type: 'Standard'
            },
            driverName: 'Ahmad Khalil',
            driverPhone: '+961-70-123456',
            driverEmail: 'ahmad.khalil@transport.lb',
            timestamp: '2024-01-15 10:30 AM',
            status: 'Completed',
            origin: 'Beirut Port',
            destination: 'Warehouse A',
            notes: 'Cargo inspection completed',
            isLocked: true,
            arrivalTime: '2024-01-15 10:30 AM'
          }
        ];
        
        set({ items: sampleItems, movements: sampleMovements });
      }
    }),
    {
      name: 'inventory-store',
      partialize: (state) => ({
        items: state.items,
        deletedItems: state.deletedItems,
        movements: state.movements,
        transactions: state.transactions,
        receipts: state.receipts,
        containerContents: state.containerContents,
        alerts: state.alerts
      })
    }
  )
);
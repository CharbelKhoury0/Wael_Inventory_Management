import { useInventoryStore } from '../store/inventoryStore';
import { useCallback, useMemo } from 'react';
import type { Item, Movement, Transaction, Receipt, ContainerContents, Alert } from '../store/inventoryStore';

// Custom hook for inventory management
export const useInventory = () => {
  const store = useInventoryStore();
  
  // Memoized selectors
  const stats = useMemo(() => {
    const totalItems = store.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = store.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const lowStockItems = store.getLowStockItems();
    const unreadAlerts = store.getUnreadAlertsCount();
    
    return {
      totalItems,
      totalValue,
      lowStockCount: lowStockItems.length,
      unreadAlerts,
      totalCategories: new Set(store.items.map(item => item.category)).size
    };
  }, [store.items, store.alerts]);
  
  // Inventory operations
  const addItem = useCallback((item: Omit<Item, 'id'>) => {
    const newItem: Item = {
      ...item,
      id: `ITEM-${Date.now()}`,
      lastUpdated: new Date().toISOString()
    };
    store.addItem(newItem);
    return newItem;
  }, [store]);
  
  const updateItemQuantity = useCallback((id: string, quantity: number) => {
    store.updateItem(id, { 
      quantity, 
      lastUpdated: new Date().toISOString() 
    });
    
    // Check for low stock alerts
    const item = store.getItemById(id);
    if (item && quantity <= item.minStock) {
      const alert: Alert = {
        id: `low_stock_${id}_${Date.now()}`,
        type: 'low_stock',
        severity: quantity === 0 ? 'critical' : 'high',
        title: quantity === 0 ? 'Out of Stock' : 'Low Stock Alert',
        message: `${item.name} (${item.sku}) ${quantity === 0 ? 'is out of stock' : `is running low: ${quantity} units remaining`}`,
        timestamp: new Date().toISOString(),
        isRead: false,
        isResolved: false,
        itemId: id,
        actionRequired: true
      };
      store.addAlert(alert);
    }
  }, [store]);
  
  const searchItems = useCallback((searchTerm: string, category?: string) => {
    return store.items.filter(item => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !category || category === 'All' || item.category === category;
      
      return matchesSearch && matchesCategory;
    });
  }, [store.items]);
  
  return {
    // State
    items: store.items,
    deletedItems: store.deletedItems,
    movements: store.movements,
    transactions: store.transactions,
    receipts: store.receipts,
    containerContents: store.containerContents,
    alerts: store.alerts,
    isLoading: store.isLoading,
    isSubmitting: store.isSubmitting,
    
    // Computed values
    stats,
    lowStockItems: store.getLowStockItems(),
    
    // Actions
    addItem,
    updateItem: store.updateItem,
    deleteItem: store.deleteItem,
    restoreItem: store.restoreItem,
    permanentDeleteItem: store.permanentDeleteItem,
    updateItemQuantity,
    searchItems,
    
    // Movement actions
    addMovement: store.addMovement,
    updateMovement: store.updateMovement,
    deleteMovement: store.deleteMovement,
    
    // Transaction actions
    addTransaction: store.addTransaction,
    updateTransaction: store.updateTransaction,
    
    // Receipt actions
    addReceipt: store.addReceipt,
    updateReceipt: store.updateReceipt,
    
    // Container actions
    addContainerContents: store.addContainerContents,
    updateContainerContents: store.updateContainerContents,
    getContainerContents: store.getContainerContents,
    
    // Alert actions
    addAlert: store.addAlert,
    markAlertAsRead: store.markAlertAsRead,
    markAlertAsResolved: store.markAlertAsResolved,
    
    // Utility functions
    getItemById: store.getItemById,
    getMovementById: store.getMovementById,
    
    // Loading states
    setLoading: store.setLoading,
    setSubmitting: store.setSubmitting,
    
    // Initialize data
    initializeData: store.initializeData
  };
};

// Hook for movement-specific operations
export const useMovements = () => {
  const store = useInventoryStore();
  
  const addMovement = useCallback((movement: Omit<Movement, 'id' | 'timestamp'>) => {
    const newMovement: Movement = {
      ...movement,
      id: `MOV-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleString()
    };
    store.addMovement(newMovement);
    
    // Create alert for new movement
    const alert: Alert = {
      id: `movement_${newMovement.id}`,
      type: 'movement',
      severity: 'medium',
      title: `New ${newMovement.type}`,
      message: `${newMovement.type} recorded for ${newMovement.transportType} ${newMovement.truckPlate || newMovement.containerId}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      isResolved: false,
      actionRequired: false
    };
    store.addAlert(alert);
    
    return newMovement;
  }, [store]);
  
  const filterMovements = useCallback((filters: {
    searchTerm?: string;
    type?: string;
    status?: string;
    transportType?: string;
  }) => {
    return store.movements.filter(movement => {
      const matchesSearch = !filters.searchTerm || 
        movement.id.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        movement.driverName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (movement.truckPlate && movement.truckPlate.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        (movement.containerId && movement.containerId.toLowerCase().includes(filters.searchTerm.toLowerCase()));
      
      const matchesType = !filters.type || filters.type === 'all' || movement.type === filters.type;
      const matchesStatus = !filters.status || filters.status === 'all' || movement.status === filters.status;
      const matchesTransportType = !filters.transportType || filters.transportType === 'all' || movement.transportType === filters.transportType;
      
      return matchesSearch && matchesType && matchesStatus && matchesTransportType;
    });
  }, [store.movements]);
  
  return {
    movements: store.movements,
    addMovement,
    updateMovement: store.updateMovement,
    deleteMovement: store.deleteMovement,
    getMovementById: store.getMovementById,
    filterMovements
  };
};

// Hook for alerts management
export const useAlerts = () => {
  const store = useInventoryStore();
  
  const unreadAlerts = useMemo(() => 
    store.alerts.filter(alert => !alert.isRead),
    [store.alerts]
  );
  
  const criticalAlerts = useMemo(() => 
    store.alerts.filter(alert => alert.severity === 'critical' && !alert.isResolved),
    [store.alerts]
  );
  
  const markAllAsRead = useCallback(() => {
    store.alerts.forEach(alert => {
      if (!alert.isRead) {
        store.markAlertAsRead(alert.id);
      }
    });
  }, [store]);
  
  return {
    alerts: store.alerts,
    unreadAlerts,
    criticalAlerts,
    unreadCount: unreadAlerts.length,
    addAlert: store.addAlert,
    markAlertAsRead: store.markAlertAsRead,
    markAlertAsResolved: store.markAlertAsResolved,
    markAllAsRead
  };
};
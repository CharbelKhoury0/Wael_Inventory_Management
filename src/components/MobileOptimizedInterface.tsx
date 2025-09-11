import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useInventory } from '../hooks/useInventory';
import {
  Search,
  Menu,
  X,
  Package,
  Truck,
  BarChart3,
  Settings,
  Bell,
  User,
  Home,
  Plus,
  Filter,
  ScanLine,
  Wifi,
  WifiOff,
  Download,
  Upload,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import type { Item, Movement } from '../store/inventoryStore';

interface MobileOptimizedInterfaceProps {
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

interface TouchGesture {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startTime: number;
  endTime: number;
}

interface OfflineData {
  items: Item[];
  movements: Movement[];
  lastSync: string;
  pendingChanges: Array<{
    id: string;
    type: 'create' | 'update' | 'delete';
    data: any;
    timestamp: string;
  }>;
}

const MobileOptimizedInterface: React.FC<MobileOptimizedInterfaceProps> = ({
  onPageChange,
  onLogout
}) => {
  const { isDark } = useTheme();
  const { items, movements, stats } = useInventory();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<OfflineData | null>(null);
  const [showSyncStatus, setShowSyncStatus] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  
  const touchStartRef = useRef<TouchGesture | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pullToRefreshRef = useRef<HTMLDivElement>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      saveOfflineData();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline data on mount
  useEffect(() => {
    loadOfflineData();
  }, []);

  // Touch gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      endX: touch.clientX,
      endY: touch.clientY,
      startTime: Date.now(),
      endTime: Date.now()
    };

    // Pull to refresh detection
    if (window.scrollY === 0 && touch.clientY < 100) {
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    touchStartRef.current.endX = touch.clientX;
    touchStartRef.current.endY = touch.clientY;

    // Pull to refresh
    if (isPulling && window.scrollY === 0) {
      const distance = Math.max(0, touch.clientY - touchStartRef.current.startY);
      setPullDistance(Math.min(distance, 100));
      
      if (distance > 80) {
        e.preventDefault();
      }
    }

    // Horizontal swipe detection
    const deltaX = touch.clientX - touchStartRef.current.startX;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.startY);
    
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
    }
  }, [isPulling]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const gesture = touchStartRef.current;
    const deltaX = gesture.endX - gesture.startX;
    const deltaY = gesture.endY - gesture.startY;
    const deltaTime = gesture.endTime - gesture.startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;

    // Pull to refresh
    if (isPulling) {
      if (pullDistance > 60) {
        handleRefresh();
      }
      setIsPulling(false);
      setPullDistance(0);
    }

    // Swipe gestures
    if (Math.abs(deltaX) > 100 && Math.abs(deltaY) < 100 && velocity > 0.5) {
      if (deltaX > 0) {
        // Swipe right - go back or open menu
        if (currentPage !== 'dashboard') {
          handlePageChange('dashboard');
        } else {
          setIsMenuOpen(true);
        }
      } else {
        // Swipe left - close menu or navigate forward
        if (isMenuOpen) {
          setIsMenuOpen(false);
        }
      }
    }

    // Reset swipe direction
    setTimeout(() => setSwipeDirection(null), 300);
    touchStartRef.current = null;
  }, [isPulling, pullDistance, currentPage, isMenuOpen]);

  // Offline data management
  const saveOfflineData = useCallback(() => {
    const data: OfflineData = {
      items,
      movements,
      lastSync: new Date().toISOString(),
      pendingChanges: []
    };
    localStorage.setItem('offline-inventory-data', JSON.stringify(data));
    setOfflineData(data);
  }, [items, movements]);

  const loadOfflineData = useCallback(() => {
    const saved = localStorage.getItem('offline-inventory-data');
    if (saved) {
      try {
        const data = JSON.parse(saved) as OfflineData;
        setOfflineData(data);
      } catch (error) {
        console.error('Failed to load offline data:', error);
      }
    }
  }, []);

  const syncOfflineData = useCallback(async () => {
    if (!offlineData || offlineData.pendingChanges.length === 0) return;

    setShowSyncStatus(true);
    
    try {
      // Simulate API sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear pending changes
      const updatedData = {
        ...offlineData,
        pendingChanges: [],
        lastSync: new Date().toISOString()
      };
      
      localStorage.setItem('offline-inventory-data', JSON.stringify(updatedData));
      setOfflineData(updatedData);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setShowSyncStatus(false);
    }
  }, [offlineData]);

  const handleRefresh = useCallback(async () => {
    if (isOnline) {
      await syncOfflineData();
    }
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, [isOnline, syncOfflineData]);

  const handlePageChange = useCallback((page: string) => {
    setCurrentPage(page);
    onPageChange(page);
    setIsMenuOpen(false);
  }, [onPageChange]);

  const handleItemSelect = useCallback((item: Item) => {
    setSelectedItem(item);
    setShowItemModal(true);
  }, []);

  const getStockStatus = useCallback((item: Item) => {
    if (item.quantity === 0) {
      return { status: 'Out of Stock', color: 'text-red-600', icon: AlertTriangle };
    } else if (item.quantity <= item.minStock) {
      return { status: 'Low Stock', color: 'text-yellow-600', icon: Clock };
    } else {
      return { status: 'In Stock', color: 'text-green-600', icon: CheckCircle };
    }
  }, []);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 20); // Limit for mobile performance

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'items', label: 'Items', icon: Package },
    { id: 'movements', label: 'Movements', icon: Truck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} relative overflow-hidden`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      {isPulling && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center"
          style={{ transform: `translateY(${pullDistance - 60}px)` }}
        >
          <div className={`p-3 rounded-full ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <RefreshCw 
              className={`h-6 w-6 ${pullDistance > 60 ? 'animate-spin' : ''} ${isDark ? 'text-white' : 'text-gray-900'}`} 
            />
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className={`sticky top-0 z-40 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <Menu className={`h-6 w-6 ${isDark ? 'text-white' : 'text-gray-900'}`} />
          </button>
          
          <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {menuItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
          </h1>
          
          <div className="flex items-center gap-2">
            {/* Online/Offline Indicator */}
            <div className={`p-2 rounded-full ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
            </div>
            
            {/* Notifications */}
            <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} relative`}>
              <Bell className={`h-5 w-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
              {stats.unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {stats.unreadAlerts}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Side Menu */}
      <div className={`fixed inset-0 z-50 ${isMenuOpen ? 'block' : 'hidden'}`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setIsMenuOpen(false)}
        />
        
        {/* Menu Panel */}
        <div className={`absolute left-0 top-0 bottom-0 w-80 max-w-[80vw] ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-xl transform transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                WAEL Inventory
              </h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className={`h-5 w-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
              </button>
            </div>
          </div>
          
          <div className="p-4">
            {/* User Info */}
            <div className={`p-4 rounded-lg mb-6 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Warehouse Manager
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Port of Beirut Terminal
                  </p>
                </div>
              </div>
            </div>
            
            {/* Menu Items */}
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handlePageChange(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
            
            {/* Sync Status */}
            {!isOnline && offlineData && (
              <div className={`mt-6 p-3 rounded-lg ${isDark ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-100 border-yellow-300'} border`}>
                <div className="flex items-center gap-2 mb-2">
                  <WifiOff className="h-4 w-4 text-yellow-600" />
                  <span className={`text-sm font-medium ${isDark ? 'text-yellow-200' : 'text-yellow-800'}`}>
                    Offline Mode
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                  Last sync: {new Date(offlineData.lastSync).toLocaleString()}
                </p>
                {offlineData.pendingChanges.length > 0 && (
                  <p className={`text-xs ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    {offlineData.pendingChanges.length} pending changes
                  </p>
                )}
              </div>
            )}
            
            {/* Logout Button */}
            <button
              onClick={onLogout}
              className={`w-full mt-6 p-3 rounded-lg border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors`}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20">
        {currentPage === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {stats.totalItems}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Items
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ${(stats.totalValue / 1000).toFixed(0)}K
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Value
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Low Stock Alert */}
            {stats.lowStockCount > 0 && (
              <div className={`p-4 rounded-lg border-l-4 border-yellow-500 ${
                isDark ? 'bg-yellow-900 bg-opacity-20' : 'bg-yellow-50'
              }`}>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className={`font-semibold ${isDark ? 'text-yellow-200' : 'text-yellow-800'}`}>
                      {stats.lowStockCount} items need attention
                    </p>
                    <p className={`text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                      Items are running low on stock
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {currentPage === 'items' && (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg whitespace-nowrap">
                <Plus className="h-4 w-4" />
                Add Item
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg whitespace-nowrap">
                <ScanLine className="h-4 w-4" />
                Scan Barcode
              </button>
              <button className={`flex items-center gap-2 px-4 py-2 border rounded-lg whitespace-nowrap ${
                isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
              }`}>
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>
            
            {/* Items List */}
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const stockStatus = getStockStatus(item);
                
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemSelect(item)}
                    className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} active:bg-gray-100 dark:active:bg-gray-700 transition-colors`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.name}
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          SKU: {item.sku}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${stockStatus.color} bg-opacity-20`}>
                        {stockStatus.status}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Quantity</p>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.quantity}
                        </p>
                      </div>
                      <div>
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Price</p>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Location</p>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.location.split('-')[0]}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t`}>
        <div className="grid grid-cols-5 gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`p-3 flex flex-col items-center gap-1 transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : isDark
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Item Detail Modal */}
      {showItemModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowItemModal(false)}
          />
          
          <div className={`relative w-full max-h-[80vh] overflow-y-auto rounded-t-xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } transform transition-transform duration-300`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedItem.name}
                </h2>
                <button
                  onClick={() => setShowItemModal(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className={`h-5 w-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>SKU</p>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedItem.sku}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Category</p>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedItem.category}
                  </p>
                </div>
              </div>
              
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Description</p>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectedItem.description}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg">
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 p-3 bg-green-600 text-white rounded-lg">
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Status Toast */}
      {showSyncStatus && (
        <div className="fixed top-20 left-4 right-4 z-50">
          <div className={`p-4 rounded-lg shadow-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
              <div>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Syncing data...
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Uploading offline changes
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swipe Indicator */}
      {swipeDirection && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className={`p-4 rounded-full ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            {swipeDirection === 'left' ? (
              <ChevronLeft className={`h-8 w-8 ${isDark ? 'text-white' : 'text-gray-900'}`} />
            ) : (
              <ChevronRight className={`h-8 w-8 ${isDark ? 'text-white' : 'text-gray-900'}`} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MobileOptimizedInterface);
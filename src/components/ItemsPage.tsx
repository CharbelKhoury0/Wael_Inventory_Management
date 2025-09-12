import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  MapPin, 
  Tag, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  Grid, 
  List, 
  ChevronLeft, 
  ChevronRight, 
  Square, 
  CheckSquare, 
  MoreVertical, 
  Download, 
  Upload, 
  Scan, 
  X, 
  Undo2, 
  RotateCcw, 
  ImageIcon,
  Building,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useEnhancedTheme } from '../contexts/ThemeContext';
import { useInventory } from '../hooks/useInventory';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import BarcodeScanner from './BarcodeScanner';
import BulkOperations from './BulkOperations';
import AdvancedSearch from './AdvancedSearch';
import ItemForm from './ItemForm';
import ItemDetails from './ItemDetails';

interface ItemsPageProps {
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

const ItemsPage: React.FC<ItemsPageProps> = ({ onPageChange, onLogout }) => {
  const { isDark } = useEnhancedTheme();
  const { 
    items, 
    deletedItems,
    addItem, 
    updateItem, 
    deleteItem,
    restoreItem,
    permanentDeleteItem
  } = useInventory();
  
  const currentWarehouse = 'Port of Beirut Terminal';
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showItemForm, setShowItemForm] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [scanMode, setScanMode] = useState<'search' | 'add' | 'update'>('search');
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [lastDeletedItem, setLastDeletedItem] = useState<any>(null);
  
  // Table scroll state
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Get unique categories and locations for filters
  const categories = Array.from(new Set(items.map(item => item.category))).filter(Boolean);
  const locations = Array.from(new Set(items.map(item => item.location))).filter(Boolean);

  // Filter and sort items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || item.location === selectedLocation;
    const matchesStatus = selectedStatus === 'all' || getStockStatus(item.quantity, item.minStock).status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'sku':
        return a.sku.localeCompare(b.sku);
      case 'quantity':
        return b.quantity - a.quantity;
      case 'price':
        return b.price - a.price;
      case 'category':
        return a.category.localeCompare(b.category);
      case 'location':
        return a.location.localeCompare(b.location);
      case 'dateAdded':
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      default:
        return 0;
    }
  });

  // Stock status helper
  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity === 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-100' };
    } else if (quantity <= minStock) {
      return { status: 'low-stock', label: 'Low Stock', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    } else {
      return { status: 'in-stock', label: 'In Stock', color: 'text-green-600', bgColor: 'bg-green-100' };
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Format time ago
  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  // Get days until permanent delete
  const getDaysUntilPermanentDelete = (deletedAt: string) => {
    const deleteDate = new Date(deletedAt);
    const permanentDeleteDate = new Date(deleteDate.getTime() + (30 * 24 * 60 * 60 * 1000));
    const now = new Date();
    const diffInDays = Math.ceil((permanentDeleteDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffInDays);
  };

  // Handle table scroll
  const handleTableScroll = () => {
    if (tableRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableRef.current;
      setScrollPosition(scrollLeft);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Scroll table
  const scrollTable = (direction: 'left' | 'right') => {
    if (tableRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left' 
        ? tableRef.current.scrollLeft - scrollAmount
        : tableRef.current.scrollLeft + scrollAmount;
      
      tableRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Update scroll state on mount and resize
  useEffect(() => {
    const updateScrollState = () => {
      if (tableRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = tableRef.current;
        setScrollPosition(scrollLeft);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [filteredItems]);

  // Handle item actions
  const handleAddItem = () => {
    setEditingItem(null);
    setShowItemForm(true);
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setShowItemForm(true);
  };

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setShowItemDetails(true);
  };

  const handleDeleteItem = (item: any) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const confirmDeleteItem = () => {
    if (selectedItem) {
      deleteItem(selectedItem.id);
      setLastDeletedItem(selectedItem);
      setShowDeleteModal(false);
      setSelectedItem(null);
      setShowUndoToast(true);
      
      // Auto-hide undo toast after 5 seconds
      setTimeout(() => {
        setShowUndoToast(false);
        setLastDeletedItem(null);
      }, 5000);
    }
  };

  const handleUndoDelete = () => {
    if (lastDeletedItem) {
      restoreItem(lastDeletedItem.id);
      setShowUndoToast(false);
      setLastDeletedItem(null);
    }
  };

  const handleRestoreItem = (item: any) => {
    restoreItem(item.id);
  };

  const handlePermanentDelete = (item: any) => {
    permanentDeleteItem(item.id);
  };

  const handleSaveItem = (itemData: any) => {
    if (editingItem) {
      updateItem(editingItem.id, itemData);
    } else {
      addItem(itemData);
    }
    setShowItemForm(false);
    setEditingItem(null);
  };

  // Handle selection
  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  // Handle barcode scanning
  const handleBarcodeScanned = (barcode: string) => {
    if (scanMode === 'search') {
      setSearchTerm(barcode);
    } else if (scanMode === 'add') {
      setEditingItem({ barcode });
      setShowItemForm(true);
    }
    setShowBarcodeScanner(false);
  };

  // Handle advanced search
  const handleAdvancedSearch = (filters: any) => {
    // Advanced search logic would be implemented here
    // For now, we'll use the existing search functionality
  };

  const handleSort = (sortOption: string) => {
    setSortBy(sortOption);
  };

  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPage="items"
        onPageChange={onPageChange}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav 
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
          onPageChange={onPageChange}
        />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            {/* Header */}
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border mb-6`}>
              <div className={`px-4 md:px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Inventory Items</h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total items: {filteredItems.length}</p>
                  </div>
                  <div className="mt-3 sm:mt-0 flex items-center space-x-2">
                    <button
                      onClick={() => setShowTrashModal(true)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} flex items-center gap-2`}
                    >
                      <Trash2 className="h-4 w-4" />
                      Trash ({deletedItems.length})
                    </button>
                    <button
                      onClick={handleAddItem}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Filters and Search */}
              <div className="p-4 md:p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search items by name, SKU, or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                      />
                    </div>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value="all">All Locations</option>
                      {locations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                    
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value="all">All Status</option>
                      <option value="in-stock">In Stock</option>
                      <option value="low-stock">Low Stock</option>
                      <option value="out-of-stock">Out of Stock</option>
                    </select>
                    
                    <select
                       value={sortBy}
                       onChange={(e) => handleSort(e.target.value)}
                       className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                     >
                       <option value="name">Sort by Name</option>
                       <option value="sku">Sort by SKU</option>
                       <option value="quantity">Sort by Quantity</option>
                       <option value="price">Sort by Price</option>
                       <option value="category">Sort by Category</option>
                       <option value="location">Sort by Location</option>
                     </select>
                    
                    <button
                      onClick={() => {
                        setScanMode('search');
                        setShowBarcodeScanner(true);
                      }}
                      className={`px-3 py-2 border rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} flex items-center gap-2`}
                    >
                      <Scan className="h-4 w-4" />
                      Scan
                    </button>
                    
                    <button
                      onClick={() => setShowAdvancedSearch(true)}
                      className={`px-3 py-2 border rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} flex items-center gap-2`}
                    >
                      <Filter className="h-4 w-4" />
                      Advanced
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Selection and Bulk Actions */}
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 mb-6`}>
              <div className="flex flex-col gap-4">
                {/* Selection Actions */}
                {selectedItems.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setShowBulkOperations(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Bulk Edit
                      </button>
                      <button
                        onClick={() => {
                          // Export selected items
                          const selectedItemsData = items.filter(item => selectedItems.includes(item.id));
                          const dataStr = JSON.stringify(selectedItemsData, null, 2);
                          const dataBlob = new Blob([dataStr], { type: 'application/json' });
                          const url = URL.createObjectURL(dataBlob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = 'selected-items.json';
                          link.click();
                        }}
                        className={`px-3 py-1 border rounded text-sm transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} flex items-center gap-1`}
                      >
                        <Download className="h-3 w-3" />
                        Export
                      </button>
                      <button
                        onClick={() => setSelectedItems([])}
                        className={`px-3 py-1 border rounded text-sm transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                )}
                
                {/* View Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>View:</span>
                    <div className={`flex rounded-lg border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`px-3 py-1 rounded-l-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : (isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50')}`}
                      >
                        <Grid className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('table')}
                        className={`px-3 py-1 rounded-r-lg transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : (isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50')}`}
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        // Export all items
                        const dataStr = JSON.stringify(filteredItems, null, 2);
                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(dataBlob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'inventory-items.json';
                        link.click();
                      }}
                      className={`px-3 py-2 border rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} flex items-center gap-2`}
                    >
                      <Download className="h-4 w-4" />
                      Export All
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Display */}
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border`}>
              {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-400' : 'text-gray-400'} mb-4`} />
                  <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                    {searchTerm || selectedCategory !== 'all' || selectedLocation !== 'all' || selectedStatus !== 'all' 
                      ? 'No items found' 
                      : 'No items yet'
                    }
                  </h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                    {searchTerm || selectedCategory !== 'all' || selectedLocation !== 'all' || selectedStatus !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Get started by adding your first inventory item'
                    }
                  </p>
                  {(!searchTerm && selectedCategory === 'all' && selectedLocation === 'all' && selectedStatus === 'all') && (
                    <button
                      onClick={handleAddItem}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Plus className="h-4 w-4" />
                      Add Your First Item
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className={`lg:hidden ${viewMode === 'grid' ? 'block' : 'hidden'}`}>
                    <div className="p-4 space-y-4">
                      {filteredItems.map((item) => {
                        const stockStatus = getStockStatus(item.quantity, item.minStock);
                        return (
                          <div
                            key={item.id}
                            className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4 ${selectedItems.includes(item.id) ? (isDark ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-500') : ''}`}
                          >
                            {/* Header with selection and actions */}
                            <div className="flex items-center justify-between mb-3">
                              <button
                                onClick={() => handleSelectItem(item.id)}
                                className="flex items-center justify-center w-5 h-5"
                              >
                                {selectedItems.includes(item.id) ? (
                                  <CheckSquare className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                              </button>
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => handleEditItem(item)}
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:bg-opacity-20 rounded-lg transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteItem(item)}
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 rounded-lg transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Item Info */}
                            <div className="space-y-3">
                              <div>
                                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>{item.name}</h3>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>SKU: {item.sku}</p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide font-medium`}>Location</p>
                                  <div className="flex items-center mt-1">
                                    <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>{item.location}</p>
                                  </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide font-medium`}>Category</p>
                                  <div className="flex items-center mt-1">
                                    <Tag className="h-4 w-4 text-gray-400 mr-1" />
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>{item.category}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide font-medium`}>Price</p>
                                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(item.price)}</p>
                                </div>
                                <div>
                                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide font-medium`}>Quantity</p>
                                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.quantity}</p>
                                </div>
                                <div>
                                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide font-medium`}>Status</p>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color} ${stockStatus.bgColor}`}>
                                    {stockStatus.label}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                              <button
                                onClick={() => handleViewDetails(item)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isDark ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900 hover:bg-opacity-20' : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'}`}
                                style={{ minHeight: '44px' }}
                              >
                                View Details
                              </button>
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditItem(item);
                                  }}
                                  className="p-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:bg-opacity-20 rounded-lg transition-colors"
                                  title="Edit item"
                                  style={{ minHeight: '44px', minWidth: '44px' }}
                                >
                                  <Edit className="h-5 w-5" />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteItem(item);
                                  }}
                                  className="p-3 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 rounded-lg transition-colors"
                                  title="Delete item"
                                  style={{ minHeight: '44px', minWidth: '44px' }}
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Desktop Table View */}
                  <div className={`hidden lg:block ${viewMode === 'table' ? 'block' : 'hidden'}`}>
                    <div className="relative">
                      {/* Scroll Indicators */}
                      <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r ${isDark ? 'from-gray-800 to-transparent' : 'from-white to-transparent'} pointer-events-none z-10 ${scrollPosition > 0 ? 'opacity-100' : 'opacity-0'} transition-opacity`}></div>
                      <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l ${isDark ? 'from-gray-800 to-transparent' : 'from-white to-transparent'} pointer-events-none z-10 ${canScrollRight ? 'opacity-100' : 'opacity-0'} transition-opacity`}></div>
                      
                      {/* Navigation Buttons */}
                      {scrollPosition > 0 && (
                        <button
                          onClick={() => scrollTable('left')}
                          className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-20 p-2 rounded-full shadow-lg ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors`}
                          aria-label="Scroll left"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                      )}
                      {canScrollRight && (
                        <button
                          onClick={() => scrollTable('right')}
                          className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-20 p-2 rounded-full shadow-lg ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors`}
                          aria-label="Scroll right"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                      
                      <div 
                        ref={tableRef}
                        className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
                        onScroll={handleTableScroll}
                        style={{ 
                          scrollBehavior: 'smooth',
                          WebkitOverflowScrolling: 'touch'
                        }}
                      >

                        <table className="w-full" style={{ minWidth: '1200px' }}>
                      <thead className={`sticky top-0 z-10 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} shadow-sm`}>
                        <tr>
                          <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                            <button
                              onClick={handleSelectAll}
                              className="flex items-center justify-center w-5 h-5"
                            >
                              {selectedItems.length === filteredItems.length && filteredItems.length > 0 ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                            SKU
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                            Item Name
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                            Images
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                            Price
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                            Quantity
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                            Location
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                            Category
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                            Status
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`${isDark ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
                        {filteredItems.map((item) => {
                          const stockStatus = getStockStatus(item.quantity, item.minStock);
                          return (
                            <tr 
                              key={item.id} 
                              className={`transition-colors ${selectedItems.includes(item.id) ? (isDark ? 'bg-blue-900 bg-opacity-20' : 'bg-blue-50') : ''} ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                            >
                              <td className="px-4 py-4 whitespace-nowrap">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectItem(item.id);
                                  }}
                                  className="flex items-center justify-center w-5 h-5"
                                >
                                  {selectedItems.includes(item.id) ? (
                                    <CheckSquare className="h-4 w-4 text-blue-600" />
                                  ) : (
                                    <Square className="h-4 w-4" />
                                  )}
                                </button>
                              </td>
                              <td 
                                className="px-6 py-4 whitespace-nowrap cursor-pointer"
                                onClick={() => handleViewDetails(item)}
                              >
                                <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.sku}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className={`p-2 rounded-lg mr-3 ${isDark ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-50'}`}>
                                    <Package className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.name}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {item.images && item.images.length > 0 ? (
                                    <div className="flex items-center space-x-2">
                                      <div className="flex -space-x-2">
                                        {item.images.slice(0, 3).map((image, index) => (
                                          <img
                                            key={image.id}
                                            src={image.preview}
                                            alt={`${item.name} image ${index + 1}`}
                                            className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                          />
                                        ))}
                                      </div>
                                      {item.images.length > 3 && (
                                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                          +{item.images.length - 3}
                                        </span>
                                      )}
                                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        ({item.images.length})
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <ImageIcon className={`h-4 w-4 ${isDark ? 'text-gray-500' : 'text-gray-400'} mr-1`} />
                                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No images</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(item.price)}</div>
                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>USD</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.quantity}</div>
                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Min: {item.minStock}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`flex items-center text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                  {item.location}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`flex items-center text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  <Tag className="h-4 w-4 text-gray-400 mr-2" />
                                  {item.category}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color} ${stockStatus.bgColor}`}>
                                  {stockStatus.label}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleViewDetails(item)}
                                    className={`text-blue-600 hover:text-blue-900 ${isDark ? 'hover:text-blue-400' : ''}`}
                                    title="View details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEditItem(item)}
                                    className={`text-gray-600 hover:text-gray-900 ${isDark ? 'text-gray-400 hover:text-gray-200' : ''}`}
                                    title="Edit item"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(item)}
                                    className={`text-red-600 hover:text-red-900 ${isDark ? 'hover:text-red-400' : ''}`}
                                    title="Delete item"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-md w-full`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Confirm Delete</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
              </div>
              
              <div className="text-center">
                <h4 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Move to Trash
                </h4>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'} mb-4`}>
                  Are you sure you want to move <strong>{selectedItem.name}</strong> (SKU: {selectedItem.sku}) to trash? You can restore it within 30 days.
                </p>
                <div className={`text-xs ${isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-50'} p-2 rounded`}>
                  💡 Items in trash are automatically deleted after 30 days
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteItem}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Move to Trash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Undo Toast Notification */}
      {showUndoToast && lastDeletedItem && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg p-4 max-w-sm`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Trash2 className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Item moved to trash
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {lastDeletedItem.name}
                  </p>
                </div>
              </div>
              <button
                onClick={handleUndoDelete}
                className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
              >
                <Undo2 className="h-3 w-3" />
                Undo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trash Modal */}
      {showTrashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Deleted Items</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {deletedItems.length} item{deletedItems.length > 1 ? "s" : ""} in trash
                </p>
              </div>
              <button
                onClick={() => setShowTrashModal(false)}
                className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              {deletedItems.length === 0 ? (
                <div className="text-center py-8">
                  <Trash2 className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-400' : 'text-gray-400'} mb-4`} />
                  <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                    Trash is empty
                  </p>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Deleted items will appear here and be automatically removed after 30 days.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deletedItems.map((deletedItem) => {
                    const daysLeft = getDaysUntilPermanentDelete(deletedItem.deletedAt);
                    return (
                      <div
                        key={deletedItem.id}
                        className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-lg ${isDark ? 'bg-red-900 bg-opacity-30' : 'bg-red-50'}`}>
                              <Package className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {deletedItem.name}
                              </h4>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                SKU: {deletedItem.sku} • Deleted {formatTimeAgo(deletedItem.deletedAt)}
                              </p>
                              <div className="flex items-center mt-1">
                                <Clock className="h-3 w-3 text-orange-500 mr-1" />
                                <span className={`text-xs ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                                  {daysLeft} day{daysLeft !== 1 ? "s" : ""} until permanent deletion
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleRestoreItem(deletedItem)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Restore
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Permanently delete ' + deletedItem.name + '? This cannot be undone.')) {
                                  handlePermanentDelete(deletedItem);
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                            >
                              <X className="h-3 w-3" />
                              Delete Forever
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className={`flex justify-end p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setShowTrashModal(false)}
                className={`px-4 py-2 border rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScanned}
        title={
          scanMode === 'search' 
            ? 'Scan to Search Items' 
            : scanMode === 'add' 
            ? 'Scan Item Barcode' 
            : 'Scan to Update Barcode'
        }
        description="Position the barcode within the frame to scan"
      />

      {/* Bulk Operations Modal */}
      <BulkOperations
        isOpen={showBulkOperations}
        onClose={() => setShowBulkOperations(false)}
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        items={items}
      />

      {/* Item Form Modal */}
      <ItemForm
        isOpen={showItemForm}
        onClose={() => setShowItemForm(false)}
        onSave={handleSaveItem}
        item={editingItem}
      />

      {/* Item Details Modal */}
      <ItemDetails
        isOpen={showItemDetails}
        onClose={() => setShowItemDetails(false)}
        item={selectedItem}
        onEdit={handleEditItem}
      />
    </div>
  );
};

export default ItemsPage;
import React, { useState, useEffect } from 'react';
import { useTheme, useWarehouse } from '../App';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import ImageUploadDropzone from './ImageUploadDropzone';
import { Search, Plus, Package, MapPin, Filter, Edit, Trash2, X, Building, Image as ImageIcon, Undo2, RotateCcw, Clock } from 'lucide-react';

interface ItemsPageProps {
  onLogout: () => void;
  onPageChange: (page: string) => void;
}

interface Item {
  id: string;
  sku: string;
  name: string;
  title: string; // E-commerce display title
  description: string; // Detailed product description
  price: number; // Price in US Dollars (USD)
  quantity: number;
  location: string;
  category: string;
  minStock: number;
  images?: UploadedImage[];
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  uploading: boolean;
  error?: string;
}

interface DeletedItem extends Item {
  deletedAt: number;
  deletedReason?: string;
}

// Currency formatting for US Dollars
const formatPrice = (price: number): string => {
  // Handle edge cases and ensure price is a valid number
  const validPrice = typeof price === 'number' && !isNaN(price) ? price : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(validPrice);
};

const ItemsPage: React.FC<ItemsPageProps> = ({ onLogout, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [lastDeletedItem, setLastDeletedItem] = useState<DeletedItem | null>(null);
  const { isDark } = useTheme();
  const { currentWarehouse, warehouseData } = useWarehouse();

  // Default items for initial setup with e-commerce data
  const defaultItems: Item[] = [
    {
      id: '1',
      sku: 'MSH-001',
      name: 'Maritime Safety Helmets',
      title: 'Professional Maritime Safety Helmet - ANSI Certified',
      description: 'High-quality maritime safety helmet designed for Lebanese port workers and ship crews. Features impact-resistant ABS shell, adjustable suspension system, and meets international safety standards. Essential for dock operations at Beirut and Tripoli ports.',
      price: 35.00,
      quantity: 150,
      location: 'BRT-A-01-15',
      category: 'Safety Equipment',
      minStock: 25
    },
    {
      id: '2',
      sku: 'CNT-002',
      name: 'Container Securing Chains',
      title: 'Heavy-Duty Container Securing Chain Set',
      description: 'Premium grade steel chains specifically designed for securing shipping containers during Mediterranean transport. Corrosion-resistant coating suitable for Lebanese coastal conditions. Complete with hooks and tensioning hardware.',
      price: 125.00,
      quantity: 75,
      location: 'BRT-B-03-22',
      category: 'Container Equipment',
      minStock: 10
    },
    {
      id: '3',
      sku: 'ENG-003',
      name: 'Marine Engine Oil Filters',
      title: 'Marine Engine Oil Filter - Universal Fit',
      description: 'High-performance oil filters for marine diesel engines commonly used in Lebanese fishing and cargo vessels. Superior filtration technology ensures engine longevity in Mediterranean saltwater conditions.',
      price: 45.00,
      quantity: 200,
      location: 'TRP-C-02-08',
      category: 'Engine Parts',
      minStock: 50
    },
    {
      id: '4',
      sku: 'DKF-004',
      name: 'Dock Fastening Hardware',
      title: 'Marine-Grade Dock Fastening Hardware Kit',
      description: 'Complete set of stainless steel bolts, nuts, and washers for dock construction and maintenance. Specially treated for Lebanese coastal environment resistance. Includes various sizes for different applications.',
      price: 85.00,
      quantity: 500,
      location: 'BRT-A-05-12',
      category: 'Port Equipment',
      minStock: 100
    },
    {
      id: '5',
      sku: 'NAV-005',
      name: 'Navigation Control Panels',
      title: 'Digital Navigation Control Panel - Waterproof',
      description: 'State-of-the-art navigation control panel with GPS integration, radar compatibility, and weather-resistant design. Perfect for Lebanese commercial vessels operating in Eastern Mediterranean routes.',
      price: 450.00,
      quantity: 300,
      location: 'SID-D-01-05',
      category: 'Navigation Equipment',
      minStock: 40
    },
    {
      id: '6',
      sku: 'DKW-006',
      name: 'Dock Worker Safety Gloves',
      title: 'Cut-Resistant Dock Worker Safety Gloves',
      description: 'Professional-grade safety gloves with cut-resistant palms and enhanced grip technology. Designed for Lebanese port workers handling cargo, containers, and maritime equipment. Breathable and comfortable for long shifts.',
      price: 18.00,
      quantity: 120,
      location: 'BRT-A-02-18',
      category: 'Safety Equipment',
      minStock: 30
    },
    {
      id: '7',
      sku: 'SHP-007',
      name: 'Ship Maintenance Tool Kit',
      title: 'Complete Ship Maintenance Tool Set - 50 Pieces',
      description: 'Comprehensive tool kit for ship maintenance and repair operations. Includes marine-grade tools resistant to saltwater corrosion. Essential for Lebanese vessel maintenance crews and port repair services.',
      price: 95.00,
      quantity: 85,
      location: 'TRP-C-04-11',
      category: 'Maintenance Tools',
      minStock: 20
    },
    {
      id: '8',
      sku: 'LED-008',
      name: 'Marine LED Signal Lights',
      title: 'High-Intensity Marine LED Signal Light',
      description: 'Energy-efficient LED signal lights for marine navigation and safety. Compliant with international maritime regulations and optimized for Mediterranean visibility conditions. Long-lasting and weather-resistant.',
      price: 275.00,
      quantity: 45,
      location: 'SID-D-03-07',
      category: 'Navigation Equipment',
      minStock: 15
    },
    {
      id: '9',
      sku: 'PWR-009',
      name: 'Ship Power Distribution Units',
      title: 'Marine Power Distribution Unit - 440V',
      description: 'Heavy-duty power distribution unit designed for ship electrical systems. Features circuit protection, weatherproof housing, and compatibility with Lebanese port power standards. Essential for vessel electrical safety.',
      price: 320.00,
      quantity: 180,
      location: 'BRT-D-02-14',
      category: 'Electrical Systems',
      minStock: 25
    },
    {
      id: '10',
      sku: 'MSR-010',
      name: 'Marine Measuring Equipment',
      title: 'Precision Marine Measuring Instrument Set',
      description: 'Professional measuring instruments for marine engineering and cargo operations. Includes calipers, depth gauges, and precision rulers. Corrosion-resistant and calibrated for accuracy in Lebanese maritime operations.',
      price: 65.00,
      quantity: 65,
      location: 'TRP-C-01-09',
      category: 'Measurement Tools',
      minStock: 15
    },
    {
      id: '11',
      sku: 'LFS-011',
      name: 'Life Jackets - Commercial Grade',
      title: 'SOLAS Approved Life Jacket - Adult Size',
      description: 'Coast Guard approved life jackets meeting SOLAS international standards. Designed for Lebanese commercial fishing and cargo vessels. High-visibility orange color with reflective strips and whistle attachment.',
      price: 28.00,
      quantity: 200,
      location: 'BRT-A-03-20',
      category: 'Safety Equipment',
      minStock: 50
    },
    {
      id: '12',
      sku: 'HYD-012',
      name: 'Hydraulic Pump Systems',
      title: 'Marine Hydraulic Pump - Heavy Duty',
      description: 'High-pressure hydraulic pump system for Lebanese port cranes and cargo handling equipment. Corrosion-resistant components designed for Mediterranean marine environment. Essential for Beirut and Tripoli port operations.',
      price: 750.00,
      quantity: 25,
      location: 'BRT-C-01-08',
      category: 'Port Equipment',
      minStock: 5
    },
    {
      id: '13',
      sku: 'FLR-013',
      name: 'Marine Fuel Filters',
      title: 'Diesel Fuel Filter - Marine Grade',
      description: 'Premium marine diesel fuel filters for Lebanese fishing boats and commercial vessels. Advanced filtration technology removes water and contaminants. Essential for engine protection in Mediterranean conditions.',
      price: 32.00,
      quantity: 150,
      location: 'TRP-C-03-15',
      category: 'Engine Parts',
      minStock: 40
    }
  ];

  // Initialize items from localStorage or use defaults
  const [items, setItems] = useState<Item[]>(() => {
    const savedItems = localStorage.getItem('inventoryItems');
    if (savedItems) {
      try {
        const parsedItems = JSON.parse(savedItems);
        // Ensure all price values are numbers and handle any corrupted data
        return parsedItems.map((item: any) => ({
          ...item,
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
          quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0
        }));
      } catch (error) {
        console.error('Error loading items from localStorage:', error);
        // Clear corrupted localStorage data
        localStorage.removeItem('inventoryItems');
        return defaultItems;
      }
    }
    return defaultItems;
  });

  const [newItem, setNewItem] = useState({
    sku: '',
    name: '',
    title: '',
    description: '',
    price: '',
    quantity: '',
    location: '',
    category: '',
    images: [] as UploadedImage[]
  });

  const [editItem, setEditItem] = useState({
    sku: '',
    name: '',
    title: '',
    description: '',
    price: '',
    quantity: '',
    location: '',
    category: '',
    images: [] as UploadedImage[]
  });

  const categories = ['All', 'Safety Equipment', 'Container Equipment', 'Engine Parts', 'Port Equipment', 'Navigation Equipment', 'Maintenance Tools', 'Electrical Systems', 'Measurement Tools'];

  // Load deleted items from localStorage on component mount
  useEffect(() => {
    const savedDeletedItems = localStorage.getItem('deletedItems');
    if (savedDeletedItems) {
      try {
        const parsed = JSON.parse(savedDeletedItems);
        // Clean up items older than 30 days
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const validItems = parsed.filter((item: DeletedItem) => item.deletedAt > thirtyDaysAgo);
        setDeletedItems(validItems);
        // Save cleaned up items back to localStorage
        localStorage.setItem('deletedItems', JSON.stringify(validItems));
      } catch (error) {
        console.error('Error loading deleted items:', error);
      }
    }
  }, []);

  // Save deleted items to localStorage whenever deletedItems changes
  useEffect(() => {
    localStorage.setItem('deletedItems', JSON.stringify(deletedItems));
  }, [deletedItems]);

  // Save items to localStorage whenever items changes
  useEffect(() => {
    localStorage.setItem('inventoryItems', JSON.stringify(items));
  }, [items]);

  // Clean up undo timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeout) {
        clearTimeout(undoTimeout);
      }
    };
  }, [undoTimeout]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.sku && newItem.name && newItem.title && newItem.description && newItem.price && newItem.quantity && newItem.location && newItem.category) {
      const item: Item = {
        id: (items.length + 1).toString(),
        sku: newItem.sku,
        name: newItem.name,
        title: newItem.title,
        description: newItem.description,
        price: parseFloat(newItem.price),
        quantity: parseInt(newItem.quantity),
        location: newItem.location,
        category: newItem.category,
        minStock: 10,
        images: newItem.images
      };
      setItems([...items, item]);
      setNewItem({ sku: '', name: '', title: '', description: '', price: '', quantity: '', location: '', category: '', images: [] });
      setShowAddModal(false);
    }
  };

  const handleImagesChange = (images: UploadedImage[]) => {
    setNewItem({ ...newItem, images });
  };

  const handleEditImagesChange = (images: UploadedImage[]) => {
    setEditItem({ ...editItem, images });
  };

  const handleEditItem = (item: Item) => {
    setSelectedItem(item);
    setEditItem({
      sku: item.sku,
      name: item.name,
      title: item.title,
      description: item.description,
      price: item.price.toString(),
      quantity: item.quantity.toString(),
      location: item.location,
      category: item.category,
      images: item.images || []
    });
    setShowEditModal(true);
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem && editItem.sku && editItem.name && editItem.title && editItem.description && editItem.price && editItem.quantity && editItem.location && editItem.category) {
      const updatedItem: Item = {
        ...selectedItem,
        sku: editItem.sku,
        name: editItem.name,
        title: editItem.title,
        description: editItem.description,
        price: parseFloat(editItem.price),
        quantity: parseInt(editItem.quantity),
        location: editItem.location,
        category: editItem.category,
        images: editItem.images
      };
      setItems(items.map(item => item.id === selectedItem.id ? updatedItem : item));
      setEditItem({ sku: '', name: '', title: '', description: '', price: '', quantity: '', location: '', category: '', images: [] });
      setSelectedItem(null);
      setShowEditModal(false);
    }
  };

  const handleViewDetails = (item: Item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleDeleteItem = (item: Item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const confirmDeleteItem = () => {
    if (selectedItem) {
      // Move item to deleted items with timestamp
      const deletedItem: DeletedItem = {
        ...selectedItem,
        deletedAt: Date.now(),
        deletedReason: 'User deleted'
      };
      
      // Add to deleted items
      setDeletedItems(prev => [deletedItem, ...prev]);
      
      // Remove from active items
      setItems(items.filter(item => item.id !== selectedItem.id));
      
      // Set up undo functionality
      setLastDeletedItem(deletedItem);
      setShowUndoToast(true);
      
      // Clear any existing timeout
      if (undoTimeout) {
        clearTimeout(undoTimeout);
      }
      
      // Set new timeout for undo
      const timeout = setTimeout(() => {
        setShowUndoToast(false);
        setLastDeletedItem(null);
      }, 10000); // 10 seconds to undo
      
      setUndoTimeout(timeout);
      
      setSelectedItem(null);
      setShowDeleteModal(false);
    }
  };

  const handleUndoDelete = () => {
    if (lastDeletedItem) {
      // Remove from deleted items
      setDeletedItems(prev => prev.filter(item => item.id !== lastDeletedItem.id));
      
      // Add back to active items
      const restoredItem: Item = {
        id: lastDeletedItem.id,
        sku: lastDeletedItem.sku,
        name: lastDeletedItem.name,
        quantity: lastDeletedItem.quantity,
        location: lastDeletedItem.location,
        category: lastDeletedItem.category,
        minStock: lastDeletedItem.minStock,
        images: lastDeletedItem.images
      };
      
      setItems(prev => [...prev, restoredItem]);
      
      // Clear undo state
      setShowUndoToast(false);
      setLastDeletedItem(null);
      
      if (undoTimeout) {
        clearTimeout(undoTimeout);
        setUndoTimeout(null);
      }
    }
  };

  const handleRestoreItem = (deletedItem: DeletedItem) => {
    // Remove from deleted items
    setDeletedItems(prev => prev.filter(item => item.id !== deletedItem.id));
    
    // Add back to active items
    const restoredItem: Item = {
      id: deletedItem.id,
      sku: deletedItem.sku,
      name: deletedItem.name,
      quantity: deletedItem.quantity,
      location: deletedItem.location,
      category: deletedItem.category,
      minStock: deletedItem.minStock,
      images: deletedItem.images
    };
    
    setItems(prev => [...prev, restoredItem]);
  };

  const handlePermanentDelete = (deletedItem: DeletedItem) => {
    setDeletedItems(prev => prev.filter(item => item.id !== deletedItem.id));
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor(diff / (60 * 1000));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getDaysUntilPermanentDelete = (timestamp: number) => {
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const deleteDate = timestamp + thirtyDaysInMs;
    const now = Date.now();
    const daysLeft = Math.ceil((deleteDate - now) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysLeft);
  };

  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity <= minStock) {
      return { status: 'Low Stock', color: 'bg-red-100 text-red-800' };
    } else if (quantity <= minStock * 2) {
      return { status: 'Medium Stock', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
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
        
        <main className={`flex-1 overflow-x-hidden overflow-y-auto ${isDark ? 'bg-gray-900' : 'bg-gray-50'} px-4 py-6 md:px-6`}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <div>
                  <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Items Management</h1>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Manage your warehouse inventory items and stock levels</p>
                </div>
                <div className={`mt-4 lg:mt-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4`}>
                  <div className="flex items-center mb-2">
                    <Building className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Current Location</span>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{currentWarehouse}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{warehouseData.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6 mb-6`}>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items by name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  />
                </div>
                <div className="flex gap-3">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {deletedItems.length > 0 && (
                    <button
                      onClick={() => setShowTrashModal(true)}
                      className={`flex items-center px-4 py-2 border rounded-lg transition-colors relative ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                      title={`View ${deletedItems.length} deleted item${deletedItems.length > 1 ? 's' : ''}`}
                    >
                      <Trash2 className="h-5 w-5 mr-2" />
                      Trash
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                        {deletedItems.length}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Item
                  </button>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Inventory Items</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total items: {filteredItems.length}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
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
                          className={`transition-colors cursor-pointer ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                          onClick={() => handleViewDetails(item)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.sku}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className={`p-2 rounded-lg mr-3 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
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
                              <MapPin className={`h-4 w-4 mr-1 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                              {item.location}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.category}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                              {stockStatus.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditItem(item);
                                }}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="Edit item"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteItem(item);
                                }}
                                className="text-red-600 hover:text-red-800 transition-colors"
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
        </main>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add New Item</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>SKU</label>
                <input
                  type="text"
                  value={newItem.sku}
                  onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="e.g., SH-011"
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Item Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="e.g., Safety Goggles"
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Product Title (E-commerce Display)</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="e.g., Professional Safety Goggles - Anti-Fog"
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Product Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="Detailed product description for e-commerce display..."
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Price (USD)</label>
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="e.g., 125000"
                  min="0"
                  step="1000"
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Initial Quantity</label>
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="e.g., 100"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Location</label>
                <input
                  type="text"
                  value={newItem.location}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="e.g., A-01-20"
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.slice(1).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Product Images</label>
                <ImageUploadDropzone
                  onImagesChange={handleImagesChange}
                  maxFiles={5}
                  maxFileSize={5}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Edit Item</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateItem} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>SKU</label>
                <input
                  type="text"
                  value={editItem.sku}
                  onChange={(e) => setEditItem({ ...editItem, sku: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="e.g., SH-011"
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Item Name</label>
                <input
                  type="text"
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="e.g., Safety Goggles"
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Product Title (E-commerce Display)</label>
                <input
                  type="text"
                  value={editItem.title}
                  onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="e.g., Professional Safety Goggles - Anti-Fog"
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Product Description</label>
                <textarea
                  value={editItem.description}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="Detailed product description for e-commerce display..."
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Price (USD)</label>
                <input
                  type="number"
                  value={editItem.price}
                  onChange={(e) => setEditItem({ ...editItem, price: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="e.g., 125000"
                  min="0"
                  step="1000"
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Quantity</label>
                <input
                  type="number"
                  value={editItem.quantity}
                  onChange={(e) => setEditItem({ ...editItem, quantity: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="e.g., 100"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Location</label>
                <input
                  type="text"
                  value={editItem.location}
                  onChange={(e) => setEditItem({ ...editItem, location: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="e.g., A-01-20"
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Category</label>
                <select
                  value={editItem.category}
                  onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.slice(1).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                 <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Product Images</label>
                 <ImageUploadDropzone
                   onImagesChange={handleEditImagesChange}
                   maxFiles={5}
                   maxFileSize={5}
                   initialImages={editItem.images}
                 />
               </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Product Details
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className={`text-gray-400 hover:text-gray-600 ${isDark ? 'hover:text-gray-300' : ''}`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* E-commerce Product Display */}
            <div className="mb-6">
              <div className={`${isDark ? 'bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-800' : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'} border rounded-lg p-6`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                      {selectedItem.title}
                    </h2>
                    <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                      {selectedItem.name}
                    </p>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`text-3xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        {formatPrice(selectedItem.price)}
                      </div>
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                        getStockStatus(selectedItem.quantity, selectedItem.minStock).color
                      }`}>
                        {getStockStatus(selectedItem.quantity, selectedItem.minStock).status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                    Product Description
                  </h4>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                    {selectedItem.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} pb-2`}>
                  Inventory Information
                </h4>
                
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    SKU
                  </label>
                  <p className={`mt-1 font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedItem.sku}</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Internal Name
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{selectedItem.name}</span>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Category
                  </label>
                  <p className={`mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedItem.category}</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Warehouse Location
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{selectedItem.location}</span>
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div className="space-y-4">
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} pb-2`}>
                  Stock Information
                </h4>
                
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Current Quantity
                  </label>
                  <p className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedItem.quantity}</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Minimum Stock Level
                  </label>
                  <p className={`mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedItem.minStock}</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Stock Status
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                    getStockStatus(selectedItem.quantity, selectedItem.minStock).color
                  }`}>
                    {getStockStatus(selectedItem.quantity, selectedItem.minStock).status}
                  </span>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Warehouse
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{currentWarehouse}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Images */}
            {selectedItem.images && selectedItem.images.length > 0 && (
              <div className="mt-6">
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} pb-2 mb-4`}>
                  Product Images ({selectedItem.images.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {selectedItem.images.map((image, index) => (
                    <div
                      key={image.id}
                      className={`relative group rounded-lg overflow-hidden border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'} shadow-sm`}
                    >
                      <div className="aspect-square relative">
                        <img
                          src={image.preview}
                          alt={`${selectedItem.name} image ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleEditItem(selectedItem);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Item
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className={`px-6 py-2 border rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} bg-${isDark ? 'gray-700' : 'gray-50'} p-2 rounded`}>
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
                  {deletedItems.length} item{deletedItems.length > 1 ? 's' : ''} in trash
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
                            <div className={`p-2 rounded-lg ${isDark ? 'bg-red-900/30' : 'bg-red-50'}`}>
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
                                  {daysLeft} day{daysLeft !== 1 ? 's' : ''} until permanent deletion
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
                                if (window.confirm(`Permanently delete ${deletedItem.name}? This cannot be undone.`)) {
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
    </div>
  );
};

export default ItemsPage;
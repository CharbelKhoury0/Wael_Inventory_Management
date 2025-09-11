import React, { useState } from 'react';
import { X, Edit, Trash2, Package, MapPin, Tag, DollarSign, Hash, Calendar, User, FileText, BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Download, Share2, Copy, ExternalLink } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ItemDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onEdit: (item: any) => void;
}

const ItemDetails: React.FC<ItemDetailsProps> = ({ isOpen, onClose, item, onEdit }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  // Stock status helper
  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity === 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle };
    } else if (quantity <= minStock) {
      return { status: 'low-stock', label: 'Low Stock', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Clock };
    } else {
      return { status: 'in-stock', label: 'In Stock', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle };
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  // Export item data
  const exportItem = () => {
    const dataStr = JSON.stringify(item, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `item-${item.sku}.json`;
    link.click();
  };

  const stockStatus = getStockStatus(item.quantity, item.minStock);
  const StockIcon = stockStatus.icon;

  // Mock movement history data
  const movementHistory = [
    { id: 1, type: 'in', quantity: 50, date: '2024-01-15T10:30:00Z', reason: 'Purchase Order #PO-001', user: 'John Doe' },
    { id: 2, type: 'out', quantity: 15, date: '2024-01-14T14:20:00Z', reason: 'Sale Order #SO-123', user: 'Jane Smith' },
    { id: 3, type: 'in', quantity: 25, date: '2024-01-10T09:15:00Z', reason: 'Stock Adjustment', user: 'Admin' },
    { id: 4, type: 'out', quantity: 8, date: '2024-01-08T16:45:00Z', reason: 'Sale Order #SO-122', user: 'Jane Smith' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Package },
    { id: 'history', label: 'Movement History', icon: BarChart3 },
    { id: 'details', label: 'Additional Details', icon: FileText }
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-50'}`}>
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {item.name}
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  SKU: {item.sku}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => copyToClipboard(item.sku)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                title="Copy SKU"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={exportItem}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                title="Export Item"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEdit(item)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={onClose}
                className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Current Stock</p>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.quantity}</p>
                  </div>
                  <Package className={`h-8 w-8 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                </div>
              </div>
              
              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Unit Price</p>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(item.price)}</p>
                  </div>
                  <DollarSign className={`h-8 w-8 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                </div>
              </div>
              
              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Value</p>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(item.price * item.quantity)}</p>
                  </div>
                  <BarChart3 className={`h-8 w-8 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                </div>
              </div>
              
              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
                    <div className="flex items-center mt-1">
                      <StockIcon className={`h-4 w-4 ${stockStatus.color} mr-1`} />
                      <span className={`text-sm font-medium ${stockStatus.color}`}>{stockStatus.label}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : isDark
                        ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <TabIcon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h4 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Basic Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Name:</span>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>SKU:</span>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.sku}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Category:</span>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
                          <Tag className="h-3 w-3 mr-1" />
                          {item.category}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Location:</span>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
                          <MapPin className="h-3 w-3 mr-1" />
                          {item.location}
                        </span>
                      </div>
                      {item.barcode && (
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Barcode:</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
                            <Hash className="h-3 w-3 mr-1" />
                            {item.barcode}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Description */}
                  {item.description && (
                    <div>
                      <h4 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Description</h4>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                        {item.description}
                      </p>
                    </div>
                  )}
                  
                  {/* Inventory Details */}
                  <div>
                    <h4 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Inventory Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Current Quantity:</span>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Minimum Stock:</span>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.minStock}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Unit Price:</span>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(item.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Value:</span>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-6">
                  {/* Images */}
                  <div>
                    <h4 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Images</h4>
                    {item.images && item.images.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {item.images.map((image: any, index: number) => (
                          <div key={image.id || index} className="relative group cursor-pointer">
                            <img
                              src={image.preview || image.url}
                              alt={`${item.name} image ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg transition-transform group-hover:scale-105"
                              onClick={() => {
                                setSelectedImage(image.preview || image.url);
                                setShowImageModal(true);
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                              <ExternalLink className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-8 text-center`}>
                        <Package className={`mx-auto h-8 w-8 ${isDark ? 'text-gray-500' : 'text-gray-400'} mb-2`} />
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No images available</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Timestamps */}
                  <div>
                    <h4 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Timestamps</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center`}>
                          <Calendar className="h-3 w-3 mr-1" />
                          Date Added:
                        </span>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatDate(item.dateAdded)}
                        </span>
                      </div>
                      {item.lastModified && (
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center`}>
                            <Calendar className="h-3 w-3 mr-1" />
                            Last Modified:
                          </span>
                          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatDate(item.lastModified)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Additional Info */}
                  {(item.supplier || item.notes) && (
                    <div>
                      <h4 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Additional Information</h4>
                      <div className="space-y-3">
                        {item.supplier && (
                          <div className="flex justify-between">
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center`}>
                              <User className="h-3 w-3 mr-1" />
                              Supplier:
                            </span>
                            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {item.supplier}
                            </span>
                          </div>
                        )}
                        {item.notes && (
                          <div>
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center mb-2`}>
                              <FileText className="h-3 w-3 mr-1" />
                              Notes:
                            </span>
                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} bg-gray-50 dark:bg-gray-700 p-3 rounded-lg`}>
                              {item.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'history' && (
              <div>
                <h4 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Movement History</h4>
                <div className="space-y-4">
                  {movementHistory.map((movement) => (
                    <div key={movement.id} className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${
                            movement.type === 'in' 
                              ? 'bg-green-100 dark:bg-green-900 dark:bg-opacity-30' 
                              : 'bg-red-100 dark:bg-red-900 dark:bg-opacity-30'
                          }`}>
                            {movement.type === 'in' ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {movement.type === 'in' ? 'Stock In' : 'Stock Out'}: {movement.quantity} units
                            </p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {movement.reason} • by {movement.user}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatDate(movement.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Technical Details</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Item ID:</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Created:</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatDate(item.dateAdded)}</span>
                    </div>
                    {item.lastModified && (
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Last Updated:</span>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatDate(item.lastModified)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Stock Analysis</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Stock Level:</span>
                      <span className={`text-sm font-medium ${stockStatus.color}`}>{stockStatus.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Days of Stock:</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {Math.floor(item.quantity / 2)} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Reorder Point:</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.minStock} units
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Item image"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ItemDetails;
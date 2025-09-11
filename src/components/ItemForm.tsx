import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Camera, Package, DollarSign, Hash, MapPin, Tag, AlertTriangle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: any) => void;
  item?: any;
}

interface ItemImage {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
}

const ItemForm: React.FC<ItemFormProps> = ({ isOpen, onClose, onSave, item }) => {
  const { isDark } = useTheme();
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    location: '',
    price: '',
    quantity: '',
    minStock: '',
    barcode: '',
    supplier: '',
    notes: ''
  });
  
  const [images, setImages] = useState<ItemImage[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Categories and locations for dropdowns
  const categories = [
    'Electronics', 'Clothing', 'Food & Beverages', 'Books', 'Home & Garden',
    'Sports & Outdoors', 'Automotive', 'Health & Beauty', 'Toys & Games', 'Office Supplies'
  ];
  
  const locations = [
    'Warehouse A', 'Warehouse B', 'Warehouse C', 'Store Front', 'Back Room',
    'Loading Dock', 'Cold Storage', 'Secure Storage', 'Display Area', 'Returns Section'
  ];

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        sku: item.sku || '',
        description: item.description || '',
        category: item.category || '',
        location: item.location || '',
        price: item.price?.toString() || '',
        quantity: item.quantity?.toString() || '',
        minStock: item.minStock?.toString() || '',
        barcode: item.barcode || '',
        supplier: item.supplier || '',
        notes: item.notes || ''
      });
      
      // Set existing images if any
      if (item.images && item.images.length > 0) {
        setImages(item.images.map((img: any) => ({
          id: img.id || Math.random().toString(36).substr(2, 9),
          file: null, // Existing images don't have file objects
          preview: img.preview || img.url,
          name: img.name || 'Existing image',
          size: img.size || 0
        })));
      }
    } else {
      // Reset form for new item
      setFormData({
        name: '',
        sku: generateSKU(),
        description: '',
        category: '',
        location: '',
        price: '',
        quantity: '',
        minStock: '10',
        barcode: '',
        supplier: '',
        notes: ''
      });
      setImages([]);
    }
    setErrors({});
  }, [item, isOpen]);

  // Generate SKU
  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `ITM-${timestamp}-${random}`;
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle file upload
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newImages: ItemImage[] = [];
    
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage: ItemImage = {
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: e.target?.result as string,
            name: file.name,
            size: file.size
          };
          newImages.push(newImage);
          
          if (newImages.length === Array.from(files).filter(f => f.type.startsWith('image/')).length) {
            setImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Remove image
  const removeImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }
    
    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.location) {
      newErrors.location = 'Location is required';
    }
    
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = 'Valid price is required';
    }
    
    if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0) {
      newErrors.quantity = 'Valid quantity is required';
    }
    
    if (!formData.minStock || isNaN(Number(formData.minStock)) || Number(formData.minStock) < 0) {
      newErrors.minStock = 'Valid minimum stock is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const itemData = {
        ...formData,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        minStock: Number(formData.minStock),
        images: images,
        dateAdded: item ? item.dateAdded : new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      await onSave(itemData);
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {item ? 'Edit Item' : 'Add New Item'}
          </h3>
          <button
            onClick={onClose}
            className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Basic Information</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Item Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      } ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="Enter item name"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      SKU *
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      } ${errors.sku ? 'border-red-500' : ''}`}
                      placeholder="Enter SKU"
                    />
                    {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter item description"
                    />
                  </div>
                </div>
              </div>
              
              {/* Category and Location */}
              <div>
                <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Classification</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      } ${errors.category ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Location *
                    </label>
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      } ${errors.location ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select location</option>
                      {locations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                    {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                  </div>
                </div>
              </div>
              
              {/* Pricing and Inventory */}
              <div>
                <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Pricing & Inventory</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Price (USD) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      } ${errors.price ? 'border-red-500' : ''}`}
                      placeholder="0.00"
                    />
                    {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Quantity *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      min="0"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      } ${errors.quantity ? 'border-red-500' : ''}`}
                      placeholder="0"
                    />
                    {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Min Stock *
                    </label>
                    <input
                      type="number"
                      name="minStock"
                      value={formData.minStock}
                      onChange={handleInputChange}
                      min="0"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      } ${errors.minStock ? 'border-red-500' : ''}`}
                      placeholder="10"
                    />
                    {errors.minStock && <p className="text-red-500 text-xs mt-1">{errors.minStock}</p>}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              {/* Images */}
              <div>
                <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Images</h4>
                
                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20'
                      : isDark 
                      ? 'border-gray-600 hover:border-gray-500' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className={`mx-auto h-8 w-8 ${isDark ? 'text-gray-400' : 'text-gray-400'} mb-2`} />
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    Drag and drop images here, or
                  </p>
                  <label className="cursor-pointer">
                    <span className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                      Choose Files
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                  </label>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </div>
                
                {/* Image Preview */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                    {images.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.preview}
                          alt={image.name}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate`}>
                          {image.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Additional Information */}
              <div>
                <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Additional Information</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Barcode
                    </label>
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter barcode"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Supplier
                    </label>
                    <input
                      type="text"
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter supplier name"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Additional notes"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className={`flex justify-end gap-3 mt-8 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 border rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4" />
                  {item ? 'Update Item' : 'Add Item'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemForm;
import React, { useState, useRef, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { useInventoryStore, Item } from '../store/inventoryStore';
import {
  Upload,
  Download,
  Edit,
  Trash2,
  X,
  CheckSquare,
  Square,
  FileText,
  AlertTriangle,
  Save,
  RotateCcw
} from 'lucide-react';

interface BulkOperationsProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  items: Item[];
}

interface BulkEditData {
  category?: string;
  minStock?: number;
  location?: string;
  supplier?: string;
  priceAdjustment?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
}

const BulkOperations: React.FC<BulkOperationsProps> = ({
  isOpen,
  onClose,
  selectedItems,
  onSelectionChange,
  items
}) => {
  const { isDark } = useTheme();
  const { showSuccess, showError, showWarning } = useNotification();
  const { updateItem, deleteItem, addItem } = useInventoryStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'delete' | 'import' | 'export'>('edit');
  const [bulkEditData, setBulkEditData] = useState<BulkEditData>({});
  const [importData, setImportData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const themeClasses = {
    modal: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    overlay: 'bg-black bg-opacity-50',
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-600',
      muted: isDark ? 'text-gray-400' : 'text-gray-500'
    },
    input: isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
    button: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: isDark ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      success: 'bg-green-600 hover:bg-green-700 text-white'
    },
    tab: {
      active: isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300',
      inactive: isDark ? 'bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-300' : 'bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-700'
    }
  };

  const selectedItemsData = items.filter(item => selectedItems.includes(item.id));
  const categories = [...new Set(items.map(item => item.category))];
  const locations = [...new Set(items.map(item => item.location))];
  const suppliers = [...new Set(items.map(item => item.supplier).filter(Boolean))];

  const handleBulkEdit = async () => {
    if (selectedItems.length === 0) {
      showWarning('No Items Selected', 'Please select items to edit');
      return;
    }

    setIsProcessing(true);
    try {
      let updatedCount = 0;
      
      for (const itemId of selectedItems) {
        const item = items.find(i => i.id === itemId);
        if (!item) continue;

        const updates: Partial<Item> = {};
        
        if (bulkEditData.category) updates.category = bulkEditData.category;
        if (bulkEditData.minStock !== undefined) updates.minStock = bulkEditData.minStock;
        if (bulkEditData.location) updates.location = bulkEditData.location;
        if (bulkEditData.supplier) updates.supplier = bulkEditData.supplier;
        
        if (bulkEditData.priceAdjustment) {
          const { type, value } = bulkEditData.priceAdjustment;
          if (type === 'percentage') {
            updates.price = item.price * (1 + value / 100);
          } else {
            updates.price = item.price + value;
          }
        }

        if (Object.keys(updates).length > 0) {
          updates.lastUpdated = new Date().toISOString();
          updateItem(itemId, updates);
          updatedCount++;
        }
      }

      showSuccess(
        'Bulk Edit Completed',
        `Successfully updated ${updatedCount} items`
      );
      
      setBulkEditData({});
      onClose();
    } catch (error) {
      showError('Bulk Edit Failed', 'An error occurred while updating items');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      showWarning('No Items Selected', 'Please select items to delete');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedItems.length} items? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      for (const itemId of selectedItems) {
        deleteItem(itemId);
      }

      showSuccess(
        'Bulk Delete Completed',
        `Successfully deleted ${selectedItems.length} items`
      );
      
      onSelectionChange([]);
      onClose();
    } catch (error) {
      showError('Bulk Delete Failed', 'An error occurred while deleting items');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          showError('Invalid File', 'The file appears to be empty');
          return;
        }

        // Parse CSV
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['sku', 'name', 'category', 'price', 'quantity', 'location', 'minstock'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          showError(
            'Invalid CSV Format',
            `Missing required columns: ${missingHeaders.join(', ')}`
          );
          return;
        }

        const data = [];
        const errors = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length !== headers.length) {
            errors.push(`Line ${i + 1}: Column count mismatch`);
            continue;
          }

          const item: any = {};
          headers.forEach((header, index) => {
            item[header] = values[index];
          });

          // Validate required fields
          if (!item.sku || !item.name || !item.category) {
            errors.push(`Line ${i + 1}: Missing required fields`);
            continue;
          }

          // Convert numeric fields
          item.price = parseFloat(item.price) || 0;
          item.quantity = parseInt(item.quantity) || 0;
          item.minstock = parseInt(item.minstock) || 0;
          
          // Generate ID and add metadata
          item.id = `IMPORT-${Date.now()}-${i}`;
          item.title = item.name;
          item.description = item.description || `Imported item: ${item.name}`;
          item.lastUpdated = new Date().toISOString();

          data.push(item);
        }

        setImportData(data);
        setImportErrors(errors);
        
        if (data.length > 0) {
          showSuccess(
            'File Parsed Successfully',
            `Found ${data.length} valid items${errors.length > 0 ? ` (${errors.length} errors)` : ''}`
          );
        }
      } catch (error) {
        showError('File Parse Error', 'Failed to parse the CSV file');
      }
    };
    
    reader.readAsText(file);
  }, [showError, showSuccess]);

  const handleImport = async () => {
    if (importData.length === 0) {
      showWarning('No Data to Import', 'Please upload a valid CSV file first');
      return;
    }

    setIsProcessing(true);
    try {
      let importedCount = 0;
      
      for (const item of importData) {
        // Check for duplicate SKU
        const existingItem = items.find(i => i.sku === item.sku);
        if (existingItem) {
          showWarning(
            'Duplicate SKU Found',
            `Item with SKU ${item.sku} already exists and was skipped`
          );
          continue;
        }

        addItem(item as Item);
        importedCount++;
      }

      showSuccess(
        'Import Completed',
        `Successfully imported ${importedCount} items`
      );
      
      setImportData([]);
      setImportErrors([]);
      onClose();
    } catch (error) {
      showError('Import Failed', 'An error occurred while importing items');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportTemplate = () => {
    const headers = ['sku', 'name', 'title', 'description', 'category', 'price', 'quantity', 'location', 'minstock', 'supplier'];
    const csvContent = headers.join(',') + '\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory_import_template.csv';
    link.click();
    URL.revokeObjectURL(url);
    
    showSuccess('Template Downloaded', 'CSV template has been downloaded');
  };

  const handleExportSelected = () => {
    if (selectedItems.length === 0) {
      showWarning('No Items Selected', 'Please select items to export');
      return;
    }

    const headers = ['sku', 'name', 'title', 'description', 'category', 'price', 'quantity', 'location', 'minstock', 'supplier'];
    const csvRows = [headers.join(',')];
    
    selectedItemsData.forEach(item => {
      const row = headers.map(header => {
        const value = item[header as keyof Item] || '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `selected_items_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    showSuccess('Export Completed', `Exported ${selectedItems.length} items`);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${themeClasses.overlay}`}>
      <div className={`${themeClasses.modal} rounded-lg border shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className={`text-xl font-semibold ${themeClasses.text.primary}`}>Bulk Operations</h3>
            <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>
              {selectedItems.length} items selected
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-md ${themeClasses.button.secondary}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'edit', label: 'Bulk Edit', icon: Edit },
              { id: 'delete', label: 'Bulk Delete', icon: Trash2 },
              { id: 'import', label: 'Import', icon: Upload },
              { id: 'export', label: 'Export', icon: Download }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'edit' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                    Category
                  </label>
                  <select
                    value={bulkEditData.category || ''}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, category: e.target.value || undefined }))}
                    className={`w-full px-3 py-2 rounded-md border ${themeClasses.input}`}
                  >
                    <option value="">Keep current</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                    Location
                  </label>
                  <select
                    value={bulkEditData.location || ''}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, location: e.target.value || undefined }))}
                    className={`w-full px-3 py-2 rounded-md border ${themeClasses.input}`}
                  >
                    <option value="">Keep current</option>
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                    Minimum Stock
                  </label>
                  <input
                    type="number"
                    value={bulkEditData.minStock || ''}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, minStock: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="Keep current"
                    className={`w-full px-3 py-2 rounded-md border ${themeClasses.input}`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                    Supplier
                  </label>
                  <select
                    value={bulkEditData.supplier || ''}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, supplier: e.target.value || undefined }))}
                    className={`w-full px-3 py-2 rounded-md border ${themeClasses.input}`}
                  >
                    <option value="">Keep current</option>
                    {suppliers.map(sup => (
                      <option key={sup} value={sup}>{sup}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                  Price Adjustment
                </label>
                <div className="flex gap-2">
                  <select
                    value={bulkEditData.priceAdjustment?.type || ''}
                    onChange={(e) => setBulkEditData(prev => ({
                      ...prev,
                      priceAdjustment: e.target.value ? {
                        type: e.target.value as 'percentage' | 'fixed',
                        value: prev.priceAdjustment?.value || 0
                      } : undefined
                    }))}
                    className={`px-3 py-2 rounded-md border ${themeClasses.input}`}
                  >
                    <option value="">No adjustment</option>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                  
                  {bulkEditData.priceAdjustment && (
                    <input
                      type="number"
                      step="0.01"
                      value={bulkEditData.priceAdjustment.value}
                      onChange={(e) => setBulkEditData(prev => ({
                        ...prev,
                        priceAdjustment: {
                          ...prev.priceAdjustment!,
                          value: parseFloat(e.target.value) || 0
                        }
                      }))}
                      placeholder={bulkEditData.priceAdjustment.type === 'percentage' ? '% change' : '$ change'}
                      className={`flex-1 px-3 py-2 rounded-md border ${themeClasses.input}`}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'delete' && (
            <div className="text-center py-8">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h4 className={`text-lg font-semibold ${themeClasses.text.primary} mb-2`}>
                Delete {selectedItems.length} Items
              </h4>
              <p className={`${themeClasses.text.secondary} mb-6`}>
                This action cannot be undone. All selected items will be permanently removed from your inventory.
              </p>
              <div className="space-y-2">
                {selectedItemsData.slice(0, 5).map(item => (
                  <div key={item.id} className={`text-sm ${themeClasses.text.muted}`}>
                    {item.sku} - {item.name}
                  </div>
                ))}
                {selectedItemsData.length > 5 && (
                  <div className={`text-sm ${themeClasses.text.muted}`}>
                    ... and {selectedItemsData.length - 5} more items
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className="text-center">
                <Upload className={`h-12 w-12 ${themeClasses.text.muted} mx-auto mb-4`} />
                <h4 className={`text-lg font-semibold ${themeClasses.text.primary} mb-2`}>
                  Import Items from CSV
                </h4>
                <p className={`${themeClasses.text.secondary} mb-4`}>
                  Upload a CSV file to bulk import inventory items
                </p>
                
                <div className="flex justify-center gap-4 mb-6">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-4 py-2 rounded-md ${themeClasses.button.primary}`}
                  >
                    Choose File
                  </button>
                  <button
                    onClick={handleExportTemplate}
                    className={`px-4 py-2 rounded-md ${themeClasses.button.secondary}`}
                  >
                    Download Template
                  </button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              
              {importData.length > 0 && (
                <div>
                  <h5 className={`font-medium ${themeClasses.text.primary} mb-2`}>
                    Preview ({importData.length} items)
                  </h5>
                  <div className="max-h-40 overflow-y-auto border rounded-md">
                    <table className="w-full text-sm">
                      <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} sticky top-0`}>
                        <tr>
                          <th className="px-3 py-2 text-left">SKU</th>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Category</th>
                          <th className="px-3 py-2 text-left">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importData.slice(0, 10).map((item, index) => (
                          <tr key={index} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                            <td className="px-3 py-2">{item.sku}</td>
                            <td className="px-3 py-2">{item.name}</td>
                            <td className="px-3 py-2">{item.category}</td>
                            <td className="px-3 py-2">${item.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {importErrors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                  <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">Import Errors</h5>
                  <ul className="text-sm text-red-600 dark:text-red-300 space-y-1">
                    {importErrors.slice(0, 5).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {importErrors.length > 5 && (
                      <li>• ... and {importErrors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div className="text-center py-8">
              <Download className={`h-12 w-12 ${themeClasses.text.muted} mx-auto mb-4`} />
              <h4 className={`text-lg font-semibold ${themeClasses.text.primary} mb-2`}>
                Export Items
              </h4>
              <p className={`${themeClasses.text.secondary} mb-6`}>
                Export selected items or download a template for importing
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={handleExportSelected}
                  disabled={selectedItems.length === 0}
                  className={`px-6 py-3 rounded-md ${themeClasses.button.primary} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Export Selected Items ({selectedItems.length})
                </button>
                
                <button
                  onClick={handleExportTemplate}
                  className={`px-6 py-3 rounded-md ${themeClasses.button.secondary}`}
                >
                  Download Import Template
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-md ${themeClasses.button.secondary}`}
          >
            Cancel
          </button>
          
          <div className="flex gap-3">
            {activeTab === 'edit' && (
              <button
                onClick={handleBulkEdit}
                disabled={isProcessing || selectedItems.length === 0}
                className={`px-6 py-2 rounded-md ${themeClasses.button.success} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {isProcessing ? (
                  <RotateCcw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isProcessing ? 'Processing...' : 'Apply Changes'}
              </button>
            )}
            
            {activeTab === 'delete' && (
              <button
                onClick={handleBulkDelete}
                disabled={isProcessing || selectedItems.length === 0}
                className={`px-6 py-2 rounded-md ${themeClasses.button.danger} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {isProcessing ? (
                  <RotateCcw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {isProcessing ? 'Deleting...' : 'Delete Items'}
              </button>
            )}
            
            {activeTab === 'import' && (
              <button
                onClick={handleImport}
                disabled={isProcessing || importData.length === 0}
                className={`px-6 py-2 rounded-md ${themeClasses.button.success} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {isProcessing ? (
                  <RotateCcw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isProcessing ? 'Importing...' : 'Import Items'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkOperations;
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { Search, Plus, Package, MapPin, Filter, Edit, Trash2, X } from 'lucide-react';

interface ItemsPageProps {
  onLogout: () => void;
  onPageChange: (page: string) => void;
}

interface Item {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  location: string;
  category: string;
  minStock: number;
}

const ItemsPage: React.FC<ItemsPageProps> = ({ onLogout, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [items, setItems] = useState<Item[]>([
    {
      id: '1',
      sku: 'SH-001',
      name: 'Industrial Safety Helmets',
      quantity: 150,
      location: 'A-01-15',
      category: 'Safety Equipment',
      minStock: 25
    },
    {
      id: '2',
      sku: 'WM-002',
      name: 'Steel Wire Mesh Rolls',
      quantity: 75,
      location: 'B-03-22',
      category: 'Construction Materials',
      minStock: 10
    },
    {
      id: '3',
      sku: 'HF-003',
      name: 'Hydraulic Oil Filters',
      quantity: 200,
      location: 'C-02-08',
      category: 'Maintenance Parts',
      minStock: 50
    },
    {
      id: '4',
      sku: 'CF-004',
      name: 'Construction Fasteners',
      quantity: 500,
      location: 'A-05-12',
      category: 'Hardware',
      minStock: 100
    },
    {
      id: '5',
      sku: 'EJ-005',
      name: 'Electrical Junction Boxes',
      quantity: 300,
      location: 'D-01-05',
      category: 'Electrical Components',
      minStock: 40
    },
    {
      id: '6',
      sku: 'WG-006',
      name: 'Heavy Duty Work Gloves',
      quantity: 120,
      location: 'A-02-18',
      category: 'Safety Equipment',
      minStock: 30
    },
    {
      id: '7',
      sku: 'PW-007',
      name: 'Power Drill Bits Set',
      quantity: 85,
      location: 'C-04-11',
      category: 'Tools',
      minStock: 20
    },
    {
      id: '8',
      sku: 'LED-008',
      name: 'LED Work Lights',
      quantity: 45,
      location: 'D-03-07',
      category: 'Lighting',
      minStock: 15
    },
    {
      id: '9',
      sku: 'CB-009',
      name: 'Circuit Breakers 20A',
      quantity: 180,
      location: 'D-02-14',
      category: 'Electrical Components',
      minStock: 25
    },
    {
      id: '10',
      sku: 'ST-010',
      name: 'Steel Measuring Tape',
      quantity: 65,
      location: 'C-01-09',
      category: 'Tools',
      minStock: 15
    }
  ]);

  const [newItem, setNewItem] = useState({
    sku: '',
    name: '',
    quantity: '',
    location: '',
    category: ''
  });

  const categories = ['All', 'Safety Equipment', 'Construction Materials', 'Maintenance Parts', 'Hardware', 'Electrical Components', 'Tools', 'Lighting'];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.sku && newItem.name && newItem.quantity && newItem.location && newItem.category) {
      const item: Item = {
        id: (items.length + 1).toString(),
        sku: newItem.sku,
        name: newItem.name,
        quantity: parseInt(newItem.quantity),
        location: newItem.location,
        category: newItem.category,
        minStock: 10
      };
      setItems([...items, item]);
      setNewItem({ sku: '', name: '', quantity: '', location: '', category: '' });
      setShowAddModal(false);
    }
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
    <div className="flex h-screen bg-gray-50">
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
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 px-4 py-6 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Items Management</h1>
              <p className="text-gray-600">Manage your warehouse inventory items and stock levels</p>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items by name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Inventory Items</h2>
                <p className="text-sm text-gray-500">Total items: {filteredItems.length}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => {
                      const stockStatus = getStockStatus(item.quantity, item.minStock);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.sku}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="bg-blue-50 p-2 rounded-lg mr-3">
                                <Package className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{item.quantity}</div>
                            <div className="text-xs text-gray-500">Min: {item.minStock}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                              {item.location}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.category}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                              {stockStatus.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button className="text-blue-600 hover:text-blue-800 transition-colors">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-800 transition-colors">
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Item</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                <input
                  type="text"
                  value={newItem.sku}
                  onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., SH-011"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Safety Goggles"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Quantity</label>
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 100"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={newItem.location}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., A-01-20"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.slice(1).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
    </div>
  );
};

export default ItemsPage;
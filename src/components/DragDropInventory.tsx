import React, { useState, useCallback, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useInventory } from '../hooks/useInventory';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from 'react-beautiful-dnd';
import {
  Package,
  Search,
  Filter,
  Calendar,
  DollarSign,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Tag,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Trash2,
  Move,
  Grid,
  List
} from 'lucide-react';
import type { Item } from '../store/inventoryStore';

interface DragDropInventoryProps {
  onItemSelect?: (item: Item) => void;
  onItemEdit?: (item: Item) => void;
  onItemDelete?: (itemId: string) => void;
}

interface FilterState {
  search: string;
  category: string;
  location: string;
  priceRange: [number, number];
  stockStatus: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  dateRange: {
    start: string;
    end: string;
  };
  sortBy: 'name' | 'price' | 'quantity' | 'category' | 'lastUpdated';
  sortOrder: 'asc' | 'desc';
}

interface LocationZone {
  id: string;
  name: string;
  capacity: number;
  currentItems: string[];
  color: string;
}

const DragDropInventory: React.FC<DragDropInventoryProps> = ({
  onItemSelect,
  onItemEdit,
  onItemDelete
}) => {
  const { isDark } = useTheme();
  const { items, updateItem } = useInventory();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    location: 'all',
    priceRange: [0, 1000],
    stockStatus: 'all',
    dateRange: {
      start: '',
      end: ''
    },
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Define warehouse zones for drag and drop
  const [locationZones] = useState<LocationZone[]>([
    {
      id: 'zone-a',
      name: 'Zone A - High Priority',
      capacity: 50,
      currentItems: [],
      color: 'bg-red-100 border-red-300'
    },
    {
      id: 'zone-b',
      name: 'Zone B - Medium Priority',
      capacity: 100,
      currentItems: [],
      color: 'bg-yellow-100 border-yellow-300'
    },
    {
      id: 'zone-c',
      name: 'Zone C - Standard',
      capacity: 200,
      currentItems: [],
      color: 'bg-green-100 border-green-300'
    },
    {
      id: 'zone-d',
      name: 'Zone D - Overflow',
      capacity: 150,
      currentItems: [],
      color: 'bg-blue-100 border-blue-300'
    }
  ]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          item.name.toLowerCase().includes(searchLower) ||
          item.sku.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }

      // Location filter
      if (filters.location !== 'all' && !item.location.includes(filters.location)) {
        return false;
      }

      // Price range filter
      if (item.price < filters.priceRange[0] || item.price > filters.priceRange[1]) {
        return false;
      }

      // Stock status filter
      if (filters.stockStatus !== 'all') {
        switch (filters.stockStatus) {
          case 'out_of_stock':
            if (item.quantity > 0) return false;
            break;
          case 'low_stock':
            if (item.quantity > item.minStock) return false;
            break;
          case 'in_stock':
            if (item.quantity <= item.minStock) return false;
            break;
        }
      }

      // Date range filter
      if (filters.dateRange.start && filters.dateRange.end) {
        const itemDate = new Date(item.lastUpdated || '');
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (itemDate < startDate || itemDate > endDate) {
          return false;
        }
      }

      return true;
    });

    // Sort items
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy];
      let bValue: any = b[filters.sortBy];

      if (filters.sortBy === 'lastUpdated') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [items, filters]);

  // Get unique categories and locations for filters
  const categories = useMemo(() => {
    const cats = new Set(items.map(item => item.category));
    return Array.from(cats).sort();
  }, [items]);

  const locations = useMemo(() => {
    const locs = new Set(items.map(item => item.location.split('-')[0]));
    return Array.from(locs).sort();
  }, [items]);

  // Handle drag end
  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // If dropped in the same position, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the item being moved
    const item = items.find(i => i.id === draggableId);
    if (!item) return;

    // Update item location based on destination zone
    const destinationZone = locationZones.find(zone => zone.id === destination.droppableId);
    if (destinationZone) {
      const newLocation = `${destinationZone.name.split(' ')[1]}-${item.location.split('-').slice(1).join('-') || '01-01'}`;
      
      updateItem(item.id, {
        location: newLocation,
        lastUpdated: new Date().toISOString()
      });
    }
  }, [items, locationZones, updateItem]);

  // Handle item selection
  const handleItemSelection = useCallback((itemId: string, isSelected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  }, []);

  // Get stock status info
  const getStockStatus = useCallback((item: Item) => {
    if (item.quantity === 0) {
      return { status: 'Out of Stock', color: 'text-red-600 bg-red-100', icon: AlertTriangle };
    } else if (item.quantity <= item.minStock) {
      return { status: 'Low Stock', color: 'text-yellow-600 bg-yellow-100', icon: Clock };
    } else {
      return { status: 'In Stock', color: 'text-green-600 bg-green-100', icon: CheckCircle };
    }
  }, []);

  // Render item card
  const renderItemCard = useCallback((item: Item, index: number) => {
    const stockStatus = getStockStatus(item);
    const isSelected = selectedItems.has(item.id);

    return (
      <Draggable key={item.id} draggableId={item.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`
              ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
              border rounded-lg p-4 mb-3 transition-all duration-200
              ${snapshot.isDragging ? 'shadow-lg rotate-2 scale-105' : 'shadow-sm hover:shadow-md'}
              ${isSelected ? 'ring-2 ring-blue-500' : ''}
              cursor-move
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleItemSelection(item.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <Package className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {item.sku}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemSelect?.(item);
                  }}
                  className={`p-1 rounded hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700' : ''}`}
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemEdit?.(item);
                  }}
                  className={`p-1 rounded hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700' : ''}`}
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemDelete?.(item.id);
                  }}
                  className="p-1 rounded hover:bg-red-100 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-3">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                {item.name}
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                {item.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Price</span>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ${item.price.toFixed(2)}
                </p>
              </div>
              <div>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Quantity</span>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {item.quantity}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {item.location}
                </span>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${stockStatus.color}`}>
                <stockStatus.icon className="h-3 w-3" />
                {stockStatus.status}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs">
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Category</span>
                <span className={`px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                  {item.category}
                </span>
              </div>
            </div>
          </div>
        )}
      </Draggable>
    );
  }, [isDark, selectedItems, getStockStatus, handleItemSelection, onItemSelect, onItemEdit, onItemDelete]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Inventory Organization
            </h1>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Drag and drop items to organize your warehouse zones
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search items..."
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Stock Status Filter */}
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Stock Status
              </label>
              <select
                value={filters.stockStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, stockStatus: e.target.value as any }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">All Status</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="quantity">Quantity</option>
                  <option value="category">Category</option>
                  <option value="lastUpdated">Last Updated</option>
                </select>
                <button
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                  }))}
                  className={`px-3 py-2 border rounded-lg ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                      : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {filters.sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="mt-4">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="1000"
                value={filters.priceRange[0]}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  priceRange: [parseInt(e.target.value), prev.priceRange[1]] 
                }))}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="1000"
                value={filters.priceRange[1]}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  priceRange: [prev.priceRange[0], parseInt(e.target.value)] 
                }))}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4">
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Showing {filteredItems.length} of {items.length} items
          {selectedItems.size > 0 && ` • ${selectedItems.size} selected`}
        </p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Warehouse Zones */}
          {locationZones.map(zone => {
            const zoneItems = filteredItems.filter(item => 
              item.location.startsWith(zone.name.split(' ')[1])
            );
            
            return (
              <div key={zone.id} className="space-y-4">
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {zone.name}
                    </h3>
                    <span className={`text-sm px-2 py-1 rounded ${zone.color}`}>
                      {zoneItems.length}/{zone.capacity}
                    </span>
                  </div>
                  
                  <Droppable droppableId={zone.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
                          min-h-[200px] p-3 border-2 border-dashed rounded-lg transition-colors
                          ${snapshot.isDraggingOver 
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-300 dark:border-gray-600'
                          }
                        `}
                      >
                        {zoneItems.length === 0 ? (
                          <div className="flex items-center justify-center h-32">
                            <div className="text-center">
                              <Move className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Drop items here
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className={viewMode === 'grid' ? 'space-y-3' : 'space-y-2'}>
                            {zoneItems.map((item, index) => renderItemCard(item, index))}
                          </div>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg p-4`}>
          <div className="flex items-center gap-4">
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {selectedItems.size} items selected
            </span>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                Move to Zone
              </button>
              <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                Update Category
              </button>
              <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                Delete Selected
              </button>
              <button 
                onClick={() => setSelectedItems(new Set())}
                className={`px-3 py-1 border rounded text-sm ${
                  isDark 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(DragDropInventory);
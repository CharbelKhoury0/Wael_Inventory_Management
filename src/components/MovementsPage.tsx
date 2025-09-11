import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useWarehouse } from '../App';
import { useInventory, useMovements } from '../hooks/useInventory';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import SkeletonLoader from './SkeletonLoader';
import TableSkeleton from './TableSkeleton';
import { 
  Search, 
  Plus, 
  Truck, 
  Container, 
  Filter, 
  Eye, 
  Calendar, 
  User, 
  FileText, 
  Building,
  Lock,
  Unlock,
  Edit,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle,
  Phone,
  Mail,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  Package
} from 'lucide-react';

interface MovementsPageProps {
  onLogout: () => void;
  onPageChange: (page: string) => void;
}

interface Movement {
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

interface Product {
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

interface ContainerContents {
  containerId: string;
  products: Product[];
  isLocked: boolean;
  lastUpdated: string;
  totalValue: number;
  totalItems: number;
}

const MovementsPage: React.FC<MovementsPageProps> = ({ onLogout, onPageChange }) => {
  const { isDark } = useTheme();
  const { currentWarehouse, warehouseData } = useWarehouse();
  const { containerContents, isLoading, isSubmitting, setLoading, setSubmitting, updateContainerContents, addContainerContents } = useInventory();
  const { movements, addMovement, updateMovement, deleteMovement, filterMovements } = useMovements();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showLogModal, setShowLogModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showContainerModal, setShowContainerModal] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [newMovement, setNewMovement] = useState({
    type: 'Arrival' as 'Arrival' | 'Departure',
    transportType: 'Container' as 'Container' | 'Truck',
    truckPlate: '',
    containerId: '',
    truckInfo: {
      plateNumber: '',
      trailerInfo: '',
      capacity: ''
    },
    containerInfo: {
      containerId: '',
      sealNumber: '',
      size: '',
      type: ''
    },
    driverName: '',
    driverPhone: '',
    driverEmail: '',
    origin: '',
    destination: '',
    notes: ''
  });
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    type: '',
    quantity: 0,
    unit: '',
    condition: 'Good',
    value: 0,
    description: '',
    barcode: ''
  });

  // Initialize data on component mount
  const { initializeData } = useInventory();
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Simulate loading delay for better UX demonstration
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Initialize data if store is empty
      if (movements.length === 0) {
        initializeData();
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [initializeData, movements.length, setLoading]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'Arrival':
        return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
      case 'Departure':
        return <ArrowUpCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  }, []);

  const getTransportTypeIcon = useCallback((transportType: string) => {
    switch (transportType) {
      case 'Container':
        return <Container className="h-5 w-5 text-blue-600" />;
      case 'Truck':
        return <Truck className="h-5 w-5 text-orange-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  }, []);

  const getTransportTypeColor = useCallback((transportType: string) => {
    switch (transportType) {
      case 'Container':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Truck':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const generateMovementId = () => {
    const timestamp = Date.now();
    return `MOV-${timestamp.toString().slice(-6)}`;
  };

  const generateProductId = () => {
    const timestamp = Date.now();
    return `PROD-${timestamp.toString().slice(-6)}`;
  };

  const validateMovement = (movement: any) => {
    const errors: string[] = [];
    
    if (!movement.driverName?.trim()) errors.push('Driver name is required');
    
    if (movement.transportType === 'Container') {
      if (!movement.containerInfo?.containerId?.trim()) {
        errors.push('Container ID is required for container transport');
      }
    } else if (movement.transportType === 'Truck') {
      if (!movement.truckInfo?.plateNumber?.trim()) {
        errors.push('Truck plate is required for truck transport');
      }
    }
    
    if (movement.driverPhone && !/^\+961-\d{2}-\d{6}$/.test(movement.driverPhone)) {
      errors.push('Phone number must be in format +961-XX-XXXXXX');
    }
    if (movement.driverEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(movement.driverEmail)) {
      errors.push('Invalid email format');
    }
    return errors;
  };

  const checkDuplicateContainer = (containerId: string, excludeId?: string) => {
    return movements.some(m => m.containerId === containerId && m.id !== excludeId && m.status !== 'Completed');
  };

  const getContainerContents = (containerId: string) => {
    return containerContents.find(cc => cc.containerId === containerId);
  };

  const toggleContainerLock = (containerId: string) => {
    const container = getContainerContents(containerId);
    if (container) {
      updateContainerContents(containerId, {
        isLocked: !container.isLocked,
        lastUpdated: new Date().toLocaleString()
      });
    }
    
    // Update all movements with this container
    movements.forEach(movement => {
      if (movement.containerId === containerId) {
        updateMovement(movement.id, { isLocked: !movement.isLocked });
      }
    });
  };

  const filteredMovements = useMemo(() => {
    return filterMovements({
      searchTerm,
      type: filterType === 'all' || filterType === 'Container' || filterType === 'Truck' ? undefined : filterType,
      transportType: filterType === 'Container' || filterType === 'Truck' ? filterType : undefined
    });
  }, [filterMovements, searchTerm, filterType]);

  const handleLogMovement = useCallback(async () => {
    setSubmitting(true);
    
    try {
      const errors = validateMovement(newMovement);
      if (errors.length > 0) {
        alert('Please fix the following errors:\n' + errors.join('\n'));
        return;
      }

    // Check for duplicate container/truck based on transport type
    if (newMovement.transportType === 'Container' && newMovement.containerInfo?.containerId) {
      if (checkDuplicateContainer(newMovement.containerInfo.containerId)) {
        alert('A container with this ID is already active. Please use a different container ID.');
        return;
      }
    }

    const movementData = {
      type: newMovement.type as 'Arrival' | 'Departure',
      transportType: newMovement.transportType,
      truckPlate: newMovement.transportType === 'Truck' ? newMovement.truckInfo?.plateNumber || '' : '',
      containerId: newMovement.transportType === 'Container' ? newMovement.containerInfo?.containerId : undefined,
      truckInfo: newMovement.transportType === 'Truck' ? newMovement.truckInfo : undefined,
      containerInfo: newMovement.transportType === 'Container' ? newMovement.containerInfo : undefined,
      driverName: newMovement.driverName!,
      driverPhone: newMovement.driverPhone,
      driverEmail: newMovement.driverEmail,
      status: 'In Progress' as const,
      origin: newMovement.origin,
      destination: newMovement.destination,
      notes: newMovement.notes,
      isLocked: false,
      arrivalTime: newMovement.type === 'Arrival' ? new Date().toLocaleString() : undefined,
      departureTime: newMovement.type === 'Departure' ? new Date().toLocaleString() : undefined
    };

    const movement = addMovement(movementData);
    
    // Initialize container contents if it's a container arrival
    if (movement.type === 'Arrival' && movement.transportType === 'Container' && movement.containerId) {
      const existingContainer = getContainerContents(movement.containerId);
      if (!existingContainer) {
        const newContainer: ContainerContents = {
          containerId: movement.containerId,
          products: [],
          isLocked: false,
          lastUpdated: new Date().toLocaleString(),
          totalValue: 0,
          totalItems: 0
        };
        addContainerContents(newContainer);
      }
    }

    // Reset form
    setNewMovement({
      type: 'Arrival',
      transportType: 'Container',
      truckPlate: '',
      containerId: '',
      truckInfo: {
        plateNumber: '',
        trailerInfo: '',
        capacity: ''
      },
      containerInfo: {
        containerId: '',
        sealNumber: '',
        size: '',
        type: ''
      },
      driverName: '',
      driverPhone: '',
      driverEmail: '',
      origin: '',
      destination: '',
      notes: ''
    });
    
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowLogModal(false);
      alert('Movement logged successfully!');
    } catch (error) {
      console.error('Error logging movement:', error);
      alert('Failed to log movement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [newMovement, movements, addMovement, addContainerContents, getContainerContents, setSubmitting]);

  const handleAddProduct = useCallback(() => {
    if (!selectedContainer) {
      alert('Please select a container first.');
      return;
    }

    if (!newProduct.name?.trim() || !newProduct.type?.trim() || !newProduct.quantity || !newProduct.unit?.trim()) {
      alert('Please fill in all required product fields.');
      return;
    }

    const product: Product = {
      id: generateProductId(),
      name: newProduct.name!,
      type: newProduct.type!,
      quantity: newProduct.quantity!,
      unit: newProduct.unit!,
      condition: newProduct.condition as 'Good' | 'Damaged' | 'Excellent',
      value: newProduct.value || 0,
      description: newProduct.description,
      barcode: newProduct.barcode
    };

    const container = getContainerContents(selectedContainer);
    if (container) {
      const updatedProducts = [...container.products, product];
      updateContainerContents(selectedContainer, {
        products: updatedProducts,
        totalItems: updatedProducts.reduce((sum, p) => sum + p.quantity, 0),
        totalValue: updatedProducts.reduce((sum, p) => sum + (p.value || 0), 0),
        lastUpdated: new Date().toLocaleString()
      });
    }

    // Reset form
    setNewProduct({
      name: '',
      type: '',
      quantity: 0,
      unit: '',
      condition: 'Good',
      value: 0,
      description: '',
      barcode: ''
    });
    
    setShowProductModal(false);
    alert('Product added successfully!');
  }, [selectedContainer, newProduct, getContainerContents, updateContainerContents]);

  const handleDeleteMovement = useCallback((movementId: string) => {
    if (confirm('Are you sure you want to delete this movement?')) {
      deleteMovement(movementId);
      alert('Movement deleted successfully!');
    }
  }, [deleteMovement]);

  const exportManifest = useCallback((containerId: string) => {
    const container = getContainerContents(containerId);
    if (!container) {
      alert('No container contents found.');
      return;
    }

    const manifest = {
      containerId: container.containerId,
      exportDate: new Date().toLocaleString(),
      totalItems: container.totalItems,
      totalValue: container.totalValue,
      products: container.products
    };

    const dataStr = JSON.stringify(manifest, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `manifest-${containerId}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [containerContents]);

  const handleViewDetails = useCallback((movement: Movement) => {
    setSelectedMovement(movement);
    setShowDetailModal(true);
  }, [setSelectedMovement, setShowDetailModal]);

  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPage="movements"
        onPageChange={onPageChange}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onLogout={onLogout}
          onPageChange={onPageChange}
        />
        
        <main className={`flex-1 overflow-x-hidden overflow-y-auto p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Movements Management
                </h1>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Track truck and container movements in your warehouse
                </p>
              </div>
              <div className={`mt-4 lg:mt-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4`}>
                <div className="flex items-center mb-2">
                  <Building className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Movement Hub</span>
                </div>
                <div>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{currentWarehouse}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>All movements for this location</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          {isLoading ? (
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 mb-6`}>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <SkeletonLoader width="200px" height="40px" />
                  <SkeletonLoader width="150px" height="40px" />
                </div>
                <div className="flex gap-2">
                  <SkeletonLoader width="120px" height="40px" />
                  <SkeletonLoader width="140px" height="40px" />
                  <SkeletonLoader width="130px" height="40px" />
                </div>
              </div>
            </div>
          ) : (
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 mb-6`}>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search movements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                {/* Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className={`pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Types</option>
                    <option value="Arrival">Arrivals</option>
                    <option value="Departure">Departures</option>
                    <option value="Container">Container Transport</option>
                    <option value="Truck">Truck Transport</option>
                  </select>
                </div>
              </div>

              {/* Log Movement Button */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowProductModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Add Product
                </button>
                <button
                  onClick={() => {
                    const containers = movements.filter(m => m.type === 'Arrival').map(m => m.containerId);
                    if (containers.length > 0) {
                      setSelectedContainer(containers[0]);
                      setShowContainerModal(true);
                    } else {
                      alert('No containers available. Please log an arrival first.');
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Contents
                </button>
                <button
                  onClick={() => setShowLogModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Log Movement
                </button>
              </div>
            </div>
          </div>
          )}

          {/* Movements Table */}
          {isLoading ? (
            <TableSkeleton rows={8} columns={9} showHeader={true} />
          ) : (
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}">
                <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Movement ID
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Type
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Transport
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Vehicle/Container
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Driver
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Timestamp
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Lock Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`${isDark ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                  {filteredMovements.map((movement) => (
                    <tr 
                      key={movement.id} 
                      className={`hover:${isDark ? 'bg-gray-700' : 'bg-gray-50'} cursor-pointer transition-colors`}
                      onClick={() => handleViewDetails(movement)}
                    >
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {movement.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(movement.type)}
                          <span className={isDark ? 'text-gray-300' : 'text-gray-900'}>
                            {movement.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {getTransportTypeIcon(movement.transportType)}
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                            getTransportTypeColor(movement.transportType)
                          }`}>
                            {movement.transportType}
                          </span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {movement.transportType === 'Container' ? (
                          <div>
                            <div className="font-medium">{movement.containerId || movement.containerInfo?.containerId}</div>
                            {movement.containerInfo?.size && (
                              <div className="text-xs text-gray-500">{movement.containerInfo.size} - {movement.containerInfo.type}</div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">{movement.truckPlate || movement.truckInfo?.plateNumber}</div>
                            {movement.truckInfo?.capacity && (
                              <div className="text-xs text-gray-500">{movement.truckInfo.capacity}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {movement.driverName}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {movement.timestamp}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getStatusColor(movement.status)
                        }`}>
                          {movement.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {movement.transportType === 'Container' && movement.containerId ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleContainerLock(movement.containerId!);
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              movement.isLocked
                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {movement.isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                            {movement.isLocked ? 'Locked' : 'Unlocked'}
                          </button>
                        ) : (
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(movement);
                            }}
                            className={`text-blue-600 hover:text-blue-900 flex items-center gap-1 ${
                              isDark ? 'text-blue-400 hover:text-blue-300' : ''
                            }`}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          {movement.transportType === 'Container' && movement.containerId ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                exportManifest(movement.containerId!);
                              }}
                              className={`text-green-600 hover:text-green-900 flex items-center gap-1 ${
                                isDark ? 'text-green-400 hover:text-green-300' : ''
                              }`}
                            >
                              <Download className="h-4 w-4" />
                              Export
                            </button>
                          ) : (
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              N/A
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMovement(movement.id);
                            }}
                            className={`text-red-600 hover:text-red-900 flex items-center gap-1 ${
                              isDark ? 'text-red-400 hover:text-red-300' : ''
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Log Movement Modal */}
          {showLogModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Log New Movement
                </h3>
                
                {/* Transport Type Selection */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Transport Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewMovement({...newMovement, transportType: 'Container'})}
                      className={`p-4 border-2 rounded-lg transition-all duration-200 flex flex-col items-center gap-2 ${
                        newMovement.transportType === 'Container'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : isDark
                            ? 'border-gray-600 hover:border-gray-500'
                            : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Container className={`h-8 w-8 ${
                        newMovement.transportType === 'Container' ? 'text-blue-600' : isDark ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <span className={`font-medium ${
                        newMovement.transportType === 'Container' ? 'text-blue-700 dark:text-blue-300' : isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Container
                      </span>
                      <span className={`text-xs text-center ${
                        newMovement.transportType === 'Container' ? 'text-blue-600 dark:text-blue-400' : isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Shipping containers with seal numbers
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setNewMovement({...newMovement, transportType: 'Truck'})}
                      className={`p-4 border-2 rounded-lg transition-all duration-200 flex flex-col items-center gap-2 ${
                        newMovement.transportType === 'Truck'
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : isDark
                            ? 'border-gray-600 hover:border-gray-500'
                            : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Truck className={`h-8 w-8 ${
                        newMovement.transportType === 'Truck' ? 'text-orange-600' : isDark ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <span className={`font-medium ${
                        newMovement.transportType === 'Truck' ? 'text-orange-700 dark:text-orange-300' : isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Truck
                      </span>
                      <span className={`text-xs text-center ${
                        newMovement.transportType === 'Truck' ? 'text-orange-600 dark:text-orange-400' : isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Direct truck transport with trailers
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Movement Type *
                    </label>
                    <select
                      value={newMovement.type}
                      onChange={(e) => setNewMovement({...newMovement, type: e.target.value as 'Arrival' | 'Departure'})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="Arrival">Arrival</option>
                      <option value="Departure">Departure</option>
                    </select>
                  </div>

                  {/* Dynamic Transport-Specific Fields */}
                  {newMovement.transportType === 'Container' ? (
                    <>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Container ID *
                        </label>
                        <input
                          type="text"
                          value={newMovement.containerInfo?.containerId || ''}
                          onChange={(e) => setNewMovement({
                            ...newMovement,
                            containerInfo: {
                              ...newMovement.containerInfo,
                              containerId: e.target.value
                            }
                          })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                          placeholder="e.g., CONT-001"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Seal Number
                        </label>
                        <input
                          type="text"
                          value={newMovement.containerInfo?.sealNumber || ''}
                          onChange={(e) => setNewMovement({
                            ...newMovement,
                            containerInfo: {
                              ...newMovement.containerInfo,
                              sealNumber: e.target.value
                            }
                          })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                          placeholder="e.g., SEAL-12345"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Container Size
                        </label>
                        <select
                          value={newMovement.containerInfo?.size || ''}
                          onChange={(e) => setNewMovement({
                            ...newMovement,
                            containerInfo: {
                              ...newMovement.containerInfo,
                              size: e.target.value
                            }
                          })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Select size...</option>
                          <option value="20ft">20ft</option>
                          <option value="40ft">40ft</option>
                          <option value="45ft">45ft</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Container Type
                        </label>
                        <select
                          value={newMovement.containerInfo?.type || ''}
                          onChange={(e) => setNewMovement({
                            ...newMovement,
                            containerInfo: {
                              ...newMovement.containerInfo,
                              type: e.target.value
                            }
                          })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Select type...</option>
                          <option value="Standard">Standard</option>
                          <option value="Refrigerated">Refrigerated</option>
                          <option value="Open Top">Open Top</option>
                          <option value="Flat Rack">Flat Rack</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Truck Plate *
                        </label>
                        <input
                          type="text"
                          value={newMovement.truckInfo?.plateNumber || ''}
                          onChange={(e) => setNewMovement({
                            ...newMovement,
                            truckInfo: {
                              ...newMovement.truckInfo,
                              plateNumber: e.target.value
                            }
                          })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                          placeholder="e.g., LB-123-456"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Trailer Information
                        </label>
                        <input
                          type="text"
                          value={newMovement.truckInfo?.trailerInfo || ''}
                          onChange={(e) => setNewMovement({
                            ...newMovement,
                            truckInfo: {
                              ...newMovement.truckInfo,
                              trailerInfo: e.target.value
                            }
                          })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                          placeholder="e.g., Semi-trailer, Flatbed"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Capacity
                        </label>
                        <input
                          type="text"
                          value={newMovement.truckInfo?.capacity || ''}
                          onChange={(e) => setNewMovement({
                            ...newMovement,
                            truckInfo: {
                              ...newMovement.truckInfo,
                              capacity: e.target.value
                            }
                          })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                          placeholder="e.g., 25 tons, 40 cubic meters"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Driver Name *
                    </label>
                    <input
                      type="text"
                      value={newMovement.driverName}
                      onChange={(e) => setNewMovement({...newMovement, driverName: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Driver's full name"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Driver Phone
                    </label>
                    <input
                      type="tel"
                      value={newMovement.driverPhone}
                      onChange={(e) => setNewMovement({...newMovement, driverPhone: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="+961-XX-XXXXXX"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Driver Email
                    </label>
                    <input
                      type="email"
                      value={newMovement.driverEmail}
                      onChange={(e) => setNewMovement({...newMovement, driverEmail: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="driver@example.com"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Origin
                    </label>
                    <input
                      type="text"
                      value={newMovement.origin}
                      onChange={(e) => setNewMovement({...newMovement, origin: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="e.g., Beirut Port"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Destination
                    </label>
                    <input
                      type="text"
                      value={newMovement.destination}
                      onChange={(e) => setNewMovement({...newMovement, destination: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="e.g., Warehouse A"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Notes
                    </label>
                    <textarea
                      value={newMovement.notes}
                      onChange={(e) => setNewMovement({...newMovement, notes: e.target.value})}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Validation Info</span>
                  </div>
                  <ul className="mt-2 text-xs text-blue-600 dark:text-blue-400 space-y-1">
                    <li>• Fields marked with * are required</li>
                    <li>• Phone format: +961-XX-XXXXXX</li>
                    <li>• Container IDs must be unique for active movements</li>
                    <li>• Timestamp will be automatically recorded</li>
                  </ul>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowLogModal(false)}
                    className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                      isDark 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogMovement}
                    disabled={isSubmitting}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      isSubmitting
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Movement'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Product Assignment Modal */}
          {showProductModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Add Product to Container
                  </h3>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className={`text-gray-400 hover:text-gray-600 ${isDark ? 'hover:text-gray-300' : ''}`}
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Select Container *
                  </label>
                  <select
                    value={selectedContainer}
                    onChange={(e) => setSelectedContainer(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select a container...</option>
                    {movements.filter(m => m.type === 'Arrival' && m.status !== 'Completed').map(movement => (
                      <option key={movement.containerId} value={movement.containerId}>
                        {movement.containerId} - {movement.truckPlate}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Product name"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Product Type *
                    </label>
                    <input
                      type="text"
                      value={newProduct.type}
                      onChange={(e) => setNewProduct({...newProduct, type: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="e.g., Electronics, Food, Textiles"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct({...newProduct, quantity: parseInt(e.target.value) || 0})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="0"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Unit *
                    </label>
                    <input
                      type="text"
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="e.g., boxes, kg, pieces"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Condition
                    </label>
                    <select
                      value={newProduct.condition}
                      onChange={(e) => setNewProduct({...newProduct, condition: e.target.value as 'Good' | 'Damaged' | 'Excellent'})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Damaged">Damaged</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Value (USD)
                    </label>
                    <input
                      type="number"
                      value={newProduct.value}
                      onChange={(e) => setNewProduct({...newProduct, value: parseFloat(e.target.value) || 0})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={newProduct.barcode}
                      onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Product barcode"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Description
                    </label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Product description..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowProductModal(false)}
                    className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                      isDark 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddProduct}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Add Product
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Container Contents Modal */}
          {showContainerModal && selectedContainer && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Container Contents: {selectedContainer}
                  </h3>
                  <button
                    onClick={() => setShowContainerModal(false)}
                    className={`text-gray-400 hover:text-gray-600 ${isDark ? 'hover:text-gray-300' : ''}`}
                  >
                    ✕
                  </button>
                </div>

                {(() => {
                  const container = getContainerContents(selectedContainer);
                  if (!container) {
                    return (
                      <div className="text-center py-8">
                        <Package className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-400' : 'text-gray-400'} mb-4`} />
                        <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          No products found in this container.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-blue-600" />
                            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Total Items</span>
                          </div>
                          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{container.totalItems}</p>
                        </div>
                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">$</span>
                            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Total Value</span>
                          </div>
                          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>${container.totalValue.toLocaleString()}</p>
                        </div>
                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2">
                            {container.isLocked ? <Lock className="h-5 w-5 text-red-600" /> : <Unlock className="h-5 w-5 text-green-600" />}
                            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</span>
                          </div>
                          <p className={`text-2xl font-bold ${container.isLocked ? 'text-red-600' : 'text-green-600'}`}>
                            {container.isLocked ? 'Locked' : 'Unlocked'}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className={`min-w-full divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                          <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                            <tr>
                              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Product</th>
                              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Type</th>
                              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Quantity</th>
                              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Condition</th>
                              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Value</th>
                            </tr>
                          </thead>
                          <tbody className={`${isDark ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
                            {container.products.map((product) => (
                              <tr key={product.id} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                                <td className={`px-6 py-4 whitespace-nowrap ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  <div>
                                    <div className="font-medium">{product.name}</div>
                                    {product.description && (
                                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{product.description}</div>
                                    )}
                                  </div>
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                  {product.type}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                  {product.quantity} {product.unit}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    product.condition === 'Excellent' ? 'bg-green-100 text-green-800' :
                                    product.condition === 'Good' ? 'bg-blue-100 text-blue-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {product.condition}
                                  </span>
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                  ${product.value?.toLocaleString() || '0'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-between items-center mt-6">
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Last updated: {container.lastUpdated}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => exportManifest(selectedContainer)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Export Manifest
                          </button>
                          <button
                            onClick={() => toggleContainerLock(selectedContainer)}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                              container.isLocked
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {container.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                            {container.isLocked ? 'Unlock' : 'Lock'} Container
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowContainerModal(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Movement Detail Modal */}
          {showDetailModal && selectedMovement && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Movement Details
                  </h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className={`text-gray-400 hover:text-gray-600 ${isDark ? 'hover:text-gray-300' : ''}`}
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} pb-2`}>
                      Basic Information
                    </h4>
                    
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Movement ID
                      </label>
                      <p className={`mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedMovement.id}</p>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Type
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        {getTypeIcon(selectedMovement.type)}
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{selectedMovement.type}</span>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Status
                      </label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                        getStatusColor(selectedMovement.status)
                      }`}>
                        {selectedMovement.status}
                      </span>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Timestamp
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{selectedMovement.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle & Driver Information */}
                  <div className="space-y-4">
                    <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} pb-2`}>
                      Vehicle &amp; Driver
                    </h4>
                    
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Truck Plate
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{selectedMovement.truckPlate}</span>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Container ID
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Container className="h-4 w-4 text-gray-400" />
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{selectedMovement.containerId}</span>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Driver Name
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{selectedMovement.driverName}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedMovement.notes && (
                  <div className="mt-6">
                    <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} pb-2 mb-4`}>
                      Notes
                    </h4>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} bg-${isDark ? 'gray-700' : 'gray-50'} p-3 rounded-lg`}>
                      {selectedMovement.notes}
                    </p>
                  </div>
                )}

                {/* Attachments Section */}
                <div className="mt-6">
                  <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} pb-2 mb-4`}>
                    Attachments
                  </h4>
                  <div className={`border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'} rounded-lg p-6 text-center`}>
                    <FileText className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-400' : 'text-gray-400'} mb-4`} />
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                      Upload documents, photos, or other files related to this movement
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button className={`px-4 py-2 border rounded-lg transition-colors ${
                        isDark 
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}>
                        Choose Files
                      </button>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                        Upload
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MovementsPage;
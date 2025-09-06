import React, { useState } from 'react';
import { useTheme, useWarehouse } from '../App';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { Search, Plus, Truck, Container, Filter, Eye, Calendar, User, FileText, Building } from 'lucide-react';

interface MovementsPageProps {
  onLogout: () => void;
  onPageChange: (page: string) => void;
}

interface Movement {
  id: string;
  type: 'Inbound' | 'Outbound' | 'Transfer';
  truckPlate: string;
  containerId: string;
  driverName: string;
  date: string;
  status: 'Arrived' | 'Departed' | 'Pending';
  notes?: string;
  timestamp: string;
}

const MovementsPage: React.FC<MovementsPageProps> = ({ onLogout, onPageChange }) => {
  const { isDark } = useTheme();
  const { currentWarehouse, warehouseData } = useWarehouse();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showLogModal, setShowLogModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [newMovement, setNewMovement] = useState({
    type: 'Inbound' as 'Inbound' | 'Outbound' | 'Transfer',
    truckPlate: '',
    containerId: '',
    driverName: '',
    notes: ''
  });

  // Sample movements data
  const movements: Movement[] = [
    {
      id: 'MOV-2025-001',
      type: 'Inbound',
      truckPlate: 'ABC-1234',
      containerId: 'CONT-001',
      driverName: 'John Smith',
      date: '2025-01-15',
      status: 'Arrived',
      notes: 'Delivery from Port A',
      timestamp: '2025-01-15 09:30:00'
    },
    {
      id: 'MOV-2025-002',
      type: 'Outbound',
      truckPlate: 'XYZ-5678',
      containerId: 'CONT-002',
      driverName: 'Mike Johnson',
      date: '2025-01-15',
      status: 'Departed',
      notes: 'Shipment to Client B',
      timestamp: '2025-01-15 14:45:00'
    },
    {
      id: 'MOV-2025-003',
      type: 'Transfer',
      truckPlate: 'DEF-9012',
      containerId: 'CONT-003',
      driverName: 'Sarah Wilson',
      date: '2025-01-15',
      status: 'Pending',
      notes: 'Internal transfer to Warehouse B',
      timestamp: '2025-01-15 16:00:00'
    },
    {
      id: 'MOV-2025-004',
      type: 'Inbound',
      truckPlate: 'GHI-3456',
      containerId: 'CONT-004',
      driverName: 'David Brown',
      date: '2025-01-14',
      status: 'Arrived',
      notes: 'Emergency delivery',
      timestamp: '2025-01-14 11:15:00'
    },
    {
      id: 'MOV-2025-005',
      type: 'Outbound',
      truckPlate: 'JKL-7890',
      containerId: 'CONT-005',
      driverName: 'Lisa Davis',
      date: '2025-01-14',
      status: 'Departed',
      notes: 'Regular shipment',
      timestamp: '2025-01-14 13:20:00'
    },
    {
      id: 'MOV-2025-006',
      type: 'Inbound',
      truckPlate: 'MNO-2468',
      containerId: 'CONT-006',
      driverName: 'Robert Taylor',
      date: '2025-01-14',
      status: 'Pending',
      notes: 'Awaiting inspection',
      timestamp: '2025-01-14 15:30:00'
    },
    {
      id: 'MOV-2025-007',
      type: 'Transfer',
      truckPlate: 'PQR-1357',
      containerId: 'CONT-007',
      driverName: 'Emily Anderson',
      date: '2025-01-13',
      status: 'Arrived',
      notes: 'Cross-dock operation',
      timestamp: '2025-01-13 10:45:00'
    },
    {
      id: 'MOV-2025-008',
      type: 'Outbound',
      truckPlate: 'STU-9753',
      containerId: 'CONT-008',
      driverName: 'James Wilson',
      date: '2025-01-13',
      status: 'Departed',
      notes: 'Express delivery',
      timestamp: '2025-01-13 16:10:00'
    },
    {
      id: 'MOV-2025-009',
      type: 'Inbound',
      truckPlate: 'VWX-4680',
      containerId: 'CONT-009',
      driverName: 'Maria Garcia',
      date: '2025-01-13',
      status: 'Arrived',
      notes: 'Scheduled delivery',
      timestamp: '2025-01-13 08:00:00'
    },
    {
      id: 'MOV-2025-010',
      type: 'Transfer',
      truckPlate: 'YZA-1234',
      containerId: 'CONT-010',
      driverName: 'Kevin Lee',
      date: '2025-01-12',
      status: 'Pending',
      notes: 'Waiting for clearance',
      timestamp: '2025-01-12 14:30:00'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Arrived':
        return 'bg-green-100 text-green-800';
      case 'Departed':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Inbound':
        return <Truck className="h-4 w-4 text-green-600" />;
      case 'Outbound':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'Transfer':
        return <Container className="h-4 w-4 text-purple-600" />;
      default:
        return <Truck className="h-4 w-4" />;
    }
  };

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.truckPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.containerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.driverName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || movement.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleLogMovement = () => {
    // Just close modal for demo
    setShowLogModal(false);
    setNewMovement({
      type: 'Inbound',
      truckPlate: '',
      containerId: '',
      driverName: '',
      notes: ''
    });
  };

  const handleViewDetails = (movement: Movement) => {
    setSelectedMovement(movement);
    setShowDetailModal(true);
  };

  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onPageChange={onPageChange}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav 
          onPageChange={onPageChange}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
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
                    <option value="Inbound">Inbound</option>
                    <option value="Outbound">Outbound</option>
                    <option value="Transfer">Transfer</option>
                  </select>
                </div>
              </div>

              {/* Log Movement Button */}
              <button
                onClick={() => setShowLogModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Log Movement
              </button>
            </div>
          </div>

          {/* Movements Table */}
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
                      Truck Plate
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Container ID
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Date
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Status
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
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {movement.truckPlate}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {movement.containerId}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {movement.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getStatusColor(movement.status)
                        }`}>
                          {movement.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Log Movement Modal */}
          {showLogModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Log New Movement
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Movement Type
                    </label>
                    <select
                      value={newMovement.type}
                      onChange={(e) => setNewMovement({...newMovement, type: e.target.value as any})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="Inbound">Inbound</option>
                      <option value="Outbound">Outbound</option>
                      <option value="Transfer">Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Truck Plate
                    </label>
                    <input
                      type="text"
                      value={newMovement.truckPlate}
                      onChange={(e) => setNewMovement({...newMovement, truckPlate: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="e.g., ABC-1234"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Container ID
                    </label>
                    <input
                      type="text"
                      value={newMovement.containerId}
                      onChange={(e) => setNewMovement({...newMovement, containerId: e.target.value})}
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
                      Driver Name
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Save Movement
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
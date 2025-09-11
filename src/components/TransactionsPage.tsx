import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useWarehouse } from '../App';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { Filter, Download, Calendar, User, Package, ArrowUp, ArrowDown, RotateCcw, Building, ChevronDown } from 'lucide-react';

interface TransactionsPageProps {
  onLogout: () => void;
  onPageChange: (page: string) => void;
}

interface Transaction {
  id: string;
  type: 'Inbound' | 'Outbound' | 'Adjustment';
  itemName: string;
  quantity: number;
  date: string;
  time: string;
  user: string;
  reference: string;
  supplier?: string;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({ onLogout, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const { isDark } = useTheme();
  const { currentWarehouse, warehouseData } = useWarehouse();

  const transactions: Transaction[] = [
    {
      id: 'TXN-2025-001',
      type: 'Inbound',
      itemName: 'Maritime Safety Helmets',
      quantity: 150,
      date: '2025-01-15',
      time: '09:30 AM',
      user: 'Ahmad Khalil',
      reference: 'PO-4821',
      supplier: 'Beirut Marine Safety Co'
    },
    {
      id: 'TXN-2025-002',
      type: 'Outbound',
      itemName: 'Container Securing Chains',
      quantity: 75,
      date: '2025-01-15',
      time: '11:15 AM',
      user: 'Fatima Nasrallah',
      reference: 'SO-3394',
      supplier: 'Mediterranean Shipping Supplies'
    },
    {
      id: 'TXN-2025-003',
      type: 'Inbound',
      itemName: 'Hydraulic Oil Filters',
      quantity: 200,
      date: '2025-01-14',
      time: '02:45 PM',
      user: 'Zeina Makdisi',
      reference: 'PO-4822',
      supplier: 'FilterTech Inc'
    },
    {
      id: 'TXN-2025-004',
      type: 'Outbound',
      itemName: 'Construction Fasteners',
      quantity: 500,
      date: '2025-01-14',
      time: '10:20 AM',
      user: 'Karim Harb',
      reference: 'SO-3395',
      supplier: 'FastenCorp'
    },
    {
      id: 'TXN-2025-005',
      type: 'Adjustment',
      itemName: 'Electrical Junction Boxes',
      quantity: -15,
      date: '2025-01-13',
      time: '03:10 PM',
      user: 'Lara Khoury',
      reference: 'ADJ-1205',
    },
    {
      id: 'TXN-2025-006',
      type: 'Outbound',
      itemName: 'Heavy Duty Work Gloves',
      quantity: 120,
      date: '2025-01-13',
      time: '08:45 AM',
      user: 'Sami Nassar',
      reference: 'SO-3396',
      supplier: 'WorkGear Plus'
    },
    {
      id: 'TXN-2025-007',
      type: 'Inbound',
      itemName: 'Power Drill Bits Set',
      quantity: 85,
      date: '2025-01-12',
      time: '01:20 PM',
      user: 'Zeina Makdisi',
      reference: 'PO-4823',
      supplier: 'ToolMaster Inc'
    },
    {
      id: 'TXN-2025-008',
      type: 'Adjustment',
      itemName: 'LED Work Lights',
      quantity: 5,
      date: '2025-01-12',
      time: '04:30 PM',
      user: 'Lara Khoury',
      reference: 'ADJ-1206',
    },
    {
      id: 'TXN-2025-009',
      type: 'Outbound',
      itemName: 'Circuit Breakers 20A',
      quantity: 50,
      date: '2025-01-11',
      time: '09:15 AM',
      user: 'Karim Harb',
      reference: 'SO-3397',
      supplier: 'ElectroSupply Co'
    },
    {
      id: 'TXN-2025-010',
      type: 'Inbound',
      itemName: 'Steel Measuring Tape',
      quantity: 65,
      date: '2025-01-11',
      time: '11:45 AM',
      user: 'Sami Nassar',
      reference: 'PO-4824',
      supplier: 'MeasurePro Ltd'
    },
    {
      id: 'TXN-2025-011',
      type: 'Outbound',
      itemName: 'Industrial Safety Helmets',
      quantity: 25,
      date: '2025-01-10',
      time: '02:10 PM',
      user: 'Zeina Makdisi',
      reference: 'SO-3398',
      supplier: 'Construction Co'
    },
    {
      id: 'TXN-2025-012',
      type: 'Adjustment',
      itemName: 'Hydraulic Oil Filters',
      quantity: -8,
      date: '2025-01-10',
      time: '10:30 AM',
      user: 'Karim Harb',
      reference: 'ADJ-1207',
    },
    {
      id: 'TXN-2025-013',
      type: 'Inbound',
      itemName: 'Safety Goggles',
      quantity: 200,
      date: '2025-01-09',
      time: '03:45 PM',
      user: 'Lara Khoury',
      reference: 'PO-4825',
      supplier: 'VisionSafe Corp'
    },
    {
      id: 'TXN-2025-014',
      type: 'Outbound',
      itemName: 'Power Drill Bits Set',
      quantity: 30,
      date: '2025-01-09',
      time: '08:20 AM',
      user: 'Sami Nassar',
      reference: 'SO-3399',
      supplier: 'Workshop Ltd'
    },
    {
      id: 'TXN-2025-015',
      type: 'Inbound',
      itemName: 'Welding Electrodes',
      quantity: 500,
      date: '2025-01-08',
      time: '01:15 PM',
      user: 'Zeina Makdisi',
      reference: 'PO-4826',
      supplier: 'WeldTech Industries'
    },
    {
      id: 'TXN-2025-016',
      type: 'Adjustment',
      itemName: 'Steel Wire Mesh Rolls',
      quantity: 3,
      date: '2025-01-08',
      time: '04:50 PM',
      user: 'Karim Harb',
      reference: 'ADJ-1208',
    }
  ];

  const filteredTransactions = transactions.filter(transaction => {
    return filterType === 'All' || transaction.type === filterType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Inbound':
        return <ArrowUp className="h-4 w-4" />;
      case 'Outbound':
        return <ArrowDown className="h-4 w-4" />;
      case 'Adjustment':
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Inbound':
        return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      case 'Outbound':
        return isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
      case 'Adjustment':
        return isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800';
      default:
        return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  const getQuantityColor = (type: string, quantity: number) => {
    if (type === 'Adjustment') {
      return quantity > 0 ? 'text-green-600' : 'text-red-600';
    }
    return type === 'Inbound' ? 'text-green-600' : 'text-red-600';
  };

  const formatQuantity = (type: string, quantity: number) => {
    if (type === 'Inbound') return `+${quantity}`;
    if (type === 'Outbound') return `-${quantity}`;
    return quantity > 0 ? `+${quantity}` : `${quantity}`;
  };

  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPage="transactions"
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
                  <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Transaction History</h1>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Track all inventory movements and adjustments</p>
                </div>
                <div className={`mt-4 lg:mt-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4`}>
                  <div className="flex items-center mb-2">
                    <Building className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Warehouse Context</span>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{currentWarehouse}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>All transactions for this location</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6 mb-6`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Filter by type:</span>
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    <option value="All">All Transactions</option>
                    <option value="Inbound">Inbound</option>
                    <option value="Outbound">Outbound</option>
                    <option value="Adjustment">Adjustment</option>
                  </select>
                </div>
                <div className="flex items-center space-x-3">
                  <button className={`flex items-center px-4 py-2 text-sm border rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Date Range
                  </button>
                  <button className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Transaction Records</h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Showing {filteredTransactions.length} transactions</p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Inbound</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Outbound</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Adjustment</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Scrollable Table Container */}
              <div className="relative">
                {/* Scroll Indicators */}
                <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r ${isDark ? 'from-gray-800 to-transparent' : 'from-white to-transparent'} pointer-events-none z-10 opacity-0 transition-opacity duration-300`} id="scroll-indicator-left-transactions"></div>
                <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l ${isDark ? 'from-gray-800 to-transparent' : 'from-white to-transparent'} pointer-events-none z-10 opacity-100 transition-opacity duration-300`} id="scroll-indicator-right-transactions"></div>
                
                {/* Scrollable Table Container */}
                <div 
                  className="overflow-x-auto smooth-scroll scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: isDark ? '#4B5563 #1F2937' : '#9CA3AF #E5E7EB'
                  }}
                  onScroll={(e) => {
                    const target = e.target as HTMLDivElement;
                    const leftIndicator = document.getElementById('scroll-indicator-left-transactions');
                    const rightIndicator = document.getElementById('scroll-indicator-right-transactions');
                    
                    if (leftIndicator && rightIndicator) {
                      const isAtStart = target.scrollLeft <= 10;
                      const isAtEnd = target.scrollLeft >= target.scrollWidth - target.clientWidth - 10;
                      
                      leftIndicator.style.opacity = isAtStart ? '0' : '1';
                      rightIndicator.style.opacity = isAtEnd ? '0' : '1';
                    }
                  }}
                >
                  <table className="w-full" style={{ minWidth: '900px' }}>
                    <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} sticky top-0 z-5`}>
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-500'}`} style={{ minWidth: '140px' }}>
                          Transaction ID
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-500'}`} style={{ minWidth: '120px' }}>
                          Type
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-500'}`} style={{ minWidth: '200px' }}>
                          Item Name
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-500'}`} style={{ minWidth: '100px' }}>
                          Quantity
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-500'}`} style={{ minWidth: '140px' }}>
                          Date & Time
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-500'}`} style={{ minWidth: '120px' }}>
                          User
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-500'}`} style={{ minWidth: '120px' }}>
                          Reference
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`${isDark ? 'bg-gray-800' : 'bg-white'} divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className={`transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ minWidth: '140px' }}>
                             <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{transaction.id}</div>
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ minWidth: '120px' }}>
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(transaction.type)}`}>
                                {getTypeIcon(transaction.type)}
                                <span className="ml-1">{transaction.type}</span>
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4" style={{ minWidth: '200px' }}>
                             <div>
                               <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{transaction.itemName}</div>
                               {transaction.supplier && (
                                 <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{transaction.supplier}</div>
                               )}
                             </div>
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ minWidth: '100px' }}>
                            <div className={`text-sm font-semibold ${getQuantityColor(transaction.type, transaction.quantity)}`}>
                              {formatQuantity(transaction.type, transaction.quantity)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ minWidth: '140px' }}>
                             <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{transaction.date}</div>
                             <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{transaction.time}</div>
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ minWidth: '120px' }}>
                             <div className="flex items-center">
                               <div className={`${isDark ? 'bg-blue-900' : 'bg-blue-50'} p-1 rounded-full mr-2`}>
                                 <User className={`h-3 w-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                               </div>
                               <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{transaction.user}</div>
                             </div>
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ minWidth: '120px' }}>
                             <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{transaction.reference}</div>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Navigation Controls */}
                <div className="absolute top-1/2 -translate-y-1/2 left-2 z-20">
                  <button 
                    className={`p-2 rounded-full shadow-lg transition-all duration-200 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                    onClick={() => {
                      const container = document.querySelector('.overflow-x-auto') as HTMLDivElement;
                      if (container) {
                        container.scrollBy({ left: -200, behavior: 'smooth' });
                      }
                    }}
                    title="Scroll Left"
                  >
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </button>
                </div>
                
                <div className="absolute top-1/2 -translate-y-1/2 right-2 z-20">
                  <button 
                    className={`p-2 rounded-full shadow-lg transition-all duration-200 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                    onClick={() => {
                      const container = document.querySelector('.overflow-x-auto') as HTMLDivElement;
                      if (container) {
                        container.scrollBy({ left: 200, behavior: 'smooth' });
                      }
                    }}
                    title="Scroll Right"
                  >
                    <ChevronDown className="h-4 w-4 -rotate-90" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TransactionsPage;
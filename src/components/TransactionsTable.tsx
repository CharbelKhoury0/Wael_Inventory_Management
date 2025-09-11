import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ChevronDown, Filter, Download, Eye } from 'lucide-react';

const TransactionsTable: React.FC = () => {
  const { isDark } = useTheme();
  
  // Keyboard navigation for table scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = document.querySelector('.overflow-x-auto') as HTMLDivElement;
      if (!container) return;
      
      // Only handle arrow keys when table is focused or no input is focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
      
      if (!isInputFocused) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            container.scrollBy({ left: -100, behavior: 'smooth' });
            break;
          case 'ArrowRight':
            e.preventDefault();
            container.scrollBy({ left: 100, behavior: 'smooth' });
            break;
          case 'Home':
            if (e.ctrlKey) {
              e.preventDefault();
              container.scrollTo({ left: 0, behavior: 'smooth' });
            }
            break;
          case 'End':
            if (e.ctrlKey) {
              e.preventDefault();
              container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
            }
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  const transactions = [
    {
      id: 'TXN-2025-001',
      item: 'Industrial Safety Helmets',
      quantity: '+150',
      type: 'Inbound',
      date: '2025-01-15',
      time: '09:30 AM',
      status: 'Completed',
      supplier: 'SafetyFirst Corp',
      reference: 'PO-4821'
    },
    {
      id: 'TXN-2025-002',
      item: 'Steel Wire Mesh Rolls',
      quantity: '-75',
      type: 'Outbound',
      date: '2025-01-15',
      time: '11:15 AM',
      status: 'Processing',
      supplier: 'BuildCorp Ltd',
      reference: 'SO-3394'
    },
    {
      id: 'TXN-2025-003',
      item: 'Hydraulic Oil Filters',
      quantity: '+200',
      type: 'Inbound',
      date: '2025-01-14',
      time: '02:45 PM',
      status: 'Completed',
      supplier: 'FilterTech Inc',
      reference: 'PO-4822'
    },
    {
      id: 'TXN-2025-004',
      item: 'Construction Fasteners',
      quantity: '-500',
      type: 'Outbound',
      date: '2025-01-14',
      time: '10:20 AM',
      status: 'Completed',
      supplier: 'FastenCorp',
      reference: 'SO-3395'
    },
    {
      id: 'TXN-2025-005',
      item: 'Electrical Junction Boxes',
      quantity: '+300',
      type: 'Inbound',
      date: '2025-01-13',
      time: '03:10 PM',
      status: 'Pending',
      supplier: 'ElectroSupply Co',
      reference: 'PO-4823'
    },
    {
      id: 'TXN-2025-006',
      item: 'Heavy Duty Work Gloves',
      quantity: '-120',
      type: 'Outbound',
      date: '2025-01-13',
      time: '08:45 AM',
      status: 'Completed',
      supplier: 'WorkGear Plus',
      reference: 'SO-3396'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuantityColor = (quantity: string) => {
    return quantity.startsWith('+') ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
      <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Transactions</h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Latest inventory movements and activities</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className={`flex items-center px-3 py-2 text-sm border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-md transition-colors`}>
              <Filter className="h-4 w-4 mr-2" />
              Filter
              <ChevronDown className="h-4 w-4 ml-1" />
            </button>
            <button className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Scrollable Table Container */}
      <div className="relative">
        {/* Scroll Indicators */}
        <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r ${isDark ? 'from-gray-800 to-transparent' : 'from-white to-transparent'} pointer-events-none z-10 opacity-0 transition-opacity duration-300`} id="scroll-indicator-left"></div>
        <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l ${isDark ? 'from-gray-800 to-transparent' : 'from-white to-transparent'} pointer-events-none z-10 opacity-100 transition-opacity duration-300`} id="scroll-indicator-right"></div>
        
        {/* Scrollable Table Container */}
        <div 
          className="overflow-x-auto smooth-scroll scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: isDark ? '#4B5563 #1F2937' : '#9CA3AF #E5E7EB'
          }}
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            const leftIndicator = document.getElementById('scroll-indicator-left');
            const rightIndicator = document.getElementById('scroll-indicator-right');
            
            if (leftIndicator && rightIndicator) {
              const isAtStart = target.scrollLeft <= 10;
              const isAtEnd = target.scrollLeft >= target.scrollWidth - target.clientWidth - 10;
              
              leftIndicator.style.opacity = isAtStart ? '0' : '1';
              rightIndicator.style.opacity = isAtEnd ? '0' : '1';
            }
          }}
        >
          <table className="w-full" style={{ minWidth: '800px' }}>
            <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} sticky top-0 z-5`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider whitespace-nowrap`} style={{ minWidth: '140px' }}>
                  Transaction
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider whitespace-nowrap`} style={{ minWidth: '200px' }}>
                  Item Details
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider whitespace-nowrap`} style={{ minWidth: '120px' }}>
                  Quantity
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider whitespace-nowrap`} style={{ minWidth: '140px' }}>
                  Date & Time
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider whitespace-nowrap`} style={{ minWidth: '100px' }}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider whitespace-nowrap`} style={{ minWidth: '80px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`${isDark ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
              {transactions.map((transaction, index) => (
                <tr key={index} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ minWidth: '140px' }}>
                      <div>
                        <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{transaction.id}</div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{transaction.reference}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4" style={{ minWidth: '200px' }}>
                      <div>
                        <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{transaction.item}</div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{transaction.supplier}</div>
                      </div>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ minWidth: '120px' }}>
                      <div className={`text-sm font-semibold ${getQuantityColor(transaction.quantity)}`}>
                        {transaction.quantity}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{transaction.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" style={{ minWidth: '140px' }}>
                      <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{transaction.date}</div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{transaction.time}</div>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ minWidth: '100px' }}>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ minWidth: '80px' }}>
                    <button className="text-blue-600 hover:text-blue-800 transition-colors touch-target">
                      <Eye className="h-4 w-4" />
                    </button>
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
  );
};

export default TransactionsTable;
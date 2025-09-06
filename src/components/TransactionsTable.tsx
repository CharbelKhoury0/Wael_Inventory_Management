import React from 'react';
import { useTheme } from '../App';
import { ChevronDown, Filter, Download, Eye } from 'lucide-react';

const TransactionsTable: React.FC = () => {
  const { isDark } = useTheme();
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

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Transaction
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Item Details
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Quantity
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Date & Time
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Status
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`${isDark ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
            {transactions.map((transaction, index) => (
              <tr key={index} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{transaction.id}</div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{transaction.reference}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{transaction.item}</div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{transaction.supplier}</div>
                    </div>
                  </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-semibold ${getQuantityColor(transaction.quantity)}`}>
                      {transaction.quantity}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{transaction.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{transaction.date}</div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{transaction.time}</div>
                  </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button className="text-blue-600 hover:text-blue-800 transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsTable;
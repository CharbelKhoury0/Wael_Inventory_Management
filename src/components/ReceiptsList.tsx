import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FileText, Calendar, Building, DollarSign, Eye, Download } from 'lucide-react';

const ReceiptsList: React.FC = () => {
  const { isDark } = useTheme();
  const receipts = [
    {
      id: 'RCP-2025-128',
      supplier: 'SafetyFirst Corp',
      date: '2025-01-15',
      amount: '$12,450.00',
      status: 'Verified',
      items: 3,
      category: 'Safety Equipment'
    },
    {
      id: 'RCP-2025-127',
      supplier: 'BuildCorp Ltd',
      date: '2025-01-14',
      amount: '$8,275.50',
      status: 'Pending',
      items: 2,
      category: 'Construction Materials'
    },
    {
      id: 'RCP-2025-126',
      supplier: 'FilterTech Inc',
      date: '2025-01-14',
      amount: '$3,890.00',
      status: 'Verified',
      items: 5,
      category: 'Maintenance Parts'
    },
    {
      id: 'RCP-2025-125',
      supplier: 'ElectroSupply Co',
      date: '2025-01-13',
      amount: '$15,620.75',
      status: 'Processing',
      items: 4,
      category: 'Electrical Components'
    },
    {
      id: 'RCP-2025-124',
      supplier: 'WorkGear Plus',
      date: '2025-01-12',
      amount: '$2,145.25',
      status: 'Verified',
      items: 6,
      category: 'Personal Protective Equipment'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified':
        return 'bg-green-100 text-green-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
      <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Receipts</h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Latest purchase receipts and invoices</p>
          </div>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All
          </button>
        </div>
      </div>

      <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
        {receipts.map((receipt, index) => (
          <div key={index} className={`px-6 py-4 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{receipt.id}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(receipt.status)}`}>
                      {receipt.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className={`flex items-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <Building className="h-4 w-4 mr-1" />
                      {receipt.supplier}
                    </div>
                    <div className={`flex items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Calendar className="h-4 w-4 mr-1" />
                      {receipt.date}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span>{receipt.items} items • {receipt.category}</span>
                      </div>
                      <div className={`flex items-center text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <DollarSign className="h-4 w-4 mr-1" />
                        {receipt.amount}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2 mt-3">
              <button className={`${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
                <Eye className="h-4 w-4" />
              </button>
              <button className={`${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={`px-6 py-4 ${isDark ? 'bg-gray-700 border-gray-700' : 'bg-gray-50 border-gray-200'} border-t`}>
        <div className="flex items-center justify-between text-sm">
          <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Total receipts this month:</span>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>$42,381.50</span>
        </div>
      </div>
    </div>
  );
};

export default ReceiptsList;
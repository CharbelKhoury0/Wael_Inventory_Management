import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { FileText, Building, Calendar, DollarSign, Eye, Download, X, Package } from 'lucide-react';

interface ReceiptsPageProps {
  onLogout: () => void;
  onPageChange: (page: string) => void;
}

interface Receipt {
  id: string;
  supplierName: string;
  type: 'Inbound' | 'Outbound';
  date: string;
  status: 'Confirmed' | 'Draft' | 'Received';
  totalAmount: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: string;
    total: string;
  }[];
  notes?: string;
  poNumber?: string;
}

const ReceiptsPage: React.FC<ReceiptsPageProps> = ({ onLogout, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const receipts: Receipt[] = [
    {
      id: 'RCP-2025-128',
      supplierName: 'SafetyFirst Corp',
      type: 'Inbound',
      date: '2025-01-15',
      status: 'Confirmed',
      totalAmount: '$12,450.00',
      poNumber: 'PO-4821',
      items: [
        { name: 'Industrial Safety Helmets', quantity: 150, unitPrice: '$45.00', total: '$6,750.00' },
        { name: 'Safety Harnesses', quantity: 75, unitPrice: '$68.00', total: '$5,100.00' },
        { name: 'Safety Goggles', quantity: 100, unitPrice: '$6.00', total: '$600.00' }
      ],
      notes: 'All items inspected and approved for warehouse storage.'
    },
    {
      id: 'RCP-2025-127',
      supplierName: 'BuildCorp Ltd',
      type: 'Inbound',
      date: '2025-01-14',
      status: 'Draft',
      totalAmount: '$8,275.50',
      poNumber: 'PO-4822',
      items: [
        { name: 'Steel Wire Mesh Rolls', quantity: 75, unitPrice: '$85.50', total: '$6,412.50' },
        { name: 'Construction Fasteners', quantity: 500, unitPrice: '$3.73', total: '$1,863.00' }
      ],
      notes: 'Pending final inspection before confirmation.'
    },
    {
      id: 'RCP-2025-126',
      supplierName: 'FilterTech Inc',
      type: 'Inbound',
      date: '2025-01-14',
      status: 'Received',
      totalAmount: '$3,890.00',
      poNumber: 'PO-4823',
      items: [
        { name: 'Hydraulic Oil Filters', quantity: 200, unitPrice: '$15.50', total: '$3,100.00' },
        { name: 'Air Filters', quantity: 50, unitPrice: '$15.80', total: '$790.00' }
      ],
      notes: 'Items received and stored in maintenance section.'
    },
    {
      id: 'RCP-2025-125',
      supplierName: 'ElectroSupply Co',
      type: 'Inbound',
      date: '2025-01-13',
      status: 'Confirmed',
      totalAmount: '$15,620.75',
      poNumber: 'PO-4824',
      items: [
        { name: 'Electrical Junction Boxes', quantity: 300, unitPrice: '$28.50', total: '$8,550.00' },
        { name: 'Circuit Breakers 20A', quantity: 180, unitPrice: '$32.75', total: '$5,895.00' },
        { name: 'Electrical Conduits', quantity: 100, unitPrice: '$11.76', total: '$1,175.75' }
      ],
      notes: 'All electrical components tested and certified.'
    },
    {
      id: 'RCP-2025-124',
      supplierName: 'WorkGear Plus',
      type: 'Outbound',
      date: '2025-01-12',
      status: 'Confirmed',
      totalAmount: '$2,145.25',
      items: [
        { name: 'Heavy Duty Work Gloves', quantity: 120, unitPrice: '$12.50', total: '$1,500.00' },
        { name: 'Work Boots', quantity: 25, unitPrice: '$25.81', total: '$645.25' }
      ],
      notes: 'Shipped to construction site as requested.'
    },
    {
      id: 'RCP-2025-123',
      supplierName: 'ToolMaster Inc',
      type: 'Inbound',
      date: '2025-01-11',
      status: 'Draft',
      totalAmount: '$4,567.80',
      poNumber: 'PO-4825',
      items: [
        { name: 'Power Drill Bits Set', quantity: 85, unitPrice: '$35.20', total: '$2,992.00' },
        { name: 'Steel Measuring Tape', quantity: 65, unitPrice: '$24.24', total: '$1,575.80' }
      ],
      notes: 'Awaiting quality control inspection.'
    },
    {
      id: 'RCP-2025-122',
      supplierName: 'LightTech Solutions',
      type: 'Inbound',
      date: '2025-01-10',
      status: 'Received',
      totalAmount: '$3,240.00',
      poNumber: 'PO-4826',
      items: [
        { name: 'LED Work Lights', quantity: 45, unitPrice: '$72.00', total: '$3,240.00' }
      ],
      notes: 'LED lights tested and ready for distribution.'
    },
    {
      id: 'RCP-2025-121',
      supplierName: 'MeasurePro Ltd',
      type: 'Outbound',
      date: '2025-01-09',
      status: 'Confirmed',
      totalAmount: '$1,890.50',
      items: [
        { name: 'Digital Calipers', quantity: 30, unitPrice: '$45.50', total: '$1,365.00' },
        { name: 'Precision Rulers', quantity: 75, unitPrice: '$7.01', total: '$525.50' }
      ],
      notes: 'Precision tools shipped to quality control department.'
    },
    {
      id: 'RCP-2025-120',
      supplierName: 'VisionSafe Corp',
      type: 'Inbound',
      date: '2025-01-08',
      status: 'Confirmed',
      totalAmount: '$5,680.00',
      poNumber: 'PO-4827',
      items: [
        { name: 'Safety Goggles', quantity: 200, unitPrice: '$18.50', total: '$3,700.00' },
        { name: 'Face Shields', quantity: 120, unitPrice: '$16.50', total: '$1,980.00' }
      ],
      notes: 'Personal protective equipment approved and stored.'
    },
    {
      id: 'RCP-2025-119',
      supplierName: 'WeldTech Industries',
      type: 'Inbound',
      date: '2025-01-07',
      status: 'Draft',
      totalAmount: '$8,950.00',
      poNumber: 'PO-4828',
      items: [
        { name: 'Welding Electrodes', quantity: 500, unitPrice: '$12.50', total: '$6,250.00' },
        { name: 'Welding Wire', quantity: 100, unitPrice: '$27.00', total: '$2,700.00' }
      ],
      notes: 'Welding materials pending final approval.'
    },
    {
      id: 'RCP-2025-118',
      supplierName: 'Construction Co',
      type: 'Outbound',
      date: '2025-01-06',
      status: 'Received',
      totalAmount: '$3,125.00',
      items: [
        { name: 'Industrial Safety Helmets', quantity: 25, unitPrice: '$45.00', total: '$1,125.00' },
        { name: 'Construction Fasteners', quantity: 500, unitPrice: '$4.00', total: '$2,000.00' }
      ],
      notes: 'Materials delivered to construction project site.'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'Received':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'Inbound' ? 'text-green-600' : 'text-red-600';
  };

  const handleViewDetails = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowDetailsModal(true);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPage="receipts"
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
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Receipts Management</h1>
              <p className="text-gray-600">Manage purchase receipts and delivery confirmations</p>
            </div>

            {/* Receipts Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Receipt Records</h2>
                    <p className="text-sm text-gray-500">Total receipts: {receipts.length}</p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">Confirmed</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">Draft</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">Received</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receipt ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
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
                    {receipts.map((receipt) => (
                      <tr key={receipt.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-blue-50 p-2 rounded-lg mr-3">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{receipt.id}</div>
                              {receipt.poNumber && (
                                <div className="text-xs text-gray-500">{receipt.poNumber}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2 text-gray-400" />
                            <div className="text-sm font-medium text-gray-900">{receipt.supplierName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-semibold ${getTypeColor(receipt.type)}`}>
                            {receipt.type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {receipt.date}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm font-semibold text-gray-900">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {receipt.totalAmount}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(receipt.status)}`}>
                            {receipt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewDetails(receipt)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Receipt Details Modal */}
      {showDetailsModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Receipt Details</h3>
                <p className="text-sm text-gray-500">{selectedReceipt.id}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Receipt Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedReceipt.supplierName}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedReceipt.date}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <span className={`text-sm font-semibold ${getTypeColor(selectedReceipt.type)}`}>
                    {selectedReceipt.type}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedReceipt.status)}`}>
                    {selectedReceipt.status}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Items</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedReceipt.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <Package className="h-4 w-4 mr-2 text-gray-400" />
                              <span className="text-sm text-gray-900">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.unitPrice}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Amount */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-lg font-bold text-blue-600">{selectedReceipt.totalAmount}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedReceipt.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{selectedReceipt.notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download className="h-4 w-4 mr-2 inline" />
                  Download PDF
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptsPage;
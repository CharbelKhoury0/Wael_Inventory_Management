import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ArrowRightLeft, 
  Receipt, 
  X,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentPage, onPageChange }) => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
    { icon: Package, label: 'Items', key: 'items' },
    { icon: ArrowRightLeft, label: 'Transactions', key: 'transactions' },
    { icon: Receipt, label: 'Receipts', key: 'receipts' },
  ];

  const handleMenuClick = (key: string) => {
    onPageChange(key);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-bold text-gray-900">WarehousePro</h2>
              <p className="text-xs text-gray-500">Inventory System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <button
                  onClick={() => handleMenuClick(item.key)}
                  className={`
                    flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 group
                    ${currentPage === item.key
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon className={`
                    h-5 w-5 mr-3 transition-colors
                    ${currentPage === item.key ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {item.label}
                  {currentPage === item.key && (
                    <ChevronRight className="h-4 w-4 ml-auto text-blue-600" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-semibold mb-1">Need Help?</h3>
            <p className="text-xs opacity-90 mb-3">Contact our support team for assistance</p>
            <button className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1 rounded-md transition-colors">
              Get Support
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
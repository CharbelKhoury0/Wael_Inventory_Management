import React, { useState } from 'react';
import { useTheme, useWarehouse } from '../App';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import DashboardCards from './DashboardCards';
import TransactionsTable from './TransactionsTable';
import ReceiptsList from './ReceiptsList';
import { MapPin, User, Clock, BarChart3 } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
  onPageChange: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark } = useTheme();
  const { currentWarehouse, warehouseData } = useWarehouse();

  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPage="dashboard"
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
                  <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Dashboard Overview</h1>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Monitor your warehouse operations and inventory status</p>
                </div>
                <div className={`mt-4 lg:mt-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 min-w-80`}>
                  <div className="flex items-center mb-3">
                    <MapPin className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Current Warehouse</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{currentWarehouse}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{warehouseData.address}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="flex items-center">
                        <User className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} mr-2`} />
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manager</p>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{warehouseData.manager}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <BarChart3 className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} mr-2`} />
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Utilization</p>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{warehouseData.utilization}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DashboardCards />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
              <div className="xl:col-span-2">
                <TransactionsTable />
              </div>
              <div className="xl:col-span-1">
                <ReceiptsList />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
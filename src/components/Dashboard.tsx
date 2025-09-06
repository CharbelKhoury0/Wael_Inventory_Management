import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import DashboardCards from './DashboardCards';
import TransactionsTable from './TransactionsTable';
import ReceiptsList from './ReceiptsList';

interface DashboardProps {
  onLogout: () => void;
  onPageChange: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
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
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 px-4 py-6 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
              <p className="text-gray-600">Monitor your warehouse operations and inventory status</p>
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
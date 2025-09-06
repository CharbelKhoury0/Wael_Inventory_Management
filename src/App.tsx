import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import ItemsPage from './components/ItemsPage';
import TransactionsPage from './components/TransactionsPage';
import ReceiptsPage from './components/ReceiptsPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <>
          {currentPage === 'dashboard' && (
            <Dashboard onLogout={handleLogout} onPageChange={handlePageChange} />
          )}
          {currentPage === 'items' && (
            <ItemsPage onLogout={handleLogout} onPageChange={handlePageChange} />
          )}
          {currentPage === 'transactions' && (
            <TransactionsPage onLogout={handleLogout} onPageChange={handlePageChange} />
          )}
          {currentPage === 'receipts' && (
            <ReceiptsPage onLogout={handleLogout} onPageChange={handlePageChange} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
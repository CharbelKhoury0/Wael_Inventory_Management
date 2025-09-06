import React, { useState, createContext, useContext, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import ItemsPage from './components/ItemsPage';
import TransactionsPage from './components/TransactionsPage';
import ReceiptsPage from './components/ReceiptsPage';
import MovementsPage from './components/MovementsPage';
import SettingsPage from './components/SettingsPage';

// Warehouse data structure
const WAREHOUSE_DATA = {
  'Main Warehouse': {
    address: '123 Industrial Blvd, City Center',
    capacity: '50,000 sq ft',
    manager: 'Sarah Johnson',
    contact: '+1 (555) 123-4567',
    hours: '24/7 Operations',
    status: 'Active',
    utilization: '85%'
  },
  'Secondary Storage': {
    address: '456 Storage Ave, North District',
    capacity: '25,000 sq ft',
    manager: 'Mike Chen',
    contact: '+1 (555) 987-6543',
    hours: 'Mon-Fri 8AM-6PM',
    status: 'Active',
    utilization: '72%'
  },
  'Distribution Center': {
    address: '789 Logistics Way, South Zone',
    capacity: '75,000 sq ft',
    manager: 'Emily Rodriguez',
    contact: '+1 (555) 456-7890',
    hours: 'Mon-Sat 6AM-10PM',
    status: 'Active',
    utilization: '91%'
  }
};

// Global Theme Context
interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {}
});

export const useTheme = () => useContext(ThemeContext);

// Global Warehouse Context
interface WarehouseInfo {
  address: string;
  capacity: string;
  manager: string;
  contact: string;
  hours: string;
  status: string;
  utilization: string;
}

interface WarehouseContextType {
  currentWarehouse: string;
  warehouseData: WarehouseInfo;
  allWarehouses: typeof WAREHOUSE_DATA;
  setCurrentWarehouse: (warehouse: string) => void;
}

const WarehouseContext = createContext<WarehouseContextType>({
  currentWarehouse: 'Main Warehouse',
  warehouseData: WAREHOUSE_DATA['Main Warehouse'],
  allWarehouses: WAREHOUSE_DATA,
  setCurrentWarehouse: () => {}
});

export const useWarehouse = () => useContext(WarehouseContext);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isDark, setIsDark] = useState(() => {
    // Load theme from localStorage on app start
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme === 'dark') return true;
    if (savedTheme === 'light') return false;
    // Auto mode: check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  // Warehouse state management
  const [currentWarehouse, setCurrentWarehouseState] = useState(() => {
    // Load selected warehouse from localStorage on app start
    const savedWarehouse = localStorage.getItem('selected-warehouse');
    return savedWarehouse && WAREHOUSE_DATA[savedWarehouse as keyof typeof WAREHOUSE_DATA] 
      ? savedWarehouse 
      : 'Main Warehouse';
  });
  
  const warehouseData = WAREHOUSE_DATA[currentWarehouse as keyof typeof WAREHOUSE_DATA];
  
  const setCurrentWarehouse = (warehouse: string) => {
    if (WAREHOUSE_DATA[warehouse as keyof typeof WAREHOUSE_DATA]) {
      setCurrentWarehouseState(warehouse);
      localStorage.setItem('selected-warehouse', warehouse);
    }
  };

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('app-theme', isDark ? 'dark' : 'light');
    // Apply theme to document root for global styling
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const setTheme = (theme: 'light' | 'dark' | 'auto') => {
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
    } else {
      setIsDark(theme === 'dark');
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  const themeClasses = {
    container: isDark ? 'bg-gray-900' : 'bg-gray-50'
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme }}>
      <WarehouseContext.Provider value={{ 
        currentWarehouse, 
        warehouseData, 
        allWarehouses: WAREHOUSE_DATA, 
        setCurrentWarehouse 
      }}>
        <div className={`min-h-screen ${themeClasses.container}`}>
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
              {currentPage === 'movements' && (
                <MovementsPage onLogout={handleLogout} onPageChange={handlePageChange} />
              )}
              {currentPage === 'settings' && (
                <SettingsPage onLogout={handleLogout} onPageChange={handlePageChange} />
              )}
            </>
          )}
        </div>
      </WarehouseContext.Provider>
     </ThemeContext.Provider>
   );
 }

export default App;
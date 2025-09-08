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
  'Port of Beirut Terminal': {
    address: 'Beirut Port Complex, Karantina District, Beirut',
    capacity: '50,000 sq ft',
    manager: 'Ahmad Khalil',
    contact: '+961 1 580-211',
    hours: '24/7 Port Operations',
    status: 'Active',
    utilization: '85%'
  },
  'Tripoli Maritime Hub': {
    address: 'Port of Tripoli, Al-Mina District, Tripoli',
    capacity: '25,000 sq ft',
    manager: 'Fatima Nasrallah',
    contact: '+961 6 601-425',
    hours: 'Mon-Fri 6AM-8PM',
    status: 'Active',
    utilization: '72%'
  },
  'Sidon Logistics Center': {
    address: 'Sidon Port Authority, Saida Industrial Zone',
    capacity: '75,000 sq ft',
    manager: 'Omar Hariri',
    contact: '+961 7 720-156',
    hours: 'Mon-Sat 5AM-11PM',
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
  currentWarehouse: 'Port of Beirut Terminal',
  warehouseData: WAREHOUSE_DATA['Port of Beirut Terminal'],
  allWarehouses: WAREHOUSE_DATA,
  setCurrentWarehouse: () => {}
});

export const useWarehouse = () => useContext(WarehouseContext);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Load login state from localStorage on app start
    const savedLoginState = localStorage.getItem('user-logged-in');
    return savedLoginState === 'true';
  });
  
  const [currentPage, setCurrentPage] = useState(() => {
    // Load current page from localStorage on app start
    const savedPage = localStorage.getItem('current-page');
    const validPages = ['dashboard', 'items', 'transactions', 'receipts', 'movements', 'settings'];
    return savedPage && validPages.includes(savedPage) ? savedPage : 'dashboard';
  });
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
      : 'Port of Beirut Terminal';
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

  // Save login state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('user-logged-in', isLoggedIn.toString());
  }, [isLoggedIn]);

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
    localStorage.removeItem('user-logged-in');
    localStorage.removeItem('current-page');
    setCurrentPage('dashboard');
  };

  const handlePageChange = (page: string) => {
    const validPages = ['dashboard', 'items', 'transactions', 'receipts', 'movements', 'settings'];
    if (validPages.includes(page)) {
      setCurrentPage(page);
      localStorage.setItem('current-page', page);
    }
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
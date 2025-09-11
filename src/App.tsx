import React, { useState, createContext, useContext, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import ItemsPage from './components/ItemsPage';
import TransactionsPage from './components/TransactionsPage';
import ReceiptsPage from './components/ReceiptsPage';
import MovementsPage from './components/MovementsPage';
// Removed unused import of AnalyticsDashboard
import ReportingDashboard from './components/ReportingDashboard';
import SettingsPage from './components/SettingsPage';
import MobileNavigation from './components/MobileNavigation';
import { NotificationProvider } from './contexts/NotificationContext';
import { EnhancedThemeProvider, useEnhancedTheme } from './contexts/ThemeContext';
import { useTouchGestures } from './components/TouchGestureHandler';

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

// Legacy theme context removed - now using EnhancedThemeProvider

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
  const { isMobile, isTouch } = useTouchGestures();
  
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Load login state from localStorage on app start
    const savedLoginState = localStorage.getItem('user-logged-in');
    return savedLoginState === 'true';
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  
  const [currentPage, setCurrentPage] = useState(() => {
    // Load current page from localStorage on app start
    const savedPage = localStorage.getItem('current-page');
    const validPages = ['dashboard', 'items', 'transactions', 'receipts', 'movements', 'analytics', 'settings'];
    return savedPage && validPages.includes(savedPage) ? savedPage : 'dashboard';
  });
  // Theme state is now managed by EnhancedThemeProvider
  
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

  // Save login state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('user-logged-in', isLoggedIn.toString());
  }, [isLoggedIn]);

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
    const validPages = ['dashboard', 'items', 'transactions', 'receipts', 'movements', 'analytics', 'settings'];
    if (validPages.includes(page)) {
      setCurrentPage(page);
      localStorage.setItem('current-page', page);
    }
  };

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      // Simulate data refresh with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update last refresh timestamp
      setLastRefresh(Date.now());
      
      // Force re-render of current page data
      // This would typically trigger data fetching in real applications
      console.log(`Refreshed ${currentPage} data at ${new Date().toLocaleTimeString()}`);
      
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Custom error handler for logging
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error details for debugging
    console.error('Application Error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      currentPage,
      currentWarehouse,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <ErrorBoundary onError={handleError}>
      <NotificationProvider>
        <EnhancedThemeProvider defaultTheme="light" enableTransitions={true}>
          <WarehouseContext.Provider value={{ 
            currentWarehouse, 
            warehouseData, 
            allWarehouses: WAREHOUSE_DATA, 
            setCurrentWarehouse 
          }}>
            <AppContent 
              isLoggedIn={isLoggedIn}
              currentPage={currentPage}
              isMobile={isMobile}
              handleLogin={handleLogin}
              handleLogout={handleLogout}
              handlePageChange={handlePageChange}
              handleRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          </WarehouseContext.Provider>
        </EnhancedThemeProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

// Separate component to use theme context
interface AppContentProps {
  isLoggedIn: boolean;
  currentPage: string;
  isMobile: boolean;
  handleLogin: () => void;
  handleLogout: () => void;
  handlePageChange: (page: string) => void;
  handleRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

const AppContent: React.FC<AppContentProps> = ({
  isLoggedIn,
  currentPage,
  isMobile,
  handleLogin,
  handleLogout,
  handlePageChange,
  handleRefresh,
  isRefreshing
}) => {
  const { getThemeClasses } = useEnhancedTheme();
  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen ${themeClasses.container.primary} ${isMobile ? 'pb-20 safe-area-bottom' : ''}`}>
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <>
          <div className={`${isMobile ? 'mobile-optimized' : ''}`}>
            {currentPage === 'dashboard' && (
              <Dashboard onLogout={handleLogout} onPageChange={handlePageChange} />
            )}
            {currentPage === 'items' && (
              <ItemsPage />
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
            {currentPage === 'analytics' && (
              <ReportingDashboard 
                onLogout={handleLogout} 
                onPageChange={handlePageChange} 
              />
            )}
            {currentPage === 'settings' && (
              <SettingsPage onLogout={handleLogout} onPageChange={handlePageChange} />
            )}
          </div>
          
          {/* Mobile Navigation */}
          {isMobile && (
            <MobileNavigation
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onLogout={handleLogout}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
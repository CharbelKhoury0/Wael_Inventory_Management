import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import TouchGestureHandler, { hapticFeedback } from './TouchGestureHandler';
import {
  Home,
  Package,
  TruckIcon,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface MobileNavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentPage,
  onPageChange,
  onLogout,
  onRefresh,
  isRefreshing = false
}) => {
  const { isDark } = useTheme();
  const [showSidebar, setShowSidebar] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [sidebarAnimation, setSidebarAnimation] = useState('translate-x-full');
  const pullThreshold = 80;
  const maxPullDistance = 120;
  const pullStartRef = useRef<number | null>(null);

  // Navigation items for bottom navigation
  const bottomNavItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'items', label: 'Items', icon: Package },
    { id: 'movements', label: 'Moves', icon: TruckIcon },
    { id: 'analytics', label: 'Reports', icon: BarChart3 },
    { id: 'menu', label: 'Menu', icon: Menu }
  ];

  // All navigation items for sidebar
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'items', label: 'Items', icon: Package },
    { id: 'transactions', label: 'Transactions', icon: FileText },
    { id: 'movements', label: 'Movements', icon: TruckIcon },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'logout', label: 'Logout', icon: X }
  ];

  // Pull-to-refresh functionality
  const handlePullStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0 && onRefresh) {
      pullStartRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [onRefresh]);

  const handlePullMove = useCallback((e: TouchEvent) => {
    if (isPulling && pullStartRef.current !== null && window.scrollY === 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - pullStartRef.current);
      const constrainedDistance = Math.min(distance * 0.5, maxPullDistance);
      setPullDistance(constrainedDistance);
      
      if (constrainedDistance > pullThreshold) {
        hapticFeedback(30);
      }
    }
  }, [isPulling, pullThreshold, maxPullDistance]);

  const handlePullEnd = useCallback(() => {
    if (isPulling) {
      if (pullDistance > pullThreshold && onRefresh) {
        onRefresh();
        hapticFeedback([50, 100, 50]);
      }
      setIsPulling(false);
      setPullDistance(0);
      pullStartRef.current = null;
    }
  }, [isPulling, pullDistance, pullThreshold, onRefresh]);

  // Hide/show navigation on scroll with enhanced animation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Pull-to-refresh event listeners
  useEffect(() => {
    if (onRefresh) {
      document.addEventListener('touchstart', handlePullStart, { passive: true });
      document.addEventListener('touchmove', handlePullMove, { passive: false });
      document.addEventListener('touchend', handlePullEnd, { passive: true });
      
      return () => {
        document.removeEventListener('touchstart', handlePullStart);
        document.removeEventListener('touchmove', handlePullMove);
        document.removeEventListener('touchend', handlePullEnd);
      };
    }
  }, [handlePullStart, handlePullMove, handlePullEnd, onRefresh]);

  // Sidebar animation control
  useEffect(() => {
    if (showSidebar) {
      setSidebarAnimation('translate-x-0');
    } else {
      setSidebarAnimation('translate-x-full');
    }
  }, [showSidebar]);

  const handleNavClick = (pageId: string) => {
    hapticFeedback(50);
    
    if (pageId === 'menu') {
      setShowSidebar(true);
    } else {
      onPageChange(pageId);
    }
  };

  const handleSidebarItemClick = (pageId: string) => {
    hapticFeedback(50);
    setShowSidebar(false);
    
    if (pageId === 'logout') {
      onLogout();
    } else {
      onPageChange(pageId);
    }
  };

  const handleSwipeNavigation = (direction: 'left' | 'right') => {
    const currentIndex = bottomNavItems.findIndex(item => item.id === currentPage);
    
    if (direction === 'left' && currentIndex < bottomNavItems.length - 1) {
      const nextPage = bottomNavItems[currentIndex + 1].id;
      onPageChange(nextPage);
      hapticFeedback(30);
    } else if (direction === 'right' && currentIndex > 0) {
      const prevPage = bottomNavItems[currentIndex - 1].id;
      onPageChange(prevPage);
      hapticFeedback(30);
    }
  };

  const themeClasses = {
    bottomNav: isDark 
      ? 'bg-gray-800 border-gray-700 text-white'
      : 'bg-white border-gray-200 text-gray-900',
    sidebar: isDark 
      ? 'bg-gray-800 text-white'
      : 'bg-white text-gray-900',
    navItem: isDark
      ? 'text-gray-300 hover:text-white hover:bg-gray-700'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
    activeNavItem: isDark
      ? 'text-blue-400 bg-gray-700'
      : 'text-blue-600 bg-blue-50'
  };

  return (
    <>
      {/* Pull-to-refresh indicator */}
      {(isPulling || isRefreshing) && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center"
          style={{
            transform: `translateY(${Math.max(0, pullDistance - 40)}px)`,
            transition: isPulling ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          <div className={`
            flex items-center justify-center w-12 h-12 rounded-full
            ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
            shadow-lg border transition-all duration-300
            ${pullDistance > pullThreshold || isRefreshing ? 'scale-110' : 'scale-100'}
          `}>
            <RefreshCw 
              className={`w-6 h-6 ${
                isRefreshing || pullDistance > pullThreshold ? 'animate-spin' : ''
              }`} 
            />
          </div>
        </div>
      )}

      {/* Touch gesture wrapper for swipe navigation */}
      <TouchGestureHandler
        onSwipe={(direction) => {
          if (direction === 'left' || direction === 'right') {
            handleSwipeNavigation(direction);
          }
        }}
        className="fixed inset-0 pointer-events-none z-10"
      />

      {/* Bottom Navigation */}
      <nav 
        className={`
          fixed bottom-0 left-0 right-0 z-40
          transition-all duration-300 ease-in-out
          ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
          ${themeClasses.bottomNav}
          backdrop-blur-md border-t
        `}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  touch-target flex flex-col items-center justify-center
                  px-3 py-2 rounded-lg transition-all duration-300 ease-out
                  transform hover:scale-105 active:scale-95 min-h-[44px] min-w-[44px]
                  ${isActive ? `${themeClasses.activeNavItem} shadow-lg` : `${themeClasses.navItem} hover:bg-opacity-80`}
                `}
                style={{
                  transform: isActive ? 'translateY(-2px)' : 'translateY(0px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <Icon className={`
                  h-5 w-5 mb-1 transition-all duration-300
                  ${isActive ? 'scale-110 text-blue-600' : 'scale-100'}
                `} />
                <span className={`
                  text-xs font-medium transition-all duration-300
                  ${isActive ? 'font-semibold text-blue-600' : ''}
                `}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Overlay */}
      {showSidebar && (
        <div 
          className={`
            fixed inset-0 z-50 transition-all duration-300 ease-out
            ${showSidebar ? 'bg-black/50 opacity-100' : 'bg-black/0 opacity-0'}
          `}
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      {showSidebar && (
        <div
          className={`
            fixed top-0 right-0 h-full w-80 max-w-[85vw] z-50
            transition-all duration-300 ease-out transform
            ${sidebarAnimation}
            ${themeClasses.sidebar}
            backdrop-blur-md shadow-2xl
          `}
          style={{
            transform: showSidebar ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.95)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <TouchGestureHandler
            onSwipe={(direction) => {
              if (direction === 'right') {
                setShowSidebar(false);
                hapticFeedback(30);
              }
            }}
            className="w-full h-full flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold animate-fade-in">Menu</h2>
              <button
                onClick={() => {
                  setShowSidebar(false);
                  hapticFeedback(50);
                }}
                className={`
                  p-2 rounded-lg transition-all duration-200 ease-out
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  active:scale-95 transform touch-target
                `}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {allNavItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSidebarItemClick(item.id)}
                    className={`
                      w-full flex items-center space-x-3 p-3 rounded-lg mb-2
                      transition-all duration-300 ease-out text-left touch-target
                      transform hover:scale-[1.02] active:scale-[0.98]
                      animate-slide-in
                      ${isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-md' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-sm'
                      }
                    `}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      transform: isActive ? 'translateX(4px)' : 'translateX(0px)'
                    }}
                  >
                    <Icon className={`
                      w-5 h-5 transition-all duration-300
                      ${isActive ? 'scale-110 text-blue-600' : 'scale-100'}
                    `} />
                    <span className={`
                      font-medium transition-all duration-300
                      ${isActive ? 'font-semibold' : ''}
                    `}>{item.label}</span>
                    <ChevronRight className={`
                      w-4 h-4 ml-auto transition-all duration-300
                      ${isActive ? 'translate-x-1 text-blue-600' : 'translate-x-0'}
                    `} />
                  </button>
                );
              })}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center animate-fade-in">
                Wael Inventory Management
              </div>
            </div>
          </TouchGestureHandler>
        </div>
      )}
    </>
  );
};

export default MobileNavigation;
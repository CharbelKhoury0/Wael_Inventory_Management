import React, { useState, useEffect, useRef } from 'react';
import { useEnhancedTheme } from '../../contexts/ThemeContext';
import { useDesignTokens } from '../../utils/designTokens';
import { HoverScale } from './AnimationSystem';
import {
  LayoutDashboard,
  Package,
  Receipt,
  TrendingUp,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Home,
  ArrowRightLeft,
  User,
  Bell,
  Search,
  HelpCircle
} from 'lucide-react';

// Navigation item interface
interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  children?: NavigationItem[];
  disabled?: boolean;
}

// Sidebar props
interface CollapsibleSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'floating';
  position?: 'left' | 'right';
  overlay?: boolean;
}

// Enhanced Collapsible Sidebar Component
const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  isOpen,
  onToggle,
  currentPage,
  onPageChange,
  onLogout,
  className = '',
  variant = 'default',
  position = 'left',
  overlay = true
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const { themeConfig, getThemeClasses } = useEnhancedTheme();
  const tokens = useDesignTokens();
  const themeClasses = getThemeClasses();
  
  // Navigation items configuration
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      onClick: () => onPageChange('dashboard')
    },
    {
      id: 'items',
      label: 'Inventory',
      icon: <Package className="h-5 w-5" />,
      onClick: () => onPageChange('items'),
      badge: '1,234'
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: <Receipt className="h-5 w-5" />,
      onClick: () => onPageChange('transactions')
    },
    {
      id: 'movements',
      label: 'Movements',
      icon: <ArrowRightLeft className="h-5 w-5" />,
      onClick: () => onPageChange('movements')
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      onClick: () => onPageChange('analytics'),
      children: [
        {
          id: 'reports',
          label: 'Reports',
          icon: <TrendingUp className="h-4 w-4" />,
          onClick: () => onPageChange('analytics')
        },
        {
          id: 'insights',
          label: 'Insights',
          icon: <BarChart3 className="h-4 w-4" />,
          onClick: () => onPageChange('analytics')
        }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      onClick: () => onPageChange('settings')
    }
  ];
  
  // Handle item expansion
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };
  
  // Handle click outside to close sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (window.innerWidth < 768 && isOpen) {
          onToggle();
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);
  
  // Sidebar width based on state
  const sidebarWidth = isOpen ? 'w-64' : 'w-16';
  const sidebarWidthMobile = isOpen ? 'w-64' : 'w-0';
  
  // Variant styles
  const variantStyles = {
    default: `${themeClasses.background.elevated} border-r ${themeClasses.border.primary}`,
    compact: `${themeClasses.background.secondary} border-r ${themeClasses.border.primary}`,
    floating: `${themeClasses.background.elevated} rounded-lg shadow-lg border ${themeClasses.border.primary} m-4`
  };
  
  // Position styles
  const positionStyles = {
    left: 'left-0',
    right: 'right-0'
  };
  
  // Navigation item component
  const NavigationItemComponent: React.FC<{
    item: NavigationItem;
    level?: number;
  }> = ({ item, level = 0 }) => {
    const isActive = currentPage === item.id;
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isHovered = hoveredItem === item.id;
    
    const itemClasses = [
      'flex items-center w-full text-left transition-all duration-200 rounded-lg relative',
      isOpen ? 'px-3 py-2 mx-2' : 'px-2 py-2 mx-1',
      level > 0 ? 'ml-6' : '',
      isActive 
        ? `${themeClasses.button.primary} text-white shadow-sm`
        : `${themeClasses.text.secondary} hover:${themeClasses.background.secondary} hover:${themeClasses.text.primary}`,
      item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    ].filter(Boolean).join(' ');
    
    return (
      <div>
        <HoverScale scale={1.02} duration="fast">
          <button
            className={itemClasses}
            onClick={() => {
              if (item.disabled) return;
              
              if (hasChildren) {
                toggleExpanded(item.id);
              }
              
              if (item.onClick) {
                item.onClick();
              }
            }}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            disabled={item.disabled}
          >
            {/* Icon */}
            <span className="flex-shrink-0">
              {item.icon}
            </span>
            
            {/* Label and badge */}
            {isOpen && (
              <Animated animation="slideInLeft" duration="fast" className="flex-1 ml-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {item.label}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    {/* Badge */}
                    {item.badge && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        isActive 
                          ? 'bg-white bg-opacity-20 text-white'
                          : `bg-[${themeConfig.colors.primary[100]}] text-[${themeConfig.colors.primary[700]}]`
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    
                    {/* Expand icon */}
                    {hasChildren && (
                      <ChevronRight 
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    )}
                  </div>
                </div>
              </Animated>
            )}
            
            {/* Tooltip for collapsed state */}
            {!isOpen && isHovered && (
              <div className={`absolute ${position === 'left' ? 'left-full ml-2' : 'right-full mr-2'} top-1/2 transform -translate-y-1/2 z-50`}>
                <div className={`${themeClasses.background.elevated} ${themeClasses.border.primary} border rounded-lg px-3 py-2 shadow-lg`}>
                  <span className={`text-sm font-medium ${themeClasses.text.primary}`}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full bg-[${themeConfig.colors.primary[100]}] text-[${themeConfig.colors.primary[700]}]`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
            )}
          </button>
        </HoverScale>
        
        {/* Children */}
        {hasChildren && isExpanded && isOpen && (
          <Animated animation="slideInDown" duration="fast" className="mt-1">
            <div className="space-y-1">
              {item.children!.map(child => (
                <NavigationItemComponent
                  key={child.id}
                  item={child}
                  level={level + 1}
                />
              ))}
            </div>
          </Animated>
        )}
      </div>
    );
  };
  
  return (
    <>
      {/* Overlay for mobile */}
      {overlay && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={[
          'fixed top-0 h-full z-50 transition-all duration-300 ease-in-out',
          positionStyles[position],
          variantStyles[variant],
          `md:${sidebarWidth}`,
          sidebarWidthMobile,
          'md:relative md:z-auto',
          className
        ].filter(Boolean).join(' ')}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${themeClasses.border.primary}`}>
          {isOpen ? (
            <Animated animation="fadeIn" duration="fast">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-[${themeConfig.colors.primary[500]}] to-[${themeConfig.colors.primary[700]}] flex items-center justify-center`}>
                  <Package className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className={`text-lg font-bold ${themeClasses.text.primary}`}>
                    Wael Inventory
                  </h1>
                  <p className={`text-xs ${themeClasses.text.secondary}`}>
                    Management System
                  </p>
                </div>
              </div>
            </Animated>
          ) : (
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-[${themeConfig.colors.primary[500]}] to-[${themeConfig.colors.primary[700]}] flex items-center justify-center mx-auto`}>
              <Package className="h-4 w-4 text-white" />
            </div>
          )}
          
          {/* Toggle button */}
          <button
            onClick={onToggle}
            className={`p-1 rounded-lg ${themeClasses.button.ghost} transition-colors`}
          >
            {isOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {/* Search */}
        {isOpen && (
          <div className="p-4">
            <Animated animation="slideInUp" duration="fast">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${themeClasses.text.tertiary}`} />
                <input
                  type="text"
                  placeholder="Search..."
                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border ${themeClasses.input.base} ${themeClasses.input.focus}`}
                />
              </div>
            </Animated>
          </div>
        )}
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1">
            {navigationItems.map(item => (
              <NavigationItemComponent key={item.id} item={item} />
            ))}
          </div>
        </nav>
        
        {/* Footer */}
        <div className={`p-4 border-t ${themeClasses.border.primary}`}>
          {isOpen ? (
            <Animated animation="fadeIn" duration="fast">
              <div className="space-y-2">
                {/* User profile */}
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${themeClasses.text.primary} truncate`}>
                      Admin User
                    </p>
                    <p className={`text-xs ${themeClasses.text.secondary} truncate`}>
                      admin@wael.com
                    </p>
                  </div>
                </div>
                
                {/* Quick actions */}
                <div className="flex space-x-1">
                  <button className={`flex-1 p-2 rounded-lg ${themeClasses.button.ghost} transition-colors`}>
                    <Bell className="h-4 w-4 mx-auto" />
                  </button>
                  <button className={`flex-1 p-2 rounded-lg ${themeClasses.button.ghost} transition-colors`}>
                    <HelpCircle className="h-4 w-4 mx-auto" />
                  </button>
                  <button 
                    onClick={onLogout}
                    className={`flex-1 p-2 rounded-lg ${themeClasses.button.ghost} transition-colors hover:bg-red-50 hover:text-red-600`}
                  >
                    <X className="h-4 w-4 mx-auto" />
                  </button>
                </div>
              </div>
            </Animated>
          ) : (
            <div className="space-y-2">
              <button className={`w-full p-2 rounded-lg ${themeClasses.button.ghost} transition-colors`}>
                <User className="h-4 w-4 mx-auto" />
              </button>
              <button 
                onClick={onLogout}
                className={`w-full p-2 rounded-lg ${themeClasses.button.ghost} transition-colors hover:bg-red-50 hover:text-red-600`}
              >
                <X className="h-4 w-4 mx-auto" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CollapsibleSidebar;
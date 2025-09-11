import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Menu, Bell, Settings, User, LogOut, Package, AlertTriangle, CheckCircle } from 'lucide-react';

interface TopNavProps {
  onMenuClick: () => void;
  onLogout: () => void;
  onPageChange: (page: string) => void;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  color: string;
  read: boolean;
}

const TopNav: React.FC<TopNavProps> = React.memo(({ onMenuClick, onLogout, onPageChange }) => {
  const { isDark } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // Get user settings from localStorage for profile picture
  const [userSettings, setUserSettings] = useState(() => {
    const saved = localStorage.getItem('user-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    }
    return { name: 'Zeina Makdisi', profilePicture: null };
  });
  
  // Listen for changes to user settings
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('user-settings');
      if (saved) {
        try {
          setUserSettings(JSON.parse(saved));
        } catch (error) {
          console.error('Error loading user settings:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes periodically (for same-tab updates)
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Icon mapping function
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return AlertTriangle;
      case 'success':
        return CheckCircle;
      case 'info':
        return Package;
      default:
        return Bell;
    }
  };

  // Initialize notifications with read status from localStorage
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
    // Default notifications
    return [
      {
        id: 1,
        type: 'warning',
        title: 'Low Stock Alert',
        message: 'Product "Wireless Headphones" is running low (5 units left)',
        time: '2 minutes ago',
        color: 'text-yellow-500',
        read: false
      },
      {
        id: 2,
        type: 'success',
        title: 'New Receipt',
        message: 'Receipt #R-2024-001 has been processed successfully',
        time: '15 minutes ago',
        color: 'text-green-500',
        read: false
      },
      {
        id: 3,
        type: 'info',
        title: 'Inventory Update',
        message: 'Monthly inventory report is ready for review',
        time: '1 hour ago',
        color: 'text-blue-500',
        read: false
      }
    ];
  });

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Get unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
    setShowNotifications(false);
  };

  // Mark individual notification as read
  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  // Handle click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);
  
  const themeClasses = {
    header: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    title: isDark ? 'text-white' : 'text-gray-900',
    subtitle: isDark ? 'text-gray-400' : 'text-gray-500',
    button: isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600',
    dropdown: isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200',
    dropdownItem: isDark ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-50',
    logoutButton: isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
  };
  
  return (
    <header className={`shadow-sm border-b ${themeClasses.header}`}>
      <div className="flex items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className={`lg:hidden p-2 rounded-md transition-colors ${themeClasses.button}`}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="ml-2 lg:ml-0">
            <h1 className={`text-xl font-semibold ${themeClasses.title}`}>Warehouse Management</h1>
            <p className={`text-sm ${themeClasses.subtitle} hidden sm:block`}>Real-time inventory tracking and logistics</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-lg transition-colors ${themeClasses.button}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-80 ${themeClasses.dropdown} rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto`}>
                <div className="py-2">
                  <div className={`px-4 py-2 border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <h3 className={`text-sm font-semibold ${themeClasses.title}`}>Notifications</h3>
                  </div>
                  
                  {unreadCount === 0 ? (
                    <div className={`px-4 py-6 text-center ${themeClasses.subtitle}`}>
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No new notifications</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.filter(n => !n.read).map((notification) => {
                        const IconComponent = getNotificationIcon(notification.type);
                        return (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 border-b ${isDark ? 'border-gray-600' : 'border-gray-200'} last:border-b-0 hover:${isDark ? 'bg-gray-600' : 'bg-gray-50'} cursor-pointer transition-colors`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <IconComponent className={`h-5 w-5 mt-0.5 ${notification.color}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className={`text-sm font-medium ${themeClasses.title}`}>
                                    {notification.title}
                                  </p>
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                </div>
                                <p className={`text-sm ${themeClasses.subtitle} mt-1`}>
                                  {notification.message}
                                </p>
                                <p className={`text-xs ${themeClasses.subtitle} mt-1`}>
                                  {notification.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className={`px-4 py-2 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <button 
                      className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => onPageChange('settings')}
            className={`p-2 rounded-lg transition-colors ${themeClasses.button}`}
          >
            <Settings className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="hidden md:block text-right">
              <p className={`text-sm font-medium ${themeClasses.title}`}>Zeina Makdisi</p>
              <p className={`text-xs ${themeClasses.subtitle}`}>Warehouse Manager</p>
            </div>
            <div className="relative group">
              <button className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${themeClasses.button}`}>
                <div className="h-8 w-8 rounded-full flex items-center justify-center overflow-hidden">
                  {userSettings.profilePicture ? (
                    <img 
                      src={userSettings.profilePicture} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {userSettings.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </button>
              
              <div className={`absolute right-0 mt-2 w-48 ${themeClasses.dropdown} rounded-lg shadow-lg border invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50`}>
                <div className="py-2">
                  <button 
                    onClick={() => onPageChange('settings')}
                    className={`flex items-center w-full px-4 py-2 text-sm ${themeClasses.dropdownItem}`}
                  >
                    <User className="h-4 w-4 mr-3" />
                    Profile Settings
                  </button>
                  <button 
                    onClick={onLogout}
                    className={`flex items-center w-full px-4 py-2 text-sm ${themeClasses.logoutButton}`}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});

export default TopNav;
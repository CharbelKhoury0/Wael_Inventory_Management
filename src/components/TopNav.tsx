import React from 'react';
import { useTheme } from '../App';
import { Menu, Bell, Settings, User, LogOut } from 'lucide-react';

interface TopNavProps {
  onMenuClick: () => void;
  onLogout: () => void;
  onPageChange: (page: string) => void;
}

const TopNav: React.FC<TopNavProps> = ({ onMenuClick, onLogout, onPageChange }) => {
  const { isDark } = useTheme();
  
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
          <button className={`relative p-2 rounded-lg transition-colors ${themeClasses.button}`}>
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </button>
          
          <button 
            onClick={() => onPageChange('settings')}
            className={`p-2 rounded-lg transition-colors ${themeClasses.button}`}
          >
            <Settings className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="hidden md:block text-right">
              <p className={`text-sm font-medium ${themeClasses.title}`}>Sarah Johnson</p>
              <p className={`text-xs ${themeClasses.subtitle}`}>Warehouse Manager</p>
            </div>
            <div className="relative group">
              <button className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${themeClasses.button}`}>
                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </button>
              
              <div className={`absolute right-0 mt-2 w-48 ${themeClasses.dropdown} rounded-lg shadow-lg border invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50`}>
                <div className="py-2">
                  <a href="#" className={`flex items-center px-4 py-2 text-sm ${themeClasses.dropdownItem}`}>
                    <User className="h-4 w-4 mr-3" />
                    Profile Settings
                  </a>
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
};

export default TopNav;
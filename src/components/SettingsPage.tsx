import React, { useState, useEffect, createContext } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { useTheme, useWarehouse } from '../App';
import { 
  User, 
  Bell, 
  Globe, 
  Shield, 
  Database, 
  Save,
  Eye,
  EyeOff,
  Download,
  Upload,
  MapPin,
  Clock,
  Users,
  Phone,
  Lock,
  Camera,
  Calendar,
  Briefcase,
  Heart,
  Award,
  Languages,
  UserCheck,
  Building,
  Hash,
  FileText
} from 'lucide-react';

// Language Context
const LanguageContext = createContext<{
  language: string;
  isRTL: boolean;
  t: (key: string) => string;
}>({ language: 'en', isRTL: false, t: (key) => key });

// Role permissions
const ROLE_PERMISSIONS = {
  'Administrator': {
    canEditProfile: true,
    canEditSystemPrefs: true,
    canEditWarehouse: true,
    canEditSecurity: true,
    canManageData: true
  },
  'Warehouse Manager': {
    canEditProfile: true,
    canEditSystemPrefs: true,
    canEditWarehouse: true,
    canEditSecurity: false,
    canManageData: false
  },
  'Inventory Clerk': {
    canEditProfile: true,
    canEditSystemPrefs: false,
    canEditWarehouse: false,
    canEditSecurity: false,
    canManageData: false
  }
};

// Warehouse data is now managed by global context

// Translations
const TRANSLATIONS = {
  en: {
    settings: 'Settings',
    userProfile: 'User Profile',
    systemPreferences: 'System Preferences',
    warehouseSettings: 'Warehouse Settings',
    securitySettings: 'Security Settings',
    dataManagement: 'Data Management',
    fullName: 'Full Name',
    emailAddress: 'Email Address',
    role: 'Role',
    theme: 'Theme',
    language: 'Language',
    defaultLocation: 'Default Location',
    unitOfMeasurement: 'Unit of Measurement',
    light: 'Light',
    dark: 'Dark',
    auto: 'Auto',
    english: 'English',
    spanish: 'Spanish',
    french: 'French',
    german: 'German',
    arabic: 'Arabic',
    warehouseDetails: 'Warehouse Details',
    address: 'Address',
    capacity: 'Capacity',
    manager: 'Manager',
    contact: 'Contact',
    hours: 'Operating Hours',
    status: 'Status',
    utilization: 'Utilization'
  },
  ar: {
    settings: 'الإعدادات',
    userProfile: 'الملف الشخصي',
    systemPreferences: 'تفضيلات النظام',
    warehouseSettings: 'إعدادات المستودع',
    securitySettings: 'إعدادات الأمان',
    dataManagement: 'إدارة البيانات',
    fullName: 'الاسم الكامل',
    emailAddress: 'عنوان البريد الإلكتروني',
    role: 'الدور',
    theme: 'المظهر',
    language: 'اللغة',
    defaultLocation: 'الموقع الافتراضي',
    unitOfMeasurement: 'وحدة القياس',
    light: 'فاتح',
    dark: 'داكن',
    auto: 'تلقائي',
    english: 'الإنجليزية',
    spanish: 'الإسبانية',
    french: 'الفرنسية',
    german: 'الألمانية',
    arabic: 'العربية',
    warehouseDetails: 'تفاصيل المستودع',
    address: 'العنوان',
    capacity: 'السعة',
    manager: 'المدير',
    contact: 'الاتصال',
    hours: 'ساعات العمل',
    status: 'الحالة',
    utilization: 'الاستخدام'
  }
};

interface SettingsPageProps {
  onLogout: () => void;
  onPageChange: (page: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { isDark, setTheme } = useTheme();
  const { currentWarehouse, warehouseData, allWarehouses, setCurrentWarehouse } = useWarehouse();
  const [settings, setSettings] = useState(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('user-settings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return {
      // User Profile - Basic Information
      name: 'John Doe',
      email: 'john.doe@company.com',
      role: 'Administrator', // This will be read-only
      
      // Contact Information
      phone: '+1 (555) 123-4567',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '+1 (555) 987-6543',
      
      // Professional Information
      jobTitle: 'Warehouse Operations Manager',
      department: 'Operations',
      employeeId: 'EMP-2024-001',
      startDate: '2023-01-15',
      manager: 'Sarah Johnson',
      
      // Personal Information
      dateOfBirth: '1990-05-15',
      bio: 'Experienced warehouse manager with 8+ years in inventory management and logistics operations.',
      skills: ['Inventory Management', 'Team Leadership', 'Process Optimization', 'Quality Control'],
      languages: ['English', 'Spanish', 'French'],
      
      // Profile Picture
      profilePicture: null,
      
      // System Preferences
      theme: localStorage.getItem('app-theme') || 'light',
      language: 'en',
      emailNotifications: true,
      pushNotifications: false,
      soundNotifications: true,
      desktopNotifications: false,
      autoSave: true,
      compactView: false,
      
      // Warehouse Settings
      defaultLocation: currentWarehouse,
      unitOfMeasurement: 'metric',
      
      // Security Settings
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      twoFactorAuth: false
    };
  });

  // Get user permissions based on role
  const permissions = ROLE_PERMISSIONS[settings.role as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS['Inventory Clerk'];
  
  // Get current warehouse details from context
  const currentWarehouseDetails = warehouseData;
  
  // Language and RTL support
  const isRTL = settings.language === 'ar';
  const t = (key: string) => {
    const translations = TRANSLATIONS[settings.language as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;
    return translations[key as keyof typeof translations] || key;
  };

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('user-settings', JSON.stringify(settings));
  }, [settings]);

  // Update theme when settings change
  useEffect(() => {
    if (settings.theme === 'dark') {
      setTheme('dark');
    } else if (settings.theme === 'light') {
      setTheme('light');
    } else {
      setTheme('auto');
    }
  }, [settings.theme, setTheme]);

  // Update language and apply RTL
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
  }, [settings.language, isRTL]);

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    
    // Immediately apply theme changes
    if (field === 'theme') {
      if (value === 'dark') {
        setTheme('dark');
      } else if (value === 'light') {
        setTheme('light');
      } else {
        setTheme('auto');
      }
    }
  };

  const handleSave = () => {
    if (settings.newPassword && settings.newPassword !== settings.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    
    // Update warehouse context if warehouse selection changed
    if (settings.defaultLocation !== currentWarehouse) {
      setCurrentWarehouse(settings.defaultLocation);
    }
    
    alert('Settings saved successfully!');
    console.log('Settings saved:', settings);
    
    setSettings(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  // CSS classes for theme and RTL support
  const themeClasses = {
    container: isDark ? 'bg-gray-900' : 'bg-gray-50',
    card: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-600',
      label: isDark ? 'text-gray-200' : 'text-gray-700'
    },
    input: isDark 
      ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400 focus:border-blue-400' 
      : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-transparent',
    select: isDark 
      ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400 focus:border-blue-400' 
      : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-transparent'
  };

  return (
    <LanguageContext.Provider value={{ language: settings.language, isRTL, t }}>
      <div className={`flex h-screen ${themeClasses.container} ${isRTL ? 'rtl' : 'ltr'}`}>
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          currentPage="settings"
          onPageChange={onPageChange}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNav 
            onMenuClick={() => setSidebarOpen(true)}
            onLogout={onLogout}
            onPageChange={onPageChange}
          />
            
          <main className={`flex-1 overflow-x-hidden overflow-y-auto ${themeClasses.container} px-4 py-6 md:px-6`}>
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className={`text-2xl md:text-3xl font-bold ${themeClasses.text.primary} mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('settings')}
                </h1>
                <p className={`${themeClasses.text.secondary} ${isRTL ? 'text-right' : 'text-left'}`}>
                  Manage your account and system preferences
                </p>
              </div>

              <div className="space-y-6">
                {/* User Profile Section */}
                {permissions.canEditProfile && (
                  <div className={`${themeClasses.card} rounded-lg shadow-sm border p-6`}>
                    <div className={`flex items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <User className={`h-5 w-5 text-blue-600 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>{t('userProfile')}</h2>
                    </div>
                    
                    {/* Profile Picture Section */}
                    <div className="mb-8">
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} mb-4`}>
                        <Camera className={`h-4 w-4 text-gray-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        <h3 className={`text-md font-medium ${themeClasses.text.primary}`}>Profile Picture</h3>
                      </div>
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
                        <div className={`w-20 h-20 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'} flex items-center justify-center`}>
                          {settings.profilePicture ? (
                            <img src={settings.profilePicture} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                          ) : (
                            <span className={`text-2xl font-bold ${themeClasses.text.secondary}`}>
                              {settings.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => alert('Profile picture upload functionality would be implemented here')}
                          className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${themeClasses.text.primary} hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700 border-gray-600' : 'hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          Change Picture
                        </button>
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div className="mb-8">
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} mb-4`}>
                        <UserCheck className={`h-4 w-4 text-gray-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        <h3 className={`text-md font-medium ${themeClasses.text.primary}`}>Basic Information</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t('fullName')}
                          </label>
                          <input
                            type="text"
                            value={settings.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${themeClasses.input} ${isRTL ? 'text-right' : 'text-left'}`}
                            dir={isRTL ? 'rtl' : 'ltr'}
                          />
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t('emailAddress')}
                          </label>
                          <input
                            type="email"
                            value={settings.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${themeClasses.input} ${isRTL ? 'text-right' : 'text-left'}`}
                            dir="ltr"
                          />
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t('role')}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={settings.role}
                              readOnly
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none cursor-not-allowed ${isDark ? 'bg-gray-600 border-gray-500 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'} ${isRTL ? 'text-right' : 'text-left'}`}
                              dir={isRTL ? 'rtl' : 'ltr'}
                            />
                            <Lock className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                          </div>
                          <p className={`text-xs ${themeClasses.text.secondary} mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                            Role is managed by system administrator
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* System Preferences Section */}
                {permissions.canEditSystemPrefs && (
                  <div className={`${themeClasses.card} rounded-lg shadow-sm border p-6`}>
                    <div className={`flex items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Globe className={`h-5 w-5 text-blue-600 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>{t('systemPreferences')}</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {t('theme')}
                        </label>
                        <select
                          value={settings.theme}
                          onChange={(e) => handleInputChange('theme', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${themeClasses.select} ${isRTL ? 'text-right' : 'text-left'}`}
                          dir={isRTL ? 'rtl' : 'ltr'}
                        >
                          <option value="light">{t('light')}</option>
                          <option value="dark">{t('dark')}</option>
                          <option value="auto">{t('auto')}</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {t('language')}
                        </label>
                        <select
                          value={settings.language}
                          onChange={(e) => handleInputChange('language', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${themeClasses.select} ${isRTL ? 'text-right' : 'text-left'}`}
                          dir={isRTL ? 'rtl' : 'ltr'}
                        >
                          <option value="en">{t('english')}</option>
                          <option value="es">{t('spanish')}</option>
                          <option value="fr">{t('french')}</option>
                          <option value="de">{t('german')}</option>
                          <option value="ar">{t('arabic')}</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Notification Settings */}
                    <div className="mt-8">
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} mb-4`}>
                        <Bell className={`h-4 w-4 text-gray-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        <h3 className={`text-md font-medium ${themeClasses.text.primary}`}>Notifications</h3>
                      </div>
                      <div className="space-y-4">
                        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className={`text-sm ${themeClasses.text.primary}`}>Email Notifications</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.emailNotifications}
                              onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className={`text-sm ${themeClasses.text.primary}`}>Push Notifications</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.pushNotifications}
                              onChange={(e) => handleInputChange('pushNotifications', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className={`text-sm ${themeClasses.text.primary}`}>Sound Notifications</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.soundNotifications}
                              onChange={(e) => handleInputChange('soundNotifications', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className={`text-sm ${themeClasses.text.primary}`}>Desktop Notifications</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.desktopNotifications}
                              onChange={(e) => handleInputChange('desktopNotifications', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Application Settings */}
                    <div className="mt-8">
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} mb-4`}>
                        <Clock className={`h-4 w-4 text-gray-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        <h3 className={`text-md font-medium ${themeClasses.text.primary}`}>Application Settings</h3>
                      </div>
                      <div className="space-y-4">
                        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className={`text-sm ${themeClasses.text.primary}`}>Auto Save</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.autoSave}
                              onChange={(e) => handleInputChange('autoSave', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className={`text-sm ${themeClasses.text.primary}`}>Compact View</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.compactView}
                              onChange={(e) => handleInputChange('compactView', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Warehouse Settings Section */}
                {permissions.canEditWarehouse && (
                  <div className={`${themeClasses.card} rounded-lg shadow-sm border p-6`}>
                    <div className={`flex items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Building className={`h-5 w-5 text-blue-600 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>{t('warehouseSettings')}</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {t('defaultLocation')}
                        </label>
                        <select
                          value={settings.defaultLocation}
                          onChange={(e) => handleInputChange('defaultLocation', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${themeClasses.select} ${isRTL ? 'text-right' : 'text-left'}`}
                          dir={isRTL ? 'rtl' : 'ltr'}
                        >
                          {Object.keys(allWarehouses).map(location => (
                            <option key={location} value={location}>{location}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {t('unitOfMeasurement')}
                        </label>
                        <select
                          value={settings.unitOfMeasurement}
                          onChange={(e) => handleInputChange('unitOfMeasurement', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${themeClasses.select} ${isRTL ? 'text-right' : 'text-left'}`}
                          dir={isRTL ? 'rtl' : 'ltr'}
                        >
                          <option value="metric">Metric (kg, cm, L)</option>
                          <option value="imperial">Imperial (lbs, in, gal)</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Warehouse Details */}
                    {currentWarehouseDetails && (
                      <div className="mt-8">
                        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} mb-4`}>
                          <MapPin className={`h-4 w-4 text-gray-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                          <h3 className={`text-md font-medium ${themeClasses.text.primary}`}>{t('warehouseDetails')}</h3>
                        </div>
                        <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className={`text-sm font-medium ${themeClasses.text.label}`}>{t('address')}</p>
                              <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>{currentWarehouseDetails.address}</p>
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${themeClasses.text.label}`}>{t('capacity')}</p>
                              <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>{currentWarehouseDetails.capacity}</p>
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${themeClasses.text.label}`}>{t('manager')}</p>
                              <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>{currentWarehouseDetails.manager}</p>
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${themeClasses.text.label}`}>{t('contact')}</p>
                              <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>{currentWarehouseDetails.contact}</p>
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${themeClasses.text.label}`}>{t('hours')}</p>
                              <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>{currentWarehouseDetails.hours}</p>
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${themeClasses.text.label}`}>{t('utilization')}</p>
                              <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>{currentWarehouseDetails.utilization}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Security Settings Section */}
                {permissions.canEditSecurity && (
                  <div className={`${themeClasses.card} rounded-lg shadow-sm border p-6`}>
                    <div className={`flex items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Shield className={`h-5 w-5 text-blue-600 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>{t('securitySettings')}</h2>
                    </div>
                    
                    {/* Password Change */}
                    <div className="mb-8">
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} mb-4`}>
                        <Lock className={`h-4 w-4 text-gray-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        <h3 className={`text-md font-medium ${themeClasses.text.primary}`}>Change Password</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={settings.currentPassword}
                              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${themeClasses.input} ${isRTL ? 'text-right pr-10' : 'text-left pl-3 pr-10'}`}
                              dir="ltr"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600`}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                            New Password
                          </label>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={settings.newPassword}
                            onChange={(e) => handleInputChange('newPassword', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${themeClasses.input} ${isRTL ? 'text-right' : 'text-left'}`}
                            dir="ltr"
                          />
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                            Confirm New Password
                          </label>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={settings.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${themeClasses.input} ${isRTL ? 'text-right' : 'text-left'}`}
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Two-Factor Authentication */}
                    <div>
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} mb-4`}>
                        <UserCheck className={`h-4 w-4 text-gray-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        <h3 className={`text-md font-medium ${themeClasses.text.primary}`}>Two-Factor Authentication</h3>
                      </div>
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div>
                          <p className={`text-sm ${themeClasses.text.primary}`}>Enable Two-Factor Authentication</p>
                          <p className={`text-xs ${themeClasses.text.secondary} mt-1`}>Add an extra layer of security to your account</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.twoFactorAuth}
                            onChange={(e) => handleInputChange('twoFactorAuth', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Data Management Section */}
                {permissions.canManageData && (
                  <div className={`${themeClasses.card} rounded-lg shadow-sm border p-6`}>
                    <div className={`flex items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Database className={`h-5 w-5 text-blue-600 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>{t('dataManagement')}</h2>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Export Data */}
                      <div>
                        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} mb-3`}>
                          <Download className={`h-4 w-4 text-gray-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                          <h3 className={`text-md font-medium ${themeClasses.text.primary}`}>Export Data</h3>
                        </div>
                        <p className={`text-sm ${themeClasses.text.secondary} mb-4`}>
                          Download your inventory data in various formats
                        </p>
                        <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                          <button
                            onClick={() => {
                              const data = JSON.stringify(settings, null, 2);
                              const blob = new Blob([data], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'inventory-data.json';
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${themeClasses.text.primary} hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700 border-gray-600' : 'hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          >
                            Export as JSON
                          </button>
                          <button
                            onClick={() => alert('CSV export functionality would be implemented here')}
                            className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${themeClasses.text.primary} hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700 border-gray-600' : 'hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          >
                            Export as CSV
                          </button>
                        </div>
                      </div>
                      
                      {/* Create Backup */}
                      <div>
                        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} mb-3`}>
                          <Upload className={`h-4 w-4 text-gray-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                          <h3 className={`text-md font-medium ${themeClasses.text.primary}`}>Create Backup</h3>
                        </div>
                        <p className={`text-sm ${themeClasses.text.secondary} mb-4`}>
                          Create a complete backup of your system data
                        </p>
                        <button
                          onClick={() => {
                            const backupData = {
                              timestamp: new Date().toISOString(),
                              settings: settings,
                              version: '1.0.0'
                            };
                            const data = JSON.stringify(backupData, null, 2);
                            const blob = new Blob([data], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                            alert('Backup created successfully!');
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          Create Backup
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                  <button
                    onClick={handleSave}
                    className={`inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <Save className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </LanguageContext.Provider>
  );
};

export default SettingsPage;
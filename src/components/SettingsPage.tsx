import React, { useState, useEffect, createContext, useRef } from 'react';
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
  FileText,
  X
} from 'lucide-react';

// Language Context
interface LanguageContextType {
  language: string;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  t: (key) => key
});

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
    warehouseDetails: 'Warehouse Details',
    address: 'Address',
    capacity: 'Capacity',
    manager: 'Manager',
    contact: 'Contact',
    hours: 'Operating Hours',
    status: 'Status',
    utilization: 'Utilization'
  }
};

interface SettingsPageProps {
  onLogout: () => void;
  onPageChange: (page: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDark, setTheme } = useTheme();
  const { currentWarehouse, warehouseData, allWarehouses, setCurrentWarehouse } = useWarehouse();
  const [settings, setSettings] = useState(() => {
    // Clear any cached user settings to ensure correct Lebanese user information
    // This prevents old 'John Doe' data from persisting
    localStorage.removeItem('user-settings');
    
    // Always use the correct Lebanese user information
    return {
      // User Profile - Basic Information
      name: 'Zeina Makdisi',
      email: 'zeina.makdisi@cedarmaritime.com',
      role: 'Warehouse Manager', // This will be read-only
      
      // Contact Information
      phone: '+961 1 234-567',
      address: 'Beirut Port Complex, Karantina District',
      city: 'Beirut',
      state: 'Beirut Governorate',
      zipCode: '1107-2020',
      emergencyContactName: 'Ahmad Makdisi',
      emergencyContactPhone: '+961 3 456-789',
      
      // Professional Information
      jobTitle: 'Warehouse Operations Manager',
      department: 'Maritime Operations',
      employeeId: 'CDR-2024-001',
      startDate: '2023-01-15',
      manager: 'Ahmad Khalil',
      
      // Personal Information
      dateOfBirth: '1990-05-15',
      bio: 'Experienced maritime warehouse manager with 8+ years in inventory management and Mediterranean shipping logistics.',
      skills: ['Maritime Logistics', 'Team Leadership', 'Port Operations', 'Quality Control'],
      languages: ['English', 'French', 'Spanish'],
      
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
  
  // Language support
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

  // Update language
  useEffect(() => {
    document.documentElement.lang = settings.language;
  }, [settings.language]);

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

  // Profile picture upload functionality
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset previous errors
    setImageError('');

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setImageError('Please select a valid image file (JPG, PNG, or GIF)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setImageError('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      // Create image element to resize
      const img = new Image();
      img.onload = () => {
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size (200x200 for profile pictures)
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        
        // Calculate crop dimensions (center crop to square)
        const minDimension = Math.min(img.width, img.height);
        const cropX = (img.width - minDimension) / 2;
        const cropY = (img.height - minDimension) / 2;
        
        // Draw and resize image
        ctx?.drawImage(
          img,
          cropX, cropY, minDimension, minDimension,
          0, 0, size, size
        );
        
        // Convert to base64
        const resizedImage = canvas.toDataURL('image/jpeg', 0.8);
        
        setPreviewImage(resizedImage);
        setShowImagePreview(true);
        setUploadingImage(false);
      };
      
      img.onerror = () => {
        setImageError('Failed to process image');
        setUploadingImage(false);
      };
      
      img.src = result;
    };
    
    reader.onerror = () => {
      setImageError('Failed to read image file');
      setUploadingImage(false);
    };
    
    reader.readAsDataURL(file);
  };

  const confirmImageUpload = () => {
    setSettings(prev => ({ ...prev, profilePicture: previewImage }));
    setShowImagePreview(false);
    setPreviewImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cancelImageUpload = () => {
    setShowImagePreview(false);
    setPreviewImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeProfilePicture = () => {
    setSettings(prev => ({ ...prev, profilePicture: null }));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
    <LanguageContext.Provider value={{ language: settings.language, t }}>
      <div className={`flex h-screen ${themeClasses.container}`}>
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
                <h1 className={`text-2xl md:text-3xl font-bold ${themeClasses.text.primary} mb-2`}>
              Settings
            </h1>
            <p className={`${themeClasses.text.secondary}`}>
              Manage your account settings and preferences
            </p>
              </div>

              <div className="space-y-6">
                {/* User Profile Section */}
                {permissions.canEditProfile && (
                  <div className={`${themeClasses.card} rounded-lg shadow-sm border p-6`}>
                    <div className="flex items-center mb-6">
                    <User className="h-5 w-5 text-blue-600 mr-2" />
                    <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>User Profile</h2>
                  </div>
                    
                    {/* Profile Picture Section */}
                    <div className="mb-8">
                      <div className="flex items-center mb-4">
                      <Camera className="h-4 w-4 text-gray-500 mr-2" />
                      <h3 className={`text-md font-medium ${themeClasses.text.primary}`}>Profile Picture</h3>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="relative group">
                          <div className={`w-20 h-20 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'} flex items-center justify-center overflow-hidden`}>
                            {settings.profilePicture ? (
                              <img src={settings.profilePicture} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                            ) : (
                              <span className={`text-2xl font-bold ${themeClasses.text.secondary}`}>
                                {settings.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            )}
                          </div>
                          {uploadingImage && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col space-y-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <button
                            onClick={triggerFileInput}
                            disabled={uploadingImage}
                            className={`flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${themeClasses.text.primary} hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700 border-gray-600' : 'hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            {uploadingImage ? 'Processing...' : 'Change Picture'}
                          </button>
                          {settings.profilePicture && (
                            <button
                              onClick={removeProfilePicture}
                              className={`flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 ${isDark ? 'hover:bg-red-900/20 border-red-600' : 'hover:bg-red-50'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remove Picture
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {imageError && (
                        <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                          {imageError}
                        </div>
                      )}
                    </div>

                    {/* Basic Information */}
                    <div className="mb-8">
                      <div className="flex items-center mb-4">
                      <UserCheck className="h-4 w-4 text-gray-500 mr-2" />
                      <h3 className={`text-md font-medium ${themeClasses.text.primary}`}>Basic Information</h3>
                    </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2`}>
                              Full Name
                            </label>
                            <input
                              type="text"
                              value={settings.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${themeClasses.input}`}
                            />
                          </div>
                        
                        <div>
                          <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2`}>
                            Email Address
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              value={settings.email}
                              readOnly
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none cursor-not-allowed ${isDark ? 'bg-gray-600 border-gray-500 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'}`}
                              dir="ltr"
                            />
                            <Lock className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                          </div>
                          <p className={`text-xs ${themeClasses.text.secondary} mt-1`}>
                            Email address cannot be changed
                          </p>
                        </div>
                        
                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2`}>
                              Role
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={settings.role}
                                readOnly
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none cursor-not-allowed ${isDark ? 'bg-gray-600 border-gray-500 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'}`}
                                dir="ltr"
                              />
                              <Lock className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                            </div>
                            <p className={`text-xs ${themeClasses.text.secondary} mt-1`}>
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
                    <div className="flex items-center mb-6">
                    <Globe className="h-5 w-5 text-blue-600 mr-2" />
                    <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>System Preferences</h2>
                  </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2`}>
                          Theme
                        </label>
                        <select
                          value={settings.theme}
                          onChange={(e) => handleInputChange('theme', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${themeClasses.select}`}
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="auto">Auto</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2`}>
                          Language
                        </label>
                        <select
                          value={settings.language}
                          onChange={(e) => handleInputChange('language', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${themeClasses.select}`}
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Notification Settings */}
                    <div className="mt-8">
                      <div className="flex items-center mb-4">
                        <Bell className="h-4 w-4 text-gray-500 mr-2" />
                        <h3 className={`text-md font-medium ${themeClasses.text.primary}`}>Notifications</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
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
                        
                        <div className="flex items-center justify-between">
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
                        
                        <div className="flex items-center justify-between">
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
                        
                        <div className="flex items-center justify-between">
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
                    

                  </div>
                )}
                
                {/* Warehouse Settings Section */}
                {permissions.canEditWarehouse && (
                  <div className={`${themeClasses.card} rounded-lg shadow-sm border p-6`}>
                    <div className="flex items-center mb-6">
                      <Building className="h-5 w-5 text-blue-600 mr-2" />
                      <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Warehouse Settings</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2`}>
                          Default Location
                        </label>
                        <select
                          value={settings.defaultLocation}
                          onChange={(e) => handleInputChange('defaultLocation', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${themeClasses.select}`}
                        >
                          {Object.keys(allWarehouses).map(location => (
                            <option key={location} value={location}>{location}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2`}>
                          Unit of Measurement
                        </label>
                        <select
                          value={settings.unitOfMeasurement}
                          onChange={(e) => handleInputChange('unitOfMeasurement', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${themeClasses.select}`}
                        >
                          <option value="metric">Metric (kg, cm, L)</option>
                          <option value="imperial">Imperial (lbs, in, gal)</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Warehouse Details */}
                    {currentWarehouseDetails && (
                      <div className="mt-8">
                        <div className="flex items-center mb-4">
                          <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                          <h3 className={`text-md font-medium ${themeClasses.text.primary}`}>Warehouse Details</h3>
                        </div>
                        <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className={`text-sm font-medium ${themeClasses.text.label}`}>Address</p>
                              <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>{currentWarehouseDetails.address}</p>
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${themeClasses.text.label}`}>Capacity</p>
                              <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>{currentWarehouseDetails.capacity}</p>
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${themeClasses.text.label}`}>Manager</p>
                              <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>{currentWarehouseDetails.manager}</p>
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${themeClasses.text.label}`}>Contact</p>
                              <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>{currentWarehouseDetails.contact}</p>
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${themeClasses.text.label}`}>Operating Hours</p>
                              <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>{currentWarehouseDetails.hours}</p>
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${themeClasses.text.label}`}>Utilization</p>
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
                    <div className="flex items-center mb-6">
                      <Shield className="h-5 w-5 text-blue-600 mr-2" />
                      <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Security Settings</h2>
                    </div>
                    
                    {/* Password Change */}
                    <div className="mb-8">
                      <div className="flex items-center mb-4">
                        <Lock className="h-4 w-4 text-gray-500 mr-2" />
                        <h3 className={`text-md font-medium ${themeClasses.text.primary}`}>Change Password</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2`}>
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={settings.currentPassword}
                              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${themeClasses.input} pl-3 pr-10`}
                              dir="ltr"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2`}>
                            New Password
                          </label>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={settings.newPassword}
                            onChange={(e) => handleInputChange('newPassword', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${themeClasses.input}`}
                            dir="ltr"
                          />
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium ${themeClasses.text.label} mb-2`}>
                            Confirm New Password
                          </label>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={settings.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${themeClasses.input}`}
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Two-Factor Authentication */}
                    <div>
                      <div className="flex items-center mb-4">
                        <UserCheck className="h-4 w-4 text-gray-500 mr-2" />
                        <h3 className={`text-md font-medium ${themeClasses.text.primary}`}>Two-Factor Authentication</h3>
                      </div>
                      <div className="flex items-center justify-between">
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
                    <div className="flex items-center mb-6">
                      <Database className="h-5 w-5 text-blue-600 mr-2" />
                      <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Data Management</h2>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Export Data */}
                      <div>
                        <div className="flex items-center mb-3">
                          <Download className="h-4 w-4 text-gray-500 mr-2" />
                          <h3 className={`text-md font-medium ${themeClasses.text.primary}`}>Export Data</h3>
                        </div>
                        <p className={`text-sm ${themeClasses.text.secondary} mb-4`}>
                          Download your inventory data in various formats
                        </p>
                        <div className="flex space-x-3">
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
                        <div className="flex items-center mb-3">
                          <Upload className="h-4 w-4 text-gray-500 mr-2" />
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
                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      
      {/* Image Preview Modal */}
      {showImagePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${themeClasses.card} rounded-lg p-6 max-w-md w-full mx-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Preview Profile Picture</h3>
              <button
                onClick={cancelImageUpload}
                className={`${themeClasses.text.secondary} hover:${themeClasses.text.primary}`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden">
                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelImageUpload}
                className={`flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${themeClasses.text.primary} hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700 border-gray-600' : 'hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-gray-500`}
              >
                Cancel
              </button>
              <button
                onClick={confirmImageUpload}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Picture
              </button>
            </div>
          </div>
        </div>
      )}
    </LanguageContext.Provider>
  );
};

export default SettingsPage;
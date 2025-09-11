import React, { useState, useCallback } from 'react';
import { useEnhancedTheme } from '../contexts/ThemeContext';
import { ThemeVariant, themeColors } from '../themes/themeConfig';
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Briefcase,
  Zap,
  Flame,
  Minimize2,
  Settings,
  RotateCcw,
  Check,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  isOpen,
  onClose,
  className = ''
}) => {
  const {
    currentTheme,
    setTheme,
    customColors,
    setCustomColors,
    resetCustomColors,
    getThemeClasses,
    applyThemeTransition
  } = useEnhancedTheme();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'themes' | 'colors'>('themes');
  const [tempCustomColors, setTempCustomColors] = useState(customColors || {});
  
  const themeClasses = getThemeClasses();
  
  // Theme variant configurations
  const themeVariants: Array<{
    variant: ThemeVariant;
    name: string;
    description: string;
    icon: React.ReactNode;
    preview: string;
  }> = [
    {
      variant: 'light',
      name: 'Light',
      description: 'Clean and bright interface',
      icon: <Sun className="h-4 w-4" />,
      preview: 'bg-white border-gray-200'
    },
    {
      variant: 'dark',
      name: 'Dark',
      description: 'Easy on the eyes',
      icon: <Moon className="h-4 w-4" />,
      preview: 'bg-gray-900 border-gray-700'
    },
    {
      variant: 'corporate',
      name: 'Corporate',
      description: 'Professional and sophisticated',
      icon: <Briefcase className="h-4 w-4" />,
      preview: 'bg-slate-50 border-slate-300'
    },
    {
      variant: 'modern',
      name: 'Modern',
      description: 'Contemporary and stylish',
      icon: <Zap className="h-4 w-4" />,
      preview: 'bg-purple-50 border-purple-200'
    },
    {
      variant: 'vibrant',
      name: 'Vibrant',
      description: 'Energetic and bold',
      icon: <Flame className="h-4 w-4" />,
      preview: 'bg-orange-50 border-orange-200'
    },
    {
      variant: 'minimal',
      name: 'Minimal',
      description: 'Simple and focused',
      icon: <Minimize2 className="h-4 w-4" />,
      preview: 'bg-gray-50 border-gray-200'
    }
  ];
  
  // Handle theme selection
  const handleThemeSelect = useCallback((variant: ThemeVariant) => {
    applyThemeTransition(400);
    setTheme(variant);
  }, [setTheme, applyThemeTransition]);
  
  // Handle custom color changes
  const handleColorChange = useCallback((category: string, key: string, value: string) => {
    setTempCustomColors(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  }, []);
  
  // Apply custom colors
  const applyCustomColors = useCallback(() => {
    setCustomColors(tempCustomColors);
  }, [tempCustomColors, setCustomColors]);
  
  // Reset custom colors
  const handleResetColors = useCallback(() => {
    setTempCustomColors({});
    resetCustomColors();
  }, [resetCustomColors]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 ${themeClasses.background.overlay} transition-opacity duration-300`}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`absolute right-0 top-0 h-full w-96 ${themeClasses.background.elevated} border-l ${themeClasses.border.primary} shadow-2xl transform transition-transform duration-300 ${className}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border.primary}`}>
          <div className="flex items-center space-x-3">
            <Palette className={`h-5 w-5 ${themeClasses.text.primary}`} />
            <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>
              Theme Customizer
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${themeClasses.button.ghost} transition-colors`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className={`flex border-b ${themeClasses.border.primary}`}>
          <button
            onClick={() => setActiveTab('themes')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'themes'
                ? `${themeClasses.text.primary} border-b-2 border-current`
                : `${themeClasses.text.secondary} hover:${themeClasses.text.primary}`
            }`}
          >
            Themes
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'colors'
                ? `${themeClasses.text.primary} border-b-2 border-current`
                : `${themeClasses.text.secondary} hover:${themeClasses.text.primary}`
            }`}
          >
            Colors
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'themes' && (
            <div className="space-y-4">
              <div>
                <h3 className={`text-sm font-medium ${themeClasses.text.primary} mb-3`}>
                  Choose Theme Variant
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {themeVariants.map((theme) => (
                    <button
                      key={theme.variant}
                      onClick={() => handleThemeSelect(theme.variant)}
                      className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        currentTheme === theme.variant
                          ? `${themeClasses.border.focus} ${themeClasses.background.secondary}`
                          : `${themeClasses.border.primary} ${themeClasses.background.primary} hover:${themeClasses.border.secondary}`
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-md ${theme.preview}`}>
                          {theme.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-medium ${themeClasses.text.primary}`}>
                              {theme.name}
                            </h4>
                            {currentTheme === theme.variant && (
                              <Check className={`h-4 w-4 ${themeClasses.text.primary}`} />
                            )}
                          </div>
                          <p className={`text-xs ${themeClasses.text.secondary} mt-1`}>
                            {theme.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Theme Preview */}
              <div>
                <h3 className={`text-sm font-medium ${themeClasses.text.primary} mb-3`}>
                  Preview
                </h3>
                <div className={`p-4 rounded-lg border ${themeClasses.border.primary} ${themeClasses.background.secondary}`}>
                  <div className="space-y-3">
                    <div className={`h-3 ${themeClasses.background.primary} rounded`} />
                    <div className={`h-2 ${themeClasses.background.primary} rounded w-3/4`} />
                    <div className={`h-2 ${themeClasses.background.primary} rounded w-1/2`} />
                    <div className="flex space-x-2">
                      <div className={`h-6 w-16 ${themeClasses.button.primary} rounded text-xs flex items-center justify-center text-white`}>
                        Button
                      </div>
                      <div className={`h-6 w-16 ${themeClasses.button.secondary} rounded text-xs flex items-center justify-center border`}>
                        Button
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'colors' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-medium ${themeClasses.text.primary}`}>
                  Custom Colors
                </h3>
                <button
                  onClick={handleResetColors}
                  className={`text-xs ${themeClasses.button.ghost} px-2 py-1 rounded flex items-center space-x-1`}
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              </div>
              
              {/* Color Categories */}
              <div className="space-y-4">
                {/* Primary Colors */}
                <div>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`flex items-center justify-between w-full text-left p-3 rounded-lg ${themeClasses.background.secondary} hover:${themeClasses.background.tertiary} transition-colors`}
                  >
                    <span className={`text-sm font-medium ${themeClasses.text.primary}`}>
                      Primary Colors
                    </span>
                    {isExpanded ? (
                      <ChevronUp className={`h-4 w-4 ${themeClasses.text.secondary}`} />
                    ) : (
                      <ChevronDown className={`h-4 w-4 ${themeClasses.text.secondary}`} />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-3 space-y-3 pl-3">
                      {Object.entries(themeColors[currentTheme]?.primary || {}).slice(0, 5).map(([shade, color]) => (
                        <div key={shade} className="flex items-center space-x-3">
                          <label className={`text-xs ${themeClasses.text.secondary} w-12`}>
                            {shade}
                          </label>
                          <input
                            type="color"
                            value={tempCustomColors.primary?.[shade as keyof typeof tempCustomColors.primary] || color}
                            onChange={(e) => handleColorChange('primary', shade, e.target.value)}
                            className="w-8 h-8 rounded border-0 cursor-pointer"
                          />
                          <span className={`text-xs font-mono ${themeClasses.text.tertiary}`}>
                            {tempCustomColors.primary?.[shade as keyof typeof tempCustomColors.primary] || color}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Apply Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={applyCustomColors}
                  className={`w-full ${themeClasses.button.primary} px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                >
                  Apply Custom Colors
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
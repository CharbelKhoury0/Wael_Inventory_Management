import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  ThemeVariant, 
  ThemeConfig, 
  getThemeConfig, 
  generateCSSVariables,
  themeColors,
  defaultThemes
} from '../themes/themeConfig';

// Enhanced Theme Context Interface
interface EnhancedThemeContextType {
  // Current theme state
  currentTheme: ThemeVariant;
  themeConfig: ThemeConfig;
  isDark: boolean;
  
  // Theme management
  setTheme: (theme: ThemeVariant) => void;
  toggleTheme: () => void;
  
  // Theme customization
  customColors: Partial<typeof themeColors.light> | null;
  setCustomColors: (colors: Partial<typeof themeColors.light>) => void;
  resetCustomColors: () => void;
  
  // Theme persistence
  saveThemePreferences: () => void;
  loadThemePreferences: () => void;
  
  // Theme utilities
  getThemeClasses: () => ThemeClasses;
  applyThemeTransition: (duration?: number) => void;
}

// Theme Classes Interface
export interface ThemeClasses {
  // Container classes
  container: {
    primary: string;
    secondary: string;
    elevated: string;
  };
  
  // Text classes
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    disabled: string;
  };
  
  // Background classes
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    overlay: string;
  };
  
  // Border classes
  border: {
    primary: string;
    secondary: string;
    focus: string;
    error: string;
    success: string;
  };
  
  // Button classes
  button: {
    primary: string;
    secondary: string;
    ghost: string;
    danger: string;
    success: string;
  };
  
  // Input classes
  input: {
    base: string;
    focus: string;
    error: string;
    disabled: string;
  };
  
  // Card classes
  card: {
    base: string;
    elevated: string;
    interactive: string;
  };
  
  // Status classes
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

// Create the enhanced theme context
const EnhancedThemeContext = createContext<EnhancedThemeContextType | undefined>(undefined);

// Theme preferences interface
interface ThemePreferences {
  variant: ThemeVariant;
  customColors?: Partial<typeof themeColors.light>;
  autoMode?: boolean;
}

// Enhanced Theme Provider Props
interface EnhancedThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeVariant;
  enableTransitions?: boolean;
}

// Enhanced Theme Provider Component
export const EnhancedThemeProvider: React.FC<EnhancedThemeProviderProps> = ({
  children,
  defaultTheme = 'light',
  enableTransitions = true
}) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeVariant>(defaultTheme);
  const [customColors, setCustomColorsState] = useState<Partial<typeof themeColors.light> | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Get current theme configuration
  const themeConfig = getThemeConfig(currentTheme, customColors || undefined);
  const isDark = ['dark', 'corporate'].includes(currentTheme);
  
  // Load theme preferences on mount
  useEffect(() => {
    loadThemePreferences();
  }, []);
  
  // Apply theme changes to DOM
  useEffect(() => {
    applyThemeToDOM();
  }, [currentTheme, customColors]);
  
  // Apply theme to DOM
  const applyThemeToDOM = () => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-corporate', 'theme-modern', 'theme-vibrant', 'theme-minimal');
    
    // Add current theme class
    root.classList.add(`theme-${currentTheme}`);
    
    // Apply dark mode class for compatibility
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Generate and apply CSS variables
    const cssVariables = generateCSSVariables(themeConfig);
    
    // Remove existing theme style element
    const existingStyle = document.getElementById('theme-variables');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Create new theme style element
    const styleElement = document.createElement('style');
    styleElement.id = 'theme-variables';
    styleElement.textContent = cssVariables;
    document.head.appendChild(styleElement);
  };
  
  // Set theme with transition
  const setTheme = (theme: ThemeVariant) => {
    if (enableTransitions) {
      applyThemeTransition();
    }
    setCurrentTheme(theme);
    saveThemePreferences();
  };
  
  // Toggle between light and dark themes
  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  };
  
  // Set custom colors
  const setCustomColors = (colors: Partial<typeof themeColors.light>) => {
    setCustomColorsState(colors);
    saveThemePreferences();
  };
  
  // Reset custom colors
  const resetCustomColors = () => {
    setCustomColorsState(null);
    saveThemePreferences();
  };
  
  // Save theme preferences to localStorage
  const saveThemePreferences = () => {
    const preferences: ThemePreferences = {
      variant: currentTheme,
      customColors: customColors || undefined
    };
    localStorage.setItem('enhanced-theme-preferences', JSON.stringify(preferences));
  };
  
  // Load theme preferences from localStorage
  const loadThemePreferences = () => {
    try {
      const saved = localStorage.getItem('enhanced-theme-preferences');
      if (saved) {
        const preferences: ThemePreferences = JSON.parse(saved);
        setCurrentTheme(preferences.variant);
        if (preferences.customColors) {
          setCustomColorsState(preferences.customColors);
        }
      }
    } catch (error) {
      console.warn('Failed to load theme preferences:', error);
    }
  };
  
  // Apply theme transition effect
  const applyThemeTransition = (duration = 300) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Add transition class to body
    document.body.style.transition = `background-color ${duration}ms ease, color ${duration}ms ease`;
    
    // Remove transition after duration
    setTimeout(() => {
      document.body.style.transition = '';
      setIsTransitioning(false);
    }, duration);
  };
  
  // Generate theme classes
  const getThemeClasses = (): ThemeClasses => {
    const { colors } = themeConfig;
    
    return {
      container: {
        primary: `bg-[${colors.background.primary}] text-[${colors.text.primary}]`,
        secondary: `bg-[${colors.background.secondary}] text-[${colors.text.secondary}]`,
        elevated: `bg-[${colors.background.elevated}] text-[${colors.text.primary}] shadow-lg`
      },
      
      text: {
        primary: `text-[${colors.text.primary}]`,
        secondary: `text-[${colors.text.secondary}]`,
        tertiary: `text-[${colors.text.tertiary}]`,
        inverse: `text-[${colors.text.inverse}]`,
        disabled: `text-[${colors.text.disabled}]`
      },
      
      background: {
        primary: `bg-[${colors.background.primary}]`,
        secondary: `bg-[${colors.background.secondary}]`,
        tertiary: `bg-[${colors.background.tertiary}]`,
        elevated: `bg-[${colors.background.elevated}]`,
        overlay: `bg-[${colors.background.overlay}]`
      },
      
      border: {
        primary: `border-[${colors.border.primary}]`,
        secondary: `border-[${colors.border.secondary}]`,
        focus: `border-[${colors.border.focus}] ring-2 ring-[${colors.border.focus}] ring-opacity-20`,
        error: `border-[${colors.border.error}]`,
        success: `border-[${colors.border.success}]`
      },
      
      button: {
        primary: `bg-[${colors.primary[600]}] hover:bg-[${colors.primary[700]}] text-white border-transparent`,
        secondary: `bg-[${colors.background.secondary}] hover:bg-[${colors.background.tertiary}] text-[${colors.text.primary}] border-[${colors.border.primary}]`,
        ghost: `bg-transparent hover:bg-[${colors.background.secondary}] text-[${colors.text.primary}] border-transparent`,
        danger: `bg-[${colors.status.error}] hover:bg-red-700 text-white border-transparent`,
        success: `bg-[${colors.status.success}] hover:bg-green-700 text-white border-transparent`
      },
      
      input: {
        base: `bg-[${colors.background.primary}] border-[${colors.border.primary}] text-[${colors.text.primary}] placeholder-[${colors.text.tertiary}]`,
        focus: `border-[${colors.border.focus}] ring-2 ring-[${colors.border.focus}] ring-opacity-20`,
        error: `border-[${colors.border.error}] ring-2 ring-red-500 ring-opacity-20`,
        disabled: `bg-[${colors.background.secondary}] text-[${colors.text.disabled}] cursor-not-allowed`
      },
      
      card: {
        base: `bg-[${colors.background.elevated}] border-[${colors.border.primary}] rounded-lg`,
        elevated: `bg-[${colors.background.elevated}] border-[${colors.border.primary}] rounded-lg shadow-lg`,
        interactive: `bg-[${colors.background.elevated}] border-[${colors.border.primary}] rounded-lg hover:shadow-md transition-shadow cursor-pointer`
      },
      
      status: {
        success: `text-[${colors.status.success}] bg-green-50 border-green-200`,
        warning: `text-[${colors.status.warning}] bg-yellow-50 border-yellow-200`,
        error: `text-[${colors.status.error}] bg-red-50 border-red-200`,
        info: `text-[${colors.status.info}] bg-blue-50 border-blue-200`
      }
    };
  };
  
  const contextValue: EnhancedThemeContextType = {
    currentTheme,
    themeConfig,
    isDark,
    setTheme,
    toggleTheme,
    customColors,
    setCustomColors,
    resetCustomColors,
    saveThemePreferences,
    loadThemePreferences,
    getThemeClasses,
    applyThemeTransition
  };
  
  return (
    <EnhancedThemeContext.Provider value={contextValue}>
      {children}
    </EnhancedThemeContext.Provider>
  );
};

// Custom hook to use the enhanced theme context
export const useEnhancedTheme = (): EnhancedThemeContextType => {
  const context = useContext(EnhancedThemeContext);
  if (!context) {
    throw new Error('useEnhancedTheme must be used within an EnhancedThemeProvider');
  }
  return context;
};

// Backward compatibility hook
export const useTheme = () => {
  const enhancedTheme = useEnhancedTheme();
  return {
    isDark: enhancedTheme.isDark,
    toggleTheme: enhancedTheme.toggleTheme,
    getThemeClasses: enhancedTheme.getThemeClasses,
    setTheme: (theme: 'light' | 'dark' | 'auto') => {
      if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        enhancedTheme.setTheme(prefersDark ? 'dark' : 'light');
      } else {
        enhancedTheme.setTheme(theme as ThemeVariant);
      }
    }
  };
};

export default EnhancedThemeProvider;
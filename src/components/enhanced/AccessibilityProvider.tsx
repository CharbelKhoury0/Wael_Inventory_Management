import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useEnhancedTheme } from '../../contexts/ThemeContext';

// Accessibility preferences interface
interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
}

// Accessibility context interface
interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  updatePreference: (key: keyof AccessibilityPreferences, value: boolean) => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  focusElement: (selector: string) => void;
  skipToContent: () => void;
}

// Create accessibility context
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Accessibility provider props
interface AccessibilityProviderProps {
  children: ReactNode;
}

// Accessibility Provider Component
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem('accessibility-preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to defaults
      }
    }
    
    // Detect system preferences
    return {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      largeText: false,
      screenReader: false,
      keyboardNavigation: false,
      focusVisible: true
    };
  });
  
  // Update preference
  const updatePreference = (key: keyof AccessibilityPreferences, value: boolean) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('accessibility-preferences', JSON.stringify(updated));
      return updated;
    });
  };
  
  // Announce to screen reader
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };
  
  // Focus element by selector
  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  };
  
  // Skip to main content
  const skipToContent = () => {
    const mainContent = document.querySelector('main, [role="main"], #main-content') as HTMLElement;
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Apply accessibility preferences to DOM
  useEffect(() => {
    const root = document.documentElement;
    
    // Reduced motion
    if (preferences.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // High contrast
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Large text
    if (preferences.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    // Focus visible
    if (preferences.focusVisible) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }
  }, [preferences]);
  
  // Keyboard navigation detection
  useEffect(() => {
    let isUsingKeyboard = false;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        isUsingKeyboard = true;
        updatePreference('keyboardNavigation', true);
        document.body.classList.add('using-keyboard');
      }
    };
    
    const handleMouseDown = () => {
      if (isUsingKeyboard) {
        isUsingKeyboard = false;
        updatePreference('keyboardNavigation', false);
        document.body.classList.remove('using-keyboard');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
  
  const contextValue: AccessibilityContextType = {
    preferences,
    updatePreference,
    announceToScreenReader,
    focusElement,
    skipToContent
  };
  
  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Hook to use accessibility context
export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Skip to content link component
export const SkipToContent: React.FC = () => {
  const { skipToContent } = useAccessibility();
  const { getThemeClasses } = useEnhancedTheme();
  const themeClasses = getThemeClasses();
  
  return (
    <button
      onClick={skipToContent}
      className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 ${themeClasses.button.primary} rounded-lg text-sm font-medium`}
    >
      Skip to main content
    </button>
  );
};

// Accessible button component
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = 'Loading',
  disabled,
  onClick,
  ...props
}) => {
  const { announceToScreenReader } = useAccessibility();
  const { getThemeClasses } = useEnhancedTheme();
  const themeClasses = getThemeClasses();
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    
    // Announce action to screen reader
    announceToScreenReader(`Button ${children} activated`);
    
    if (onClick) {
      onClick(e);
    }
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const variantClasses = {
    primary: themeClasses.button.primary,
    secondary: themeClasses.button.secondary,
    ghost: themeClasses.button.ghost
  };
  
  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      aria-label={loading ? loadingText : undefined}
      className={`
        ${sizeClasses[size]} 
        ${variantClasses[variant]} 
        rounded-lg font-medium transition-all duration-200 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${props.className || ''}
      `}
    >
      {loading ? loadingText : children}
    </button>
  );
};

// Accessible input component
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  error,
  helpText,
  required,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;
  
  const { getThemeClasses } = useEnhancedTheme();
  const themeClasses = getThemeClasses();
  
  return (
    <div className="space-y-1">
      <label 
        htmlFor={inputId}
        className={`block text-sm font-medium ${themeClasses.text.primary}`}
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      <input
        {...props}
        id={inputId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={[
          error ? errorId : '',
          helpText ? helpId : ''
        ].filter(Boolean).join(' ') || undefined}
        className={`
          w-full px-3 py-2 border rounded-lg transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${error 
            ? 'border-red-500 bg-red-50' 
            : `${themeClasses.input.base} ${themeClasses.input.focus}`
          }
          ${props.className || ''}
        `}
      />
      
      {helpText && (
        <p id={helpId} className={`text-sm ${themeClasses.text.secondary}`}>
          {helpText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible modal component
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  const { announceToScreenReader, focusElement } = useAccessibility();
  const { getThemeClasses } = useEnhancedTheme();
  const themeClasses = getThemeClasses();
  
  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Announce modal opening
      announceToScreenReader(`Modal ${title} opened`, 'assertive');
      
      // Focus the modal
      setTimeout(() => {
        focusElement('[role="dialog"]');
      }, 100);
      
      // Trap focus within modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
        
        if (e.key === 'Tab') {
          const modal = document.querySelector('[role="dialog"]');
          if (!modal) return;
          
          const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        announceToScreenReader(`Modal ${title} closed`);
      };
    }
  }, [isOpen, title, onClose, announceToScreenReader, focusElement]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 ${themeClasses.background.overlay} transition-opacity`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          tabIndex={-1}
          className={`
            relative w-full max-w-md transform overflow-hidden rounded-lg 
            ${themeClasses.background.elevated} border ${themeClasses.border.primary} 
            shadow-xl transition-all ${className}
          `}
        >
          {/* Header */}
          <div className={`px-6 py-4 border-b ${themeClasses.border.primary}`}>
            <h2 id="modal-title" className={`text-lg font-semibold ${themeClasses.text.primary}`}>
              {title}
            </h2>
          </div>
          
          {/* Content */}
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Accessibility settings panel
export const AccessibilitySettings: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { preferences, updatePreference } = useAccessibility();
  const { getThemeClasses } = useEnhancedTheme();
  const themeClasses = getThemeClasses();
  
  const settings = [
    {
      key: 'reducedMotion' as const,
      label: 'Reduce Motion',
      description: 'Minimize animations and transitions'
    },
    {
      key: 'highContrast' as const,
      label: 'High Contrast',
      description: 'Increase color contrast for better visibility'
    },
    {
      key: 'largeText' as const,
      label: 'Large Text',
      description: 'Increase text size throughout the application'
    },
    {
      key: 'focusVisible' as const,
      label: 'Focus Indicators',
      description: 'Show focus outlines for keyboard navigation'
    }
  ];
  
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>
        Accessibility Settings
      </h3>
      
      <div className="space-y-3">
        {settings.map(setting => (
          <div key={setting.key} className="flex items-start space-x-3">
            <input
              type="checkbox"
              id={setting.key}
              checked={preferences[setting.key]}
              onChange={(e) => updatePreference(setting.key, e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <label 
                htmlFor={setting.key}
                className={`text-sm font-medium ${themeClasses.text.primary} cursor-pointer`}
              >
                {setting.label}
              </label>
              <p className={`text-sm ${themeClasses.text.secondary}`}>
                {setting.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccessibilityProvider;
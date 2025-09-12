import React, { useState, useRef, useEffect } from 'react';
import { useEnhancedTheme } from '../contexts/ThemeContext';
import TouchGestureHandler, { hapticFeedback } from './TouchGestureHandler';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Calendar,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Mobile-optimized Modal Component
interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCloseButton?: boolean;
}

export const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true
}) => {
  const { isDark, getThemeClasses } = useEnhancedTheme();
  const themeClasses = getThemeClasses();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    hapticFeedback(50);
    onClose();
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'w-full h-full rounded-none'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`
          absolute inset-0 transition-all duration-300 ease-out
          ${isAnimating ? 'bg-black/50 opacity-100' : 'bg-black/0 opacity-0'}
        `}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <TouchGestureHandler
        onSwipe={(direction) => {
          if (direction === 'down') {
            handleClose();
          }
        }}
        className={`
          relative w-full mx-4 mb-4 sm:mb-0 rounded-t-2xl sm:rounded-2xl
          transition-all duration-300 ease-out transform
          ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
          ${sizeClasses[size]}
          ${isAnimating ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 scale-95'}
          shadow-2xl backdrop-blur-md
        `}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold animate-fade-in">{title}</h2>
          {showCloseButton && (
            <button
              onClick={handleClose}
              className={`
                p-2 rounded-lg transition-all duration-200 ease-out
                hover:bg-gray-100 dark:hover:bg-gray-700
                active:scale-95 transform touch-target
              `}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </TouchGestureHandler>
    </div>
  );
};

// Mobile-optimized Input Component
interface MobileInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  error?: string;
  icon?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}

export const MobileInput: React.FC<MobileInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  icon,
  required = false,
  disabled = false
}) => {
  const { isDark, getThemeClasses } = useEnhancedTheme();
  const themeClasses = getThemeClasses();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    setIsFocused(true);
    hapticFeedback(20);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="w-full">
      {label && (
        <label className={`
          block text-sm font-medium mb-2
          ${isDark ? 'text-gray-200' : 'text-gray-700'}
          ${required ? 'after:content-["*"] after:text-red-500 after:ml-1' : ''}
        `}>
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-4 py-3 rounded-lg border transition-all duration-300 ease-out
            ${icon ? 'pl-10' : 'pl-4'}
            ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}
            ${error ? 'border-red-500 ring-2 ring-red-500' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isDark 
              ? 'bg-gray-700 text-white placeholder-gray-400' 
              : 'bg-white text-gray-900 placeholder-gray-500'
            }
            text-base touch-target
            focus:outline-none focus:scale-[1.02] transform
          `}
        />
      </div>
      
      {error && (
        <div className="flex items-center mt-2 text-red-500 text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

// Mobile-optimized Button Component
interface MobileButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon
}) => {
  const { isDark, getThemeClasses } = useEnhancedTheme();
  const themeClasses = getThemeClasses();

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      hapticFeedback(50);
      onClick();
    }
  };

  const variantClasses = {
    primary: `
      bg-blue-600 hover:bg-blue-700 text-white
      shadow-lg hover:shadow-xl
    `,
    secondary: `
      ${isDark 
        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
      }
      shadow-md hover:shadow-lg
    `,
    danger: `
      bg-red-600 hover:bg-red-700 text-white
      shadow-lg hover:shadow-xl
    `,
    ghost: `
      ${isDark 
        ? 'text-gray-300 hover:bg-gray-700' 
        : 'text-gray-700 hover:bg-gray-100'
      }
      border border-gray-300 dark:border-gray-600
    `
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        flex items-center justify-center rounded-lg font-medium
        transition-all duration-300 ease-out transform
        hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed
        disabled:hover:scale-100 disabled:active:scale-100
        touch-target btn-enhanced
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${loading ? 'cursor-wait' : ''}
      `}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

// Mobile-optimized Select Component
interface MobileSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export const MobileSelect: React.FC<MobileSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  error,
  disabled = false
}) => {
  const { isDark } = useEnhancedTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    hapticFeedback(50);
  };

  return (
    <div className="w-full">
      {label && (
        <label className={`
          block text-sm font-medium mb-2
          ${isDark ? 'text-gray-200' : 'text-gray-700'}
        `}>
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          onClick={() => {
            if (!disabled) {
              setIsOpen(true);
              hapticFeedback(30);
            }
          }}
          disabled={disabled}
          className={`
            w-full px-4 py-3 rounded-lg border text-left
            transition-all duration-300 ease-out transform
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}
            ${isDark 
              ? 'bg-gray-700 text-white' 
              : 'bg-white text-gray-900'
            }
            text-base touch-target focus:outline-none
          `}
        >
          <div className="flex items-center justify-between">
            <span className={selectedOption ? '' : 'text-gray-500'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown className={`
              w-5 h-5 transition-transform duration-300
              ${isOpen ? 'rotate-180' : 'rotate-0'}
            `} />
          </div>
        </button>
      </div>

      {error && (
        <div className="flex items-center mt-2 text-red-500 text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </div>
      )}

      {/* Options Modal */}
      <MobileModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={label || 'Select Option'}
        size="md"
      >
        {/* Search */}
        <div className="mb-4">
          <MobileInput
            placeholder="Search options..."
            value={searchTerm}
            onChange={setSearchTerm}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Options List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filteredOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`
                w-full p-3 rounded-lg text-left transition-all duration-200
                flex items-center justify-between touch-target
                ${value === option.value
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              <span>{option.label}</span>
              {value === option.value && (
                <Check className="w-5 h-5" />
              )}
            </button>
          ))}
          
          {filteredOptions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No options found
            </div>
          )}
        </div>
      </MobileModal>
    </div>
  );
};

// Mobile-optimized Date Picker
interface MobileDatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
}

export const MobileDatePicker: React.FC<MobileDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  disabled = false,
  minDate,
  maxDate
}) => {
  const { isDark } = useEnhancedTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleDateChange = (date: string) => {
    onChange(date);
    setIsOpen(false);
    hapticFeedback(50);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full">
      {label && (
        <label className={`
          block text-sm font-medium mb-2
          ${isDark ? 'text-gray-200' : 'text-gray-700'}
        `}>
          {label}
        </label>
      )}
      
      <button
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            hapticFeedback(30);
          }
        }}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-lg border text-left
          transition-all duration-300 ease-out transform
          ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}
          ${isDark 
            ? 'bg-gray-700 text-white' 
            : 'bg-white text-gray-900'
          }
          text-base touch-target focus:outline-none
        `}
      >
        <div className="flex items-center justify-between">
          <span className={value ? '' : 'text-gray-500'}>
            {value ? formatDate(value) : placeholder}
          </span>
          <Calendar className="w-5 h-5" />
        </div>
      </button>

      {error && (
        <div className="flex items-center mt-2 text-red-500 text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </div>
      )}

      {/* Date Picker Modal */}
      <MobileModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={label || 'Select Date'}
        size="md"
      >
        <input
          type="date"
          value={value}
          onChange={(e) => handleDateChange(e.target.value)}
          min={minDate}
          max={maxDate}
          className={`
            w-full px-4 py-3 rounded-lg border
            ${isDark 
              ? 'bg-gray-700 text-white border-gray-600' 
              : 'bg-white text-gray-900 border-gray-300'
            }
            text-base touch-target focus:outline-none
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          `}
        />
      </MobileModal>
    </div>
  );
};

export default {
  MobileModal,
  MobileInput,
  MobileButton,
  MobileSelect,
  MobileDatePicker
};
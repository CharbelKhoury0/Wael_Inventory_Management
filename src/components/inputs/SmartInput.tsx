import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, ChevronDown, Calendar, Upload, Eye, EyeOff } from 'lucide-react';

interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
  category?: string;
  icon?: React.ReactNode;
}

interface SmartInputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  
  // Autocomplete features
  autocomplete?: AutocompleteOption[];
  onAutocompleteSearch?: (query: string) => Promise<AutocompleteOption[]>;
  autocompleteMinLength?: number;
  autocompleteDelay?: number;
  
  // Number formatting
  numberFormat?: {
    decimals?: number;
    thousandsSeparator?: string;
    decimalSeparator?: string;
    prefix?: string;
    suffix?: string;
    min?: number;
    max?: number;
  };
  
  // Validation
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    custom?: (value: string) => string | null;
  };
  
  // UI enhancements
  showClearButton?: boolean;
  showPasswordToggle?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helpText?: string;
  
  // Events
  onFocus?: () => void;
  onBlur?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
}

const SmartInput: React.FC<SmartInputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  error,
  disabled = false,
  required = false,
  className = '',
  autocomplete = [],
  onAutocompleteSearch,
  autocompleteMinLength = 2,
  autocompleteDelay = 300,
  numberFormat,
  validation,
  showClearButton = true,
  showPasswordToggle = true,
  leftIcon,
  rightIcon,
  helpText,
  onFocus,
  onBlur,
  onEnter,
  onEscape
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [autocompleteOptions, setAutocompleteOptions] = useState<AutocompleteOption[]>(autocomplete);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Format number value
  const formatNumber = useCallback((val: string): string => {
    if (!numberFormat || type !== 'number') return val;
    
    const {
      decimals = 2,
      thousandsSeparator = ',',
      decimalSeparator = '.',
      prefix = '',
      suffix = ''
    } = numberFormat;
    
    // Remove existing formatting
    let numStr = val.replace(/[^\d.-]/g, '');
    
    if (numStr === '' || numStr === '-') return numStr;
    
    const num = parseFloat(numStr);
    if (isNaN(num)) return val;
    
    // Apply min/max constraints
    let constrainedNum = num;
    if (numberFormat.min !== undefined) {
      constrainedNum = Math.max(constrainedNum, numberFormat.min);
    }
    if (numberFormat.max !== undefined) {
      constrainedNum = Math.min(constrainedNum, numberFormat.max);
    }
    
    // Format the number
    const parts = constrainedNum.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    
    let formatted = parts.join(decimalSeparator);
    
    return `${prefix}${formatted}${suffix}`;
  }, [numberFormat, type]);
  
  // Validate input
  const validateInput = useCallback((val: string): string | null => {
    if (!validation) return null;
    
    const { pattern, minLength, maxLength, custom } = validation;
    
    if (pattern && !pattern.test(val)) {
      return 'Invalid format';
    }
    
    if (minLength && val.length < minLength) {
      return `Minimum ${minLength} characters required`;
    }
    
    if (maxLength && val.length > maxLength) {
      return `Maximum ${maxLength} characters allowed`;
    }
    
    if (custom) {
      return custom(val);
    }
    
    return null;
  }, [validation]);
  
  // Handle autocomplete search
  const handleAutocompleteSearch = useCallback(async (query: string) => {
    if (query.length < autocompleteMinLength) {
      setAutocompleteOptions(autocomplete);
      setShowAutocomplete(false);
      return;
    }
    
    if (onAutocompleteSearch) {
      setIsLoading(true);
      try {
        const results = await onAutocompleteSearch(query);
        setAutocompleteOptions(results);
        setShowAutocomplete(results.length > 0);
      } catch (error) {
        console.error('Autocomplete search error:', error);
        setAutocompleteOptions([]);
        setShowAutocomplete(false);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Filter local autocomplete options
      const filtered = autocomplete.filter(option => 
        option.label.toLowerCase().includes(query.toLowerCase()) ||
        option.value.toLowerCase().includes(query.toLowerCase()) ||
        option.description?.toLowerCase().includes(query.toLowerCase())
      );
      
      setAutocompleteOptions(filtered);
      setShowAutocomplete(filtered.length > 0);
    }
  }, [autocomplete, onAutocompleteSearch, autocompleteMinLength]);
  
  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Apply number formatting if needed
    if (type === 'number' && numberFormat) {
      newValue = formatNumber(newValue);
    }
    
    onChange(newValue);
    
    // Handle autocomplete search with debouncing
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      handleAutocompleteSearch(newValue);
    }, autocompleteDelay);
  }, [onChange, type, numberFormat, formatNumber, handleAutocompleteSearch, autocompleteDelay]);
  
  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showAutocomplete && autocompleteOptions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedOptionIndex(prev => 
            prev < autocompleteOptions.length - 1 ? prev + 1 : 0
          );
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          setSelectedOptionIndex(prev => 
            prev > 0 ? prev - 1 : autocompleteOptions.length - 1
          );
          break;
          
        case 'Enter':
          e.preventDefault();
          if (selectedOptionIndex >= 0) {
            const selectedOption = autocompleteOptions[selectedOptionIndex];
            onChange(selectedOption.value);
            setShowAutocomplete(false);
            setSelectedOptionIndex(-1);
          } else if (onEnter) {
            onEnter();
          }
          break;
          
        case 'Escape':
          e.preventDefault();
          setShowAutocomplete(false);
          setSelectedOptionIndex(-1);
          if (onEscape) {
            onEscape();
          }
          break;
      }
    } else {
      switch (e.key) {
        case 'Enter':
          if (onEnter) {
            onEnter();
          }
          break;
          
        case 'Escape':
          if (onEscape) {
            onEscape();
          }
          break;
      }
    }
  }, [showAutocomplete, autocompleteOptions, selectedOptionIndex, onChange, onEnter, onEscape]);
  
  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (onFocus) {
      onFocus();
    }
    
    // Show autocomplete if there are options
    if (autocompleteOptions.length > 0) {
      setShowAutocomplete(true);
    }
  }, [onFocus, autocompleteOptions.length]);
  
  // Handle blur
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Delay hiding autocomplete to allow for option selection
    setTimeout(() => {
      setIsFocused(false);
      setShowAutocomplete(false);
      setSelectedOptionIndex(-1);
      
      if (onBlur) {
        onBlur();
      }
    }, 150);
  }, [onBlur]);
  
  // Handle autocomplete option selection
  const handleOptionSelect = useCallback((option: AutocompleteOption) => {
    onChange(option.value);
    setShowAutocomplete(false);
    setSelectedOptionIndex(-1);
    inputRef.current?.focus();
  }, [onChange]);
  
  // Clear input
  const handleClear = useCallback(() => {
    onChange('');
    setShowAutocomplete(false);
    inputRef.current?.focus();
  }, [onChange]);
  
  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  const inputType = type === 'password' && showPassword ? 'text' : type;
  const hasError = Boolean(error);
  const validationError = validateInput(value);
  const displayError = error || validationError;
  
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        
        {/* Input */}
        <input
          ref={inputRef}
          type={inputType}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full px-3 py-2 border rounded-lg transition-all duration-200
            ${leftIcon ? 'pl-10' : ''}
            ${(rightIcon || showClearButton || (type === 'password' && showPasswordToggle)) ? 'pr-10' : ''}
            ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : ''}
            ${hasError || validationError ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300 dark:border-gray-600'}
            ${disabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-800'}
            text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none
          `}
        />
        
        {/* Right Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
          )}
          
          {showClearButton && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          {type === 'password' && showPasswordToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          
          {rightIcon && (
            <div className="text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        
        {/* Autocomplete Dropdown */}
        {showAutocomplete && autocompleteOptions.length > 0 && (
          <div
            ref={autocompleteRef}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {autocompleteOptions.map((option, index) => (
              <button
                key={`${option.value}-${index}`}
                type="button"
                onClick={() => handleOptionSelect(option)}
                className={`
                  w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                  ${index === selectedOptionIndex ? 'bg-blue-50 dark:bg-blue-900' : ''}
                  ${index === 0 ? 'rounded-t-lg' : ''}
                  ${index === autocompleteOptions.length - 1 ? 'rounded-b-lg' : ''}
                `}
              >
                <div className="flex items-center space-x-2">
                  {option.icon && (
                    <div className="text-gray-400">
                      {option.icon}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {option.label}
                    </div>
                    
                    {option.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {option.description}
                      </div>
                    )}
                  </div>
                  
                  {option.category && (
                    <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {option.category}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Help Text */}
      {helpText && !displayError && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
      
      {/* Error Message */}
      {displayError && (
        <p className="mt-1 text-xs text-red-500 flex items-center space-x-1">
          <span>⚠️</span>
          <span>{displayError}</span>
        </p>
      )}
    </div>
  );
};

export default SmartInput;
export type { AutocompleteOption, SmartInputProps };
import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { useEnhancedTheme } from '../../contexts/ThemeContext';
import { Loader2 } from 'lucide-react';

// Button variant types
export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'ghost' 
  | 'outline'
  | 'danger' 
  | 'success' 
  | 'warning'
  | 'info';

// Button size types
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Button props interface
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  rounded?: boolean;
  elevation?: boolean;
  children: React.ReactNode;
}

// Enhanced Button Component
const Button = forwardRef<HTMLButtonElement, ButtonProps>((
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    fullWidth = false,
    rounded = false,
    elevation = false,
    disabled,
    className = '',
    children,
    ...props
  },
  ref
) => {
  const { themeConfig } = useEnhancedTheme();
  const { colors, tokens } = themeConfig;
  
  // Size configurations
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };
  
  // Icon sizes based on button size
  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6'
  };
  
  // Variant styles
  const getVariantClasses = () => {
    const baseClasses = 'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-[${colors.primary[600]}] hover:bg-[${colors.primary[700]}] active:bg-[${colors.primary[800]}] text-white focus:ring-[${colors.primary[500]}] shadow-sm hover:shadow-md`;
      
      case 'secondary':
        return `${baseClasses} bg-[${colors.background.secondary}] hover:bg-[${colors.background.tertiary}] active:bg-[${colors.primary[100]}] text-[${colors.text.primary}] border border-[${colors.border.primary}] focus:ring-[${colors.primary[500]}] shadow-sm hover:shadow`;
      
      case 'ghost':
        return `${baseClasses} bg-transparent hover:bg-[${colors.background.secondary}] active:bg-[${colors.background.tertiary}] text-[${colors.text.primary}] focus:ring-[${colors.primary[500]}]`;
      
      case 'outline':
        return `${baseClasses} bg-transparent hover:bg-[${colors.primary[50]}] active:bg-[${colors.primary[100]}] text-[${colors.primary[600]}] border border-[${colors.primary[300]}] hover:border-[${colors.primary[400]}] focus:ring-[${colors.primary[500]}]`;
      
      case 'danger':
        return `${baseClasses} bg-[${colors.status.error}] hover:bg-red-700 active:bg-red-800 text-white focus:ring-red-500 shadow-sm hover:shadow-md`;
      
      case 'success':
        return `${baseClasses} bg-[${colors.status.success}] hover:bg-green-700 active:bg-green-800 text-white focus:ring-green-500 shadow-sm hover:shadow-md`;
      
      case 'warning':
        return `${baseClasses} bg-[${colors.status.warning}] hover:bg-yellow-600 active:bg-yellow-700 text-white focus:ring-yellow-500 shadow-sm hover:shadow-md`;
      
      case 'info':
        return `${baseClasses} bg-[${colors.status.info}] hover:bg-blue-700 active:bg-blue-800 text-white focus:ring-blue-500 shadow-sm hover:shadow-md`;
      
      default:
        return baseClasses;
    }
  };
  
  // Disabled state classes
  const disabledClasses = (disabled || loading) 
    ? 'opacity-50 cursor-not-allowed pointer-events-none' 
    : 'cursor-pointer';
  
  // Additional classes
  const additionalClasses = [
    fullWidth ? 'w-full' : '',
    rounded ? 'rounded-full' : 'rounded-lg',
    elevation ? 'shadow-lg hover:shadow-xl' : '',
    'inline-flex items-center justify-center',
    'relative overflow-hidden',
    'transform transition-transform duration-150',
    'active:scale-95'
  ].filter(Boolean).join(' ');
  
  const finalClassName = [
    sizeClasses[size],
    getVariantClasses(),
    disabledClasses,
    additionalClasses,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <button
      ref={ref}
      className={finalClassName}
      disabled={disabled || loading}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <Loader2 className={`${iconSizes[size]} animate-spin mr-2`} />
      )}
      
      {/* Left icon */}
      {!loading && leftIcon && (
        <span className={`${iconSizes[size]} mr-2 flex-shrink-0`}>
          {leftIcon}
        </span>
      )}
      
      {/* Button content */}
      <span className="flex-1">
        {loading && loadingText ? loadingText : children}
      </span>
      
      {/* Right icon */}
      {!loading && rightIcon && (
        <span className={`${iconSizes[size]} ml-2 flex-shrink-0`}>
          {rightIcon}
        </span>
      )}
      
      {/* Ripple effect overlay */}
      <span className="absolute inset-0 bg-white opacity-0 transition-opacity duration-150 hover:opacity-10 active:opacity-20 rounded-inherit" />
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
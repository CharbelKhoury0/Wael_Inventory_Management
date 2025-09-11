import React, { forwardRef, HTMLAttributes } from 'react';
import { useEnhancedTheme } from '../../contexts/ThemeContext';

// Card variant types
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'glass';

// Card padding types
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

// Card props interface
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  loading?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

// Enhanced Card Component
const Card = forwardRef<HTMLDivElement, CardProps>((
  {
    variant = 'default',
    padding = 'md',
    interactive = false,
    loading = false,
    header,
    footer,
    className = '',
    children,
    ...props
  },
  ref
) => {
  const { themeConfig } = useEnhancedTheme();
  const { colors, tokens } = themeConfig;
  
  // Padding configurations
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };
  
  // Header/Footer padding (smaller than main content)
  const headerFooterPadding = {
    none: '',
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
    xl: 'px-8 py-5'
  };
  
  // Variant styles
  const getVariantClasses = () => {
    const baseClasses = 'rounded-lg transition-all duration-200';
    
    switch (variant) {
      case 'default':
        return `${baseClasses} bg-[${colors.background.elevated}] border border-[${colors.border.primary}]`;
      
      case 'elevated':
        return `${baseClasses} bg-[${colors.background.elevated}] shadow-lg hover:shadow-xl border border-[${colors.border.primary}]`;
      
      case 'outlined':
        return `${baseClasses} bg-transparent border-2 border-[${colors.border.secondary}] hover:border-[${colors.primary[300]}]`;
      
      case 'filled':
        return `${baseClasses} bg-[${colors.background.secondary}] border border-[${colors.border.primary}]`;
      
      case 'glass':
        return `${baseClasses} bg-[${colors.background.overlay}] backdrop-blur-md border border-[${colors.border.primary}] border-opacity-20`;
      
      default:
        return baseClasses;
    }
  };
  
  // Interactive classes
  const interactiveClasses = interactive 
    ? 'cursor-pointer hover:shadow-md transform hover:-translate-y-1 active:translate-y-0' 
    : '';
  
  // Loading overlay
  const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-[${colors.background.overlay}] backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[${colors.primary[600]}]"></div>
        <span className={`text-sm ${colors.text.secondary}`}>Loading...</span>
      </div>
    </div>
  );
  
  const finalClassName = [
    getVariantClasses(),
    interactiveClasses,
    'relative overflow-hidden',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div
      ref={ref}
      className={finalClassName}
      {...props}
    >
      {/* Loading overlay */}
      {loading && <LoadingOverlay />}
      
      {/* Header */}
      {header && (
        <div className={`${headerFooterPadding[padding]} border-b border-[${colors.border.primary}]`}>
          {header}
        </div>
      )}
      
      {/* Main content */}
      <div className={paddingClasses[padding]}>
        {children}
      </div>
      
      {/* Footer */}
      {footer && (
        <div className={`${headerFooterPadding[padding]} border-t border-[${colors.border.primary}] bg-[${colors.background.secondary}]`}>
          {footer}
        </div>
      )}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;

// Card Header Component
export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const { themeConfig } = useEnhancedTheme();
  const { colors } = themeConfig;
  
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
};

// Card Title Component
export const CardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const { themeConfig } = useEnhancedTheme();
  const { colors } = themeConfig;
  
  return (
    <h3 className={`text-lg font-semibold text-[${colors.text.primary}] ${className}`}>
      {children}
    </h3>
  );
};

// Card Description Component
export const CardDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const { themeConfig } = useEnhancedTheme();
  const { colors } = themeConfig;
  
  return (
    <p className={`text-sm text-[${colors.text.secondary}] ${className}`}>
      {children}
    </p>
  );
};

// Card Content Component
export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {children}
    </div>
  );
};

// Card Footer Component
export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center justify-end space-x-2 ${className}`}>
      {children}
    </div>
  );
};
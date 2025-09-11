import React from 'react';
import { useEnhancedTheme } from '../../contexts/ThemeContext';

// Skeleton variant types
export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';

// Skeleton animation types
export type SkeletonAnimation = 'pulse' | 'wave' | 'none';

// Base Skeleton props
export interface SkeletonProps {
  variant?: SkeletonVariant;
  animation?: SkeletonAnimation;
  width?: string | number;
  height?: string | number;
  className?: string;
  children?: React.ReactNode;
}

// Base Skeleton Component
const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  animation = 'pulse',
  width,
  height,
  className = '',
  children
}) => {
  const { themeConfig } = useEnhancedTheme();
  const { colors } = themeConfig;
  
  // Animation classes
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: ''
  };
  
  // Variant classes
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg'
  };
  
  // Default dimensions based on variant
  const getDefaultDimensions = () => {
    switch (variant) {
      case 'text':
        return { width: width || '100%', height: height || '1rem' };
      case 'circular':
        return { width: width || '2.5rem', height: height || '2.5rem' };
      case 'rectangular':
      case 'rounded':
        return { width: width || '100%', height: height || '2rem' };
      default:
        return { width: width || '100%', height: height || '1rem' };
    }
  };
  
  const dimensions = getDefaultDimensions();
  
  const style = {
    width: typeof dimensions.width === 'number' ? `${dimensions.width}px` : dimensions.width,
    height: typeof dimensions.height === 'number' ? `${dimensions.height}px` : dimensions.height
  };
  
  const finalClassName = [
    `bg-[${colors.background.tertiary}]`,
    variantClasses[variant],
    animationClasses[animation],
    className
  ].filter(Boolean).join(' ');
  
  if (children) {
    return (
      <div className={`relative ${className}`}>
        <div className="invisible">{children}</div>
        <div 
          className={`absolute inset-0 ${finalClassName}`}
          style={style}
        />
      </div>
    );
  }
  
  return (
    <div 
      className={finalClassName}
      style={style}
    />
  );
};

// Text Skeleton Component
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 1, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton 
          key={index}
          variant="text"
          width={index === lines - 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  );
};

// Avatar Skeleton Component
export const SkeletonAvatar: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: '2rem',
    md: '2.5rem',
    lg: '3rem',
    xl: '4rem'
  };
  
  return (
    <Skeleton 
      variant="circular"
      width={sizes[size]}
      height={sizes[size]}
      className={className}
    />
  );
};

// Card Skeleton Component
export const SkeletonCard: React.FC<{
  hasAvatar?: boolean;
  hasImage?: boolean;
  lines?: number;
  className?: string;
}> = ({ hasAvatar = false, hasImage = false, lines = 3, className = '' }) => {
  const { themeConfig } = useEnhancedTheme();
  const { colors } = themeConfig;
  
  return (
    <div className={`p-4 border border-[${colors.border.primary}] rounded-lg ${className}`}>
      {/* Header with avatar */}
      {hasAvatar && (
        <div className="flex items-center space-x-3 mb-4">
          <SkeletonAvatar size="md" />
          <div className="flex-1">
            <Skeleton variant="text" width="60%" height="1.25rem" />
            <Skeleton variant="text" width="40%" height="1rem" className="mt-1" />
          </div>
        </div>
      )}
      
      {/* Image */}
      {hasImage && (
        <Skeleton 
          variant="rounded" 
          height="12rem" 
          className="mb-4" 
        />
      )}
      
      {/* Content */}
      <div className="space-y-2">
        <Skeleton variant="text" width="90%" height="1.5rem" />
        <SkeletonText lines={lines} />
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <Skeleton variant="rounded" width="5rem" height="2rem" />
        <Skeleton variant="rounded" width="4rem" height="2rem" />
      </div>
    </div>
  );
};

// Table Skeleton Component
export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
  className?: string;
}> = ({ rows = 5, columns = 4, hasHeader = true, className = '' }) => {
  const { themeConfig } = useEnhancedTheme();
  const { colors } = themeConfig;
  
  return (
    <div className={`border border-[${colors.border.primary}] rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      {hasHeader && (
        <div className={`bg-[${colors.background.secondary}] p-4 border-b border-[${colors.border.primary}]`}>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton key={index} variant="text" width="80%" height="1.25rem" />
            ))}
          </div>
        </div>
      )}
      
      {/* Rows */}
      <div className="divide-y divide-[${colors.border.primary}]">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  variant="text" 
                  width={colIndex === 0 ? '90%' : '70%'} 
                  height="1rem" 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// List Skeleton Component
export const SkeletonList: React.FC<{
  items?: number;
  hasAvatar?: boolean;
  hasIcon?: boolean;
  className?: string;
}> = ({ items = 5, hasAvatar = false, hasIcon = false, className = '' }) => {
  const { themeConfig } = useEnhancedTheme();
  const { colors } = themeConfig;
  
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className={`flex items-center space-x-3 p-3 border border-[${colors.border.primary}] rounded-lg`}>
          {/* Avatar or Icon */}
          {hasAvatar && <SkeletonAvatar size="sm" />}
          {hasIcon && !hasAvatar && (
            <Skeleton variant="rounded" width="1.5rem" height="1.5rem" />
          )}
          
          {/* Content */}
          <div className="flex-1">
            <Skeleton variant="text" width="70%" height="1.25rem" />
            <Skeleton variant="text" width="50%" height="1rem" className="mt-1" />
          </div>
          
          {/* Action */}
          <Skeleton variant="rounded" width="2rem" height="2rem" />
        </div>
      ))}
    </div>
  );
};

// Chart Skeleton Component
export const SkeletonChart: React.FC<{
  type?: 'bar' | 'line' | 'pie' | 'area';
  height?: string;
  className?: string;
}> = ({ type = 'bar', height = '20rem', className = '' }) => {
  const { themeConfig } = useEnhancedTheme();
  const { colors } = themeConfig;
  
  const renderChartSkeleton = () => {
    switch (type) {
      case 'bar':
        return (
          <div className="flex items-end justify-between h-full px-4 pb-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton 
                key={index}
                variant="rounded"
                width="2rem"
                height={`${Math.random() * 60 + 20}%`}
              />
            ))}
          </div>
        );
      
      case 'line':
      case 'area':
        return (
          <div className="relative h-full p-4">
            <svg className="w-full h-full">
              <defs>
                <linearGradient id="skeleton-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={colors.background.tertiary} />
                  <stop offset="50%" stopColor={colors.background.secondary} />
                  <stop offset="100%" stopColor={colors.background.tertiary} />
                </linearGradient>
              </defs>
              <path 
                d="M0,80 Q50,20 100,60 T200,40 T300,70 T400,30" 
                stroke="url(#skeleton-gradient)" 
                strokeWidth="3" 
                fill="none"
                className="animate-pulse"
              />
            </svg>
          </div>
        );
      
      case 'pie':
        return (
          <div className="flex items-center justify-center h-full">
            <Skeleton variant="circular" width="12rem" height="12rem" />
          </div>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <Skeleton variant="rounded" width="80%" height="60%" />
          </div>
        );
    }
  };
  
  return (
    <div className={`border border-[${colors.border.primary}] rounded-lg p-4 ${className}`} style={{ height }}>
      {/* Chart Title */}
      <div className="mb-4">
        <Skeleton variant="text" width="40%" height="1.5rem" />
        <Skeleton variant="text" width="60%" height="1rem" className="mt-1" />
      </div>
      
      {/* Chart Content */}
      <div className="flex-1" style={{ height: 'calc(100% - 4rem)' }}>
        {renderChartSkeleton()}
      </div>
    </div>
  );
};

// Dashboard Skeleton Component
export const SkeletonDashboard: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton variant="text" width="15rem" height="2rem" />
          <Skeleton variant="text" width="20rem" height="1.25rem" className="mt-2" />
        </div>
        <Skeleton variant="rounded" width="8rem" height="2.5rem" />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} lines={1} />
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart type="bar" />
        <SkeletonChart type="line" />
      </div>
      
      {/* Table */}
      <SkeletonTable rows={8} columns={5} />
    </div>
  );
};

export default Skeleton;
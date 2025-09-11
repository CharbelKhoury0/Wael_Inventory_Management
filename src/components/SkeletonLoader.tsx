import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface SkeletonLoaderProps {
  className?: string;
  width?: string;
  height?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  lines?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = React.memo(({ 
  className = '', 
  width = '100%', 
  height = '1rem', 
  variant = 'text',
  lines = 1 
}) => {
  const { isDark } = useTheme();
  
  const baseClasses = `animate-pulse ${
    isDark ? 'bg-gray-700' : 'bg-gray-200'
  }`;
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-md';
      case 'text':
      default:
        return 'rounded';
    }
  };
  
  const skeletonStyle = {
    width,
    height: variant === 'text' ? height : height,
  };
  
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()}`}
            style={{
              ...skeletonStyle,
              width: index === lines - 1 ? '75%' : width, // Last line is shorter
            }}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={skeletonStyle}
    />
  );
});

export default SkeletonLoader;
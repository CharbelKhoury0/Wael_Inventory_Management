import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SkeletonLoader from './SkeletonLoader';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

const TableSkeleton: React.FC<TableSkeletonProps> = React.memo(({ 
  rows = 5, 
  columns = 6, 
  showHeader = true 
}) => {
  const { isDark } = useTheme();
  
  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {showHeader && (
            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                {Array.from({ length: columns }).map((_, index) => (
                  <th key={index} className="px-6 py-3">
                    <SkeletonLoader height="1rem" width="80%" />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className={`${isDark ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    <SkeletonLoader 
                      height="1rem" 
                      width={colIndex === 0 ? '60%' : colIndex === columns - 1 ? '40%' : '80%'} 
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default TableSkeleton;
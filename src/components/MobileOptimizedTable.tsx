import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';

interface MobileOptimizedTableProps {
  data: any[];
  columns: {
    key: string;
    label: string;
    render?: (value: any, item: any) => React.ReactNode;
    sortable?: boolean;
    searchable?: boolean;
  }[];
  itemHeight?: number;
  containerHeight?: number;
  onItemClick?: (item: any) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

const MobileOptimizedTable: React.FC<MobileOptimizedTableProps> = ({
  data,
  columns,
  itemHeight = 80,
  containerHeight = 400,
  onItemClick,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data available'
}) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = data.filter(item =>
        columns.some(column => {
          if (column.searchable === false) return false;
          const value = item[column.key];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig, columns]);

  // Virtual scrolling logic
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(start + visibleCount + 2, processedData.length);

    setVisibleRange({ start: Math.max(0, start - 1), end });
    
    // Set scrolling state for performance optimization
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [containerHeight, itemHeight, processedData.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleSort = (key: string) => {
    const column = columns.find(col => col.key === key);
    if (!column?.sortable) return;

    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const visibleItems = processedData.slice(visibleRange.start, visibleRange.end);
  const totalHeight = processedData.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const themeClasses = {
    container: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    searchInput: isDark 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
    item: isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200',
    itemHover: isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-50',
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-600',
      muted: isDark ? 'text-gray-400' : 'text-gray-500'
    }
  };

  return (
    <div className={`rounded-lg border ${themeClasses.container} overflow-hidden`}>
      {/* Search Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`input-mobile pl-10 ${themeClasses.searchInput}`}
          />
        </div>
        
        {/* Sort indicators */}
        {sortConfig && (
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <Filter className="h-4 w-4 mr-1" />
            Sorted by {columns.find(col => col.key === sortConfig.key)?.label} 
            ({sortConfig.direction === 'asc' ? 'A-Z' : 'Z-A'})
          </div>
        )}
      </div>

      {/* Virtual Scrolling Container */}
      <div 
        ref={containerRef}
        className="smooth-scroll hide-scrollbar"
        style={{ height: containerHeight, overflowY: 'auto' }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div 
            style={{ 
              transform: `translateY(${offsetY}px)`,
              willChange: isScrolling ? 'transform' : 'auto'
            }}
          >
            {visibleItems.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className={`text-center ${themeClasses.text.muted}`}>
                  {emptyMessage}
                </p>
              </div>
            ) : (
              visibleItems.map((item, index) => {
                const actualIndex = visibleRange.start + index;
                return (
                  <div
                    key={item.id || actualIndex}
                    className={`
                      ${themeClasses.item} ${themeClasses.itemHover}
                      border-b p-4 transition-colors duration-150
                      ${onItemClick ? 'cursor-pointer touch-feedback' : ''}
                    `}
                    style={{ height: itemHeight }}
                    onClick={() => onItemClick?.(item)}
                  >
                    <div className="space-y-2">
                      {columns.map((column, colIndex) => {
                        const value = item[column.key];
                        const displayValue = column.render ? column.render(value, item) : value;
                        
                        return (
                          <div key={column.key} className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-medium ${themeClasses.text.muted}`}>
                                {column.label}:
                              </span>
                              {column.sortable && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSort(column.key);
                                  }}
                                  className="touch-target p-1"
                                >
                                  {sortConfig?.key === column.key ? (
                                    sortConfig.direction === 'asc' ? (
                                      <ChevronUp className="h-3 w-3 text-blue-500" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3 text-blue-500" />
                                    )
                                  ) : (
                                    <ChevronDown className="h-3 w-3 text-gray-400" />
                                  )}
                                </button>
                              )}
                            </div>
                            <div className={`text-sm font-medium ${themeClasses.text.primary} text-right`}>
                              {displayValue}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer with item count */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <p className={`text-xs ${themeClasses.text.muted} text-center`}>
          Showing {visibleItems.length} of {processedData.length} items
          {searchTerm && ` (filtered from ${data.length} total)`}
        </p>
      </div>
    </div>
  );
};

export default MobileOptimizedTable;
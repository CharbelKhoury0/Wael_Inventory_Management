import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, Filter, RefreshCw, Download, Settings } from 'lucide-react';

interface VirtualScrollItem {
  id: string | number;
  [key: string]: any;
}

interface VirtualScrollListProps<T extends VirtualScrollItem> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number, isVisible: boolean) => React.ReactNode;
  onItemClick?: (item: T, index: number) => void;
  onItemsLoad?: (startIndex: number, endIndex: number) => void;
  overscan?: number;
  enableSearch?: boolean;
  searchFields?: (keyof T)[];
  enableFiltering?: boolean;
  filters?: Array<{
    key: keyof T;
    label: string;
    type: 'text' | 'select' | 'date' | 'number';
    options?: any[];
  }>;
  enableSorting?: boolean;
  sortableFields?: Array<{
    key: keyof T;
    label: string;
    type?: 'string' | 'number' | 'date';
  }>;
  enableSelection?: boolean;
  selectedItems?: (string | number)[];
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  headerComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
  className?: string;
  itemClassName?: string;
  cacheSize?: number;
  enableInfiniteScroll?: boolean;
  hasNextPage?: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
  estimatedItemSize?: number;
  getItemSize?: (index: number) => number;
}

interface CacheItem<T> {
  item: T;
  rendered: React.ReactNode;
  timestamp: number;
  height?: number;
}

const VirtualScrollList = <T extends VirtualScrollItem>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  onItemClick,
  onItemsLoad,
  overscan = 5,
  enableSearch = false,
  searchFields = [],
  enableFiltering = false,
  filters = [],
  enableSorting = false,
  sortableFields = [],
  enableSelection = false,
  selectedItems = [],
  onSelectionChange,
  loadingComponent,
  emptyComponent,
  headerComponent,
  footerComponent,
  className = '',
  itemClassName = '',
  cacheSize = 1000,
  enableInfiniteScroll = false,
  hasNextPage = false,
  isLoading = false,
  onLoadMore,
  estimatedItemSize,
  getItemSize,
  ...props
}: VirtualScrollListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [cache, setCache] = useState<Map<string | number, CacheItem<T>>>(new Map());
  const [itemSizes, setItemSizes] = useState<Map<number, number>>(new Map());
  
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  
  // Calculate dynamic item height
  const getItemHeight = useCallback((index: number) => {
    if (getItemSize) {
      return getItemSize(index);
    }
    return itemSizes.get(index) || estimatedItemSize || itemHeight;
  }, [getItemSize, itemSizes, estimatedItemSize, itemHeight]);
  
  // Filter and search items
  const filteredItems = useMemo(() => {
    let filtered = [...items];
    
    // Apply search
    if (enableSearch && searchQuery.trim() && searchFields.length > 0) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        searchFields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(query);
        })
      );
    }
    
    // Apply filters
    if (enableFiltering) {
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          filtered = filtered.filter(item => {
            const itemValue = item[key as keyof T];
            
            if (Array.isArray(value)) {
              return value.includes(itemValue);
            }
            
            if (typeof value === 'string') {
              return String(itemValue).toLowerCase().includes(value.toLowerCase());
            }
            
            return itemValue === value;
          });
        }
      });
    }
    
    // Apply sorting
    if (enableSorting && sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        let comparison = 0;
        
        if (aValue < bValue) comparison = -1;
        else if (aValue > bValue) comparison = 1;
        
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }
    
    return filtered;
  }, [items, searchQuery, searchFields, activeFilters, sortField, sortDirection, enableSearch, enableFiltering, enableSorting]);
  
  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (filteredItems.length === 0) {
      return { start: 0, end: 0, offsetY: 0 };
    }
    
    let start = 0;
    let offsetY = 0;
    let currentHeight = 0;
    
    // Find start index
    for (let i = 0; i < filteredItems.length; i++) {
      const height = getItemHeight(i);
      if (currentHeight + height > scrollTop) {
        start = Math.max(0, i - overscan);
        offsetY = currentHeight - (i - start) * itemHeight;
        break;
      }
      currentHeight += height;
    }
    
    // Find end index
    let end = start;
    let visibleHeight = 0;
    
    for (let i = start; i < filteredItems.length; i++) {
      const height = getItemHeight(i);
      visibleHeight += height;
      
      if (visibleHeight >= containerHeight + overscan * itemHeight) {
        end = Math.min(filteredItems.length - 1, i + overscan);
        break;
      }
      
      end = i;
    }
    
    return { start, end, offsetY };
  }, [filteredItems.length, scrollTop, containerHeight, overscan, itemHeight, getItemHeight]);
  
  // Calculate total height
  const totalHeight = useMemo(() => {
    if (getItemSize || estimatedItemSize) {
      return filteredItems.reduce((total, _, index) => total + getItemHeight(index), 0);
    }
    return filteredItems.length * itemHeight;
  }, [filteredItems.length, itemHeight, getItemHeight, getItemSize, estimatedItemSize]);
  
  // Get cached or render item
  const getCachedItem = useCallback((item: T, index: number) => {
    const cacheKey = item.id;
    const cached = cache.get(cacheKey);
    
    // Check if cache is still valid (within 5 minutes)
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.rendered;
    }
    
    // Render new item
    const isVisible = index >= visibleRange.start && index <= visibleRange.end;
    const rendered = renderItem(item, index, isVisible);
    
    // Update cache
    const newCached: CacheItem<T> = {
      item,
      rendered,
      timestamp: Date.now()
    };
    
    setCache(prev => {
      const newCache = new Map(prev);
      
      // Remove old entries if cache is too large
      if (newCache.size >= cacheSize) {
        const entries = Array.from(newCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Remove oldest 20% of entries
        const toRemove = Math.floor(cacheSize * 0.2);
        for (let i = 0; i < toRemove; i++) {
          newCache.delete(entries[i][0]);
        }
      }
      
      newCache.set(cacheKey, newCached);
      return newCache;
    });
    
    return rendered;
  }, [cache, cacheSize, renderItem, visibleRange]);
  
  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    
    isScrolling.current = true;
    
    // Clear existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    // Set timeout to detect scroll end
    scrollTimeout.current = setTimeout(() => {
      isScrolling.current = false;
      
      // Trigger load more for infinite scroll
      if (enableInfiniteScroll && hasNextPage && !isLoading && onLoadMore) {
        const scrollElement = e.currentTarget;
        const scrollPercentage = (scrollElement.scrollTop + scrollElement.clientHeight) / scrollElement.scrollHeight;
        
        if (scrollPercentage > 0.8) {
          onLoadMore();
        }
      }
    }, 150);
    
    // Notify about visible items
    if (onItemsLoad) {
      onItemsLoad(visibleRange.start, visibleRange.end);
    }
    
    lastScrollTop.current = newScrollTop;
  }, [visibleRange, enableInfiniteScroll, hasNextPage, isLoading, onLoadMore, onItemsLoad]);
  
  // Handle item selection
  const handleItemSelection = useCallback((itemId: string | number, selected: boolean) => {
    if (!enableSelection || !onSelectionChange) return;
    
    const newSelection = selected
      ? [...selectedItems, itemId]
      : selectedItems.filter(id => id !== itemId);
    
    onSelectionChange(newSelection);
  }, [enableSelection, selectedItems, onSelectionChange]);
  
  // Handle select all
  const handleSelectAll = useCallback((selected: boolean) => {
    if (!enableSelection || !onSelectionChange) return;
    
    const newSelection = selected ? filteredItems.map(item => item.id) : [];
    onSelectionChange(newSelection);
  }, [enableSelection, filteredItems, onSelectionChange]);
  
  // Handle sorting
  const handleSort = useCallback((field: keyof T) => {
    if (!enableSorting) return;
    
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [enableSorting, sortField]);
  
  // Handle filter change
  const handleFilterChange = useCallback((key: string, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  // Clear filters
  const clearFilters = useCallback(() => {
    setActiveFilters({});
    setSearchQuery('');
  }, []);
  
  // Scroll to item
  const scrollToItem = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!scrollElementRef.current) return;
    
    let targetScrollTop = 0;
    
    for (let i = 0; i < index; i++) {
      targetScrollTop += getItemHeight(i);
    }
    
    if (align === 'center') {
      targetScrollTop -= containerHeight / 2 - getItemHeight(index) / 2;
    } else if (align === 'end') {
      targetScrollTop -= containerHeight - getItemHeight(index);
    }
    
    scrollElementRef.current.scrollTop = Math.max(0, targetScrollTop);
  }, [containerHeight, getItemHeight]);
  
  // Expose scroll methods
  React.useImperativeHandle(props.ref, () => ({
    scrollToItem,
    scrollToTop: () => scrollElementRef.current?.scrollTo({ top: 0, behavior: 'smooth' }),
    scrollToBottom: () => scrollElementRef.current?.scrollTo({ top: totalHeight, behavior: 'smooth' }),
    getVisibleRange: () => visibleRange,
    clearCache: () => setCache(new Map()),
    refresh: () => {
      setCache(new Map());
      setItemSizes(new Map());
    }
  }), [scrollToItem, totalHeight, visibleRange]);
  
  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header Controls */}
      {(enableSearch || enableFiltering || enableSorting || headerComponent) && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 space-y-4">
          {headerComponent}
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            {enableSearch && (
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            {/* Filters */}
            {enableFiltering && filters.length > 0 && (
              <div className="flex items-center space-x-2">
                {filters.map(filter => (
                  <div key={String(filter.key)} className="min-w-0">
                    {filter.type === 'select' ? (
                      <select
                        value={activeFilters[String(filter.key)] || ''}
                        onChange={(e) => handleFilterChange(String(filter.key), e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="">{filter.label}</option>
                        {filter.options?.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={filter.type}
                        value={activeFilters[String(filter.key)] || ''}
                        onChange={(e) => handleFilterChange(String(filter.key), e.target.value)}
                        placeholder={filter.label}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm w-32"
                      />
                    )}
                  </div>
                ))}
                
                {(Object.keys(activeFilters).length > 0 || searchQuery) && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
            
            {/* Selection Controls */}
            {enableSelection && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedItems.length} selected
                </span>
              </div>
            )}
          </div>
          
          {/* Sort Controls */}
          {enableSorting && sortableFields.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
              {sortableFields.map(field => (
                <button
                  key={String(field.key)}
                  onClick={() => handleSort(field.key)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                    sortField === field.key
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span>{field.label}</span>
                  {sortField === field.key && (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Virtual Scroll Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden"
        style={{ height: containerHeight }}
      >
        {filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            {emptyComponent || (
              <div className="text-center">
                <div className="text-gray-400 mb-2">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                  No items found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery || Object.keys(activeFilters).length > 0
                    ? 'Try adjusting your search or filters'
                    : 'No items to display'
                  }
                </p>
              </div>
            )}
          </div>
        ) : (
          <div
            ref={scrollElementRef}
            className="h-full overflow-auto"
            onScroll={handleScroll}
          >
            <div style={{ height: totalHeight, position: 'relative' }}>
              <div
                style={{
                  transform: `translateY(${visibleRange.offsetY}px)`,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0
                }}
              >
                {filteredItems.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => {
                  const actualIndex = visibleRange.start + index;
                  const isSelected = selectedItems.includes(item.id);
                  
                  return (
                    <div
                      key={item.id}
                      className={`${itemClassName} ${isSelected ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
                      style={{ height: getItemHeight(actualIndex) }}
                      onClick={() => onItemClick?.(item, actualIndex)}
                    >
                      <div className="flex items-center">
                        {enableSelection && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleItemSelection(item.id, e.target.checked);
                            }}
                            className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        )}
                        
                        <div className="flex-1">
                          {getCachedItem(item, actualIndex)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Infinite Scroll Loading */}
            {enableInfiniteScroll && isLoading && (
              <div className="flex items-center justify-center py-4">
                {loadingComponent || (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loading more...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      {footerComponent && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          {footerComponent}
        </div>
      )}
      
      {/* Stats */}
      <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Showing {visibleRange.start + 1}-{Math.min(visibleRange.end + 1, filteredItems.length)} of {filteredItems.length} items
            {filteredItems.length !== items.length && ` (filtered from ${items.length})`}
          </span>
          
          <div className="flex items-center space-x-4">
            {selectedItems.length > 0 && (
              <span>{selectedItems.length} selected</span>
            )}
            
            <span>Cache: {cache.size} items</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualScrollList;
export type { VirtualScrollItem, VirtualScrollListProps };
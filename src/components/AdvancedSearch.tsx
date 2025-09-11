import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Search, Filter, X, ChevronDown, Calendar, SortAsc, SortDesc } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface SortOption {
  label: string;
  value: string;
  direction: 'asc' | 'desc';
}

interface AdvancedSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters?: {
    label: string;
    key: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }[];
  sortOptions?: SortOption[];
  currentSort?: string;
  onSortChange?: (sort: string) => void;
  dateRange?: {
    from: string;
    to: string;
    onChange: (from: string, to: string) => void;
  };
  placeholder?: string;
  showAdvanced?: boolean;
  onAdvancedToggle?: () => void;
  resultCount?: number;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  searchTerm,
  onSearchChange,
  filters = [],
  sortOptions = [],
  currentSort,
  onSortChange,
  dateRange,
  placeholder = "Search...",
  showAdvanced = false,
  onAdvancedToggle,
  resultCount
}) => {
  const { isDark } = useTheme();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(showAdvanced);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const themeClasses = {
    container: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    input: isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
    button: isDark ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300',
    dropdown: isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200',
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-600',
      muted: isDark ? 'text-gray-400' : 'text-gray-500'
    }
  };

  useEffect(() => {
    const active = filters.filter(filter => filter.value !== 'all' && filter.value !== '').map(filter => filter.key);
    setActiveFilters(active);
  }, [filters]);

  const handleClearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  const handleClearFilter = useCallback((filterKey: string) => {
    const filter = filters.find(f => f.key === filterKey);
    if (filter) {
      filter.onChange('all');
    }
  }, [filters]);

  const handleClearAllFilters = useCallback(() => {
    filters.forEach(filter => filter.onChange('all'));
    if (dateRange) {
      dateRange.onChange('', '');
    }
  }, [filters, dateRange]);

  const toggleAdvanced = useCallback(() => {
    setIsAdvancedOpen(!isAdvancedOpen);
    if (onAdvancedToggle) {
      onAdvancedToggle();
    }
  }, [isAdvancedOpen, onAdvancedToggle]);

  return (
    <div className={`${themeClasses.container} rounded-lg border p-4 space-y-4`}>
      {/* Main Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${themeClasses.text.muted}`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full pl-10 pr-10 py-2 rounded-md border ${themeClasses.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${themeClasses.text.muted} hover:text-red-500`}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          {filters.length > 0 && (
            <button
              onClick={toggleAdvanced}
              className={`px-4 py-2 rounded-md border ${themeClasses.button} flex items-center gap-2 transition-colors`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilters.length > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
          
          {sortOptions.length > 0 && onSortChange && (
            <select
              value={currentSort || ''}
              onChange={(e) => onSortChange(e.target.value)}
              className={`px-4 py-2 rounded-md border ${themeClasses.button} min-w-[120px]`}
            >
              <option value="">Sort by...</option>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} {option.direction === 'asc' ? '↑' : '↓'}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Results Count */}
      {resultCount !== undefined && (
        <div className={`text-sm ${themeClasses.text.secondary}`}>
          {resultCount} result{resultCount !== 1 ? 's' : ''} found
          {searchTerm && ` for "${searchTerm}"`}
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className={`text-sm ${themeClasses.text.secondary}`}>Active filters:</span>
          {filters.filter(filter => filter.value !== 'all' && filter.value !== '').map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-200"
            >
              {filter.label}: {filter.options.find(opt => opt.value === filter.value)?.label || filter.value}
              <button
                onClick={() => handleClearFilter(filter.key)}
                className="hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={handleClearAllFilters}
            className={`text-xs ${themeClasses.text.muted} hover:text-red-500 underline`}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Advanced Filters */}
      {isAdvancedOpen && (
        <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-4 space-y-4`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                  {filter.label}
                </label>
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-md border ${themeClasses.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="all">All {filter.label}</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                      {option.count !== undefined && ` (${option.count})`}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            
            {/* Date Range Filter */}
            {dateRange && (
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Date Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => dateRange.onChange(e.target.value, dateRange.to)}
                    className={`flex-1 px-3 py-2 rounded-md border ${themeClasses.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  <span className={`self-center ${themeClasses.text.secondary}`}>to</span>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => dateRange.onChange(dateRange.from, e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-md border ${themeClasses.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
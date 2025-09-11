import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, X, Plus, Minus, Calendar, Hash, Type, Tag, Star, Clock, ChevronDown, Save, Trash2 } from 'lucide-react';
import { SmartDatePicker, DateRange } from '../inputs/SmartDatePicker';

interface SearchField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'range';
  options?: string[];
  placeholder?: string;
  searchable?: boolean;
  filterable?: boolean;
}

interface SearchFilter {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn' | 'exists' | 'notExists';
  value: any;
  logic?: 'AND' | 'OR';
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter[];
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
}

interface SearchResult<T = any> {
  item: T;
  score: number;
  matches: Array<{
    field: string;
    value: string;
    highlight: string;
  }>;
}

interface AdvancedSearchProps<T = any> {
  data: T[];
  fields: SearchField[];
  onSearch: (results: SearchResult<T>[]) => void;
  onFiltersChange?: (filters: SearchFilter[]) => void;
  placeholder?: string;
  enableFuzzySearch?: boolean;
  enableSavedSearches?: boolean;
  enableGlobalSearch?: boolean;
  maxResults?: number;
  className?: string;
}

const OPERATORS = {
  text: ['contains', 'equals', 'startsWith', 'endsWith', 'exists', 'notExists'],
  number: ['equals', 'greaterThan', 'lessThan', 'between', 'exists', 'notExists'],
  date: ['equals', 'greaterThan', 'lessThan', 'between', 'exists', 'notExists'],
  select: ['equals', 'in', 'notIn', 'exists', 'notExists'],
  boolean: ['equals', 'exists', 'notExists'],
  range: ['between', 'greaterThan', 'lessThan']
};

const AdvancedSearch = <T extends Record<string, any>>({
  data,
  fields,
  onSearch,
  onFiltersChange,
  placeholder = 'Search...',
  enableFuzzySearch = true,
  enableSavedSearches = true,
  enableGlobalSearch = true,
  maxResults = 100,
  className = ''
}: AdvancedSearchProps<T>) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Load saved searches and history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('advanced-search-saved');
      if (saved) {
        const parsedSaved = JSON.parse(saved).map((search: any) => ({
          ...search,
          createdAt: new Date(search.createdAt),
          lastUsed: new Date(search.lastUsed)
        }));
        setSavedSearches(parsedSaved);
      }
      
      const history = localStorage.getItem('advanced-search-history');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search data:', error);
    }
  }, []);
  
  // Save to localStorage when data changes
  useEffect(() => {
    try {
      localStorage.setItem('advanced-search-saved', JSON.stringify(savedSearches));
    } catch (error) {
      console.error('Error saving search data:', error);
    }
  }, [savedSearches]);
  
  useEffect(() => {
    try {
      localStorage.setItem('advanced-search-history', JSON.stringify(searchHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }, [searchHistory]);
  
  // Fuzzy search implementation
  const fuzzyMatch = useCallback((text: string, pattern: string): { score: number; matches: number[] } => {
    if (!enableFuzzySearch) {
      const index = text.toLowerCase().indexOf(pattern.toLowerCase());
      return {
        score: index !== -1 ? 1 : 0,
        matches: index !== -1 ? Array.from({ length: pattern.length }, (_, i) => index + i) : []
      };
    }
    
    const textLower = text.toLowerCase();
    const patternLower = pattern.toLowerCase();
    
    let score = 0;
    let textIndex = 0;
    let patternIndex = 0;
    const matches: number[] = [];
    
    while (textIndex < textLower.length && patternIndex < patternLower.length) {
      if (textLower[textIndex] === patternLower[patternIndex]) {
        matches.push(textIndex);
        score += 1;
        patternIndex++;
      }
      textIndex++;
    }
    
    // Bonus for exact matches
    if (textLower.includes(patternLower)) {
      score += patternLower.length;
    }
    
    // Bonus for word boundaries
    if (textLower.startsWith(patternLower)) {
      score += patternLower.length * 0.5;
    }
    
    return {
      score: patternIndex === patternLower.length ? score / patternLower.length : 0,
      matches
    };
  }, [enableFuzzySearch]);
  
  // Apply filters to data
  const applyFilters = useCallback((items: T[], filtersToApply: SearchFilter[]): T[] => {
    if (filtersToApply.length === 0) return items;
    
    return items.filter(item => {
      let result = true;
      let currentLogic: 'AND' | 'OR' = 'AND';
      
      for (const filter of filtersToApply) {
        const fieldValue = item[filter.field];
        let filterResult = false;
        
        switch (filter.operator) {
          case 'equals':
            filterResult = fieldValue === filter.value;
            break;
            
          case 'contains':
            filterResult = String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
            break;
            
          case 'startsWith':
            filterResult = String(fieldValue).toLowerCase().startsWith(String(filter.value).toLowerCase());
            break;
            
          case 'endsWith':
            filterResult = String(fieldValue).toLowerCase().endsWith(String(filter.value).toLowerCase());
            break;
            
          case 'greaterThan':
            filterResult = Number(fieldValue) > Number(filter.value);
            break;
            
          case 'lessThan':
            filterResult = Number(fieldValue) < Number(filter.value);
            break;
            
          case 'between':
            if (Array.isArray(filter.value) && filter.value.length === 2) {
              const [min, max] = filter.value;
              filterResult = Number(fieldValue) >= Number(min) && Number(fieldValue) <= Number(max);
            }
            break;
            
          case 'in':
            filterResult = Array.isArray(filter.value) && filter.value.includes(fieldValue);
            break;
            
          case 'notIn':
            filterResult = Array.isArray(filter.value) && !filter.value.includes(fieldValue);
            break;
            
          case 'exists':
            filterResult = fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
            break;
            
          case 'notExists':
            filterResult = fieldValue === null || fieldValue === undefined || fieldValue === '';
            break;
        }
        
        if (currentLogic === 'AND') {
          result = result && filterResult;
        } else {
          result = result || filterResult;
        }
        
        currentLogic = filter.logic || 'AND';
      }
      
      return result;
    });
  }, []);
  
  // Perform search
  const performSearch = useCallback((searchQuery: string, searchFilters: SearchFilter[]) => {
    setIsSearching(true);
    
    try {
      let results: SearchResult<T>[] = [];
      
      // Apply filters first
      const filteredData = applyFilters(data, searchFilters);
      
      if (searchQuery.trim() === '') {
        // No query, return filtered data
        results = filteredData.map(item => ({
          item,
          score: 1,
          matches: []
        }));
      } else {
        // Search in filtered data
        const searchableFields = fields.filter(field => field.searchable !== false);
        
        for (const item of filteredData) {
          let totalScore = 0;
          const matches: SearchResult<T>['matches'] = [];
          
          for (const field of searchableFields) {
            const fieldValue = String(item[field.key] || '');
            const { score, matches: fieldMatches } = fuzzyMatch(fieldValue, searchQuery);
            
            if (score > 0) {
              totalScore += score;
              
              // Create highlighted text
              let highlighted = fieldValue;
              if (fieldMatches.length > 0) {
                const chars = fieldValue.split('');
                fieldMatches.forEach(index => {
                  chars[index] = `<mark>${chars[index]}</mark>`;
                });
                highlighted = chars.join('');
              }
              
              matches.push({
                field: field.key,
                value: fieldValue,
                highlight: highlighted
              });
            }
          }
          
          if (totalScore > 0) {
            results.push({
              item,
              score: totalScore,
              matches
            });
          }
        }
        
        // Sort by score
        results.sort((a, b) => b.score - a.score);
      }
      
      // Limit results
      if (results.length > maxResults) {
        results = results.slice(0, maxResults);
      }
      
      onSearch(results);
      
      // Add to search history
      if (searchQuery.trim() && !searchHistory.includes(searchQuery)) {
        setSearchHistory(prev => [searchQuery, ...prev.slice(0, 9)]); // Keep last 10
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [data, fields, fuzzyMatch, applyFilters, onSearch, maxResults, searchHistory]);
  
  // Debounced search
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(query, filters);
    }, 300);
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, filters, performSearch]);
  
  // Generate suggestions
  const generateSuggestions = useCallback((input: string) => {
    if (input.length < 2) {
      setSuggestions([]);
      return;
    }
    
    const suggestions = new Set<string>();
    
    // Add from search history
    searchHistory.forEach(historyItem => {
      if (historyItem.toLowerCase().includes(input.toLowerCase())) {
        suggestions.add(historyItem);
      }
    });
    
    // Add from data
    const searchableFields = fields.filter(field => field.searchable !== false);
    
    for (const item of data.slice(0, 100)) { // Limit for performance
      for (const field of searchableFields) {
        const value = String(item[field.key] || '');
        if (value.toLowerCase().includes(input.toLowerCase())) {
          suggestions.add(value);
        }
      }
    }
    
    setSuggestions(Array.from(suggestions).slice(0, 10));
  }, [searchHistory, data, fields]);
  
  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    generateSuggestions(value);
    setShowSuggestions(true);
  }, [generateSuggestions]);
  
  // Add filter
  const addFilter = useCallback(() => {
    const newFilter: SearchFilter = {
      id: `filter_${Date.now()}`,
      field: fields[0]?.key || '',
      operator: 'contains',
      value: '',
      logic: 'AND'
    };
    
    const newFilters = [...filters, newFilter];
    setFilters(newFilters);
    
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  }, [filters, fields, onFiltersChange]);
  
  // Update filter
  const updateFilter = useCallback((filterId: string, updates: Partial<SearchFilter>) => {
    const newFilters = filters.map(filter => 
      filter.id === filterId ? { ...filter, ...updates } : filter
    );
    
    setFilters(newFilters);
    
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  }, [filters, onFiltersChange]);
  
  // Remove filter
  const removeFilter = useCallback((filterId: string) => {
    const newFilters = filters.filter(filter => filter.id !== filterId);
    setFilters(newFilters);
    
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  }, [filters, onFiltersChange]);
  
  // Save search
  const saveSearch = useCallback(() => {
    const name = prompt('Enter a name for this search:');
    if (!name) return;
    
    const savedSearch: SavedSearch = {
      id: `search_${Date.now()}`,
      name,
      query,
      filters,
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 1
    };
    
    setSavedSearches(prev => [savedSearch, ...prev]);
  }, [query, filters]);
  
  // Load saved search
  const loadSavedSearch = useCallback((savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    
    // Update usage stats
    setSavedSearches(prev => 
      prev.map(search => 
        search.id === savedSearch.id 
          ? { ...search, lastUsed: new Date(), useCount: search.useCount + 1 }
          : search
      )
    );
    
    setShowSavedSearches(false);
  }, []);
  
  // Delete saved search
  const deleteSavedSearch = useCallback((searchId: string) => {
    setSavedSearches(prev => prev.filter(search => search.id !== searchId));
  }, []);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters([]);
    if (onFiltersChange) {
      onFiltersChange([]);
    }
  }, [onFiltersChange]);
  
  // Get field by key
  const getField = useCallback((key: string) => {
    return fields.find(field => field.key === key);
  }, [fields]);
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className="w-full pl-10 pr-20 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {isSearching && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
            )}
            
            {enableSavedSearches && (
              <button
                onClick={() => setShowSavedSearches(!showSavedSearches)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Saved searches"
              >
                <Star className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1 transition-colors ${
                showFilters || filters.length > 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Filters"
            >
              <Filter className="w-4 h-4" />
              {filters.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {filters.length}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(suggestion);
                  setShowSuggestions(false);
                  searchInputRef.current?.focus();
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Saved Searches Panel */}
      {showSavedSearches && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Saved Searches
            </h3>
            
            <div className="flex items-center space-x-2">
              {(query || filters.length > 0) && (
                <button
                  onClick={saveSearch}
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  <Save className="w-3 h-3" />
                  <span>Save Current</span>
                </button>
              )}
              
              <button
                onClick={() => setShowSavedSearches(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {savedSearches.length > 0 ? (
            <div className="space-y-2">
              {savedSearches.map(savedSearch => (
                <div
                  key={savedSearch.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <div className="flex-1 cursor-pointer" onClick={() => loadSavedSearch(savedSearch)}>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {savedSearch.name}
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {savedSearch.query && `"${savedSearch.query}"`}
                      {savedSearch.filters.length > 0 && ` • ${savedSearch.filters.length} filters`}
                      {` • Used ${savedSearch.useCount} times`}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteSavedSearch(savedSearch.id)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No saved searches yet
            </p>
          )}
        </div>
      )}
      
      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Advanced Filters
            </h3>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={addFilter}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Filter</span>
              </button>
              
              {filters.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>
          
          {filters.length > 0 ? (
            <div className="space-y-3">
              {filters.map((filter, index) => {
                const field = getField(filter.field);
                const availableOperators = OPERATORS[field?.type || 'text'];
                
                return (
                  <div key={filter.id} className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    {/* Logic Operator */}
                    {index > 0 && (
                      <select
                        value={filter.logic || 'AND'}
                        onChange={(e) => updateFilter(filter.id, { logic: e.target.value as 'AND' | 'OR' })}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    )}
                    
                    {/* Field */}
                    <select
                      value={filter.field}
                      onChange={(e) => updateFilter(filter.id, { field: e.target.value, operator: 'contains', value: '' })}
                      className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      {fields.filter(f => f.filterable !== false).map(field => (
                        <option key={field.key} value={field.key}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                    
                    {/* Operator */}
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(filter.id, { operator: e.target.value as any, value: '' })}
                      className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      {availableOperators.map(op => (
                        <option key={op} value={op}>
                          {op.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </option>
                      ))}
                    </select>
                    
                    {/* Value */}
                    {!['exists', 'notExists'].includes(filter.operator) && (
                      <div className="flex-1">
                        {field?.type === 'select' ? (
                          <select
                            value={filter.value}
                            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          >
                            <option value="">Select value</option>
                            {field.options?.map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : field?.type === 'date' ? (
                          <SmartDatePicker
                            value={filter.value}
                            onChange={(value) => updateFilter(filter.id, { value })}
                            mode={filter.operator === 'between' ? 'range' : 'single'}
                          />
                        ) : filter.operator === 'between' ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type={field?.type === 'number' ? 'number' : 'text'}
                              value={Array.isArray(filter.value) ? filter.value[0] || '' : ''}
                              onChange={(e) => {
                                const newValue = [e.target.value, Array.isArray(filter.value) ? filter.value[1] || '' : ''];
                                updateFilter(filter.id, { value: newValue });
                              }}
                              placeholder="Min"
                              className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                            <span className="text-xs text-gray-500">to</span>
                            <input
                              type={field?.type === 'number' ? 'number' : 'text'}
                              value={Array.isArray(filter.value) ? filter.value[1] || '' : ''}
                              onChange={(e) => {
                                const newValue = [Array.isArray(filter.value) ? filter.value[0] || '' : '', e.target.value];
                                updateFilter(filter.id, { value: newValue });
                              }}
                              placeholder="Max"
                              className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        ) : (
                          <input
                            type={field?.type === 'number' ? 'number' : 'text'}
                            value={filter.value}
                            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                            placeholder={field?.placeholder || 'Enter value'}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                        )}
                      </div>
                    )}
                    
                    {/* Remove Filter */}
                    <button
                      onClick={() => removeFilter(filter.id)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No filters applied. Click "Add Filter" to get started.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
export type { SearchField, SearchFilter, SavedSearch, SearchResult, AdvancedSearchProps };
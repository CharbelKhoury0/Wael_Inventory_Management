import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { SearchableItem, SearchResult } from './GlobalSearch';
import { SearchField, SearchFilter } from './AdvancedSearch';

interface SearchContextType {
  // Global search state
  globalQuery: string;
  setGlobalQuery: (query: string) => void;
  globalResults: SearchResult[];
  isGlobalSearchOpen: boolean;
  setIsGlobalSearchOpen: (open: boolean) => void;
  
  // Advanced search state
  advancedQuery: string;
  setAdvancedQuery: (query: string) => void;
  advancedFilters: SearchFilter[];
  setAdvancedFilters: (filters: SearchFilter[]) => void;
  advancedResults: SearchResult[];
  
  // Search data
  searchableData: SearchableItem[];
  addSearchableData: (data: SearchableItem[]) => void;
  removeSearchableData: (ids: string[]) => void;
  updateSearchableData: (data: SearchableItem[]) => void;
  
  // Search history and favorites
  searchHistory: string[];
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  favorites: string[];
  addToFavorites: (id: string) => void;
  removeFromFavorites: (id: string) => void;
  
  // Search configuration
  searchFields: SearchField[];
  setSearchFields: (fields: SearchField[]) => void;
  
  // Search actions
  performGlobalSearch: (query: string) => void;
  performAdvancedSearch: (query: string, filters: SearchFilter[]) => void;
  clearAllSearches: () => void;
  
  // Search analytics
  searchStats: {
    totalSearches: number;
    popularQueries: Array<{ query: string; count: number }>;
    averageResultsPerSearch: number;
  };
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
  children: React.ReactNode;
  initialData?: SearchableItem[];
  initialFields?: SearchField[];
}

export const SearchProvider: React.FC<SearchProviderProps> = ({
  children,
  initialData = [],
  initialFields = []
}) => {
  // State
  const [globalQuery, setGlobalQuery] = useState('');
  const [globalResults, setGlobalResults] = useState<SearchResult[]>([]);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  
  const [advancedQuery, setAdvancedQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<SearchFilter[]>([]);
  const [advancedResults, setAdvancedResults] = useState<SearchResult[]>([]);
  
  const [searchableData, setSearchableData] = useState<SearchableItem[]>(initialData);
  const [searchFields, setSearchFields] = useState<SearchField[]>(initialFields);
  
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const [searchStats, setSearchStats] = useState({
    totalSearches: 0,
    popularQueries: [] as Array<{ query: string; count: number }>,
    averageResultsPerSearch: 0
  });
  
  // Load persisted data
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('search-provider-history');
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
      
      const savedFavorites = localStorage.getItem('search-provider-favorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
      
      const savedStats = localStorage.getItem('search-provider-stats');
      if (savedStats) {
        setSearchStats(JSON.parse(savedStats));
      }
    } catch (error) {
      console.error('Error loading search provider data:', error);
    }
  }, []);
  
  // Persist data changes
  useEffect(() => {
    try {
      localStorage.setItem('search-provider-history', JSON.stringify(searchHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }, [searchHistory]);
  
  useEffect(() => {
    try {
      localStorage.setItem('search-provider-favorites', JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }, [favorites]);
  
  useEffect(() => {
    try {
      localStorage.setItem('search-provider-stats', JSON.stringify(searchStats));
    } catch (error) {
      console.error('Error saving search stats:', error);
    }
  }, [searchStats]);
  
  // Fuzzy search implementation
  const fuzzySearch = useCallback((text: string, pattern: string) => {
    const textLower = text.toLowerCase();
    const patternLower = pattern.toLowerCase();
    
    let score = 0;
    let textIndex = 0;
    let patternIndex = 0;
    const positions: number[] = [];
    
    // Exact match bonus
    if (textLower.includes(patternLower)) {
      score += patternLower.length * 2;
    }
    
    // Word boundary bonus
    if (textLower.startsWith(patternLower)) {
      score += patternLower.length;
    }
    
    // Character matching
    while (textIndex < textLower.length && patternIndex < patternLower.length) {
      if (textLower[textIndex] === patternLower[patternIndex]) {
        positions.push(textIndex);
        score += 1;
        patternIndex++;
      }
      textIndex++;
    }
    
    // Completion bonus
    if (patternIndex === patternLower.length) {
      score += patternLower.length;
    }
    
    return {
      score: patternIndex === patternLower.length ? score : 0,
      positions
    };
  }, []);
  
  // Apply filters to data
  const applyFilters = useCallback((items: SearchableItem[], filters: SearchFilter[]): SearchableItem[] => {
    if (filters.length === 0) return items;
    
    return items.filter(item => {
      let result = true;
      let currentLogic: 'AND' | 'OR' = 'AND';
      
      for (const filter of filters) {
        const fieldValue = item.metadata?.[filter.field] || (item as any)[filter.field];
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
  
  // Perform global search
  const performGlobalSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setGlobalResults([]);
      return;
    }
    
    const results: SearchResult[] = [];
    
    for (const item of searchableData) {
      let totalScore = 0;
      const highlights: SearchResult['highlights'] = [];
      
      // Search in title
      const titleMatch = fuzzySearch(item.title, query);
      if (titleMatch.score > 0) {
        totalScore += titleMatch.score * 3;
        highlights.push({
          field: 'title',
          text: item.title,
          positions: titleMatch.positions
        });
      }
      
      // Search in subtitle
      if (item.subtitle) {
        const subtitleMatch = fuzzySearch(item.subtitle, query);
        if (subtitleMatch.score > 0) {
          totalScore += subtitleMatch.score * 2;
          highlights.push({
            field: 'subtitle',
            text: item.subtitle,
            positions: subtitleMatch.positions
          });
        }
      }
      
      // Search in description
      if (item.description) {
        const descMatch = fuzzySearch(item.description, query);
        if (descMatch.score > 0) {
          totalScore += descMatch.score;
          highlights.push({
            field: 'description',
            text: item.description,
            positions: descMatch.positions
          });
        }
      }
      
      // Search in searchable text
      const searchableMatch = fuzzySearch(item.searchableText, query);
      if (searchableMatch.score > 0) {
        totalScore += searchableMatch.score;
      }
      
      // Priority bonus
      if (item.priority) {
        totalScore += item.priority;
      }
      
      // Favorites bonus
      if (favorites.includes(item.id)) {
        totalScore += 10;
      }
      
      if (totalScore > 0) {
        results.push({
          ...item,
          score: totalScore,
          highlights
        });
      }
    }
    
    // Sort by score
    const sortedResults = results.sort((a, b) => b.score - a.score);
    setGlobalResults(sortedResults);
    
    // Update stats
    updateSearchStats(query, sortedResults.length);
  }, [searchableData, fuzzySearch, favorites]);
  
  // Perform advanced search
  const performAdvancedSearch = useCallback((query: string, filters: SearchFilter[]) => {
    // Apply filters first
    const filteredData = applyFilters(searchableData, filters);
    
    if (!query.trim()) {
      // No query, return filtered data
      const results = filteredData.map(item => ({
        ...item,
        score: 1,
        highlights: [] as SearchResult['highlights']
      }));
      setAdvancedResults(results);
      return;
    }
    
    const results: SearchResult[] = [];
    
    for (const item of filteredData) {
      let totalScore = 0;
      const highlights: SearchResult['highlights'] = [];
      
      // Search in searchable fields
      const searchableFields = searchFields.filter(field => field.searchable !== false);
      
      for (const field of searchableFields) {
        const fieldValue = String(item.metadata?.[field.key] || (item as any)[field.key] || '');
        const fieldMatch = fuzzySearch(fieldValue, query);
        
        if (fieldMatch.score > 0) {
          totalScore += fieldMatch.score;
          highlights.push({
            field: field.key,
            text: fieldValue,
            positions: fieldMatch.positions
          });
        }
      }
      
      // Priority bonus
      if (item.priority) {
        totalScore += item.priority;
      }
      
      // Favorites bonus
      if (favorites.includes(item.id)) {
        totalScore += 10;
      }
      
      if (totalScore > 0) {
        results.push({
          ...item,
          score: totalScore,
          highlights
        });
      }
    }
    
    // Sort by score
    const sortedResults = results.sort((a, b) => b.score - a.score);
    setAdvancedResults(sortedResults);
    
    // Update stats
    updateSearchStats(query, sortedResults.length);
  }, [searchableData, searchFields, applyFilters, fuzzySearch, favorites]);
  
  // Update search statistics
  const updateSearchStats = useCallback((query: string, resultCount: number) => {
    setSearchStats(prev => {
      const newTotalSearches = prev.totalSearches + 1;
      const newAverageResults = ((prev.averageResultsPerSearch * prev.totalSearches) + resultCount) / newTotalSearches;
      
      // Update popular queries
      const existingQuery = prev.popularQueries.find(q => q.query === query);
      let newPopularQueries;
      
      if (existingQuery) {
        newPopularQueries = prev.popularQueries.map(q => 
          q.query === query ? { ...q, count: q.count + 1 } : q
        );
      } else {
        newPopularQueries = [...prev.popularQueries, { query, count: 1 }];
      }
      
      // Sort and limit popular queries
      newPopularQueries = newPopularQueries
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      return {
        totalSearches: newTotalSearches,
        popularQueries: newPopularQueries,
        averageResultsPerSearch: newAverageResults
      };
    });
  }, []);
  
  // Data management functions
  const addSearchableData = useCallback((data: SearchableItem[]) => {
    setSearchableData(prev => {
      const existingIds = new Set(prev.map(item => item.id));
      const newItems = data.filter(item => !existingIds.has(item.id));
      return [...prev, ...newItems];
    });
  }, []);
  
  const removeSearchableData = useCallback((ids: string[]) => {
    setSearchableData(prev => prev.filter(item => !ids.includes(item.id)));
  }, []);
  
  const updateSearchableData = useCallback((data: SearchableItem[]) => {
    setSearchableData(prev => {
      const updatedItems = new Map(data.map(item => [item.id, item]));
      return prev.map(item => updatedItems.get(item.id) || item);
    });
  }, []);
  
  // History management
  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h !== query);
      return [query, ...filtered].slice(0, 20); // Keep last 20
    });
  }, []);
  
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);
  
  // Favorites management
  const addToFavorites = useCallback((id: string) => {
    setFavorites(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);
  
  const removeFromFavorites = useCallback((id: string) => {
    setFavorites(prev => prev.filter(fav => fav !== id));
  }, []);
  
  // Clear all searches
  const clearAllSearches = useCallback(() => {
    setGlobalQuery('');
    setGlobalResults([]);
    setAdvancedQuery('');
    setAdvancedFilters([]);
    setAdvancedResults([]);
  }, []);
  
  // Context value
  const contextValue = useMemo(() => ({
    // Global search
    globalQuery,
    setGlobalQuery,
    globalResults,
    isGlobalSearchOpen,
    setIsGlobalSearchOpen,
    
    // Advanced search
    advancedQuery,
    setAdvancedQuery,
    advancedFilters,
    setAdvancedFilters,
    advancedResults,
    
    // Search data
    searchableData,
    addSearchableData,
    removeSearchableData,
    updateSearchableData,
    
    // History and favorites
    searchHistory,
    addToHistory,
    clearHistory,
    favorites,
    addToFavorites,
    removeFromFavorites,
    
    // Configuration
    searchFields,
    setSearchFields,
    
    // Actions
    performGlobalSearch,
    performAdvancedSearch,
    clearAllSearches,
    
    // Analytics
    searchStats
  }), [
    globalQuery, globalResults, isGlobalSearchOpen,
    advancedQuery, advancedFilters, advancedResults,
    searchableData, searchHistory, favorites, searchFields, searchStats,
    addSearchableData, removeSearchableData, updateSearchableData,
    addToHistory, clearHistory, addToFavorites, removeFromFavorites,
    performGlobalSearch, performAdvancedSearch, clearAllSearches
  ]);
  
  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export default SearchProvider;
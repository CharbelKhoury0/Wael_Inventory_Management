import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Clock, Star, Filter, ArrowRight, Zap, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface SearchableItem {
  id: string;
  type: 'item' | 'transaction' | 'movement' | 'receipt' | 'user' | 'category';
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Record<string, any>;
  searchableText: string;
  url?: string;
  icon?: React.ReactNode;
  priority?: number;
}

interface SearchResult extends SearchableItem {
  score: number;
  highlights: Array<{
    field: string;
    text: string;
    positions: number[];
  }>;
}

interface SearchCategory {
  type: SearchableItem['type'];
  label: string;
  icon: React.ReactNode;
  color: string;
}

interface GlobalSearchProps {
  data: SearchableItem[];
  onSelect?: (item: SearchableItem) => void;
  onNavigate?: (url: string) => void;
  placeholder?: string;
  maxResults?: number;
  enableCategories?: boolean;
  enableHistory?: boolean;
  enableShortcuts?: boolean;
  className?: string;
}

const SEARCH_CATEGORIES: SearchCategory[] = [
  {
    type: 'item',
    label: 'Items',
    icon: <div className="w-2 h-2 bg-blue-500 rounded-full" />,
    color: 'blue'
  },
  {
    type: 'transaction',
    label: 'Transactions',
    icon: <div className="w-2 h-2 bg-green-500 rounded-full" />,
    color: 'green'
  },
  {
    type: 'movement',
    label: 'Movements',
    icon: <div className="w-2 h-2 bg-purple-500 rounded-full" />,
    color: 'purple'
  },
  {
    type: 'receipt',
    label: 'Receipts',
    icon: <div className="w-2 h-2 bg-orange-500 rounded-full" />,
    color: 'orange'
  },
  {
    type: 'user',
    label: 'Users',
    icon: <div className="w-2 h-2 bg-pink-500 rounded-full" />,
    color: 'pink'
  },
  {
    type: 'category',
    label: 'Categories',
    icon: <div className="w-2 h-2 bg-yellow-500 rounded-full" />,
    color: 'yellow'
  }
];

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  data,
  onSelect,
  onNavigate,
  placeholder = 'Search everything...',
  maxResults = 50,
  enableCategories = true,
  enableHistory = true,
  enableShortcuts = true,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Load search history and favorites from localStorage
  useEffect(() => {
    if (enableHistory) {
      try {
        const history = localStorage.getItem('global-search-history');
        if (history) {
          setSearchHistory(JSON.parse(history));
        }
        
        const favs = localStorage.getItem('global-search-favorites');
        if (favs) {
          setFavorites(JSON.parse(favs));
        }
      } catch (error) {
        console.error('Error loading search data:', error);
      }
    }
  }, [enableHistory]);
  
  // Save to localStorage when data changes
  useEffect(() => {
    if (enableHistory) {
      try {
        localStorage.setItem('global-search-history', JSON.stringify(searchHistory));
      } catch (error) {
        console.error('Error saving search history:', error);
      }
    }
  }, [searchHistory, enableHistory]);
  
  useEffect(() => {
    if (enableHistory) {
      try {
        localStorage.setItem('global-search-favorites', JSON.stringify(favorites));
      } catch (error) {
        console.error('Error saving favorites:', error);
      }
    }
  }, [favorites, enableHistory]);
  
  // Fuzzy search with highlighting
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
  
  // Highlight text with positions
  const highlightText = useCallback((text: string, positions: number[], className = 'bg-yellow-200 dark:bg-yellow-800') => {
    if (positions.length === 0) return text;
    
    const chars = text.split('');
    const highlighted: React.ReactNode[] = [];
    let lastIndex = 0;
    
    positions.forEach((pos, index) => {
      // Add text before highlight
      if (pos > lastIndex) {
        highlighted.push(text.slice(lastIndex, pos));
      }
      
      // Add highlighted character
      highlighted.push(
        <span key={`highlight-${index}`} className={className}>
          {chars[pos]}
        </span>
      );
      
      lastIndex = pos + 1;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      highlighted.push(text.slice(lastIndex));
    }
    
    return highlighted;
  }, []);
  
  // Perform search
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      return [];
    }
    
    setIsSearching(true);
    
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();
    
    for (const item of data) {
      // Skip if category filter is active and doesn't match
      if (selectedCategory && item.type !== selectedCategory) {
        continue;
      }
      
      let totalScore = 0;
      const highlights: SearchResult['highlights'] = [];
      
      // Search in title
      const titleMatch = fuzzySearch(item.title, query);
      if (titleMatch.score > 0) {
        totalScore += titleMatch.score * 3; // Title has higher weight
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
    
    // Sort by score and limit results
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
    
    setIsSearching(false);
    return sortedResults;
  }, [query, data, selectedCategory, fuzzySearch, favorites, maxResults]);
  
  // Group results by category
  const groupedResults = useMemo(() => {
    if (!enableCategories) {
      return { all: searchResults };
    }
    
    const grouped: Record<string, SearchResult[]> = {};
    
    searchResults.forEach(result => {
      if (!grouped[result.type]) {
        grouped[result.type] = [];
      }
      grouped[result.type].push(result);
    });
    
    return grouped;
  }, [searchResults, enableCategories]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : 0
          );
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : searchResults.length - 1
          );
          break;
          
        case 'Enter':
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            handleSelect(searchResults[selectedIndex]);
          }
          break;
          
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex]);
  
  // Global keyboard shortcut
  useEffect(() => {
    if (!enableShortcuts) return;
    
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [enableShortcuts]);
  
  // Handle input change with debouncing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(0);
    
    // Reset category filter when query changes
    if (value.trim() === '') {
      setSelectedCategory(null);
    }
  }, []);
  
  // Handle item selection
  const handleSelect = useCallback((item: SearchableItem) => {
    // Add to search history
    if (enableHistory && query.trim()) {
      setSearchHistory(prev => {
        const filtered = prev.filter(h => h !== query);
        return [query, ...filtered].slice(0, 10); // Keep last 10
      });
    }
    
    // Close search
    setIsOpen(false);
    setQuery('');
    
    // Handle selection
    if (onSelect) {
      onSelect(item);
    }
    
    if (item.url && onNavigate) {
      onNavigate(item.url);
    }
    
    toast.success(`Navigated to ${item.title}`);
  }, [query, enableHistory, onSelect, onNavigate]);
  
  // Toggle favorite
  const toggleFavorite = useCallback((itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setFavorites(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  }, []);
  
  // Get category info
  const getCategoryInfo = useCallback((type: string) => {
    return SEARCH_CATEGORIES.find(cat => cat.type === type);
  }, []);
  
  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-16 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {enableShortcuts && (
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded border">
                ⌘K
              </kbd>
            )}
            
            {isSearching && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
            )}
            
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setSelectedCategory(null);
                  inputRef.current?.focus();
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Search Results */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-96 overflow-hidden">
          {/* Category Filters */}
          {enableCategories && query.trim() && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex items-center space-x-1 px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                    selectedCategory === null
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>All</span>
                </button>
                
                {SEARCH_CATEGORIES.map(category => {
                  const count = groupedResults[category.type]?.length || 0;
                  if (count === 0) return null;
                  
                  return (
                    <button
                      key={category.type}
                      onClick={() => setSelectedCategory(category.type)}
                      className={`flex items-center space-x-1 px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                        selectedCategory === category.type
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {category.icon}
                      <span>{category.label}</span>
                      <span className="bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1 rounded-full text-xs">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Results List */}
          <div ref={resultsRef} className="max-h-80 overflow-y-auto">
            {query.trim() === '' ? (
              // Show search history and favorites when no query
              <div className="p-4">
                {enableHistory && searchHistory.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Recent Searches
                    </h4>
                    
                    <div className="space-y-1">
                      {searchHistory.slice(0, 5).map((historyItem, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setQuery(historyItem);
                            inputRef.current?.focus();
                          }}
                          className="w-full text-left px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          {historyItem}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Start typing to search everything...</p>
                  {enableShortcuts && (
                    <p className="text-xs mt-1">Press ⌘K to focus search</p>
                  )}
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              // Show search results
              <div className="py-2">
                {searchResults.map((result, index) => {
                  const categoryInfo = getCategoryInfo(result.type);
                  const isSelected = index === selectedIndex;
                  const isFavorite = favorites.includes(result.id);
                  
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {categoryInfo?.icon}
                            
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {result.highlights.find(h => h.field === 'title') ? (
                                highlightText(
                                  result.title,
                                  result.highlights.find(h => h.field === 'title')?.positions || []
                                )
                              ) : (
                                result.title
                              )}
                            </h4>
                            
                            <span className={`text-xs px-1.5 py-0.5 rounded-full bg-${categoryInfo?.color}-100 dark:bg-${categoryInfo?.color}-900 text-${categoryInfo?.color}-700 dark:text-${categoryInfo?.color}-300`}>
                              {categoryInfo?.label}
                            </span>
                          </div>
                          
                          {result.subtitle && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {result.highlights.find(h => h.field === 'subtitle') ? (
                                highlightText(
                                  result.subtitle,
                                  result.highlights.find(h => h.field === 'subtitle')?.positions || []
                                )
                              ) : (
                                result.subtitle
                              )}
                            </p>
                          )}
                          
                          {result.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
                              {result.highlights.find(h => h.field === 'description') ? (
                                highlightText(
                                  result.description,
                                  result.highlights.find(h => h.field === 'description')?.positions || []
                                )
                              ) : (
                                result.description
                              )}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={(e) => toggleFavorite(result.id, e)}
                            className={`p-1 rounded transition-colors ${
                              isFavorite
                                ? 'text-yellow-500 hover:text-yellow-600'
                                : 'text-gray-400 hover:text-yellow-500'
                            }`}
                          >
                            <Star className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
                          </button>
                          
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              // No results
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No results found for "{query}"</p>
                <p className="text-xs mt-1">Try adjusting your search terms</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          {query.trim() && searchResults.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  {searchResults.length === maxResults ? ` (showing first ${maxResults})` : ''}
                </span>
                
                <div className="flex items-center space-x-2">
                  <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">↑↓</kbd>
                  <span>navigate</span>
                  <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">↵</kbd>
                  <span>select</span>
                  <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">esc</kbd>
                  <span>close</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default GlobalSearch;
export type { SearchableItem, SearchResult, SearchCategory, GlobalSearchProps };
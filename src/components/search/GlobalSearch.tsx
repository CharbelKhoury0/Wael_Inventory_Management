import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, Command, ArrowRight, Clock, Star, Hash, Package, Users, FileText, Settings, X, Filter } from 'lucide-react';

interface SearchCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  searchFields: string[];
  resultTemplate: (item: any) => React.ReactNode;
  onClick?: (item: any) => void;
}

interface SearchResult {
  id: string;
  category: string;
  item: any;
  score: number;
  matches: Array<{
    field: string;
    value: string;
    highlight: string;
  }>;
}

interface GlobalSearchProps {
  data: Record<string, any[]>; // { categoryId: items[] }
  categories: SearchCategory[];
  onResultClick?: (result: SearchResult) => void;
  onCategoryFilter?: (categoryId: string | null) => void;
  placeholder?: string;
  maxResults?: number;
  enableShortcuts?: boolean;
  enableRecents?: boolean;
  className?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  data,
  categories,
  onResultClick,
  onCategoryFilter,
  placeholder = 'Search everything... (Ctrl+K)',
  maxResults = 50,
  enableShortcuts = true,
  enableRecents = true,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentResults, setRecentResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Load recent data from localStorage
  useEffect(() => {
    if (!enableRecents) return;
    
    try {
      const recent = localStorage.getItem('global-search-recent');
      if (recent) {
        setRecentSearches(JSON.parse(recent));
      }
      
      const recentRes = localStorage.getItem('global-search-recent-results');
      if (recentRes) {
        const parsed = JSON.parse(recentRes);
        setRecentResults(parsed);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, [enableRecents]);
  
  // Save recent data to localStorage
  useEffect(() => {
    if (!enableRecents) return;
    
    try {
      localStorage.setItem('global-search-recent', JSON.stringify(recentSearches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
  }, [recentSearches, enableRecents]);
  
  useEffect(() => {
    if (!enableRecents) return;
    
    try {
      localStorage.setItem('global-search-recent-results', JSON.stringify(recentResults));
    } catch (error) {
      console.error('Error saving recent results:', error);
    }
  }, [recentResults, enableRecents]);
  
  // Keyboard shortcuts
  useEffect(() => {
    if (!enableShortcuts) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      
      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(0);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableShortcuts]);
  
  // Fuzzy search implementation
  const fuzzyMatch = useCallback((text: string, pattern: string): { score: number; matches: number[] } => {
    const textLower = text.toLowerCase();
    const patternLower = pattern.toLowerCase();
    
    // Exact match gets highest score
    if (textLower === patternLower) {
      return { score: 100, matches: Array.from({ length: pattern.length }, (_, i) => i) };
    }
    
    // Contains match
    const containsIndex = textLower.indexOf(patternLower);
    if (containsIndex !== -1) {
      return {
        score: 80 - containsIndex, // Earlier matches score higher
        matches: Array.from({ length: pattern.length }, (_, i) => containsIndex + i)
      };
    }
    
    // Fuzzy match
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
    
    // Bonus for word boundaries
    if (textLower.startsWith(patternLower)) {
      score += 20;
    }
    
    // Bonus for consecutive matches
    let consecutiveBonus = 0;
    for (let i = 1; i < matches.length; i++) {
      if (matches[i] === matches[i - 1] + 1) {
        consecutiveBonus += 5;
      }
    }
    score += consecutiveBonus;
    
    return {
      score: patternIndex === patternLower.length ? score : 0,
      matches
    };
  }, []);
  
  // Perform search
  const search
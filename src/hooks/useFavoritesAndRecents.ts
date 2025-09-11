import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

interface FavoriteItem {
  id: string;
  type: string;
  data: any;
  addedAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  tags?: string[];
  notes?: string;
}

interface RecentItem {
  id: string;
  type: string;
  data: any;
  accessedAt: Date;
  action: string; // 'view', 'edit', 'create', etc.
}

interface UseFavoritesAndRecentsOptions {
  maxRecents?: number;
  maxFavorites?: number;
  storageKey?: string;
  enableToasts?: boolean;
  autoCleanup?: boolean;
  cleanupDays?: number;
}

interface UseFavoritesAndRecentsReturn {
  // Favorites
  favorites: FavoriteItem[];
  addToFavorites: (id: string, type: string, data: any, tags?: string[], notes?: string) => void;
  removeFromFavorites: (id: string) => void;
  isFavorite: (id: string) => boolean;
  updateFavorite: (id: string, updates: Partial<FavoriteItem>) => void;
  getFavoritesByType: (type: string) => FavoriteItem[];
  getFavoritesByTag: (tag: string) => FavoriteItem[];
  
  // Recents
  recents: RecentItem[];
  addToRecents: (id: string, type: string, data: any, action: string) => void;
  clearRecents: () => void;
  getRecentsByType: (type: string) => RecentItem[];
  getRecentsByAction: (action: string) => RecentItem[];
  
  // Combined
  getFrequentlyUsed: (limit?: number) => FavoriteItem[];
  searchFavorites: (query: string) => FavoriteItem[];
  exportData: () => string;
  importData: (data: string) => void;
  
  // Statistics
  getStats: () => {
    totalFavorites: number;
    totalRecents: number;
    favoritesByType: Record<string, number>;
    recentsByType: Record<string, number>;
    mostAccessedFavorite: FavoriteItem | null;
    recentActivity: RecentItem[];
  };
}

export const useFavoritesAndRecents = ({
  maxRecents = 50,
  maxFavorites = 100,
  storageKey = 'favorites-recents',
  enableToasts = true,
  autoCleanup = true,
  cleanupDays = 30
}: UseFavoritesAndRecentsOptions = {}): UseFavoritesAndRecentsReturn => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [recents, setRecents] = useState<RecentItem[]>([]);
  
  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const { favorites: storedFavorites, recents: storedRecents } = JSON.parse(stored);
        
        // Parse dates
        const parsedFavorites = storedFavorites.map((fav: any) => ({
          ...fav,
          addedAt: new Date(fav.addedAt),
          lastAccessedAt: new Date(fav.lastAccessedAt)
        }));
        
        const parsedRecents = storedRecents.map((rec: any) => ({
          ...rec,
          accessedAt: new Date(rec.accessedAt)
        }));
        
        setFavorites(parsedFavorites);
        setRecents(parsedRecents);
        
        // Auto cleanup old items
        if (autoCleanup) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - cleanupDays);
          
          const cleanedRecents = parsedRecents.filter(
            (item: RecentItem) => item.accessedAt > cutoffDate
          );
          
          if (cleanedRecents.length !== parsedRecents.length) {
            setRecents(cleanedRecents);
          }
        }
      }
    } catch (error) {
      console.error('Error loading favorites and recents:', error);
    }
  }, [storageKey, autoCleanup, cleanupDays]);
  
  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      const dataToStore = {
        favorites,
        recents
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Error saving favorites and recents:', error);
    }
  }, [favorites, recents, storageKey]);
  
  // Add to favorites
  const addToFavorites = useCallback((id: string, type: string, data: any, tags: string[] = [], notes: string = '') => {
    setFavorites(prev => {
      // Check if already exists
      const existingIndex = prev.findIndex(fav => fav.id === id);
      
      if (existingIndex !== -1) {
        // Update existing favorite
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          lastAccessedAt: new Date(),
          accessCount: updated[existingIndex].accessCount + 1,
          data, // Update data in case it changed
          tags,
          notes
        };
        
        if (enableToasts) {
          toast.success('Favorite updated', {
            duration: 2000,
            position: 'bottom-right'
          });
        }
        
        return updated;
      } else {
        // Add new favorite
        const newFavorite: FavoriteItem = {
          id,
          type,
          data,
          addedAt: new Date(),
          lastAccessedAt: new Date(),
          accessCount: 1,
          tags,
          notes
        };
        
        const newFavorites = [newFavorite, ...prev];
        
        // Limit favorites
        if (newFavorites.length > maxFavorites) {
          newFavorites.splice(maxFavorites);
        }
        
        if (enableToasts) {
          toast.success('Added to favorites', {
            duration: 2000,
            position: 'bottom-right'
          });
        }
        
        return newFavorites;
      }
    });
  }, [maxFavorites, enableToasts]);
  
  // Remove from favorites
  const removeFromFavorites = useCallback((id: string) => {
    setFavorites(prev => {
      const filtered = prev.filter(fav => fav.id !== id);
      
      if (filtered.length !== prev.length && enableToasts) {
        toast.info('Removed from favorites', {
          duration: 2000,
          position: 'bottom-right'
        });
      }
      
      return filtered;
    });
  }, [enableToasts]);
  
  // Check if item is favorite
  const isFavorite = useCallback((id: string): boolean => {
    return favorites.some(fav => fav.id === id);
  }, [favorites]);
  
  // Update favorite
  const updateFavorite = useCallback((id: string, updates: Partial<FavoriteItem>) => {
    setFavorites(prev => 
      prev.map(fav => 
        fav.id === id 
          ? { ...fav, ...updates, lastAccessedAt: new Date() }
          : fav
      )
    );
  }, []);
  
  // Get favorites by type
  const getFavoritesByType = useCallback((type: string): FavoriteItem[] => {
    return favorites.filter(fav => fav.type === type);
  }, [favorites]);
  
  // Get favorites by tag
  const getFavoritesByTag = useCallback((tag: string): FavoriteItem[] => {
    return favorites.filter(fav => fav.tags?.includes(tag));
  }, [favorites]);
  
  // Add to recents
  const addToRecents = useCallback((id: string, type: string, data: any, action: string) => {
    setRecents(prev => {
      // Remove existing entry for this item
      const filtered = prev.filter(rec => rec.id !== id);
      
      // Add new entry at the beginning
      const newRecent: RecentItem = {
        id,
        type,
        data,
        accessedAt: new Date(),
        action
      };
      
      const newRecents = [newRecent, ...filtered];
      
      // Limit recents
      if (newRecents.length > maxRecents) {
        newRecents.splice(maxRecents);
      }
      
      return newRecents;
    });
    
    // Update favorite access count if it exists
    if (isFavorite(id)) {
      updateFavorite(id, { accessCount: favorites.find(f => f.id === id)!.accessCount + 1 });
    }
  }, [maxRecents, isFavorite, updateFavorite, favorites]);
  
  // Clear recents
  const clearRecents = useCallback(() => {
    setRecents([]);
    
    if (enableToasts) {
      toast.info('Recent items cleared', {
        duration: 2000,
        position: 'bottom-right'
      });
    }
  }, [enableToasts]);
  
  // Get recents by type
  const getRecentsByType = useCallback((type: string): RecentItem[] => {
    return recents.filter(rec => rec.type === type);
  }, [recents]);
  
  // Get recents by action
  const getRecentsByAction = useCallback((action: string): RecentItem[] => {
    return recents.filter(rec => rec.action === action);
  }, [recents]);
  
  // Get frequently used items
  const getFrequentlyUsed = useCallback((limit: number = 10): FavoriteItem[] => {
    return [...favorites]
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }, [favorites]);
  
  // Search favorites
  const searchFavorites = useCallback((query: string): FavoriteItem[] => {
    const lowercaseQuery = query.toLowerCase();
    
    return favorites.filter(fav => {
      // Search in data properties
      const dataString = JSON.stringify(fav.data).toLowerCase();
      
      return (
        fav.id.toLowerCase().includes(lowercaseQuery) ||
        fav.type.toLowerCase().includes(lowercaseQuery) ||
        dataString.includes(lowercaseQuery) ||
        fav.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
        fav.notes?.toLowerCase().includes(lowercaseQuery)
      );
    });
  }, [favorites]);
  
  // Export data
  const exportData = useCallback((): string => {
    const exportData = {
      favorites,
      recents,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [favorites, recents]);
  
  // Import data
  const importData = useCallback((data: string) => {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.favorites) {
        const importedFavorites = parsed.favorites.map((fav: any) => ({
          ...fav,
          addedAt: new Date(fav.addedAt),
          lastAccessedAt: new Date(fav.lastAccessedAt)
        }));
        
        setFavorites(importedFavorites);
      }
      
      if (parsed.recents) {
        const importedRecents = parsed.recents.map((rec: any) => ({
          ...rec,
          accessedAt: new Date(rec.accessedAt)
        }));
        
        setRecents(importedRecents);
      }
      
      if (enableToasts) {
        toast.success('Data imported successfully', {
          duration: 3000,
          position: 'bottom-right'
        });
      }
    } catch (error) {
      console.error('Error importing data:', error);
      
      if (enableToasts) {
        toast.error('Failed to import data', {
          duration: 3000,
          position: 'bottom-right'
        });
      }
    }
  }, [enableToasts]);
  
  // Get statistics
  const getStats = useCallback(() => {
    const favoritesByType = favorites.reduce((acc, fav) => {
      acc[fav.type] = (acc[fav.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const recentsByType = recents.reduce((acc, rec) => {
      acc[rec.type] = (acc[rec.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostAccessedFavorite = favorites.length > 0 
      ? favorites.reduce((max, fav) => 
          fav.accessCount > max.accessCount ? fav : max
        )
      : null;
    
    const recentActivity = recents.slice(0, 10); // Last 10 activities
    
    return {
      totalFavorites: favorites.length,
      totalRecents: recents.length,
      favoritesByType,
      recentsByType,
      mostAccessedFavorite,
      recentActivity
    };
  }, [favorites, recents]);
  
  return {
    // Favorites
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    updateFavorite,
    getFavoritesByType,
    getFavoritesByTag,
    
    // Recents
    recents,
    addToRecents,
    clearRecents,
    getRecentsByType,
    getRecentsByAction,
    
    // Combined
    getFrequentlyUsed,
    searchFavorites,
    exportData,
    importData,
    
    // Statistics
    getStats
  };
};

// Hook for managing favorites and recents for specific item types
export const useTypedFavoritesAndRecents = <T = any>(itemType: string, options?: UseFavoritesAndRecentsOptions) => {
  const {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    updateFavorite,
    recents,
    addToRecents,
    getRecentsByType,
    searchFavorites,
    ...rest
  } = useFavoritesAndRecents(options);
  
  // Typed versions of the functions
  const typedAddToFavorites = useCallback((id: string, data: T, tags?: string[], notes?: string) => {
    addToFavorites(id, itemType, data, tags, notes);
  }, [addToFavorites, itemType]);
  
  const typedAddToRecents = useCallback((id: string, data: T, action: string) => {
    addToRecents(id, itemType, data, action);
  }, [addToRecents, itemType]);
  
  const typedFavorites = useMemo(() => 
    favorites.filter(fav => fav.type === itemType) as (Omit<FavoriteItem, 'data'> & { data: T })[],
    [favorites, itemType]
  );
  
  const typedRecents = useMemo(() => 
    getRecentsByType(itemType) as (Omit<RecentItem, 'data'> & { data: T })[],
    [getRecentsByType, itemType]
  );
  
  const typedSearchFavorites = useCallback((query: string) => 
    searchFavorites(query).filter(fav => fav.type === itemType) as (Omit<FavoriteItem, 'data'> & { data: T })[],
    [searchFavorites, itemType]
  );
  
  return {
    favorites: typedFavorites,
    recents: typedRecents,
    addToFavorites: typedAddToFavorites,
    addToRecents: typedAddToRecents,
    removeFromFavorites,
    isFavorite,
    updateFavorite,
    searchFavorites: typedSearchFavorites,
    ...rest
  };
};

export default useFavoritesAndRecents;
export type { FavoriteItem, RecentItem, UseFavoritesAndRecentsOptions, UseFavoritesAndRecentsReturn };
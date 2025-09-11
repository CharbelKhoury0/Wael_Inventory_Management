import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
  size: number; // Estimated size in bytes
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  persistent: boolean;
}

interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  defaultTtl: number; // Default TTL in milliseconds
  maxEntries: number; // Maximum number of entries
  persistentStorage: boolean; // Use localStorage for persistence
  compressionEnabled: boolean; // Enable data compression
  evictionPolicy: 'lru' | 'lfu' | 'ttl' | 'priority';
  backgroundCleanup: boolean; // Enable background cleanup
  cleanupInterval: number; // Cleanup interval in milliseconds
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  lastCleanup: number;
  memoryUsage: {
    used: number;
    available: number;
    percentage: number;
  };
}

interface CacheManagerContextType {
  // Core cache operations
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T, options?: Partial<CacheEntry>) => void;
  remove: (key: string) => boolean;
  clear: () => void;
  has: (key: string) => boolean;
  
  // Batch operations
  getMultiple: <T>(keys: string[]) => Record<string, T | null>;
  setMultiple: <T>(entries: Record<string, { data: T; options?: Partial<CacheEntry> }>) => void;
  removeMultiple: (keys: string[]) => number;
  
  // Tag-based operations
  getByTag: <T>(tag: string) => Record<string, T>;
  removeByTag: (tag: string) => number;
  invalidateTag: (tag: string) => number;
  
  // Cache management
  cleanup: () => number;
  optimize: () => void;
  export: () => string;
  import: (data: string) => boolean;
  
  // Statistics and monitoring
  getStats: () => CacheStats;
  getConfig: () => CacheConfig;
  updateConfig: (config: Partial<CacheConfig>) => void;
  
  // Event handlers
  onHit?: (key: string) => void;
  onMiss?: (key: string) => void;
  onEviction?: (key: string, reason: string) => void;
}

const CacheManagerContext = createContext<CacheManagerContextType | undefined>(undefined);

interface CacheManagerProps {
  children: React.ReactNode;
  config?: Partial<CacheConfig>;
  enableDevTools?: boolean;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 50 * 1024 * 1024, // 50MB
  defaultTtl: 30 * 60 * 1000, // 30 minutes
  maxEntries: 1000,
  persistentStorage: true,
  compressionEnabled: false,
  evictionPolicy: 'lru',
  backgroundCleanup: true,
  cleanupInterval: 5 * 60 * 1000 // 5 minutes
};

export const CacheManager: React.FC<CacheManagerProps> = ({
  children,
  config: userConfig = {},
  enableDevTools = false
}) => {
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());
  const [config, setConfig] = useState<CacheConfig>({ ...DEFAULT_CONFIG, ...userConfig });
  const [stats, setStats] = useState<CacheStats>({
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    evictionCount: 0,
    lastCleanup: Date.now(),
    memoryUsage: {
      used: 0,
      available: config.maxSize,
      percentage: 0
    }
  });
  
  // Load cache from persistent storage
  useEffect(() => {
    if (config.persistentStorage) {
      try {
        const stored = localStorage.getItem('cache-manager-data');
        if (stored) {
          const parsed = JSON.parse(stored);
          const restoredCache = new Map<string, CacheEntry>();
          
          Object.entries(parsed).forEach(([key, entry]: [string, any]) => {
            // Check if entry is still valid
            if (Date.now() - entry.timestamp < entry.ttl) {
              restoredCache.set(key, entry);
            }
          });
          
          setCache(restoredCache);
        }
      } catch (error) {
        console.error('Failed to load cache from storage:', error);
      }
    }
  }, [config.persistentStorage]);
  
  // Save cache to persistent storage
  useEffect(() => {
    if (config.persistentStorage && cache.size > 0) {
      try {
        const persistentEntries = Array.from(cache.entries())
          .filter(([, entry]) => entry.persistent)
          .reduce((acc, [key, entry]) => {
            acc[key] = entry;
            return acc;
          }, {} as Record<string, CacheEntry>);
        
        localStorage.setItem('cache-manager-data', JSON.stringify(persistentEntries));
      } catch (error) {
        console.error('Failed to save cache to storage:', error);
      }
    }
  }, [cache, config.persistentStorage]);
  
  // Background cleanup
  useEffect(() => {
    if (!config.backgroundCleanup) return;
    
    const interval = setInterval(() => {
      cleanup();
    }, config.cleanupInterval);
    
    return () => clearInterval(interval);
  }, [config.backgroundCleanup, config.cleanupInterval]);
  
  // Update stats
  useEffect(() => {
    const totalSize = Array.from(cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    
    setStats(prev => ({
      ...prev,
      totalEntries: cache.size,
      totalSize,
      memoryUsage: {
        used: totalSize,
        available: config.maxSize - totalSize,
        percentage: (totalSize / config.maxSize) * 100
      }
    }));
  }, [cache, config.maxSize]);
  
  // Estimate data size
  const estimateSize = useCallback((data: any): number => {
    const str = JSON.stringify(data);
    return new Blob([str]).size;
  }, []);
  
  // Compress data (simple implementation)
  const compressData = useCallback((data: any): any => {
    if (!config.compressionEnabled) return data;
    
    // Simple compression - in production, use a proper compression library
    try {
      const str = JSON.stringify(data);
      return btoa(str); // Base64 encoding as simple compression
    } catch {
      return data;
    }
  }, [config.compressionEnabled]);
  
  // Decompress data
  const decompressData = useCallback((data: any): any => {
    if (!config.compressionEnabled) return data;
    
    try {
      if (typeof data === 'string' && data.length > 0) {
        const str = atob(data);
        return JSON.parse(str);
      }
    } catch {
      // Fallback to original data if decompression fails
    }
    
    return data;
  }, [config.compressionEnabled]);
  
  // Eviction strategies
  const evictEntries = useCallback((requiredSpace: number = 0) => {
    const entries = Array.from(cache.entries());
    let evicted = 0;
    let freedSpace = 0;
    
    // Sort entries based on eviction policy
    switch (config.evictionPolicy) {
      case 'lru':
        entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
        break;
      case 'lfu':
        entries.sort(([, a], [, b]) => a.accessCount - b.accessCount);
        break;
      case 'ttl':
        entries.sort(([, a], [, b]) => (a.timestamp + a.ttl) - (b.timestamp + b.ttl));
        break;
      case 'priority':
        const priorityOrder = { low: 0, medium: 1, high: 2 };
        entries.sort(([, a], [, b]) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
    }
    
    // Evict entries until we have enough space
    for (const [key, entry] of entries) {
      if (entry.persistent && entry.priority === 'high') continue;
      
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      
      freedSpace += entry.size;
      evicted++;
      
      if (requiredSpace > 0 && freedSpace >= requiredSpace) break;
      if (requiredSpace === 0 && freedSpace >= config.maxSize * 0.1) break; // Free 10% of max size
    }
    
    setStats(prev => ({
      ...prev,
      evictionCount: prev.evictionCount + evicted
    }));
    
    return evicted;
  }, [cache, config]);
  
  // Get cache entry
  const get = useCallback(<T>(key: string): T | null => {
    const entry = cache.get(key);
    
    if (!entry) {
      setStats(prev => ({
        ...prev,
        missRate: prev.missRate + 1
      }));
      return null;
    }
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      
      setStats(prev => ({
        ...prev,
        missRate: prev.missRate + 1
      }));
      
      return null;
    }
    
    // Update access statistics
    setCache(prev => {
      const newCache = new Map(prev);
      const updatedEntry = {
        ...entry,
        accessCount: entry.accessCount + 1,
        lastAccessed: Date.now()
      };
      newCache.set(key, updatedEntry);
      return newCache;
    });
    
    setStats(prev => ({
      ...prev,
      hitRate: prev.hitRate + 1
    }));
    
    return decompressData(entry.data) as T;
  }, [cache, decompressData]);
  
  // Set cache entry
  const set = useCallback(<T>(key: string, data: T, options: Partial<CacheEntry> = {}) => {
    const compressedData = compressData(data);
    const size = estimateSize(compressedData);
    
    // Check if we need to evict entries
    const currentSize = Array.from(cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    if (currentSize + size > config.maxSize || cache.size >= config.maxEntries) {
      evictEntries(size);
    }
    
    const entry: CacheEntry = {
      data: compressedData,
      timestamp: Date.now(),
      ttl: options.ttl || config.defaultTtl,
      accessCount: 0,
      lastAccessed: Date.now(),
      size,
      tags: options.tags || [],
      priority: options.priority || 'medium',
      persistent: options.persistent || false
    };
    
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(key, entry);
      return newCache;
    });
  }, [cache, config, compressData, estimateSize, evictEntries]);
  
  // Remove cache entry
  const remove = useCallback((key: string): boolean => {
    const existed = cache.has(key);
    
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(key);
      return newCache;
    });
    
    return existed;
  }, [cache]);
  
  // Clear all cache entries
  const clear = useCallback(() => {
    setCache(new Map());
    
    if (config.persistentStorage) {
      try {
        localStorage.removeItem('cache-manager-data');
      } catch (error) {
        console.error('Failed to clear persistent storage:', error);
      }
    }
  }, [config.persistentStorage]);
  
  // Check if key exists
  const has = useCallback((key: string): boolean => {
    const entry = cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      remove(key);
      return false;
    }
    
    return true;
  }, [cache, remove]);
  
  // Get multiple entries
  const getMultiple = useCallback(<T>(keys: string[]): Record<string, T | null> => {
    const result: Record<string, T | null> = {};
    
    keys.forEach(key => {
      result[key] = get<T>(key);
    });
    
    return result;
  }, [get]);
  
  // Set multiple entries
  const setMultiple = useCallback(<T>(entries: Record<string, { data: T; options?: Partial<CacheEntry> }>) => {
    Object.entries(entries).forEach(([key, { data, options }]) => {
      set(key, data, options);
    });
  }, [set]);
  
  // Remove multiple entries
  const removeMultiple = useCallback((keys: string[]): number => {
    let removed = 0;
    
    keys.forEach(key => {
      if (remove(key)) removed++;
    });
    
    return removed;
  }, [remove]);
  
  // Get entries by tag
  const getByTag = useCallback(<T>(tag: string): Record<string, T> => {
    const result: Record<string, T> = {};
    
    cache.forEach((entry, key) => {
      if (entry.tags.includes(tag)) {
        const data = get<T>(key);
        if (data !== null) {
          result[key] = data;
        }
      }
    });
    
    return result;
  }, [cache, get]);
  
  // Remove entries by tag
  const removeByTag = useCallback((tag: string): number => {
    let removed = 0;
    const keysToRemove: string[] = [];
    
    cache.forEach((entry, key) => {
      if (entry.tags.includes(tag)) {
        keysToRemove.push(key);
      }
    });
    
    keysToRemove.forEach(key => {
      if (remove(key)) removed++;
    });
    
    return removed;
  }, [cache, remove]);
  
  // Invalidate tag (alias for removeByTag)
  const invalidateTag = useCallback((tag: string): number => {
    return removeByTag(tag);
  }, [removeByTag]);
  
  // Cleanup expired entries
  const cleanup = useCallback((): number => {
    let cleaned = 0;
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToRemove.push(key);
      }
    });
    
    keysToRemove.forEach(key => {
      if (remove(key)) cleaned++;
    });
    
    setStats(prev => ({
      ...prev,
      lastCleanup: now
    }));
    
    return cleaned;
  }, [cache, remove]);
  
  // Optimize cache
  const optimize = useCallback(() => {
    // Run cleanup
    const cleaned = cleanup();
    
    // Defragment if needed
    const currentSize = Array.from(cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    if (currentSize > config.maxSize * 0.8) {
      evictEntries();
    }
    
    toast.success(`Cache optimized: ${cleaned} expired entries removed`);
  }, [cleanup, evictEntries, cache, config.maxSize]);
  
  // Export cache data
  const exportCache = useCallback((): string => {
    const exportData = {
      config,
      cache: Object.fromEntries(cache.entries()),
      stats,
      timestamp: Date.now()
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [cache, config, stats]);
  
  // Import cache data
  const importCache = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.cache) {
        const importedCache = new Map(Object.entries(parsed.cache));
        setCache(importedCache);
      }
      
      if (parsed.config) {
        setConfig(prev => ({ ...prev, ...parsed.config }));
      }
      
      toast.success('Cache data imported successfully');
      return true;
    } catch (error) {
      toast.error('Failed to import cache data');
      return false;
    }
  }, []);
  
  // Get current stats
  const getStats = useCallback((): CacheStats => {
    const totalHits = stats.hitRate;
    const totalMisses = stats.missRate;
    const total = totalHits + totalMisses;
    
    return {
      ...stats,
      hitRate: total > 0 ? (totalHits / total) * 100 : 0,
      missRate: total > 0 ? (totalMisses / total) * 100 : 0
    };
  }, [stats]);
  
  // Get current config
  const getConfig = useCallback((): CacheConfig => config, [config]);
  
  // Update config
  const updateConfig = useCallback((newConfig: Partial<CacheConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);
  
  // Context value
  const contextValue = useMemo(() => ({
    get,
    set,
    remove,
    clear,
    has,
    getMultiple,
    setMultiple,
    removeMultiple,
    getByTag,
    removeByTag,
    invalidateTag,
    cleanup,
    optimize,
    export: exportCache,
    import: importCache,
    getStats,
    getConfig,
    updateConfig
  }), [
    get, set, remove, clear, has,
    getMultiple, setMultiple, removeMultiple,
    getByTag, removeByTag, invalidateTag,
    cleanup, optimize, exportCache, importCache,
    getStats, getConfig, updateConfig
  ]);
  
  // Dev tools
  useEffect(() => {
    if (enableDevTools && typeof window !== 'undefined') {
      (window as any).__CACHE_MANAGER__ = {
        cache,
        config,
        stats: getStats(),
        methods: contextValue
      };
    }
  }, [enableDevTools, cache, config, getStats, contextValue]);
  
  return (
    <CacheManagerContext.Provider value={contextValue}>
      {children}
    </CacheManagerContext.Provider>
  );
};

export const useCacheManager = () => {
  const context = useContext(CacheManagerContext);
  if (context === undefined) {
    throw new Error('useCacheManager must be used within a CacheManager');
  }
  return context;
};

// Hook for cached API calls
export const useCachedApi = <T>(
  key: string,
  apiCall: () => Promise<T>,
  options: {
    ttl?: number;
    tags?: string[];
    priority?: 'low' | 'medium' | 'high';
    persistent?: boolean;
    enabled?: boolean;
    refetchOnMount?: boolean;
  } = {}
) => {
  const cache = useCacheManager();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchData = useCallback(async (force = false) => {
    if (!options.enabled && options.enabled !== undefined) return;
    
    // Check cache first
    if (!force) {
      const cached = cache.get<T>(key);
      if (cached !== null) {
        setData(cached);
        return cached;
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      
      // Cache the result
      cache.set(key, result, {
        ttl: options.ttl,
        tags: options.tags,
        priority: options.priority,
        persistent: options.persistent
      });
      
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [cache, key, apiCall, options]);
  
  // Initial fetch
  useEffect(() => {
    if (options.refetchOnMount !== false) {
      fetchData();
    }
  }, [fetchData, options.refetchOnMount]);
  
  const invalidate = useCallback(() => {
    cache.remove(key);
    setData(null);
  }, [cache, key]);
  
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);
  
  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
    isStale: data === null && !loading
  };
};

export default CacheManager;
export type { CacheEntry, CacheConfig, CacheStats, CacheManagerContextType };
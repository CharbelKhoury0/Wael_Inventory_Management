// Performance Optimization Utilities
import { useCallback, useMemo, useRef, useEffect } from 'react';

// Debounce hook for search and input optimization
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook for scroll and resize events
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRan = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const now = Date.now();
    if (now - lastRan.current >= delay) {
      callback(...args);
      lastRan.current = now;
    } else {
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        lastRan.current = Date.now();
      }, delay - (now - lastRan.current));
    }
  }, [callback, delay]) as T;
};

// Virtual scrolling hook for large lists
export const useVirtualScrolling = (
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + 1, itemCount);
    
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, itemCount]);

  const totalHeight = itemCount * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleRange,
    totalHeight,
    offsetY,
    setScrollTop,
  };
};

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  const metricsRef = useRef<Map<string, number[]>>(new Map());

  const startTiming = useCallback((operation: string): () => void => {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      const metrics = metricsRef.current.get(operation) || [];
      metrics.push(duration);
      
      // Keep only last 100 measurements
      if (metrics.length > 100) {
        metrics.shift();
      }
      
      metricsRef.current.set(operation, metrics);
      
      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
      }
    };
  }, []);

  const getMetrics = useCallback((operation: string) => {
    const metrics = metricsRef.current.get(operation) || [];
    if (metrics.length === 0) return null;

    const avg = metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
    const min = Math.min(...metrics);
    const max = Math.max(...metrics);
    const p95 = metrics.sort((a, b) => a - b)[Math.floor(metrics.length * 0.95)];

    return { avg, min, max, p95, count: metrics.length };
  }, []);

  return { startTiming, getMetrics };
};

// Memory usage monitoring
export const useMemoryMonitoring = () => {
  const [memoryUsage, setMemoryUsage] = useState<{
    used: number;
    total: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const used = memory.usedJSHeapSize;
        const total = memory.totalJSHeapSize;
        const percentage = (used / total) * 100;

        setMemoryUsage({ used, total, percentage });

        // Warn if memory usage is high
        if (percentage > 80) {
          console.warn(`High memory usage detected: ${percentage.toFixed(1)}%`);
        }
      }
    };

    const interval = setInterval(checkMemory, 5000); // Check every 5 seconds
    checkMemory(); // Initial check

    return () => clearInterval(interval);
  }, []);

  return memoryUsage;
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [options]);

  return { targetRef, isIntersecting };
};

// Image lazy loading hook
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  });

  useEffect(() => {
    if (isIntersecting && src && !isLoaded && !isError) {
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      
      img.onerror = () => {
        setIsError(true);
      };
      
      img.src = src;
    }
  }, [isIntersecting, src, isLoaded, isError]);

  return { targetRef, imageSrc, isLoaded, isError };
};

// Bundle size analyzer utility
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    import('webpack-bundle-analyzer').then(({ BundleAnalyzerPlugin }) => {
      console.log('Bundle analysis available at http://localhost:8888');
    });
  }
};

// Performance budget checker
export const checkPerformanceBudget = () => {
  if ('performance' in window && 'getEntriesByType' in performance) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const metrics = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: 0,
      firstContentfulPaint: 0,
    };

    // Get paint metrics
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach(entry => {
      if (entry.name === 'first-paint') {
        metrics.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
      }
    });

    // Performance budget thresholds
    const budgets = {
      domContentLoaded: 1500, // 1.5s
      loadComplete: 3000,     // 3s
      firstPaint: 1000,       // 1s
      firstContentfulPaint: 1500, // 1.5s
    };

    // Check against budgets
    const violations = Object.entries(metrics)
      .filter(([key, value]) => value > budgets[key as keyof typeof budgets])
      .map(([key, value]) => ({
        metric: key,
        actual: value,
        budget: budgets[key as keyof typeof budgets],
        violation: value - budgets[key as keyof typeof budgets],
      }));

    if (violations.length > 0) {
      console.warn('Performance budget violations:', violations);
    }

    return { metrics, violations };
  }

  return null;
};

// Component performance wrapper
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.memo((props: P) => {
    const { startTiming } = usePerformanceMonitoring();
    
    useEffect(() => {
      const endTiming = startTiming(`${componentName}_render`);
      return endTiming;
    });

    return <Component {...props} />;
  });
};

// Memoization utilities
export const createMemoizedSelector = <T, R>(
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) => {
  let lastState: T;
  let lastResult: R;
  
  return (state: T): R => {
    if (state !== lastState) {
      const newResult = selector(state);
      
      if (!equalityFn || !equalityFn(lastResult, newResult)) {
        lastResult = newResult;
      }
      
      lastState = state;
    }
    
    return lastResult;
  };
};

// Deep equality check for complex objects
export const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
};
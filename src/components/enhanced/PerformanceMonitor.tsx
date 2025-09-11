import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Activity, Zap, Clock, Database, Cpu, HardDrive, Wifi, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, RefreshCw, Download, Settings, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  threshold: {
    good: number;
    warning: number;
    critical: number;
  };
  trend: 'up' | 'down' | 'stable';
  history: Array<{
    timestamp: number;
    value: number;
  }>;
}

interface MemoryInfo {
  used: number;
  total: number;
  percentage: number;
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
}

interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface PerformanceData {
  metrics: {
    fps: PerformanceMetric;
    memoryUsage: PerformanceMetric;
    domNodes: PerformanceMetric;
    renderTime: PerformanceMetric;
    bundleSize: PerformanceMetric;
    cacheHitRate: PerformanceMetric;
  };
  memory: MemoryInfo;
  network: NetworkInfo | null;
  vitals: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    ttfb: number; // Time to First Byte
  };
  suggestions: Array<{
    id: string;
    type: 'performance' | 'memory' | 'network' | 'bundle';
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    action?: string;
  }>;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  updateInterval?: number;
  historySize?: number;
  showOverlay?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onPerformanceIssue?: (issue: PerformanceData['suggestions'][0]) => void;
  className?: string;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = true,
  updateInterval = 1000,
  historySize = 60,
  showOverlay = false,
  position = 'top-right',
  onPerformanceIssue,
  className = ''
}) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isVisible, setIsVisible] = useState(showOverlay);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'metrics' | 'memory' | 'network' | 'suggestions'>('overview');
  
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const observer = useRef<PerformanceObserver | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize performance observer
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    
    try {
      observer.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        // Process performance entries
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            // Handle navigation timing
          } else if (entry.entryType === 'paint') {
            // Handle paint timing
          } else if (entry.entryType === 'largest-contentful-paint') {
            // Handle LCP
          }
        });
      });
      
      observer.current.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
    
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [enabled]);
  
  // Calculate FPS
  const calculateFPS = useCallback(() => {
    const now = performance.now();
    const delta = now - lastTime.current;
    
    if (delta >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / delta);
      frameCount.current = 0;
      lastTime.current = now;
      return fps;
    }
    
    frameCount.current++;
    return null;
  }, []);
  
  // Get memory info
  const getMemoryInfo = useCallback((): MemoryInfo => {
    const memory = (performance as any).memory;
    
    if (memory) {
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize
      };
    }
    
    // Fallback estimation
    const estimatedUsed = document.querySelectorAll('*').length * 1000; // Rough estimate
    return {
      used: estimatedUsed,
      total: estimatedUsed * 2,
      percentage: 50
    };
  }, []);
  
  // Get network info
  const getNetworkInfo = useCallback((): NetworkInfo | null => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false
      };
    }
    
    return null;
  }, []);
  
  // Get DOM node count
  const getDOMNodeCount = useCallback((): number => {
    return document.querySelectorAll('*').length;
  }, []);
  
  // Calculate render time
  const calculateRenderTime = useCallback((): number => {
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationTiming) {
      return navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart;
    }
    return 0;
  }, []);
  
  // Get bundle size estimate
  const getBundleSize = useCallback((): number => {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    // This is an estimation - in a real app, you'd track actual bundle sizes
    return scripts.length * 100000; // Estimate 100KB per script
  }, []);
  
  // Generate performance suggestions
  const generateSuggestions = useCallback((data: Partial<PerformanceData>): PerformanceData['suggestions'] => {
    const suggestions: PerformanceData['suggestions'] = [];
    
    if (data.metrics?.fps.value && data.metrics.fps.value < 30) {
      suggestions.push({
        id: 'low-fps',
        type: 'performance',
        severity: 'high',
        title: 'Low Frame Rate',
        description: `Current FPS is ${data.metrics.fps.value}. Consider optimizing animations and reducing DOM complexity.`,
        action: 'Optimize rendering performance'
      });
    }
    
    if (data.memory?.percentage && data.memory.percentage > 80) {
      suggestions.push({
        id: 'high-memory',
        type: 'memory',
        severity: 'high',
        title: 'High Memory Usage',
        description: `Memory usage is at ${data.memory.percentage.toFixed(1)}%. Consider implementing memory optimization strategies.`,
        action: 'Optimize memory usage'
      });
    }
    
    if (data.metrics?.domNodes.value && data.metrics.domNodes.value > 1500) {
      suggestions.push({
        id: 'large-dom',
        type: 'performance',
        severity: 'medium',
        title: 'Large DOM Size',
        description: `DOM has ${data.metrics.domNodes.value} nodes. Consider using virtual scrolling or lazy loading.`,
        action: 'Reduce DOM complexity'
      });
    }
    
    if (data.network?.effectiveType === 'slow-2g' || data.network?.effectiveType === '2g') {
      suggestions.push({
        id: 'slow-network',
        type: 'network',
        severity: 'medium',
        title: 'Slow Network Connection',
        description: 'User is on a slow network. Consider enabling data saving features.',
        action: 'Optimize for slow networks'
      });
    }
    
    if (data.metrics?.bundleSize.value && data.metrics.bundleSize.value > 1000000) {
      suggestions.push({
        id: 'large-bundle',
        type: 'bundle',
        severity: 'medium',
        title: 'Large Bundle Size',
        description: 'Bundle size is large. Consider code splitting and lazy loading.',
        action: 'Implement code splitting'
      });
    }
    
    return suggestions;
  }, []);
  
  // Update performance data
  const updatePerformanceData = useCallback(() => {
    if (!enabled) return;
    
    const fps = calculateFPS();
    const memory = getMemoryInfo();
    const network = getNetworkInfo();
    const domNodes = getDOMNodeCount();
    const renderTime = calculateRenderTime();
    const bundleSize = getBundleSize();
    
    const now = Date.now();
    
    setPerformanceData(prev => {
      const newData: PerformanceData = {
        metrics: {
          fps: {
            name: 'Frame Rate',
            value: fps || prev?.metrics.fps.value || 60,
            unit: 'fps',
            threshold: { good: 60, warning: 30, critical: 15 },
            trend: 'stable',
            history: [
              ...(prev?.metrics.fps.history || []).slice(-historySize + 1),
              { timestamp: now, value: fps || prev?.metrics.fps.value || 60 }
            ]
          },
          memoryUsage: {
            name: 'Memory Usage',
            value: memory.percentage,
            unit: '%',
            threshold: { good: 50, warning: 70, critical: 90 },
            trend: 'stable',
            history: [
              ...(prev?.metrics.memoryUsage.history || []).slice(-historySize + 1),
              { timestamp: now, value: memory.percentage }
            ]
          },
          domNodes: {
            name: 'DOM Nodes',
            value: domNodes,
            unit: 'nodes',
            threshold: { good: 1000, warning: 1500, critical: 2000 },
            trend: 'stable',
            history: [
              ...(prev?.metrics.domNodes.history || []).slice(-historySize + 1),
              { timestamp: now, value: domNodes }
            ]
          },
          renderTime: {
            name: 'Render Time',
            value: renderTime,
            unit: 'ms',
            threshold: { good: 100, warning: 300, critical: 500 },
            trend: 'stable',
            history: [
              ...(prev?.metrics.renderTime.history || []).slice(-historySize + 1),
              { timestamp: now, value: renderTime }
            ]
          },
          bundleSize: {
            name: 'Bundle Size',
            value: bundleSize,
            unit: 'bytes',
            threshold: { good: 500000, warning: 1000000, critical: 2000000 },
            trend: 'stable',
            history: [
              ...(prev?.metrics.bundleSize.history || []).slice(-historySize + 1),
              { timestamp: now, value: bundleSize }
            ]
          },
          cacheHitRate: {
            name: 'Cache Hit Rate',
            value: 85, // This would come from your cache manager
            unit: '%',
            threshold: { good: 80, warning: 60, critical: 40 },
            trend: 'stable',
            history: [
              ...(prev?.metrics.cacheHitRate.history || []).slice(-historySize + 1),
              { timestamp: now, value: 85 }
            ]
          }
        },
        memory,
        network,
        vitals: {
          fcp: 1200, // These would come from real measurements
          lcp: 2500,
          fid: 50,
          cls: 0.1,
          ttfb: 200
        },
        suggestions: []
      };
      
      // Generate suggestions
      newData.suggestions = generateSuggestions(newData);
      
      // Trigger performance issue callbacks
      newData.suggestions.forEach(suggestion => {
        if (suggestion.severity === 'high' && onPerformanceIssue) {
          onPerformanceIssue(suggestion);
        }
      });
      
      return newData;
    });
  }, [enabled, calculateFPS, getMemoryInfo, getNetworkInfo, getDOMNodeCount, calculateRenderTime, getBundleSize, generateSuggestions, historySize, onPerformanceIssue]);
  
  // Start monitoring
  useEffect(() => {
    if (!enabled) return;
    
    updatePerformanceData();
    intervalRef.current = setInterval(updatePerformanceData, updateInterval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, updateInterval, updatePerformanceData]);
  
  // Get metric status
  const getMetricStatus = useCallback((metric: PerformanceMetric) => {
    if (metric.value <= metric.threshold.good) return 'good';
    if (metric.value <= metric.threshold.warning) return 'warning';
    return 'critical';
  }, []);
  
  // Format bytes
  const formatBytes = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);
  
  // Export performance data
  const exportData = useCallback(() => {
    if (!performanceData) return;
    
    const dataStr = JSON.stringify(performanceData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-data-${new Date().toISOString()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success('Performance data exported');
  }, [performanceData]);
  
  if (!enabled || !performanceData) return null;
  
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };
  
  return (
    <>
      {/* Overlay Toggle */}
      {showOverlay && (
        <button
          onClick={() => setIsVisible(!isVisible)}
          className={`fixed z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg transition-all hover:bg-gray-800 ${positionClasses[position]}`}
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
      
      {/* Performance Monitor Panel */}
      {(isVisible || !showOverlay) && (
        <div className={`${showOverlay ? 'fixed z-40' : ''} ${showOverlay ? positionClasses[position] : ''} ${showOverlay ? 'mt-12' : ''} ${className}`}>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-80">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Performance Monitor
                </h3>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportData}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Export data"
                >
                  <Download className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    getMetricStatus(performanceData.metrics.fps) === 'good' ? 'text-green-600' :
                    getMetricStatus(performanceData.metrics.fps) === 'warning' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {performanceData.metrics.fps.value}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">FPS</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    getMetricStatus(performanceData.metrics.memoryUsage) === 'good' ? 'text-green-600' :
                    getMetricStatus(performanceData.metrics.memoryUsage) === 'warning' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {performanceData.metrics.memoryUsage.value.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Memory</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    getMetricStatus(performanceData.metrics.domNodes) === 'good' ? 'text-green-600' :
                    getMetricStatus(performanceData.metrics.domNodes) === 'warning' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {performanceData.metrics.domNodes.value}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">DOM Nodes</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    performanceData.suggestions.filter(s => s.severity === 'high').length === 0 ? 'text-green-600' :
                    performanceData.suggestions.filter(s => s.severity === 'high').length < 3 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {performanceData.suggestions.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Issues</div>
                </div>
              </div>
            </div>
            
            {/* Expanded View */}
            {isExpanded && (
              <>
                {/* Tabs */}
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <nav className="flex">
                    {[
                      { key: 'overview', label: 'Overview', icon: Activity },
                      { key: 'metrics', label: 'Metrics', icon: TrendingUp },
                      { key: 'memory', label: 'Memory', icon: HardDrive },
                      { key: 'network', label: 'Network', icon: Wifi },
                      { key: 'suggestions', label: 'Issues', icon: AlertTriangle }
                    ].map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setSelectedTab(tab.key as any)}
                          className={`flex-1 flex items-center justify-center space-x-1 py-2 text-xs font-medium transition-colors ${
                            selectedTab === tab.key
                              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
                
                {/* Tab Content */}
                <div className="p-4 max-h-64 overflow-y-auto">
                  {selectedTab === 'overview' && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Core Web Vitals</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span>First Contentful Paint:</span>
                            <span className={performanceData.vitals.fcp < 1800 ? 'text-green-600' : 'text-yellow-600'}>
                              {performanceData.vitals.fcp}ms
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Largest Contentful Paint:</span>
                            <span className={performanceData.vitals.lcp < 2500 ? 'text-green-600' : 'text-yellow-600'}>
                              {performanceData.vitals.lcp}ms
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>First Input Delay:</span>
                            <span className={performanceData.vitals.fid < 100 ? 'text-green-600' : 'text-yellow-600'}>
                              {performanceData.vitals.fid}ms
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cumulative Layout Shift:</span>
                            <span className={performanceData.vitals.cls < 0.1 ? 'text-green-600' : 'text-yellow-600'}>
                              {performanceData.vitals.cls.toFixed(3)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedTab === 'metrics' && (
                    <div className="space-y-3">
                      {Object.values(performanceData.metrics).map(metric => {
                        const status = getMetricStatus(metric);
                        return (
                          <div key={metric.name} className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {metric.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Threshold: {metric.threshold.good} {metric.unit}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className={`text-sm font-bold ${
                                status === 'good' ? 'text-green-600' :
                                status === 'warning' ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {typeof metric.value === 'number' && metric.unit === 'bytes'
                                  ? formatBytes(metric.value)
                                  : `${metric.value} ${metric.unit}`
                                }
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                {status === 'good' ? (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                ) : status === 'warning' ? (
                                  <AlertTriangle className="w-3 h-3 text-yellow-500" />
                                ) : (
                                  <AlertTriangle className="w-3 h-3 text-red-500" />
                                )}
                                
                                {metric.trend === 'up' ? (
                                  <TrendingUp className="w-3 h-3 text-green-500" />
                                ) : metric.trend === 'down' ? (
                                  <TrendingDown className="w-3 h-3 text-red-500" />
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {selectedTab === 'memory' && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Memory Usage</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span>Used:</span>
                            <span>{formatBytes(performanceData.memory.used)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span>{formatBytes(performanceData.memory.total)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Percentage:</span>
                            <span className={performanceData.memory.percentage > 80 ? 'text-red-600' : 'text-green-600'}>
                              {performanceData.memory.percentage.toFixed(1)}%
                            </span>
                          </div>
                          
                          {performanceData.memory.jsHeapSizeLimit && (
                            <>
                              <div className="flex justify-between">
                                <span>JS Heap Limit:</span>
                                <span>{formatBytes(performanceData.memory.jsHeapSizeLimit)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>JS Heap Used:</span>
                                <span>{formatBytes(performanceData.memory.usedJSHeapSize || 0)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedTab === 'network' && (
                    <div className="space-y-3">
                      {performanceData.network ? (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Network Info</h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span>Connection Type:</span>
                              <span className="capitalize">{performanceData.network.effectiveType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Downlink:</span>
                              <span>{performanceData.network.downlink} Mbps</span>
                            </div>
                            <div className="flex justify-between">
                              <span>RTT:</span>
                              <span>{performanceData.network.rtt}ms</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Data Saver:</span>
                              <span>{performanceData.network.saveData ? 'Enabled' : 'Disabled'}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                          Network information not available
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedTab === 'suggestions' && (
                    <div className="space-y-3">
                      {performanceData.suggestions.length > 0 ? (
                        performanceData.suggestions.map(suggestion => (
                          <div
                            key={suggestion.id}
                            className={`p-3 rounded-lg border ${
                              suggestion.severity === 'high' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900' :
                              suggestion.severity === 'medium' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900' :
                              'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900'
                            }`}
                          >
                            <div className="flex items-start space-x-2">
                              <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                                suggestion.severity === 'high' ? 'text-red-500' :
                                suggestion.severity === 'medium' ? 'text-yellow-500' :
                                'text-blue-500'
                              }`} />
                              
                              <div className="flex-1">
                                <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {suggestion.title}
                                </h5>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {suggestion.description}
                                </p>
                                {suggestion.action && (
                                  <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1">
                                    {suggestion.action}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                          No performance issues detected
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PerformanceMonitor;
export type { PerformanceMetric, PerformanceData, PerformanceMonitorProps };
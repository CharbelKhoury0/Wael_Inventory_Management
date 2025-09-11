import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useEnhancedTheme } from '../contexts/ThemeContext';
import InteractiveChart from './InteractiveCharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  BarChart3,
  Activity,
  Zap,
  Brain,
  Eye,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface DataPoint {
  timestamp: string;
  value: number;
  category?: string;
  metadata?: Record<string, any>;
}

interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  strength: 'weak' | 'moderate' | 'strong';
  confidence: number;
  changePercent: number;
  description: string;
  forecast?: DataPoint[];
}

interface Anomaly {
  id: string;
  timestamp: string;
  value: number;
  expectedValue: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'spike' | 'drop' | 'outlier' | 'pattern_break';
  description: string;
  confidence: number;
  impact?: string;
}

interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'pattern' | 'correlation' | 'forecast';
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  recommendations?: string[];
  data?: any;
  timestamp: string;
}

interface AnalyticsConfig {
  timeWindow: '7d' | '30d' | '90d' | '1y';
  sensitivity: 'low' | 'medium' | 'high';
  enableForecasting: boolean;
  enableAnomalyDetection: boolean;
  enablePatternRecognition: boolean;
  forecastPeriods: number;
}

interface AnalyticsEngineProps {
  data: DataPoint[];
  title?: string;
  config?: Partial<AnalyticsConfig>;
  onInsightGenerated?: (insight: Insight) => void;
  enableRealTime?: boolean;
  refreshInterval?: number;
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  timeWindow: '30d',
  sensitivity: 'medium',
  enableForecasting: true,
  enableAnomalyDetection: true,
  enablePatternRecognition: true,
  forecastPeriods: 7
};

// Statistical functions
const calculateMovingAverage = (data: number[], window: number): number[] => {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((sum, val) => sum + val, 0) / slice.length;
    result.push(avg);
  }
  return result;
};

const calculateStandardDeviation = (data: number[]): number => {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
};

const detectTrend = (data: number[]): TrendAnalysis => {
  if (data.length < 2) {
    return {
      direction: 'stable',
      strength: 'weak',
      confidence: 0,
      changePercent: 0,
      description: 'Insufficient data for trend analysis'
    };
  }

  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
  const absChange = Math.abs(changePercent);
  
  let direction: 'up' | 'down' | 'stable';
  let strength: 'weak' | 'moderate' | 'strong';
  
  if (absChange < 5) {
    direction = 'stable';
    strength = 'weak';
  } else if (changePercent > 0) {
    direction = 'up';
    strength = absChange > 20 ? 'strong' : absChange > 10 ? 'moderate' : 'weak';
  } else {
    direction = 'down';
    strength = absChange > 20 ? 'strong' : absChange > 10 ? 'moderate' : 'weak';
  }
  
  const confidence = Math.min(95, Math.max(50, 100 - (calculateStandardDeviation(data) / (secondAvg || 1)) * 10));
  
  const description = `${direction === 'stable' ? 'Stable trend' : 
    direction === 'up' ? 'Upward trend' : 'Downward trend'} with ${strength} strength (${changePercent.toFixed(1)}% change)`;
  
  return {
    direction,
    strength,
    confidence,
    changePercent,
    description
  };
};

const detectAnomalies = (data: DataPoint[], sensitivity: 'low' | 'medium' | 'high'): Anomaly[] => {
  if (data.length < 10) return [];
  
  const values = data.map(d => d.value);
  const movingAvg = calculateMovingAverage(values, 7);
  const stdDev = calculateStandardDeviation(values);
  
  const thresholds = {
    low: 2.5,
    medium: 2.0,
    high: 1.5
  };
  
  const threshold = thresholds[sensitivity] * stdDev;
  const anomalies: Anomaly[] = [];
  
  data.forEach((point, index) => {
    if (index < 7) return; // Skip first few points
    
    const expected = movingAvg[index];
    const deviation = Math.abs(point.value - expected);
    
    if (deviation > threshold) {
      const severity = deviation > threshold * 2 ? 'critical' : 
                     deviation > threshold * 1.5 ? 'high' : 
                     deviation > threshold * 1.2 ? 'medium' : 'low';
      
      const type = point.value > expected ? 'spike' : 'drop';
      const confidence = Math.min(95, (deviation / threshold) * 50);
      
      anomalies.push({
        id: `anomaly-${index}`,
        timestamp: point.timestamp,
        value: point.value,
        expectedValue: expected,
        severity,
        type,
        description: `${type === 'spike' ? 'Unusual spike' : 'Unusual drop'} detected (${((point.value - expected) / expected * 100).toFixed(1)}% deviation)`,
        confidence,
        impact: severity === 'critical' ? 'High impact on operations' : 
               severity === 'high' ? 'Moderate impact expected' : 'Low impact'
      });
    }
  });
  
  return anomalies;
};

const generateForecast = (data: DataPoint[], periods: number): DataPoint[] => {
  if (data.length < 5) return [];
  
  const values = data.map(d => d.value);
  const trend = detectTrend(values);
  
  // Simple linear regression for forecasting
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;
  
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const forecast: DataPoint[] = [];
  const lastTimestamp = new Date(data[data.length - 1].timestamp);
  
  for (let i = 1; i <= periods; i++) {
    const futureTimestamp = new Date(lastTimestamp);
    futureTimestamp.setDate(futureTimestamp.getDate() + i);
    
    const predictedValue = slope * (n + i - 1) + intercept;
    // Add some noise based on historical variance
    const noise = (Math.random() - 0.5) * calculateStandardDeviation(values) * 0.1;
    
    forecast.push({
      timestamp: futureTimestamp.toISOString(),
      value: Math.max(0, predictedValue + noise),
      category: 'forecast'
    });
  }
  
  return forecast;
};

const generateInsights = (data: DataPoint[], anomalies: Anomaly[], trend: TrendAnalysis, config: AnalyticsConfig): Insight[] => {
  const insights: Insight[] = [];
  
  // Trend insights
  if (trend.confidence > 70) {
    insights.push({
      id: 'trend-analysis',
      type: 'trend',
      title: `${trend.direction === 'up' ? 'Growth' : trend.direction === 'down' ? 'Decline' : 'Stability'} Detected`,
      description: trend.description,
      importance: trend.strength === 'strong' ? 'high' : trend.strength === 'moderate' ? 'medium' : 'low',
      actionable: trend.direction !== 'stable',
      recommendations: trend.direction === 'up' ? [
        'Consider increasing inventory to meet growing demand',
        'Analyze factors contributing to growth',
        'Plan for capacity expansion'
      ] : trend.direction === 'down' ? [
        'Investigate causes of decline',
        'Consider promotional strategies',
        'Review pricing and market conditions'
      ] : [
        'Monitor for any changes in pattern',
        'Maintain current operational levels'
      ],
      timestamp: new Date().toISOString()
    });
  }
  
  // Anomaly insights
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
  if (criticalAnomalies.length > 0) {
    insights.push({
      id: 'critical-anomalies',
      type: 'anomaly',
      title: `${criticalAnomalies.length} Critical Anomal${criticalAnomalies.length === 1 ? 'y' : 'ies'} Detected`,
      description: `Significant deviations from expected patterns require immediate attention`,
      importance: 'critical',
      actionable: true,
      recommendations: [
        'Investigate root causes immediately',
        'Check data quality and collection processes',
        'Review operational changes during anomaly periods',
        'Implement monitoring alerts for similar patterns'
      ],
      data: criticalAnomalies,
      timestamp: new Date().toISOString()
    });
  }
  
  // Pattern insights
  const recentData = data.slice(-7); // Last 7 data points
  const recentValues = recentData.map(d => d.value);
  const recentAvg = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
  const overallAvg = data.map(d => d.value).reduce((sum, val) => sum + val, 0) / data.length;
  
  if (Math.abs(recentAvg - overallAvg) / overallAvg > 0.15) {
    insights.push({
      id: 'recent-pattern-change',
      type: 'pattern',
      title: 'Recent Pattern Change Detected',
      description: `Recent values are ${recentAvg > overallAvg ? 'significantly higher' : 'significantly lower'} than historical average`,
      importance: 'medium',
      actionable: true,
      recommendations: [
        'Analyze recent operational changes',
        'Review external factors affecting performance',
        'Consider adjusting forecasts and plans'
      ],
      timestamp: new Date().toISOString()
    });
  }
  
  return insights;
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  isDark: boolean;
}> = ({ title, value, change, icon: Icon, color, isDark }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-sm ${
            change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {change > 0 ? <ArrowUp className="h-4 w-4 mr-1" /> : 
             change < 0 ? <ArrowDown className="h-4 w-4 mr-1" /> : 
             <Minus className="h-4 w-4 mr-1" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
          {title}
        </p>
        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
};

const AnomalyCard: React.FC<{ anomaly: Anomaly; isDark: boolean }> = ({ anomaly, isDark }) => {
  const severityColors = {
    low: 'border-yellow-300 bg-yellow-50 text-yellow-800',
    medium: 'border-orange-300 bg-orange-50 text-orange-800',
    high: 'border-red-300 bg-red-50 text-red-800',
    critical: 'border-red-500 bg-red-100 text-red-900'
  };

  const severityColorsDark = {
    low: 'border-yellow-600 bg-yellow-900 bg-opacity-20 text-yellow-300',
    medium: 'border-orange-600 bg-orange-900 bg-opacity-20 text-orange-300',
    high: 'border-red-600 bg-red-900 bg-opacity-20 text-red-300',
    critical: 'border-red-500 bg-red-900 bg-opacity-30 text-red-200'
  };

  return (
    <div className={`border rounded-lg p-4 ${
      isDark ? severityColorsDark[anomaly.severity] : severityColors[anomaly.severity]
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium capitalize">{anomaly.severity} Anomaly</span>
        </div>
        <span className="text-xs opacity-75">
          {new Date(anomaly.timestamp).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm mb-2">{anomaly.description}</p>
      <div className="flex items-center justify-between text-xs">
        <span>Confidence: {anomaly.confidence.toFixed(1)}%</span>
        <span>Impact: {anomaly.impact}</span>
      </div>
    </div>
  );
};

const InsightCard: React.FC<{ insight: Insight; isDark: boolean }> = ({ insight, isDark }) => {
  const importanceColors = {
    low: 'border-blue-300 bg-blue-50',
    medium: 'border-yellow-300 bg-yellow-50',
    high: 'border-orange-300 bg-orange-50',
    critical: 'border-red-300 bg-red-50'
  };

  const importanceColorsDark = {
    low: 'border-blue-600 bg-blue-900 bg-opacity-20',
    medium: 'border-yellow-600 bg-yellow-900 bg-opacity-20',
    high: 'border-orange-600 bg-orange-900 bg-opacity-20',
    critical: 'border-red-600 bg-red-900 bg-opacity-20'
  };

  const typeIcons = {
    trend: TrendingUp,
    anomaly: AlertTriangle,
    pattern: Activity,
    correlation: BarChart3,
    forecast: Target
  };

  const Icon = typeIcons[insight.type];

  return (
    <div className={`border rounded-lg p-4 ${
      isDark ? `${importanceColorsDark[insight.importance]} text-white` : `${importanceColors[insight.importance]} text-gray-900`
    }`}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">{insight.title}</h4>
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}>
              {insight.importance}
            </span>
          </div>
          <p className="text-sm mb-3 opacity-90">{insight.description}</p>
          
          {insight.recommendations && insight.recommendations.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2">Recommendations:</h5>
              <ul className="text-sm space-y-1">
                {insight.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span className="opacity-90">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AnalyticsEngine: React.FC<AnalyticsEngineProps> = ({
  data,
  title = 'Analytics Dashboard',
  config: userConfig = {},
  onInsightGenerated,
  enableRealTime = false,
  refreshInterval = 30000
}) => {
  const { isDark } = useTheme();
  const [config, setConfig] = useState<AnalyticsConfig>({ ...DEFAULT_CONFIG, ...userConfig });
  const [selectedTimeWindow, setSelectedTimeWindow] = useState(config.timeWindow);
  const [showSettings, setShowSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter data based on time window
  const filteredData = useMemo(() => {
    const now = new Date();
    const windowMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };
    
    const cutoff = new Date(now.getTime() - windowMs[selectedTimeWindow]);
    return data.filter(d => new Date(d.timestamp) >= cutoff);
  }, [data, selectedTimeWindow]);

  // Analytics calculations
  const analytics = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        trend: { direction: 'stable' as const, strength: 'weak' as const, confidence: 0, changePercent: 0, description: 'No data' },
        anomalies: [],
        forecast: [],
        insights: [],
        metrics: {
          total: 0,
          average: 0,
          min: 0,
          max: 0,
          variance: 0
        }
      };
    }

    const values = filteredData.map(d => d.value);
    const trend = detectTrend(values);
    const anomalies = config.enableAnomalyDetection ? detectAnomalies(filteredData, config.sensitivity) : [];
    const forecast = config.enableForecasting ? generateForecast(filteredData, config.forecastPeriods) : [];
    
    const metrics = {
      total: values.reduce((sum, val) => sum + val, 0),
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      variance: calculateStandardDeviation(values)
    };

    const insights = generateInsights(filteredData, anomalies, trend, config);
    
    return { trend, anomalies, forecast, insights, metrics };
  }, [filteredData, config]);

  // Real-time updates
  useEffect(() => {
    if (!enableRealTime) return;
    
    const interval = setInterval(() => {
      setIsRefreshing(true);
      // Simulate refresh
      setTimeout(() => setIsRefreshing(false), 1000);
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [enableRealTime, refreshInterval]);

  // Notify about new insights
  useEffect(() => {
    if (onInsightGenerated && analytics.insights.length > 0) {
      analytics.insights.forEach(insight => {
        onInsightGenerated(insight);
      });
    }
  }, [analytics.insights, onInsightGenerated]);

  const handleConfigChange = useCallback((newConfig: Partial<AnalyticsConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const exportAnalytics = useCallback(() => {
    const exportData = {
      config,
      data: filteredData,
      analytics,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [config, filteredData, analytics]);

  const chartData = useMemo(() => {
    const baseData = filteredData.map(d => ({
      name: new Date(d.timestamp).toLocaleDateString(),
      value: d.value,
      timestamp: d.timestamp
    }));
    
    if (analytics.forecast.length > 0) {
      const forecastData = analytics.forecast.map(d => ({
        name: new Date(d.timestamp).toLocaleDateString(),
        value: d.value,
        forecast: d.value,
        timestamp: d.timestamp
      }));
      return [...baseData, ...forecastData];
    }
    
    return baseData;
  }, [filteredData, analytics.forecast]);

  return (
    <div className={`space-y-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold">{title}</h2>
            {isRefreshing && <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />}
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={selectedTimeWindow}
              onChange={(e) => setSelectedTimeWindow(e.target.value as any)}
              className={`px-3 py-2 border rounded-lg text-sm ${
                isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
              }`}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <button
              onClick={exportAnalytics}
              className={`px-3 py-2 border rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <Download className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className={`px-3 py-2 border rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Average Value"
            value={analytics.metrics.average.toFixed(2)}
            change={analytics.trend.changePercent}
            icon={BarChart3}
            color="blue"
            isDark={isDark}
          />
          <MetricCard
            title="Total Count"
            value={filteredData.length}
            icon={Activity}
            color="green"
            isDark={isDark}
          />
          <MetricCard
            title="Anomalies"
            value={analytics.anomalies.length}
            icon={AlertTriangle}
            color={analytics.anomalies.length > 0 ? 'red' : 'green'}
            isDark={isDark}
          />
          <MetricCard
            title="Trend Confidence"
            value={`${analytics.trend.confidence.toFixed(1)}%`}
            icon={TrendingUp}
            color="purple"
            isDark={isDark}
          />
        </div>
      </div>

      {/* Main Chart */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
        <h3 className="text-lg font-semibold mb-4">Trend Analysis & Forecast</h3>
        <InteractiveChart
          data={chartData}
          type="line"
          height={400}
          enableBrush={true}
          enableZoom={true}
          enableExport={true}
          colors={['#3B82F6', '#EF4444', '#10B981']}
        />
      </div>

      {/* Insights & Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">AI Insights</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${
              analytics.insights.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {analytics.insights.length}
            </span>
          </div>
          
          <div className="space-y-4">
            {analytics.insights.length > 0 ? (
              analytics.insights.map(insight => (
                <InsightCard key={insight.id} insight={insight} isDark={isDark} />
              ))
            ) : (
              <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No significant insights detected</p>
                <p className="text-sm">Continue monitoring for patterns</p>
              </div>
            )}
          </div>
        </div>

        {/* Anomalies */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold">Anomaly Detection</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${
              analytics.anomalies.length > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {analytics.anomalies.length}
            </span>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {analytics.anomalies.length > 0 ? (
              analytics.anomalies.map(anomaly => (
                <AnomalyCard key={anomaly.id} anomaly={anomaly} isDark={isDark} />
              ))
            ) : (
              <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>No anomalies detected</p>
                <p className="text-sm">All values within expected ranges</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-md w-full`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Analytics Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Sensitivity
                </label>
                <select
                  value={config.sensitivity}
                  onChange={(e) => handleConfigChange({ sensitivity: e.target.value as any })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  <option value="low">Low (fewer alerts)</option>
                  <option value="medium">Medium (balanced)</option>
                  <option value="high">High (more sensitive)</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Forecast Periods
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={config.forecastPeriods}
                  onChange={(e) => handleConfigChange({ forecastPeriods: parseInt(e.target.value) })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                  }`}
                />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.enableForecasting}
                    onChange={(e) => handleConfigChange({ enableForecasting: e.target.checked })}
                    className="mr-2"
                  />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Enable Forecasting
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.enableAnomalyDetection}
                    onChange={(e) => handleConfigChange({ enableAnomalyDetection: e.target.checked })}
                    className="mr-2"
                  />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Enable Anomaly Detection
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.enablePatternRecognition}
                    onChange={(e) => handleConfigChange({ enablePatternRecognition: e.target.checked })}
                    className="mr-2"
                  />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Enable Pattern Recognition
                  </span>
                </label>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsEngine;
export type { DataPoint, TrendAnalysis, Anomaly, Insight, AnalyticsConfig };
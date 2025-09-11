import React, { useState, useMemo, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useWarehouse } from '../App';
import { useInventory } from '../hooks/useInventory';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import InteractiveChart from './InteractiveCharts';
import CustomizableDashboard from './CustomizableDashboard';
import AdvancedFilters from './AdvancedFilters';
import AnalyticsEngine from './AnalyticsEngine';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Scatter,
  ScatterChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  Container,
  AlertTriangle,
  Clock,
  DollarSign,
  Activity,
  BarChart3,
  Target,
  Zap,
  Calendar,
  Users,
  MapPin,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Settings,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Layout,
  Brain,
  Layers,
  Grid
} from 'lucide-react';

interface AdvancedAnalyticsProps {
  onLogout: () => void;
  onPageChange: (page: string) => void;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
}

interface PredictiveData {
  period: string;
  predicted: number;
  actual?: number;
  confidence: number;
}

interface InventoryValuation {
  method: 'FIFO' | 'LIFO' | 'Average';
  totalValue: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitCost: number;
    totalValue: number;
  }>;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  icon, 
  color, 
  trend = change >= 0 ? 'up' : 'down',
  subtitle 
}) => {
  const { isDark } = useTheme();
  const isPositive = trend === 'up';
  const isStable = trend === 'stable';

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-lg border p-6 hover:shadow-xl transition-shadow duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="text-right">
          {!isStable && (
            <div className="flex items-center">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
      </div>
      <div>
        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
          {title}
        </p>
        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
          {value}
        </p>
        {subtitle && (
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsProps> = ({ onLogout, onPageChange }) => {
  const { isDark } = useTheme();
  const { currentWarehouse, warehouseData } = useWarehouse();
  const { items, movements, transactions, stats } = useInventory();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [valuationMethod, setValuationMethod] = useState<'FIFO' | 'LIFO' | 'Average'>('FIFO');
  const [showPredictive, setShowPredictive] = useState(true);
  const [viewMode, setViewMode] = useState<'standard' | 'customizable' | 'analytics' | 'filtered'>('standard');
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Filter fields configuration
  const filterFields = useMemo(() => [
    {
      key: 'category',
      label: 'Category',
      type: 'multiselect' as const,
      options: [...new Set(items.map(item => item.category))].map(cat => ({ value: cat, label: cat })),
      icon: Package
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'daterange' as const,
      icon: Calendar
    },
    {
      key: 'priceRange',
      label: 'Price Range',
      type: 'number' as const,
      placeholder: { min: 'Min Price', max: 'Max Price' },
      icon: DollarSign
    },
    {
      key: 'status',
      label: 'Status',
      type: 'multiselect' as const,
      options: [
        { value: 'active', label: 'Active', color: '#10B981' },
        { value: 'inactive', label: 'Inactive', color: '#EF4444' },
        { value: 'pending', label: 'Pending', color: '#F59E0B' }
      ],
      icon: Activity
    },
    {
      key: 'location',
      label: 'Location',
      type: 'select' as const,
      options: [...new Set(movements.map(m => m.location))].map(loc => ({ value: loc, label: loc })),
      icon: MapPin
    },
    {
      key: 'tags',
      label: 'Tags',
      type: 'tags' as const,
      placeholder: 'Add tags...',
      icon: Target
    }
  ], [items, movements]);

  // Analytics data for the engine
  const analyticsData = useMemo(() => {
    return movements.map(movement => ({
      timestamp: movement.date,
      value: movement.quantity * (movement.unitPrice || 0),
      category: movement.type,
      metadata: {
        itemId: movement.itemId,
        location: movement.location,
        type: movement.type
      }
    }));
  }, [movements]);

  // Advanced metrics calculation
  const advancedMetrics = useMemo(() => {
    const now = new Date();
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Filter data by time range
    const recentMovements = movements.filter(m => new Date(m.timestamp) >= cutoffDate);
    const recentTransactions = transactions.filter(t => new Date(t.date) >= cutoffDate);
    
    // Calculate turnover rate
    const totalSold = recentTransactions
      .filter(t => t.type === 'Outbound')
      .reduce((sum, t) => sum + t.quantity, 0);
    const avgInventory = items.reduce((sum, item) => sum + item.quantity, 0) / items.length;
    const turnoverRate = avgInventory > 0 ? (totalSold / avgInventory) * (365 / daysAgo) : 0;
    
    // Calculate fill rate
    const totalDemand = recentTransactions.reduce((sum, t) => sum + t.quantity, 0);
    const fulfilledDemand = recentTransactions
      .filter(t => t.status === 'Completed')
      .reduce((sum, t) => sum + t.quantity, 0);
    const fillRate = totalDemand > 0 ? (fulfilledDemand / totalDemand) * 100 : 100;
    
    // Calculate carrying cost
    const totalInventoryValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const carryingCostRate = 0.25; // 25% annual carrying cost
    const carryingCost = totalInventoryValue * carryingCostRate;
    
    // Calculate stockout risk
    const stockoutRisk = items.filter(item => item.quantity <= item.minStock).length / items.length * 100;
    
    // Calculate warehouse utilization
    const utilizationMatch = warehouseData.utilization.match(/\d+/);
    const utilization = utilizationMatch ? parseInt(utilizationMatch[0]) : 0;
    
    return {
      turnoverRate: turnoverRate.toFixed(2),
      fillRate: fillRate.toFixed(1),
      carryingCost,
      stockoutRisk: stockoutRisk.toFixed(1),
      utilization,
      avgOrderValue: recentTransactions.length > 0 
        ? recentTransactions.reduce((sum, t) => sum + t.totalValue, 0) / recentTransactions.length 
        : 0,
      movementVelocity: recentMovements.length / daysAgo,
      accuracyRate: 98.5 // Simulated accuracy rate
    };
  }, [items, movements, transactions, timeRange, warehouseData]);

  // Predictive analytics data
  const predictiveData = useMemo((): PredictiveData[] => {
    const baseData = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const period = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Simulate predictive data based on historical trends
      const seasonalFactor = 1 + 0.2 * Math.sin((date.getMonth() / 12) * 2 * Math.PI);
      const trendFactor = 1 + (i * 0.02); // 2% growth per month
      const baseValue = stats.totalItems * seasonalFactor * trendFactor;
      
      baseData.push({
        period,
        predicted: Math.round(baseValue),
        actual: i < 3 ? Math.round(baseValue * (0.95 + Math.random() * 0.1)) : undefined,
        confidence: Math.max(60, 95 - i * 3) // Decreasing confidence over time
      });
    }
    
    return baseData;
  }, [stats.totalItems]);

  // Inventory valuation calculation
  const inventoryValuation = useMemo((): InventoryValuation => {
    const valuatedItems = items.map(item => {
      let unitCost = item.price;
      
      // Apply valuation method
      switch (valuationMethod) {
        case 'FIFO':
          // First In, First Out - use current price
          unitCost = item.price;
          break;
        case 'LIFO':
          // Last In, First Out - simulate older, lower cost
          unitCost = item.price * 0.9;
          break;
        case 'Average':
          // Weighted average cost
          unitCost = item.price * 0.95;
          break;
      }
      
      return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitCost,
        totalValue: unitCost * item.quantity
      };
    });
    
    const totalValue = valuatedItems.reduce((sum, item) => sum + item.totalValue, 0);
    
    return {
      method: valuationMethod,
      totalValue,
      items: valuatedItems
    };
  }, [items, valuationMethod]);

  // Performance radar data
  const performanceData = useMemo(() => [
    {
      metric: 'Efficiency',
      value: advancedMetrics.utilization,
      fullMark: 100
    },
    {
      metric: 'Accuracy',
      value: advancedMetrics.accuracyRate,
      fullMark: 100
    },
    {
      metric: 'Fill Rate',
      value: parseFloat(advancedMetrics.fillRate),
      fullMark: 100
    },
    {
      metric: 'Turnover',
      value: Math.min(parseFloat(advancedMetrics.turnoverRate) * 20, 100),
      fullMark: 100
    },
    {
      metric: 'Safety',
      value: 100 - parseFloat(advancedMetrics.stockoutRisk),
      fullMark: 100
    }
  ], [advancedMetrics]);

  // Financial trends data
  const financialTrends = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Simulate financial data
      const revenue = 50000 + Math.random() * 20000;
      const costs = revenue * (0.6 + Math.random() * 0.2);
      const profit = revenue - costs;
      
      months.push({
        month,
        revenue,
        costs,
        profit,
        margin: (profit / revenue) * 100
      });
    }
    
    return months;
  }, []);

  const chartTheme = {
    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    textColor: isDark ? '#E5E7EB' : '#374151',
    gridColor: isDark ? '#374151' : '#E5E7EB'
  };

  const exportData = useCallback(() => {
    const data = {
      metrics: advancedMetrics,
      predictive: predictiveData,
      valuation: inventoryValuation,
      performance: performanceData,
      financial: financialTrends,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [advancedMetrics, predictiveData, inventoryValuation, performanceData, financialTrends]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <TopNav 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onLogout={onLogout}
        onPageChange={onPageChange}
      />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPage="analytics"
          onPageChange={onPageChange}
        />
        
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Advanced Analytics
                </h1>
                <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Enterprise-grade insights and predictive analytics for {currentWarehouse}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* View Mode Selector */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('standard')}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      viewMode === 'standard'
                        ? 'bg-blue-600 text-white'
                        : isDark ? 'border border-gray-600 text-gray-300 hover:bg-gray-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4 mr-2 inline" />
                    Standard
                  </button>
                  <button
                    onClick={() => setViewMode('customizable')}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      viewMode === 'customizable'
                        ? 'bg-blue-600 text-white'
                        : isDark ? 'border border-gray-600 text-gray-300 hover:bg-gray-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Layout className="h-4 w-4 mr-2 inline" />
                    Custom
                  </button>
                  <button
                    onClick={() => setViewMode('analytics')}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      viewMode === 'analytics'
                        ? 'bg-blue-600 text-white'
                        : isDark ? 'border border-gray-600 text-gray-300 hover:bg-gray-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Brain className="h-4 w-4 mr-2 inline" />
                    AI Analytics
                  </button>
                  <button
                    onClick={() => setViewMode('filtered')}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      viewMode === 'filtered'
                        ? 'bg-blue-600 text-white'
                        : isDark ? 'border border-gray-600 text-gray-300 hover:bg-gray-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Filter className="h-4 w-4 mr-2 inline" />
                    Filtered
                  </button>
                </div>
                
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
                <button
                  onClick={exportData}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
            
            {/* Metric Selector */}
            <div className="flex gap-2 mb-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'predictive', label: 'Predictive', icon: TrendingUp },
                { id: 'financial', label: 'Financial', icon: DollarSign },
                { id: 'performance', label: 'Performance', icon: Target }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSelectedMetric(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    selectedMetric === id
                      ? 'bg-blue-600 text-white'
                      : isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Inventory Turnover"
              value={`${advancedMetrics.turnoverRate}x`}
              change={8.5}
              icon={<RefreshCw className="h-6 w-6 text-white" />}
              color="bg-blue-500"
              subtitle="Annual rate"
            />
            <MetricCard
              title="Fill Rate"
              value={`${advancedMetrics.fillRate}%`}
              change={2.3}
              icon={<Target className="h-6 w-6 text-white" />}
              color="bg-green-500"
              subtitle="Order fulfillment"
            />
            <MetricCard
              title="Carrying Cost"
              value={`$${(advancedMetrics.carryingCost / 1000).toFixed(0)}K`}
              change={-1.2}
              icon={<DollarSign className="h-6 w-6 text-white" />}
              color="bg-purple-500"
              subtitle="Annual estimate"
            />
            <MetricCard
              title="Stockout Risk"
              value={`${advancedMetrics.stockoutRisk}%`}
              change={-5.7}
              icon={<AlertTriangle className="h-6 w-6 text-white" />}
              color="bg-red-500"
              subtitle="Items at risk"
            />
          </div>

          {/* Dynamic Content Based on Selected Metric */}
          {selectedMetric === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Warehouse Performance Radar */}
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Warehouse Performance
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={performanceData}>
                    <PolarGrid stroke={chartTheme.gridColor} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: chartTheme.textColor }} />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]} 
                      tick={{ fill: chartTheme.textColor, fontSize: 12 }}
                    />
                    <Radar
                      name="Performance"
                      dataKey="value"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: chartTheme.backgroundColor,
                        border: `1px solid ${chartTheme.gridColor}`,
                        borderRadius: '8px',
                        color: chartTheme.textColor
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Inventory Valuation */}
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Inventory Valuation
                  </h3>
                  <select
                    value={valuationMethod}
                    onChange={(e) => setValuationMethod(e.target.value as 'FIFO' | 'LIFO' | 'Average')}
                    className={`px-3 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="FIFO">FIFO</option>
                    <option value="LIFO">LIFO</option>
                    <option value="Average">Average Cost</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ${inventoryValuation.totalValue.toLocaleString()}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Total Inventory Value ({valuationMethod})
                    </p>
                  </div>
                  <div className="space-y-2">
                    {inventoryValuation.items.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {item.name.substring(0, 20)}...
                        </span>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          ${item.totalValue.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedMetric === 'predictive' && (
            <div className="grid grid-cols-1 gap-6 mb-8">
              {/* Predictive Analytics */}
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Inventory Demand Forecast
                  </h3>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      AI-Powered Predictions
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={predictiveData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                    <XAxis dataKey="period" stroke={chartTheme.textColor} />
                    <YAxis stroke={chartTheme.textColor} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: chartTheme.backgroundColor,
                        border: `1px solid ${chartTheme.gridColor}`,
                        borderRadius: '8px',
                        color: chartTheme.textColor
                      }}
                    />
                    <Legend />
                    <Bar dataKey="actual" fill="#10B981" name="Actual" />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      name="Predicted"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="confidence" 
                      stroke="#F59E0B" 
                      fill="#F59E0B" 
                      fillOpacity={0.2}
                      name="Confidence %"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {selectedMetric === 'financial' && (
            <div className="grid grid-cols-1 gap-6 mb-8">
              {/* Financial Trends */}
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Financial Performance Trends
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={financialTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                    <XAxis dataKey="month" stroke={chartTheme.textColor} />
                    <YAxis yAxisId="left" stroke={chartTheme.textColor} />
                    <YAxis yAxisId="right" orientation="right" stroke={chartTheme.textColor} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: chartTheme.backgroundColor,
                        border: `1px solid ${chartTheme.gridColor}`,
                        borderRadius: '8px',
                        color: chartTheme.textColor
                      }}
                      formatter={(value, name) => {
                        if (name === 'margin') return [`${Number(value).toFixed(1)}%`, 'Profit Margin'];
                        return [`$${Number(value).toLocaleString()}`, name];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#10B981" name="Revenue" />
                    <Bar yAxisId="left" dataKey="costs" fill="#EF4444" name="Costs" />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="margin" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      name="Profit Margin %"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {selectedMetric === 'performance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Efficiency Metrics */}
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Operational Efficiency
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Warehouse Utilization</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{advancedMetrics.utilization}%</span>
                    </div>
                    <div className={`w-full bg-gray-200 rounded-full h-2 ${isDark ? 'bg-gray-700' : ''}`}>
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${advancedMetrics.utilization}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Order Accuracy</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{advancedMetrics.accuracyRate}%</span>
                    </div>
                    <div className={`w-full bg-gray-200 rounded-full h-2 ${isDark ? 'bg-gray-700' : ''}`}>
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${advancedMetrics.accuracyRate}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Fill Rate</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{advancedMetrics.fillRate}%</span>
                    </div>
                    <div className={`w-full bg-gray-200 rounded-full h-2 ${isDark ? 'bg-gray-700' : ''}`}>
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${advancedMetrics.fillRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Movement Velocity */}
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Movement Analytics
                </h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {advancedMetrics.movementVelocity.toFixed(1)}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Movements per day
                    </p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ${advancedMetrics.avgOrderValue.toLocaleString()}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Average order value
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Executive Summary */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Executive Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 ${isDark ? 'bg-green-900' : ''} mb-3`}>
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Performance</h4>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Warehouse operating at {advancedMetrics.utilization}% capacity with {advancedMetrics.fillRate}% fill rate
                </p>
              </div>
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 ${isDark ? 'bg-blue-900' : ''} mb-3`}>
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Financial</h4>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Inventory turnover of {advancedMetrics.turnoverRate}x with ${(advancedMetrics.carryingCost / 1000).toFixed(0)}K carrying costs
                </p>
              </div>
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 ${isDark ? 'bg-yellow-900' : ''} mb-3`}>
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Risk Management</h4>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {advancedMetrics.stockoutRisk}% stockout risk with proactive monitoring in place
                </p>
              </div>
            </div>
          </div>

          {/* Conditional View Rendering */}
          {viewMode === 'customizable' && (
            <CustomizableDashboard
              enableTemplates={true}
              enableExport={true}
              enableSharing={true}
              dataSource={{
                'revenue-trend': movements.map(m => ({
                  name: new Date(m.date).toLocaleDateString(),
                  value: m.quantity * (m.unitPrice || 0)
                })),
                'category-distribution': categoryData,
                'inventory-levels': items.map(item => ({
                  name: item.name,
                  value: item.quantity
                }))
              }}
            />
          )}

          {viewMode === 'analytics' && (
            <AnalyticsEngine
              data={analyticsData}
              title="AI-Powered Analytics"
              config={{
                timeWindow: timeRange as any,
                sensitivity: 'medium',
                enableForecasting: true,
                enableAnomalyDetection: true,
                enablePatternRecognition: true,
                forecastPeriods: 7
              }}
              enableRealTime={true}
              refreshInterval={30000}
            />
          )}

          {viewMode === 'filtered' && (
            <div className="space-y-6">
              <AdvancedFilters
                fields={filterFields}
                initialFilters={filters}
                onFiltersChange={setFilters}
                onSearch={setSearchQuery}
                enablePresets={true}
                enableExport={true}
                enableRealTimeUpdate={true}
                showResultCount={true}
                resultCount={items.length}
              />
              
              {/* Filtered Results */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
                  <h3 className="text-lg font-semibold mb-4">Filtered Inventory Trends</h3>
                  <InteractiveChart
                    data={movements.map(m => ({
                      name: new Date(m.date).toLocaleDateString(),
                      value: m.quantity
                    }))}
                    type="line"
                    height={300}
                    enableBrush={true}
                    enableZoom={true}
                    enableExport={true}
                    colors={['#3B82F6', '#10B981', '#F59E0B']}
                  />
                </div>
                
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
                  <h3 className="text-lg font-semibold mb-4">Category Performance</h3>
                  <InteractiveChart
                    data={[...new Set(items.map(item => item.category))].map(cat => ({
                      name: cat,
                      value: items.filter(item => item.category === cat).length
                    }))}
                    type="pie"
                    height={300}
                    enableExport={true}
                    colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']}
                  />
                </div>
              </div>
            </div>
          )}

          {viewMode === 'standard' && (
            <>
              {/* Enhanced Standard Charts with Interactive Components */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
                  <h3 className="text-lg font-semibold mb-4">Interactive Inventory Trends</h3>
                  <InteractiveChart
                    data={movements.map(m => ({
                      name: new Date(m.date).toLocaleDateString(),
                      value: m.quantity
                    }))}
                    type="line"
                    height={300}
                    enableBrush={true}
                    enableZoom={true}
                    enableExport={true}
                    enableFullscreen={true}
                    colors={['#3B82F6', '#10B981', '#F59E0B']}
                  />
                </div>
                
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
                  <h3 className="text-lg font-semibold mb-4">Enhanced Category Distribution</h3>
                  <InteractiveChart
                    data={[...new Set(items.map(item => item.category))].map(cat => ({
                      name: cat,
                      value: items.filter(item => item.category === cat).length
                    }))}
                    type="pie"
                    height={300}
                    enableExport={true}
                    enableFullscreen={true}
                    colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
                  <h3 className="text-lg font-semibold mb-4">Movement Volume</h3>
                  <InteractiveChart
                    data={movements.slice(0, 7).map((m, i) => ({
                      name: `Day ${i + 1}`,
                      value: m.quantity
                    }))}
                    type="bar"
                    height={250}
                    enableExport={true}
                    colors={['#3B82F6']}
                  />
                </div>
                
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
                  <h3 className="text-lg font-semibold mb-4">Value Distribution</h3>
                  <InteractiveChart
                    data={items.slice(0, 7).map(item => ({
                      name: item.name.substring(0, 10),
                      value: item.price * item.quantity
                    }))}
                    type="area"
                    height={250}
                    enableExport={true}
                    colors={['#10B981']}
                  />
                </div>
                
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
                  <h3 className="text-lg font-semibold mb-4">Performance Gauge</h3>
                  <InteractiveChart
                    data={[{ name: 'Performance', value: 75, target: 100 }]}
                    type="gauge"
                    height={250}
                    colors={['#F59E0B']}
                  />
                </div>
              </div>

              {/* Heatmap for Location Analysis */}
              <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
                <h3 className="text-lg font-semibold mb-4">Location Performance Heatmap</h3>
                <InteractiveChart
                  data={[...new Set(movements.map(m => m.location))].map(loc => ({
                    name: loc,
                    value: movements.filter(m => m.location === loc).length
                  }))}
                  type="heatmap"
                  height={400}
                  enableExport={true}
                  enableFullscreen={true}
                  colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444']}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(AdvancedAnalyticsDashboard);
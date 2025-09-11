import React, { useState, useMemo } from 'react';
import { Search, TrendingUp, Clock, Star, BarChart3, Users, Target, Zap, Filter, Download, RefreshCw } from 'lucide-react';
import { useSearch } from './SearchProvider';

interface SearchAnalytics {
  totalSearches: number;
  uniqueQueries: number;
  averageResultsPerSearch: number;
  searchSuccessRate: number;
  popularQueries: Array<{ query: string; count: number; successRate: number }>;
  searchTrends: Array<{ date: string; searches: number; results: number }>;
  categoryBreakdown: Array<{ category: string; searches: number; percentage: number }>;
  userEngagement: {
    averageSessionDuration: number;
    clickThroughRate: number;
    returnSearchRate: number;
  };
}

interface SearchDashboardProps {
  className?: string;
  showExportOptions?: boolean;
  refreshInterval?: number;
}

const SearchDashboard: React.FC<SearchDashboardProps> = ({
  className = '',
  showExportOptions = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const {
    searchStats,
    searchHistory,
    favorites,
    searchableData,
    globalResults,
    advancedResults
  } = useSearch();
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedMetric, setSelectedMetric] = useState<'searches' | 'results' | 'success_rate'>('searches');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Calculate analytics
  const analytics = useMemo((): SearchAnalytics => {
    const totalSearches = searchStats.totalSearches;
    const uniqueQueries = new Set(searchHistory).size;
    const averageResults = searchStats.averageResultsPerSearch;
    
    // Calculate success rate (searches that returned results)
    const successfulSearches = searchStats.popularQueries.filter(q => q.count > 0).length;
    const searchSuccessRate = totalSearches > 0 ? (successfulSearches / totalSearches) * 100 : 0;
    
    // Enhanced popular queries with success rates
    const popularQueries = searchStats.popularQueries.map(query => ({
      ...query,
      successRate: 85 + Math.random() * 15 // Simulated success rate
    }));
    
    // Generate search trends (simulated data)
    const searchTrends = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        searches: Math.floor(Math.random() * 100) + 20,
        results: Math.floor(Math.random() * 500) + 100
      };
    });
    
    // Category breakdown based on searchable data
    const categoryCount = searchableData.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalItems = searchableData.length;
    const categoryBreakdown = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      searches: count,
      percentage: totalItems > 0 ? (count / totalItems) * 100 : 0
    }));
    
    // User engagement metrics (simulated)
    const userEngagement = {
      averageSessionDuration: 4.2, // minutes
      clickThroughRate: 68.5, // percentage
      returnSearchRate: 23.1 // percentage
    };
    
    return {
      totalSearches,
      uniqueQueries,
      averageResultsPerSearch: averageResults,
      searchSuccessRate,
      popularQueries,
      searchTrends,
      categoryBreakdown,
      userEngagement
    };
  }, [searchStats, searchHistory, searchableData]);
  
  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };
  
  // Handle export
  const handleExport = (format: 'csv' | 'json') => {
    const data = {
      analytics,
      exportDate: new Date().toISOString(),
      timeRange: selectedTimeRange
    };
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-analytics-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Convert to CSV
      const csvData = [
        ['Metric', 'Value'],
        ['Total Searches', analytics.totalSearches.toString()],
        ['Unique Queries', analytics.uniqueQueries.toString()],
        ['Average Results', analytics.averageResultsPerSearch.toFixed(2)],
        ['Success Rate', `${analytics.searchSuccessRate.toFixed(1)}%`],
        ['Click Through Rate', `${analytics.userEngagement.clickThroughRate.toFixed(1)}%`],
        ['Return Search Rate', `${analytics.userEngagement.returnSearchRate.toFixed(1)}%`]
      ];
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2" />
            Search Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Insights and performance metrics for search functionality
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          {/* Export Options */}
          {showExportOptions && (
            <div className="relative">
              <button className="flex items-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm group">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Export JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Searches</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {analytics.totalSearches.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400">+12.5%</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Queries</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {analytics.uniqueQueries.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400">+8.3%</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {analytics.searchSuccessRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400">+2.1%</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Results</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {analytics.averageResultsPerSearch.toFixed(1)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400">+5.7%</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
          </div>
        </div>
      </div>
      
      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Trends */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Search Trends
            </h3>
            
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="searches">Searches</option>
              <option value="results">Results</option>
              <option value="success_rate">Success Rate</option>
            </select>
          </div>
          
          <div className="space-y-3">
            {analytics.searchTrends.map((trend, index) => {
              const value = selectedMetric === 'searches' ? trend.searches : 
                          selectedMetric === 'results' ? trend.results : 
                          (trend.results / trend.searches) * 100;
              const maxValue = Math.max(...analytics.searchTrends.map(t => 
                selectedMetric === 'searches' ? t.searches : 
                selectedMetric === 'results' ? t.results : 
                (t.results / t.searches) * 100
              ));
              const percentage = (value / maxValue) * 100;
              
              return (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-20">
                    {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-12 text-right">
                    {selectedMetric === 'success_rate' ? `${value.toFixed(1)}%` : value.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Popular Queries */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Popular Queries
          </h3>
          
          <div className="space-y-3">
            {analytics.popularQueries.slice(0, 8).map((query, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {query.query}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {query.count} searches
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-400">
                      {query.successRate.toFixed(1)}% success
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${(query.count / Math.max(...analytics.popularQueries.map(q => q.count))) * 100}%` }}
                    />
                  </div>
                  
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8 text-right">
                    {index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Category Breakdown and User Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Search Categories
          </h3>
          
          <div className="space-y-3">
            {analytics.categoryBreakdown.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-green-500' :
                    index === 2 ? 'bg-purple-500' :
                    index === 3 ? 'bg-orange-500' :
                    index === 4 ? 'bg-pink-500' : 'bg-yellow-500'
                  }`} />
                  
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {category.category}
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' :
                        index === 2 ? 'bg-purple-500' :
                        index === 3 ? 'bg-orange-500' :
                        index === 4 ? 'bg-pink-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                  
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                    {category.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* User Engagement */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            User Engagement
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Session Duration</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Average time per search session</p>
              </div>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {analytics.userEngagement.averageSessionDuration.toFixed(1)}m
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Click-Through Rate</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Users who click on results</p>
              </div>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {analytics.userEngagement.clickThroughRate.toFixed(1)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Return Search Rate</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Users who search again</p>
              </div>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {analytics.userEngagement.returnSearchRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Recent Search Activity
          </h3>
          
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Last {searchHistory.length} searches
          </span>
        </div>
        
        <div className="space-y-2">
          {searchHistory.slice(0, 10).map((query, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {query}
              </span>
              
              <div className="flex items-center space-x-2">
                {favorites.includes(query) && (
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                )}
                
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.floor(Math.random() * 60)} min ago
                </span>
              </div>
            </div>
          ))}
          
          {searchHistory.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No recent search activity
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDashboard;
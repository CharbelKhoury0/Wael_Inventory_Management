import React, { useState, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useWarehouse } from '../App';
import { useInventoryStore } from '../store/inventoryStore';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import AdvancedSearch from './AdvancedSearch';
import { useExport, createItemsExportColumns, createMovementsExportColumns, createTransactionsExportColumns } from '../utils/exportUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  DollarSign,
  AlertTriangle,
  Download,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Filter
} from 'lucide-react';

interface ReportingDashboardProps {
  onLogout: () => void;
  onPageChange: (page: string) => void;
}

const ReportingDashboard: React.FC<ReportingDashboardProps> = ({ onLogout, onPageChange }) => {
  const { isDark } = useTheme();
  const { currentWarehouse } = useWarehouse();
  const { items, movements, transactions } = useInventoryStore();
  const { exportData } = useExport();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30');
  const [selectedChart, setSelectedChart] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const themeClasses = {
    container: isDark ? 'bg-gray-900' : 'bg-gray-50',
    card: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-600',
      muted: isDark ? 'text-gray-400' : 'text-gray-500'
    },
    button: isDark ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
  };

  // Calculate analytics data
  const analytics = useMemo(() => {
    const now = new Date();
    const daysAgo = parseInt(selectedTimeRange);
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Filter data by time range
    const recentMovements = movements.filter(m => new Date(m.timestamp) >= cutoffDate);
    const recentTransactions = transactions.filter(t => new Date(t.date) >= cutoffDate);

    // Basic metrics
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const lowStockItems = items.filter(item => item.quantity <= item.minStock);
    const outOfStockItems = items.filter(item => item.quantity === 0);

    // Movement analytics
    const arrivals = recentMovements.filter(m => m.type === 'Arrival').length;
    const departures = recentMovements.filter(m => m.type === 'Departure').length;
    const pendingMovements = recentMovements.filter(m => m.status === 'Pending').length;

    // Transaction analytics
    const inboundTransactions = recentTransactions.filter(t => t.type === 'Inbound');
    const outboundTransactions = recentTransactions.filter(t => t.type === 'Outbound');
    const totalInbound = inboundTransactions.reduce((sum, t) => sum + t.totalValue, 0);
    const totalOutbound = outboundTransactions.reduce((sum, t) => sum + t.totalValue, 0);

    // Category distribution
    const categoryData = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);

    const categoryChartData = Object.entries(categoryData).map(([category, quantity]) => ({
      category,
      quantity,
      value: items.filter(i => i.category === category).reduce((sum, i) => sum + (i.price * i.quantity), 0)
    }));

    // Daily movement trends
    const dailyMovements = Array.from({ length: daysAgo }, (_, i) => {
      const date = new Date(now.getTime() - (daysAgo - 1 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayMovements = recentMovements.filter(m => m.timestamp.startsWith(dateStr));
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        arrivals: dayMovements.filter(m => m.type === 'Arrival').length,
        departures: dayMovements.filter(m => m.type === 'Departure').length,
        total: dayMovements.length
      };
    });

    // Stock status distribution
    const stockStatusData = [
      { name: 'In Stock', value: items.filter(i => i.quantity > i.minStock).length, color: '#10B981' },
      { name: 'Low Stock', value: lowStockItems.length, color: '#F59E0B' },
      { name: 'Out of Stock', value: outOfStockItems.length, color: '#EF4444' }
    ];

    return {
      totalItems,
      totalValue,
      lowStockItems: lowStockItems.length,
      outOfStockItems: outOfStockItems.length,
      arrivals,
      departures,
      pendingMovements,
      totalInbound,
      totalOutbound,
      categoryChartData,
      dailyMovements,
      stockStatusData
    };
  }, [items, movements, transactions, selectedTimeRange]);

  const handleExport = async (type: 'csv' | 'pdf', dataType: 'items' | 'movements' | 'transactions') => {
    let columns, data, filename;
    
    switch (dataType) {
      case 'items':
        columns = createItemsExportColumns();
        data = items;
        filename = 'inventory_items';
        break;
      case 'movements':
        columns = createMovementsExportColumns();
        data = movements;
        filename = 'warehouse_movements';
        break;
      case 'transactions':
        columns = createTransactionsExportColumns();
        data = transactions;
        filename = 'inventory_transactions';
        break;
    }
    
    await exportData(type, {
      filename,
      title: `${filename.replace('_', ' ').toUpperCase()} Report`,
      subtitle: `${currentWarehouse} - Generated on ${new Date().toLocaleDateString()}`,
      columns,
      data
    });
  };

  const chartColors = isDark ? {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    grid: '#374151',
    text: '#D1D5DB'
  } : {
    primary: '#2563EB',
    secondary: '#059669',
    accent: '#D97706',
    danger: '#DC2626',
    grid: '#E5E7EB',
    text: '#374151'
  };

  return (
    <div className={`flex h-screen ${themeClasses.container}`}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPage="analytics"
        onPageChange={onPageChange}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav 
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
          onPageChange={onPageChange}
        />
        
        <main className={`flex-1 overflow-x-hidden overflow-y-auto ${themeClasses.container} px-4 py-6 md:px-6`}>
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <div>
                  <h1 className={`text-2xl md:text-3xl font-bold ${themeClasses.text.primary} mb-2`}>
                    Analytics & Reporting
                  </h1>
                  <p className={themeClasses.text.secondary}>
                    Comprehensive insights and data analysis for {currentWarehouse}
                  </p>
                </div>
                
                {/* Time Range Selector */}
                <div className="flex items-center gap-4 mt-4 lg:mt-0">
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                    className={`px-4 py-2 rounded-md border ${themeClasses.button}`}
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className={`${themeClasses.card} rounded-lg border p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${themeClasses.text.secondary}`}>Total Items</p>
                    <p className={`text-2xl font-bold ${themeClasses.text.primary}`}>{analytics.totalItems}</p>
                  </div>
                  <Package className={`h-8 w-8 ${themeClasses.text.secondary}`} />
                </div>
                <p className={`text-xs ${themeClasses.text.muted} mt-2`}>
                  Total inventory value: ${analytics.totalValue.toLocaleString()}
                </p>
              </div>

              <div className={`${themeClasses.card} rounded-lg border p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${themeClasses.text.secondary}`}>Movements</p>
                    <p className={`text-2xl font-bold ${themeClasses.text.primary}`}>
                      {analytics.arrivals + analytics.departures}
                    </p>
                  </div>
                  <Truck className={`h-8 w-8 ${themeClasses.text.secondary}`} />
                </div>
                <p className={`text-xs ${themeClasses.text.muted} mt-2`}>
                  {analytics.arrivals} arrivals, {analytics.departures} departures
                </p>
              </div>

              <div className={`${themeClasses.card} rounded-lg border p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${themeClasses.text.secondary}`}>Transaction Value</p>
                    <p className={`text-2xl font-bold ${themeClasses.text.primary}`}>
                      ${(analytics.totalInbound + analytics.totalOutbound).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className={`h-8 w-8 ${themeClasses.text.secondary}`} />
                </div>
                <p className={`text-xs ${themeClasses.text.muted} mt-2`}>
                  In: ${analytics.totalInbound.toLocaleString()}, Out: ${analytics.totalOutbound.toLocaleString()}
                </p>
              </div>

              <div className={`${themeClasses.card} rounded-lg border p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${themeClasses.text.secondary}`}>Stock Alerts</p>
                    <p className={`text-2xl font-bold text-orange-500`}>
                      {analytics.lowStockItems + analytics.outOfStockItems}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
                <p className={`text-xs ${themeClasses.text.muted} mt-2`}>
                  {analytics.lowStockItems} low stock, {analytics.outOfStockItems} out of stock
                </p>
              </div>
            </div>

            {/* Export Actions */}
            <div className={`${themeClasses.card} rounded-lg border p-6 mb-8`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-4`}>
                <Download className="inline h-5 w-5 mr-2" />
                Export Reports
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className={`font-medium ${themeClasses.text.primary} mb-2`}>Inventory Items</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport('csv', 'items')}
                      className={`px-3 py-2 rounded-md border ${themeClasses.button} text-sm`}
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleExport('pdf', 'items')}
                      className={`px-3 py-2 rounded-md border ${themeClasses.button} text-sm`}
                    >
                      PDF
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className={`font-medium ${themeClasses.text.primary} mb-2`}>Movements</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport('csv', 'movements')}
                      className={`px-3 py-2 rounded-md border ${themeClasses.button} text-sm`}
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleExport('pdf', 'movements')}
                      className={`px-3 py-2 rounded-md border ${themeClasses.button} text-sm`}
                    >
                      PDF
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className={`font-medium ${themeClasses.text.primary} mb-2`}>Transactions</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport('csv', 'transactions')}
                      className={`px-3 py-2 rounded-md border ${themeClasses.button} text-sm`}
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleExport('pdf', 'transactions')}
                      className={`px-3 py-2 rounded-md border ${themeClasses.button} text-sm`}
                    >
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Daily Movements Chart */}
              <div className={`${themeClasses.card} rounded-lg border p-6`}>
                <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-4`}>
                  Daily Movement Trends
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.dailyMovements}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis dataKey="date" stroke={chartColors.text} />
                    <YAxis stroke={chartColors.text} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: isDark ? '#374151' : '#ffffff',
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: '6px',
                        color: chartColors.text
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="arrivals" 
                      stackId="1" 
                      stroke={chartColors.secondary} 
                      fill={chartColors.secondary}
                      name="Arrivals"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="departures" 
                      stackId="1" 
                      stroke={chartColors.primary} 
                      fill={chartColors.primary}
                      name="Departures"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Stock Status Distribution */}
              <div className={`${themeClasses.card} rounded-lg border p-6`}>
                <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-4`}>
                  Stock Status Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.stockStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.stockStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: isDark ? '#374151' : '#ffffff',
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: '6px',
                        color: chartColors.text
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Analysis */}
            <div className={`${themeClasses.card} rounded-lg border p-6`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-4`}>
                Inventory by Category
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis 
                    dataKey="category" 
                    stroke={chartColors.text}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis stroke={chartColors.text} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDark ? '#374151' : '#ffffff',
                      border: `1px solid ${chartColors.grid}`,
                      borderRadius: '6px',
                      color: chartColors.text
                    }}
                  />
                  <Legend />
                  <Bar dataKey="quantity" fill={chartColors.primary} name="Quantity" />
                  <Bar dataKey="value" fill={chartColors.secondary} name="Value ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportingDashboard;
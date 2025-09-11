import React, { useState, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useWarehouse } from '../App';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
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
  Area
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
  BarChart3
} from 'lucide-react';

interface AnalyticsProps {
  movements: any[];
  items: any[];
  containerContents: Record<string, any[]>;
  onLogout: () => void;
  onPageChange: (page: string) => void;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, color }) => {
  const { isDark } = useTheme();
  const isPositive = change >= 0;

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center">
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
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-1`}>
          vs last month
        </span>
      </div>
    </div>
  );
};

const AnalyticsDashboard: React.FC<AnalyticsProps> = ({ movements, items, containerContents, onLogout, onPageChange }) => {
  const { isDark } = useTheme();
  const { currentWarehouse } = useWarehouse();
  const [timeRange, setTimeRange] = useState('7d');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalMovements = movements.length;
    const arrivals = movements.filter(m => m.type === 'Arrival').length;
    const departures = movements.filter(m => m.type === 'Departure').length;
    const containerMovements = movements.filter(m => m.transportType === 'Container').length;
    const truckMovements = movements.filter(m => m.transportType === 'Truck').length;
    
    const totalItems = items.length;
    const lowStockItems = items.filter(item => item.quantity < 10).length;
    
    const totalValue = Object.values(containerContents)
      .flat()
      .reduce((sum, product) => sum + (product.value || 0), 0);

    return {
      totalMovements,
      arrivals,
      departures,
      containerMovements,
      truckMovements,
      totalItems,
      lowStockItems,
      totalValue
    };
  }, [movements, items, containerContents]);

  // Movement trends data
  const movementTrends = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayMovements = movements.filter(m => 
        m.timestamp.startsWith(date)
      );
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        arrivals: dayMovements.filter(m => m.type === 'Arrival').length,
        departures: dayMovements.filter(m => m.type === 'Departure').length,
        total: dayMovements.length
      };
    });
  }, [movements]);

  // Transport type distribution
  const transportData = useMemo(() => [
    { name: 'Container', value: metrics.containerMovements, color: '#3B82F6' },
    { name: 'Truck', value: metrics.truckMovements, color: '#F59E0B' }
  ], [metrics]);

  // Status distribution
  const statusData = useMemo(() => {
    const statusCounts = movements.reduce((acc, movement) => {
      acc[movement.status] = (acc[movement.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      color: status === 'Completed' ? '#10B981' : 
             status === 'In Progress' ? '#F59E0B' : '#EF4444'
    }));
  }, [movements]);

  // Hourly activity data
  const hourlyActivity = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return hours.map(hour => {
      const hourMovements = movements.filter(m => {
        const movementHour = new Date(m.timestamp).getHours();
        return movementHour === hour;
      });
      
      return {
        hour: `${hour}:00`,
        movements: hourMovements.length
      };
    });
  }, [movements]);

  const chartTheme = {
    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    textColor: isDark ? '#E5E7EB' : '#374151',
    gridColor: isDark ? '#374151' : '#E5E7EB'
  };

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Analytics Dashboard
              </h1>
              <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Comprehensive insights into warehouse operations and performance
              </p>
            </div>
            <div className="flex items-center gap-4">
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
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Movements"
            value={metrics.totalMovements}
            change={12.5}
            icon={<Activity className="h-6 w-6 text-white" />}
            color="bg-blue-500"
          />
          <MetricCard
            title="Total Items"
            value={metrics.totalItems}
            change={8.2}
            icon={<Package className="h-6 w-6 text-white" />}
            color="bg-green-500"
          />
          <MetricCard
            title="Total Value"
            value={`$${metrics.totalValue.toLocaleString()}`}
            change={15.3}
            icon={<DollarSign className="h-6 w-6 text-white" />}
            color="bg-purple-500"
          />
          <MetricCard
            title="Low Stock Alerts"
            value={metrics.lowStockItems}
            change={-5.1}
            icon={<AlertTriangle className="h-6 w-6 text-white" />}
            color="bg-red-500"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Movement Trends */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Movement Trends (Last 7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={movementTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                <XAxis dataKey="date" stroke={chartTheme.textColor} />
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
                <Area 
                  type="monotone" 
                  dataKey="arrivals" 
                  stackId="1" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.6}
                  name="Arrivals"
                />
                <Area 
                  type="monotone" 
                  dataKey="departures" 
                  stackId="1" 
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  fillOpacity={0.6}
                  name="Departures"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Transport Type Distribution */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Transport Type Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={transportData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {transportData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: chartTheme.backgroundColor,
                    border: `1px solid ${chartTheme.gridColor}`,
                    borderRadius: '8px',
                    color: chartTheme.textColor
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Movement Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                <XAxis dataKey="name" stroke={chartTheme.textColor} />
                <YAxis stroke={chartTheme.textColor} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: chartTheme.backgroundColor,
                    border: `1px solid ${chartTheme.gridColor}`,
                    borderRadius: '8px',
                    color: chartTheme.textColor
                  }}
                />
                <Bar dataKey="value" fill={(entry) => entry.color} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Activity */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Hourly Activity Pattern
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                <XAxis 
                  dataKey="hour" 
                  stroke={chartTheme.textColor}
                  interval={2}
                />
                <YAxis stroke={chartTheme.textColor} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: chartTheme.backgroundColor,
                    border: `1px solid ${chartTheme.gridColor}`,
                    borderRadius: '8px',
                    color: chartTheme.textColor
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="movements" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AnalyticsDashboard);
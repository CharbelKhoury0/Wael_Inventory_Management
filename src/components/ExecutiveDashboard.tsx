import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle,
  Users, Clock, Target, Award, Activity, FileText, Download,
  Filter, Calendar, RefreshCw, Eye, Shield, CheckCircle
} from 'lucide-react';
import { useInventoryStore } from '../store/inventoryStore';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface ExecutiveMetric {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
  target?: number;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'inventory' | 'user' | 'system' | 'security' | 'compliance';
}

interface ComplianceReport {
  id: string;
  name: string;
  status: 'compliant' | 'warning' | 'non-compliant';
  lastCheck: string;
  nextCheck: string;
  issues: number;
  description: string;
}

const ExecutiveDashboard: React.FC = () => {
  const { items, movements, transactions, receipts } = useInventoryStore();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [showAuditDetails, setShowAuditDetails] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Generate mock audit logs
  useEffect(() => {
    const generateAuditLogs = (): AuditLogEntry[] => {
      const actions = [
        'Item Created', 'Item Updated', 'Item Deleted', 'Movement Created',
        'Transaction Processed', 'User Login', 'User Logout', 'Report Generated',
        'Settings Changed', 'Backup Created', 'Data Export', 'Permission Changed'
      ];
      
      const users = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'Admin'];
      const categories: AuditLogEntry['category'][] = ['inventory', 'user', 'system', 'security', 'compliance'];
      const severities: AuditLogEntry['severity'][] = ['low', 'medium', 'high', 'critical'];
      
      return Array.from({ length: 50 }, (_, i) => ({
        id: `audit-${i + 1}`,
        timestamp: format(subDays(new Date(), Math.floor(Math.random() * 30)), 'yyyy-MM-dd HH:mm:ss'),
        user: users[Math.floor(Math.random() * users.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        resource: `Resource-${Math.floor(Math.random() * 100)}`,
        details: `Detailed information about the action performed`,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: severities[Math.floor(Math.random() * severities.length)],
        category: categories[Math.floor(Math.random() * categories.length)]
      }));
    };

    const generateComplianceReports = (): ComplianceReport[] => {
      return [
        {
          id: 'soc2',
          name: 'SOC 2 Type II Compliance',
          status: 'compliant',
          lastCheck: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
          nextCheck: format(subDays(new Date(), -25), 'yyyy-MM-dd'),
          issues: 0,
          description: 'Security, availability, and confidentiality controls'
        },
        {
          id: 'gdpr',
          name: 'GDPR Data Protection',
          status: 'warning',
          lastCheck: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
          nextCheck: format(subDays(new Date(), -20), 'yyyy-MM-dd'),
          issues: 2,
          description: 'General Data Protection Regulation compliance'
        },
        {
          id: 'iso27001',
          name: 'ISO 27001 Information Security',
          status: 'compliant',
          lastCheck: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
          nextCheck: format(subDays(new Date(), -27), 'yyyy-MM-dd'),
          issues: 0,
          description: 'Information security management system'
        },
        {
          id: 'hipaa',
          name: 'HIPAA Compliance',
          status: 'non-compliant',
          lastCheck: format(subDays(new Date(), 15), 'yyyy-MM-dd'),
          nextCheck: format(subDays(new Date(), -15), 'yyyy-MM-dd'),
          issues: 5,
          description: 'Health Insurance Portability and Accountability Act'
        }
      ];
    };

    setAuditLogs(generateAuditLogs());
    setComplianceReports(generateComplianceReports());
  }, []);

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case '7d': return { start: subDays(now, 7), end: now };
      case '30d': return { start: subDays(now, 30), end: now };
      case '90d': return { start: subDays(now, 90), end: now };
      case '1y': return { start: subDays(now, 365), end: now };
      default: return { start: subDays(now, 30), end: now };
    }
  }, [timeRange]);

  const executiveMetrics = useMemo((): ExecutiveMetric[] => {
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalTransactions = transactions.length;
    const recentMovements = movements.filter(m => 
      new Date(m.timestamp) >= dateRange.start && new Date(m.timestamp) <= dateRange.end
    );
    
    const lowStockItems = items.filter(item => item.quantity <= item.minStock).length;
    const averageOrderValue = totalTransactions > 0 ? totalValue / totalTransactions : 0;
    
    return [
      {
        title: 'Total Inventory Value',
        value: `$${totalValue.toLocaleString()}`,
        change: 12.5,
        trend: 'up',
        icon: <DollarSign className="w-6 h-6" />,
        color: 'text-green-600',
        target: 1000000
      },
      {
        title: 'Total Items in Stock',
        value: totalItems.toLocaleString(),
        change: -3.2,
        trend: 'down',
        icon: <Package className="w-6 h-6" />,
        color: 'text-blue-600',
        target: 50000
      },
      {
        title: 'Low Stock Alerts',
        value: lowStockItems,
        change: 8.1,
        trend: 'up',
        icon: <AlertTriangle className="w-6 h-6" />,
        color: 'text-red-600',
        target: 0
      },
      {
        title: 'Recent Movements',
        value: recentMovements.length,
        change: 15.3,
        trend: 'up',
        icon: <Activity className="w-6 h-6" />,
        color: 'text-purple-600',
        target: 1000
      },
      {
        title: 'Average Order Value',
        value: `$${averageOrderValue.toFixed(2)}`,
        change: 5.7,
        trend: 'up',
        icon: <Target className="w-6 h-6" />,
        color: 'text-indigo-600',
        target: 500
      },
      {
        title: 'Compliance Score',
        value: '94%',
        change: 2.1,
        trend: 'up',
        icon: <Shield className="w-6 h-6" />,
        color: 'text-green-600',
        target: 100
      }
    ];
  }, [items, movements, transactions, dateRange]);

  const chartData = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const dayMovements = movements.filter(m => 
        format(new Date(m.timestamp), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      return {
        date: format(date, 'MMM dd'),
        movements: dayMovements.length,
        value: dayMovements.reduce((sum, m) => {
          const item = items.find(i => i.id === m.itemId);
          return sum + (item ? item.price * m.quantity : 0);
        }, 0),
        inbound: dayMovements.filter(m => m.type === 'inbound').length,
        outbound: dayMovements.filter(m => m.type === 'outbound').length
      };
    });
    
    return days;
  }, [movements, items]);

  const categoryDistribution = useMemo(() => {
    const categories = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [items]);

  const filteredAuditLogs = useMemo(() => {
    if (filterCategory === 'all') return auditLogs;
    return auditLogs.filter(log => log.category === filterCategory);
  }, [auditLogs, filterCategory]);

  const complianceOverview = useMemo(() => {
    const total = complianceReports.length;
    const compliant = complianceReports.filter(r => r.status === 'compliant').length;
    const warning = complianceReports.filter(r => r.status === 'warning').length;
    const nonCompliant = complianceReports.filter(r => r.status === 'non-compliant').length;
    
    return [
      { name: 'Compliant', value: compliant, color: '#10B981' },
      { name: 'Warning', value: warning, color: '#F59E0B' },
      { name: 'Non-Compliant', value: nonCompliant, color: '#EF4444' }
    ];
  }, [complianceReports]);

  const exportExecutiveReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      metrics: executiveMetrics,
      chartData,
      complianceStatus: complianceOverview,
      auditSummary: {
        totalLogs: auditLogs.length,
        criticalIssues: auditLogs.filter(log => log.severity === 'critical').length,
        recentActivity: auditLogs.slice(0, 10)
      }
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executive-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: AuditLogEntry['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getComplianceStatusColor = (status: ComplianceReport['status']) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'non-compliant': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive overview and compliance monitoring</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={exportExecutiveReport}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Executive Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {executiveMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${metric.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                <div className={metric.color}>
                  {metric.icon}
                </div>
              </div>
              <div className={`flex items-center text-sm ${
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {metric.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : 
                 metric.trend === 'down' ? <TrendingDown className="w-4 h-4 mr-1" /> : null}
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
              <p className="text-gray-600 text-sm">{metric.title}</p>
              {metric.target && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress to target</span>
                    <span>{typeof metric.value === 'string' ? '0' : Math.min(100, (Number(metric.value) / metric.target) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${typeof metric.value === 'string' ? 0 : Math.min(100, (Number(metric.value) / metric.target) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Movement Trends */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Movement Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="inbound" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="outbound" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={complianceOverview}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {complianceOverview.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Reports</h3>
          <div className="space-y-3">
            {complianceReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    report.status === 'compliant' ? 'bg-green-500' :
                    report.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <h4 className="font-medium text-gray-900">{report.name}</h4>
                    <p className="text-sm text-gray-600">{report.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    getComplianceStatusColor(report.status)
                  }`}>
                    {report.status.replace('-', ' ').toUpperCase()}
                  </span>
                  {report.issues > 0 && (
                    <p className="text-xs text-red-600 mt-1">{report.issues} issues</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Trail */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Audit Trail</h3>
            <div className="flex items-center space-x-4">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="inventory">Inventory</option>
                <option value="user">User</option>
                <option value="system">System</option>
                <option value="security">Security</option>
                <option value="compliance">Compliance</option>
              </select>
              <button
                onClick={() => setShowAuditDetails(!showAuditDetails)}
                className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Eye className="w-4 h-4 mr-1" />
                {showAuditDetails ? 'Hide' : 'Show'} Details
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAuditLogs.slice(0, 20).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    getSeverityColor(log.severity)
                  }`}>
                    {log.severity.toUpperCase()}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{log.action}</span>
                      <span className="text-gray-500">by</span>
                      <span className="text-blue-600">{log.user}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {log.resource} • {log.timestamp}
                    </p>
                    {showAuditDetails && (
                      <div className="mt-2 text-xs text-gray-500">
                        <p>IP: {log.ipAddress}</p>
                        <p>Details: {log.details}</p>
                      </div>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  log.category === 'security' ? 'text-red-600 bg-red-50' :
                  log.category === 'compliance' ? 'text-purple-600 bg-purple-50' :
                  log.category === 'inventory' ? 'text-blue-600 bg-blue-50' :
                  log.category === 'user' ? 'text-green-600 bg-green-50' :
                  'text-gray-600 bg-gray-50'
                }`}>
                  {log.category}
                </span>
              </div>
            ))}
          </div>
          
          {filteredAuditLogs.length > 20 && (
            <div className="mt-4 text-center">
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Load More ({filteredAuditLogs.length - 20} remaining)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
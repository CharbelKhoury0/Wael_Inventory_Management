import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  AlertTriangle,
  Clock,
  Package,
  Wrench,
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Settings,
  Filter,
  Calendar,
  TrendingDown,
  Truck,
  Container
} from 'lucide-react';

interface Alert {
  id: string;
  type: 'low_stock' | 'maintenance' | 'expiry' | 'system' | 'movement';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isResolved: boolean;
  itemId?: string;
  containerId?: string;
  actionRequired?: boolean;
  dueDate?: string;
}

interface AlertsSystemProps {
  items: any[];
  movements: any[];
  containerContents: Record<string, any[]>;
  onAlertAction?: (alertId: string, action: string) => void;
}

interface AlertSettings {
  lowStockThreshold: number;
  criticalStockThreshold: number;
  maintenanceReminderDays: number;
  expiryWarningDays: number;
  enableNotifications: boolean;
  enableEmailAlerts: boolean;
  alertFrequency: 'immediate' | 'hourly' | 'daily';
}

const AlertsSystem: React.FC<AlertsSystemProps> = ({ 
  items, 
  movements, 
  containerContents, 
  onAlertAction 
}) => {
  const { isDark } = useTheme();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [filterType, setFilterType] = useState<'all' | Alert['type']>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | Alert['severity']>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  const [settings, setSettings] = useState<AlertSettings>({
    lowStockThreshold: 20,
    criticalStockThreshold: 5,
    maintenanceReminderDays: 30,
    expiryWarningDays: 7,
    enableNotifications: true,
    enableEmailAlerts: false,
    alertFrequency: 'immediate'
  });

  // Generate alerts based on current data
  const generateAlerts = useMemo(() => {
    const newAlerts: Alert[] = [];
    const now = new Date();

    // Low stock alerts
    items.forEach(item => {
      const stockPercentage = (item.quantity / item.minStock) * 100;
      
      if (item.quantity <= settings.criticalStockThreshold) {
        newAlerts.push({
          id: `low_stock_critical_${item.id}`,
          type: 'low_stock',
          severity: 'critical',
          title: 'Critical Stock Level',
          message: `${item.name} (${item.sku}) has critically low stock: ${item.quantity} units remaining`,
          timestamp: now.toISOString(),
          isRead: false,
          isResolved: false,
          itemId: item.id,
          actionRequired: true
        });
      } else if (item.quantity <= settings.lowStockThreshold) {
        newAlerts.push({
          id: `low_stock_${item.id}`,
          type: 'low_stock',
          severity: 'high',
          title: 'Low Stock Alert',
          message: `${item.name} (${item.sku}) is running low: ${item.quantity} units remaining`,
          timestamp: now.toISOString(),
          isRead: false,
          isResolved: false,
          itemId: item.id,
          actionRequired: true
        });
      }
    });

    // Maintenance alerts (simulated based on item age and usage)
    items.forEach(item => {
      // Simulate maintenance needs for equipment categories
      if (['Port Equipment', 'Engine Parts', 'Electrical Systems'].includes(item.category)) {
        const maintenanceDue = Math.random() > 0.85; // 15% chance of maintenance due
        
        if (maintenanceDue) {
          const daysUntilDue = Math.floor(Math.random() * settings.maintenanceReminderDays);
          const dueDate = new Date(now.getTime() + daysUntilDue * 24 * 60 * 60 * 1000);
          
          newAlerts.push({
            id: `maintenance_${item.id}`,
            type: 'maintenance',
            severity: daysUntilDue <= 7 ? 'high' : daysUntilDue <= 14 ? 'medium' : 'low',
            title: 'Maintenance Required',
            message: `${item.name} (${item.sku}) requires maintenance in ${daysUntilDue} days`,
            timestamp: now.toISOString(),
            isRead: false,
            isResolved: false,
            itemId: item.id,
            actionRequired: true,
            dueDate: dueDate.toISOString()
          });
        }
      }
    });

    // Movement-based alerts
    const recentMovements = movements.filter(m => {
      const movementDate = new Date(m.timestamp);
      const hoursSince = (now.getTime() - movementDate.getTime()) / (1000 * 60 * 60);
      return hoursSince <= 24; // Last 24 hours
    });

    // Alert for containers that have been locked for too long
    recentMovements.forEach(movement => {
      if (movement.transportType === 'Container' && movement.isLocked) {
        const lockDuration = Math.random() * 48; // Simulate lock duration in hours
        
        if (lockDuration > 24) {
          newAlerts.push({
            id: `container_locked_${movement.containerId}`,
            type: 'movement',
            severity: lockDuration > 36 ? 'high' : 'medium',
            title: 'Container Locked Too Long',
            message: `Container ${movement.containerId} has been locked for ${Math.floor(lockDuration)} hours`,
            timestamp: now.toISOString(),
            isRead: false,
            isResolved: false,
            containerId: movement.containerId,
            actionRequired: true
          });
        }
      }
    });

    // System alerts (simulated)
    const systemAlerts = [
      {
        id: 'system_backup',
        type: 'system' as const,
        severity: 'low' as const,
        title: 'Scheduled Backup',
        message: 'System backup completed successfully at 2:00 AM',
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        isRead: false,
        isResolved: true
      },
      {
        id: 'system_update',
        type: 'system' as const,
        severity: 'medium' as const,
        title: 'System Update Available',
        message: 'A new system update is available. Please schedule maintenance window.',
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        isRead: false,
        isResolved: false,
        actionRequired: true
      }
    ];

    return [...newAlerts, ...systemAlerts];
  }, [items, movements, settings]);

  // Update alerts when data changes
  useEffect(() => {
    setAlerts(generateAlerts);
  }, [generateAlerts]);

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const typeMatch = filterType === 'all' || alert.type === filterType;
      const severityMatch = filterSeverity === 'all' || alert.severity === filterSeverity;
      const readMatch = !showUnreadOnly || !alert.isRead;
      
      return typeMatch && severityMatch && readMatch;
    });
  }, [alerts, filterType, filterSeverity, showUnreadOnly]);

  // Alert statistics
  const alertStats = useMemo(() => {
    const unreadCount = alerts.filter(a => !a.isRead).length;
    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const actionRequiredCount = alerts.filter(a => a.actionRequired && !a.isResolved).length;
    
    return { unreadCount, criticalCount, actionRequiredCount };
  }, [alerts]);

  // Handle alert actions
  const handleMarkAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isResolved: true, isRead: true } : alert
    ));
    
    if (onAlertAction) {
      onAlertAction(alertId, 'resolve');
    }
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    
    if (onAlertAction) {
      onAlertAction(alertId, 'dismiss');
    }
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
  };

  // Get alert icon and color
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'low_stock': return Package;
      case 'maintenance': return Wrench;
      case 'expiry': return Clock;
      case 'movement': return Truck;
      case 'system': return Settings;
      default: return AlertTriangle;
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Bell className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Alerts & Notifications
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {alertStats.unreadCount} unread • {alertStats.actionRequiredCount} require action
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mark All Read
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className={`font-medium ${isDark ? 'text-red-400' : 'text-red-800'}`}>
              Critical Alerts
            </span>
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-red-300' : 'text-red-900'}`}>
            {alertStats.criticalCount}
          </p>
        </div>
        
        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span className={`font-medium ${isDark ? 'text-orange-400' : 'text-orange-800'}`}>
              Action Required
            </span>
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-orange-300' : 'text-orange-900'}`}>
            {alertStats.actionRequiredCount}
          </p>
        </div>
        
        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <span className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
              Total Alerts
            </span>
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
            {alerts.length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className={`px-3 py-1 border rounded-lg text-sm ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Types</option>
            <option value="low_stock">Low Stock</option>
            <option value="maintenance">Maintenance</option>
            <option value="movement">Movement</option>
            <option value="system">System</option>
          </select>
        </div>
        
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as any)}
          className={`px-3 py-1 border rounded-lg text-sm ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
            className="rounded"
          />
          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Unread only
          </span>
        </label>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-400' : 'text-gray-400'} mb-4`} />
            <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              No alerts found
            </p>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              All systems are running smoothly.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const IconComponent = getAlertIcon(alert.type);
            const severityColor = getSeverityColor(alert.severity);
            
            return (
              <div
                key={alert.id}
                className={`p-4 border rounded-lg transition-all ${
                  alert.isRead
                    ? isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                    : isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                } ${!alert.isRead ? 'shadow-md' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${severityColor}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} ${!alert.isRead ? 'font-semibold' : ''}`}>
                          {alert.title}
                        </h4>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatTimeAgo(alert.timestamp)}
                          </span>
                          {alert.dueDate && (
                            <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                              <Calendar className="h-3 w-3" />
                              Due: {new Date(alert.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {alert.actionRequired && !alert.isResolved && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                              Action Required
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-4">
                        {!alert.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(alert.id)}
                            className={`p-1 rounded transition-colors ${
                              isDark
                                ? 'hover:bg-gray-600 text-gray-400'
                                : 'hover:bg-gray-200 text-gray-500'
                            }`}
                            title="Mark as read"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        {alert.actionRequired && !alert.isResolved && (
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="p-1 rounded transition-colors text-green-600 hover:bg-green-100"
                            title="Resolve alert"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDismissAlert(alert.id)}
                          className={`p-1 rounded transition-colors ${
                            isDark
                              ? 'hover:bg-gray-600 text-gray-400'
                              : 'hover:bg-gray-200 text-gray-500'
                          }`}
                          title="Dismiss alert"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg w-full max-w-md`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Alert Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className={`text-gray-400 hover:text-gray-600 ${isDark ? 'hover:text-gray-300' : ''}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  value={settings.lowStockThreshold}
                  onChange={(e) => setSettings({...settings, lowStockThreshold: parseInt(e.target.value)})}
                  className={`w-full px-3 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Critical Stock Threshold
                </label>
                <input
                  type="number"
                  value={settings.criticalStockThreshold}
                  onChange={(e) => setSettings({...settings, criticalStockThreshold: parseInt(e.target.value)})}
                  className={`w-full px-3 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => setSettings({...settings, enableNotifications: e.target.checked})}
                  className="rounded"
                />
                <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Enable browser notifications
                </label>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className={`flex-1 px-4 py-2 border rounded-lg ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
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

export default React.memo(AlertsSystem);
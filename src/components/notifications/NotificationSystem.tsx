import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, Check, AlertCircle, Info, CheckCircle, AlertTriangle, Settings, Filter, Archive, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  category?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
  data?: any;
  expiresAt?: Date;
}

interface NotificationPreferences {
  enableSound: boolean;
  enableDesktop: boolean;
  enableToasts: boolean;
  categories: Record<string, boolean>;
  priorities: Record<string, boolean>;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  maxNotifications: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onNotificationRead: (id: string) => void;
  onNotificationDismiss: (id: string) => void;
  onNotificationAction: (id: string, actionIndex: number) => void;
  preferences?: NotificationPreferences;
  onPreferencesChange?: (preferences: NotificationPreferences) => void;
  className?: string;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enableSound: true,
  enableDesktop: true,
  enableToasts: true,
  categories: {},
  priorities: {
    low: true,
    medium: true,
    high: true,
    urgent: true
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  maxNotifications: 50
};

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onNotificationRead,
  onNotificationDismiss,
  onNotificationAction,
  preferences = DEFAULT_PREFERENCES,
  onPreferencesChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'priority'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [localPreferences, setLocalPreferences] = useState(preferences);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // Get notification icon
  const getNotificationIcon = useCallback((type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'reminder':
        return <Bell className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  }, []);
  
  // Get priority color
  const getPriorityColor = useCallback((priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  }, []);
  
  // Check if in quiet hours
  const isInQuietHours = useCallback((): boolean => {
    if (!localPreferences.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = localPreferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = localPreferences.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Crosses midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, [localPreferences.quietHours]);
  
  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!localPreferences.enableSound || isInQuietHours()) return;
    
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [localPreferences.enableSound, isInQuietHours]);
  
  // Show desktop notification
  const showDesktopNotification = useCallback((notification: Notification) => {
    if (!localPreferences.enableDesktop || isInQuietHours()) return;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      const desktopNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent'
      });
      
      desktopNotification.onclick = () => {
        window.focus();
        setIsOpen(true);
        onNotificationRead(notification.id);
        desktopNotification.close();
      };
      
      // Auto close after 5 seconds for non-urgent notifications
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          desktopNotification.close();
        }, 5000);
      }
    }
  }, [localPreferences.enableDesktop, isInQuietHours, onNotificationRead]);
  
  // Show toast notification
  const showToastNotification = useCallback((notification: Notification) => {
    if (!localPreferences.enableToasts || isInQuietHours()) return;
    
    const toastOptions = {
      duration: notification.priority === 'urgent' ? 10000 : 5000,
      position: 'top-right' as const,
      action: notification.actions?.[0] ? {
        label: notification.actions[0].label,
        onClick: notification.actions[0].action
      } : undefined
    };
    
    switch (notification.type) {
      case 'success':
        toast.success(notification.title, toastOptions);
        break;
      case 'warning':
        toast.warning(notification.title, toastOptions);
        break;
      case 'error':
        toast.error(notification.title, toastOptions);
        break;
      default:
        toast.info(notification.title, toastOptions);
        break;
    }
  }, [localPreferences.enableToasts, isInQuietHours]);
  
  // Handle new notifications
  useEffect(() => {
    const newNotifications = notifications.filter(n => !n.read && n.timestamp > new Date(Date.now() - 1000));
    
    newNotifications.forEach(notification => {
      // Check if category is enabled
      if (notification.category && localPreferences.categories[notification.category] === false) {
        return;
      }
      
      // Check if priority is enabled
      if (!localPreferences.priorities[notification.priority]) {
        return;
      }
      
      playNotificationSound();
      showDesktopNotification(notification);
      showToastNotification(notification);
    });
  }, [notifications, localPreferences, playNotificationSound, showDesktopNotification, showToastNotification]);
  
  // Request desktop notification permission
  useEffect(() => {
    if (localPreferences.enableDesktop && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [localPreferences.enableDesktop]);
  
  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    // Filter by read status
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'priority' && notification.priority === 'low') return false;
    
    // Filter by category
    if (selectedCategory !== 'all' && notification.category !== selectedCategory) return false;
    
    // Filter expired notifications
    if (notification.expiresAt && notification.expiresAt < new Date()) return false;
    
    return true;
  });
  
  // Get unique categories
  const categories = Array.from(new Set(notifications.map(n => n.category).filter(Boolean)));
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Handle preference changes
  const handlePreferenceChange = useCallback((key: string, value: any) => {
    const newPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(newPreferences);
    
    if (onPreferencesChange) {
      onPreferencesChange(newPreferences);
    }
  }, [localPreferences, onPreferencesChange]);
  
  // Mark all as read
  const markAllAsRead = useCallback(() => {
    notifications.filter(n => !n.read).forEach(n => onNotificationRead(n.id));
  }, [notifications, onNotificationRead]);
  
  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    notifications.forEach(n => onNotificationDismiss(n.id));
  }, [notifications, onNotificationDismiss]);
  
  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <Bell className="w-6 h-6" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Notification Panel */}
      {isOpen && (
        <div
          ref={notificationRef}
          className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Notifications
              </h3>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex items-center space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="priority">Priority</option>
              </select>
              
              {categories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              )}
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>
          
          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Notification Settings
              </h4>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localPreferences.enableSound}
                    onChange={(e) => handlePreferenceChange('enableSound', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Sound notifications</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localPreferences.enableDesktop}
                    onChange={(e) => handlePreferenceChange('enableDesktop', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Desktop notifications</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localPreferences.enableToasts}
                    onChange={(e) => handlePreferenceChange('enableToasts', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Toast notifications</span>
                </label>
                
                <div className="pt-2">
                  <label className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      checked={localPreferences.quietHours.enabled}
                      onChange={(e) => handlePreferenceChange('quietHours', {
                        ...localPreferences.quietHours,
                        enabled: e.target.checked
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Quiet hours</span>
                  </label>
                  
                  {localPreferences.quietHours.enabled && (
                    <div className="flex items-center space-x-2 ml-6">
                      <input
                        type="time"
                        value={localPreferences.quietHours.start}
                        onChange={(e) => handlePreferenceChange('quietHours', {
                          ...localPreferences.quietHours,
                          start: e.target.value
                        })}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                      <span className="text-xs text-gray-500">to</span>
                      <input
                        type="time"
                        value={localPreferences.quietHours.end}
                        onChange={(e) => handlePreferenceChange('quietHours', {
                          ...localPreferences.quietHours,
                          end: e.target.value
                        })}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`
                    p-4 border-l-4 border-b border-gray-200 dark:border-gray-700 transition-colors
                    ${notification.read ? 'opacity-60' : ''}
                    ${getPriorityColor(notification.priority)}
                    hover:bg-gray-50 dark:hover:bg-gray-700
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </h4>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {notification.timestamp.toLocaleTimeString()}
                            </span>
                            
                            {notification.category && (
                              <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                                {notification.category}
                              </span>
                            )}
                            
                            <span className={`text-xs px-2 py-1 rounded ${
                              notification.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                              notification.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                              notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            }`}>
                              {notification.priority}
                            </span>
                          </div>
                          
                          {/* Actions */}
                          {notification.actions && notification.actions.length > 0 && (
                            <div className="flex items-center space-x-2 mt-3">
                              {notification.actions.map((action, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    action.action();
                                    onNotificationAction(notification.id, index);
                                  }}
                                  className={`
                                    px-3 py-1 text-xs rounded transition-colors
                                    ${action.style === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                      action.style === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
                                      'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                                    }
                                  `}
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <button
                              onClick={() => onNotificationRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => onNotificationDismiss(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Dismiss"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {filteredNotifications.length} of {notifications.length} notifications
                </span>
                
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationSystem;
export type { Notification, NotificationPreferences, NotificationSystemProps };
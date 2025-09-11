import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Filter, Calendar, User, Clock, CheckCircle, XCircle, AlertCircle, MoreHorizontal, Edit, Trash2, Eye, MessageSquare, Bell, Flag, ArrowRight, Users, Tag, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'review' | 'approved' | 'rejected' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
    email: string;
  };
  creator: {
    id: string;
    name: string;
    avatar?: string;
    email: string;
  };
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  category: string;
  tags: string[];
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  comments: Array<{
    id: string;
    author: {
      id: string;
      name: string;
      avatar?: string;
    };
    content: string;
    createdAt: Date;
  }>;
  approvals: Array<{
    id: string;
    approver: {
      id: string;
      name: string;
      avatar?: string;
    };
    status: 'pending' | 'approved' | 'rejected';
    comment?: string;
    timestamp: Date;
  }>;
  workflow?: {
    id: string;
    name: string;
    steps: Array<{
      id: string;
      name: string;
      type: 'task' | 'approval' | 'review';
      assignee?: string;
      completed: boolean;
      completedAt?: Date;
    }>;
  };
  metadata?: Record<string, any>;
}

interface TaskFilter {
  status?: Task['status'][];
  priority?: Task['priority'][];
  assignee?: string[];
  category?: string[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface TaskManagerProps {
  tasks: Task[];
  onTaskCreate?: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskAssign?: (taskId: string, assigneeId: string) => void;
  onTaskApprove?: (taskId: string, comment?: string) => void;
  onTaskReject?: (taskId: string, comment: string) => void;
  onCommentAdd?: (taskId: string, comment: string) => void;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
    email: string;
    role: 'admin' | 'manager' | 'user';
  };
  users: Array<{
    id: string;
    name: string;
    avatar?: string;
    email: string;
    role: string;
  }>;
  categories: string[];
  workflows: Array<{
    id: string;
    name: string;
    description: string;
    steps: Array<{
      id: string;
      name: string;
      type: 'task' | 'approval' | 'review';
      assigneeRole?: string;
    }>;
  }>;
  className?: string;
}

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
};

const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onTaskAssign,
  onTaskApprove,
  onTaskReject,
  onCommentAdd,
  currentUser,
  users,
  categories,
  workflows,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TaskFilter>({});
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'calendar'>('list');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status' | 'createdAt'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.category.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query)) ||
        task.assignee?.name.toLowerCase().includes(query) ||
        task.creator.name.toLowerCase().includes(query)
      );
    }
    
    // Apply filters
    if (filters.status?.length) {
      filtered = filtered.filter(task => filters.status!.includes(task.status));
    }
    
    if (filters.priority?.length) {
      filtered = filtered.filter(task => filters.priority!.includes(task.priority));
    }
    
    if (filters.assignee?.length) {
      filtered = filtered.filter(task => 
        task.assignee && filters.assignee!.includes(task.assignee.id)
      );
    }
    
    if (filters.category?.length) {
      filtered = filtered.filter(task => filters.category!.includes(task.category));
    }
    
    if (filters.tags?.length) {
      filtered = filtered.filter(task => 
        task.tags.some(tag => filters.tags!.includes(tag))
      );
    }
    
    if (filters.dateRange) {
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false;
        return task.dueDate >= filters.dateRange!.start && task.dueDate <= filters.dateRange!.end;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'dueDate':
          aValue = a.dueDate?.getTime() || 0;
          bValue = b.dueDate?.getTime() || 0;
          break;
        case 'priority':
          const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'status':
          const statusOrder = { pending: 1, in_progress: 2, review: 3, approved: 4, rejected: 5, completed: 6 };
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
    
    return filtered;
  }, [tasks, searchQuery, filters, sortBy, sortOrder]);
  
  // Group tasks by status for board view
  const tasksByStatus = useMemo(() => {
    const grouped: Record<Task['status'], Task[]> = {
      pending: [],
      in_progress: [],
      review: [],
      approved: [],
      rejected: [],
      completed: []
    };
    
    filteredTasks.forEach(task => {
      grouped[task.status].push(task);
    });
    
    return grouped;
  }, [filteredTasks]);
  
  // Handle task selection
  const handleTaskSelect = useCallback((taskId: string, selected: boolean) => {
    setSelectedTasks(prev => {
      if (selected) {
        return [...prev, taskId];
      } else {
        return prev.filter(id => id !== taskId);
      }
    });
  }, []);
  
  // Handle bulk actions
  const handleBulkAction = useCallback((action: 'assign' | 'delete' | 'status_change', value?: any) => {
    if (selectedTasks.length === 0) {
      toast.error('No tasks selected');
      return;
    }
    
    switch (action) {
      case 'assign':
        selectedTasks.forEach(taskId => {
          if (onTaskAssign) {
            onTaskAssign(taskId, value);
          }
        });
        toast.success(`Assigned ${selectedTasks.length} tasks`);
        break;
        
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedTasks.length} tasks?`)) {
          selectedTasks.forEach(taskId => {
            if (onTaskDelete) {
              onTaskDelete(taskId);
            }
          });
          toast.success(`Deleted ${selectedTasks.length} tasks`);
        }
        break;
        
      case 'status_change':
        selectedTasks.forEach(taskId => {
          if (onTaskUpdate) {
            onTaskUpdate(taskId, { status: value });
          }
        });
        toast.success(`Updated status for ${selectedTasks.length} tasks`);
        break;
    }
    
    setSelectedTasks([]);
  }, [selectedTasks, onTaskAssign, onTaskDelete, onTaskUpdate]);
  
  // Handle task approval
  const handleTaskApproval = useCallback((task: Task, approved: boolean, comment?: string) => {
    if (approved && onTaskApprove) {
      onTaskApprove(task.id, comment);
      toast.success(`Task "${task.title}" approved`);
    } else if (!approved && onTaskReject) {
      onTaskReject(task.id, comment || 'No reason provided');
      toast.success(`Task "${task.title}" rejected`);
    }
  }, [onTaskApprove, onTaskReject]);
  
  // Get task statistics
  const taskStats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'completed').length;
    const pending = filteredTasks.filter(t => t.status === 'pending').length;
    const overdue = filteredTasks.filter(t => 
      t.dueDate && t.dueDate < new Date() && t.status !== 'completed'
    ).length;
    
    return { total, completed, pending, overdue };
  }, [filteredTasks]);
  
  // Format date
  const formatDate = useCallback((date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  }, []);
  
  // Render task card
  const renderTaskCard = useCallback((task: Task, compact = false) => {
    const isOverdue = task.dueDate && task.dueDate < new Date() && task.status !== 'completed';
    const isSelected = selectedTasks.includes(task.id);
    
    return (
      <div
        key={task.id}
        className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        } ${isOverdue ? 'border-red-300 dark:border-red-700' : ''}`}
        onClick={() => {
          setSelectedTask(task);
          setShowTaskDetail(true);
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                handleTaskSelect(task.id, e.target.checked);
              }}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {task.title}
              </h4>
              
              {!compact && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
              
              <div className="flex items-center space-x-2 mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[task.status]}`}>
                  {task.status.replace('_', ' ')}
                </span>
                
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                  {task.priority}
                </span>
                
                {task.category && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    {task.category}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isOverdue && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            
            {task.comments.length > 0 && (
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{task.comments.length}</span>
              </div>
            )}
            
            {task.attachments.length > 0 && (
              <div className="flex items-center space-x-1">
                <FileText className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{task.attachments.length}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            {task.assignee && (
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>{task.assignee.name}</span>
              </div>
            )}
            
            {task.dueDate && (
              <div className={`flex items-center space-x-1 ${
                isOverdue ? 'text-red-500' : ''
              }`}>
                <Calendar className="w-3 h-3" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{formatDate(task.createdAt)}</span>
          </div>
        </div>
        
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              >
                <Tag className="w-2 h-2 mr-1" />
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{task.tags.length - 3} more</span>
            )}
          </div>
        )}
      </div>
    );
  }, [selectedTasks, handleTaskSelect, formatDate]);
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Task Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage tasks, workflows, and approvals
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{taskStats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{taskStats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{taskStats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{taskStats.overdue}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors ${
              showFilters ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="list">List View</option>
            <option value="board">Board View</option>
            <option value="calendar">Calendar View</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as any);
              setSortOrder(order as any);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="dueDate-asc">Due Date (Earliest)</option>
            <option value="dueDate-desc">Due Date (Latest)</option>
            <option value="priority-desc">Priority (High to Low)</option>
            <option value="priority-asc">Priority (Low to High)</option>
            <option value="status-asc">Status (A-Z)</option>
            <option value="createdAt-desc">Created (Newest)</option>
            <option value="createdAt-asc">Created (Oldest)</option>
          </select>
        </div>
      </div>
      
      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
            </span>
            
            <div className="flex items-center space-x-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkAction('assign', e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-2 py-1 text-sm border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-800"
              >
                <option value="">Assign to...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkAction('status_change', e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-2 py-1 text-sm border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-800"
              >
                <option value="">Change status...</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
              
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Delete
              </button>
              
              <button
                onClick={() => setSelectedTasks([])}
                className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tasks Display */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredTasks.map(task => renderTaskCard(task))}
          
          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No tasks found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery || Object.keys(filters).length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Create your first task to get started'
                }
              </p>
            </div>
          )}
        </div>
      )}
      
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {status.replace('_', ' ')}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {statusTasks.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {statusTasks.map(task => renderTaskCard(task, true))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskManager;
export type { Task, TaskFilter, TaskManagerProps };
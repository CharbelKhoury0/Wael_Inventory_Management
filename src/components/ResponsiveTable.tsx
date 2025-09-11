import React, { useState, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import TouchGestureHandler, { hapticFeedback } from './TouchGestureHandler';
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown
} from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
  mobileHidden?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

interface Action {
  label: string;
  icon: React.ReactNode;
  onClick: (row: any) => void;
  variant?: 'primary' | 'secondary' | 'danger';
  condition?: (row: any) => boolean;
}

interface ResponsiveTableProps {
  data: any[];
  columns: Column[];
  actions?: Action[];
  searchable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  rowIdKey?: string;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  data,
  columns,
  actions = [],
  searchable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  selectedRows = [],
  onSelectionChange,
  rowIdKey = 'id'
}) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showActions, setShowActions] = useState<string | null>(null);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row =>
      columns.some(column => {
        const value = row[column.key];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (columnKey: string) => {
    if (!sortable) return;
    
    hapticFeedback(30);
    setSortConfig(current => {
      if (current?.key === columnKey) {
        return current.direction === 'asc' 
          ? { key: columnKey, direction: 'desc' }
          : null;
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  const handleRowClick = (row: any) => {
    if (onRowClick) {
      hapticFeedback(50);
      onRowClick(row);
    }
  };

  const toggleRowExpansion = (rowId: string) => {
    hapticFeedback(30);
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const handleSelectionChange = (rowId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    
    hapticFeedback(30);
    const newSelection = checked
      ? [...selectedRows, rowId]
      : selectedRows.filter(id => id !== rowId);
    
    onSelectionChange(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    
    hapticFeedback(50);
    const newSelection = checked
      ? paginatedData.map(row => row[rowIdKey])
      : [];
    
    onSelectionChange(newSelection);
  };

  const visibleColumns = columns.filter(col => !col.mobileHidden);
  const hiddenColumns = columns.filter(col => col.mobileHidden);

  const themeClasses = {
    container: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    header: isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700',
    row: isDark ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-white hover:bg-gray-50 border-gray-200',
    cell: isDark ? 'text-gray-300' : 'text-gray-900',
    searchInput: isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
  };

  return (
    <div className="w-full">
      {/* Search and Filters */}
      {searchable && (
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-200
                ${themeClasses.searchInput}
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                touch-target
              `}
            />
          </div>
          <button className={`
            flex items-center px-4 py-2 rounded-lg border transition-all duration-200
            ${isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}
            touch-target
          `}>
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <div className={`rounded-lg border ${themeClasses.container}`}>
          <table className="w-full">
            <thead className={themeClasses.header}>
              <tr>
                {onSelectionChange && (
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`
                      px-4 py-3 text-left font-medium text-sm
                      ${column.sortable && sortable ? 'cursor-pointer hover:bg-opacity-80' : ''}
                      ${column.width ? column.width : ''}
                    `}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.sortable && sortable && (
                        <div className="flex flex-col">
                          {sortConfig?.key === column.key ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )
                          ) : (
                            <ArrowUpDown className="w-4 h-4 opacity-50" />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className="w-20 px-4 py-3 text-center">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (onSelectionChange ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (onSelectionChange ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr
                    key={row[rowIdKey] || index}
                    className={`
                      border-t transition-all duration-200
                      ${themeClasses.row}
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${selectedRows.includes(row[rowIdKey]) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                    `}
                    onClick={() => handleRowClick(row)}
                  >
                    {onSelectionChange && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(row[rowIdKey])}
                          onChange={(e) => handleSelectionChange(row[rowIdKey], e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`
                          px-4 py-3 ${themeClasses.cell}
                          ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                        `}
                      >
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <button
                            onClick={() => setShowActions(showActions === row[rowIdKey] ? null : row[rowIdKey])}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {showActions === row[rowIdKey] && (
                            <div className={`
                              absolute right-0 top-8 z-10 min-w-[120px] rounded-lg shadow-lg border
                              ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                            `}>
                              {actions
                                .filter(action => !action.condition || action.condition(row))
                                .map((action, actionIndex) => (
                                <button
                                  key={actionIndex}
                                  onClick={() => {
                                    action.onClick(row);
                                    setShowActions(null);
                                  }}
                                  className={`
                                    w-full flex items-center px-3 py-2 text-sm text-left
                                    hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                                    ${actionIndex === 0 ? 'rounded-t-lg' : ''}
                                    ${actionIndex === actions.length - 1 ? 'rounded-b-lg' : ''}
                                    ${action.variant === 'danger' ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : ''}
                                  `}
                                >
                                  <span className="mr-2">{action.icon}</span>
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading...</span>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          paginatedData.map((row, index) => {
            const isExpanded = expandedRows.has(row[rowIdKey]);
            const isSelected = selectedRows.includes(row[rowIdKey]);
            
            return (
              <TouchGestureHandler
                key={row[rowIdKey] || index}
                onTap={() => handleRowClick(row)}
                onLongPress={() => toggleRowExpansion(row[rowIdKey])}
                className={`
                  rounded-lg border p-4 transition-all duration-300 transform
                  ${themeClasses.container}
                  ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
                  hover:scale-[1.02] active:scale-[0.98]
                  touch-feedback
                `}
              >
                {/* Main Content */}
                <div className="space-y-2">
                  {visibleColumns.map((column) => {
                    const value = row[column.key];
                    if (!value && value !== 0) return null;
                    
                    return (
                      <div key={column.key} className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-0 flex-1">
                          {column.label}:
                        </span>
                        <span className={`text-sm ${themeClasses.cell} text-right min-w-0 flex-1 ml-2`}>
                          {column.render ? column.render(value, row) : value}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Expanded Content */}
                {isExpanded && hiddenColumns.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2 animate-fade-in">
                    {hiddenColumns.map((column) => {
                      const value = row[column.key];
                      if (!value && value !== 0) return null;
                      
                      return (
                        <div key={column.key} className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-0 flex-1">
                            {column.label}:
                          </span>
                          <span className={`text-sm ${themeClasses.cell} text-right min-w-0 flex-1 ml-2`}>
                            {column.render ? column.render(value, row) : value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Actions */}
                {actions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap gap-2">
                      {actions
                        .filter(action => !action.condition || action.condition(row))
                        .map((action, actionIndex) => (
                        <button
                          key={actionIndex}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(row);
                          }}
                          className={`
                            flex items-center px-3 py-1.5 rounded-lg text-xs font-medium
                            transition-all duration-200 transform hover:scale-105 active:scale-95
                            ${
                              action.variant === 'danger'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                                : action.variant === 'primary'
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                            }
                          `}
                        >
                          <span className="mr-1">{action.icon}</span>
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selection Checkbox */}
                {onSelectionChange && (
                  <div className="absolute top-4 right-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectionChange(row[rowIdKey], e.target.checked);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Expansion Indicator */}
                {hiddenColumns.length > 0 && (
                  <div className="absolute bottom-4 right-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRowExpansion(row[rowIdKey]);
                      }}
                      className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </TouchGestureHandler>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`
                px-3 py-1 rounded border transition-colors touch-target
                ${currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }
                ${isDark ? 'border-gray-600' : 'border-gray-300'}
              `}
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`
                      w-8 h-8 rounded border transition-colors touch-target
                      ${currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : `hover:bg-gray-50 dark:hover:bg-gray-700 ${isDark ? 'border-gray-600' : 'border-gray-300'}`
                      }
                    `}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`
                px-3 py-1 rounded border transition-colors touch-target
                ${currentPage === totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }
                ${isDark ? 'border-gray-600' : 'border-gray-300'}
              `}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponsiveTable;
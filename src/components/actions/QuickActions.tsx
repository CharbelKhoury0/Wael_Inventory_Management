import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MoreVertical, Zap, Star, Copy, Edit3, Trash2, Eye, Download, Share2, Archive, Tag, Clock, Plus } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  description?: string;
  category?: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  featured?: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
  trigger?: 'click' | 'hover' | 'contextmenu';
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  showShortcuts?: boolean;
  showCategories?: boolean;
  maxVisible?: number;
  className?: string;
  children?: React.ReactNode;
}

interface ActionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  actions: QuickAction[];
  searchable?: boolean;
  title?: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  actions: QuickAction[];
  onClose: () => void;
}

// Context Menu Component
const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, actions, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);
  
  // Group actions by category
  const groupedActions = actions.reduce((acc, action) => {
    const category = action.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(action);
    return acc;
  }, {} as Record<string, QuickAction[]>);
  
  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-48"
      style={{ left: x, top: y }}
    >
      {Object.entries(groupedActions).map(([category, categoryActions], categoryIndex) => (
        <div key={category}>
          {categoryIndex > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          )}
          
          {Object.keys(groupedActions).length > 1 && (
            <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {category}
            </div>
          )}
          
          {categoryActions.map(action => (
            <button
              key={action.id}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              disabled={action.disabled}
              className={`
                w-full flex items-center space-x-3 px-3 py-2 text-left text-sm transition-colors
                ${action.disabled 
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                  : action.destructive
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <div className="flex-shrink-0">
                {action.icon}
              </div>
              
              <div className="flex-1">
                <div className="font-medium">{action.label}</div>
                {action.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {action.description}
                  </div>
                )}
              </div>
              
              {action.shortcut && (
                <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                  {action.shortcut}
                </div>
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

// Action Panel Component
const ActionPanel: React.FC<ActionPanelProps> = ({ 
  isOpen, 
  onClose, 
  actions, 
  searchable = true, 
  title = 'Quick Actions' 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Filter actions based on search query
  const filteredActions = actions.filter(action => 
    action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    action.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    action.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Group filtered actions by category
  const groupedActions = filteredActions.reduce((acc, action) => {
    const category = action.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(action);
    return acc;
  }, {} as Record<string, QuickAction[]>);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredActions.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredActions.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].onClick();
          onClose();
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredActions, selectedIndex, onClose]);
  
  // Focus search input when panel opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);
  
  // Reset search and selection when panel opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h3>
          
          {searchable && (
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search actions..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
        
        {/* Actions List */}
        <div className="max-h-64 overflow-y-auto">
          {Object.entries(groupedActions).map(([category, categoryActions], categoryIndex) => (
            <div key={category}>
              {categoryIndex > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700" />
              )}
              
              {Object.keys(groupedActions).length > 1 && (
                <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                  {category}
                </div>
              )}
              
              {categoryActions.map((action, actionIndex) => {
                const globalIndex = filteredActions.findIndex(a => a.id === action.id);
                const isSelected = globalIndex === selectedIndex;
                
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.onClick();
                      onClose();
                    }}
                    disabled={action.disabled}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors
                      ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                      ${action.disabled 
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                        : action.destructive
                          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <div className="flex-shrink-0">
                      {action.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium">{action.label}</div>
                      {action.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {action.description}
                        </div>
                      )}
                    </div>
                    
                    {action.shortcut && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                        {action.shortcut}
                      </div>
                    )}
                    
                    {action.featured && (
                      <Star className="w-4 h-4 text-yellow-500" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          
          {filteredActions.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No actions found</p>
              {searchQuery && (
                <p className="text-sm">Try a different search term</p>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>↑↓ Navigate • Enter Select • Esc Close</span>
            <span>{filteredActions.length} actions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Quick Actions Component
const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  trigger = 'click',
  position = 'auto',
  showShortcuts = true,
  showCategories = true,
  maxVisible = 3,
  className = '',
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  
  // Separate featured and regular actions
  const featuredActions = actions.filter(action => action.featured && !action.disabled);
  const regularActions = actions.filter(action => !action.featured && !action.disabled);
  const visibleActions = featuredActions.slice(0, maxVisible);
  const hiddenActions = [...featuredActions.slice(maxVisible), ...regularActions];
  
  // Handle trigger events
  const handleTrigger = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (trigger === 'contextmenu') {
      setContextMenu({ x: e.clientX, y: e.clientY });
    } else {
      setIsOpen(!isOpen);
    }
  }, [trigger, isOpen]);
  
  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (trigger === 'contextmenu') {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  }, [trigger]);
  
  // Handle hover
  const handleMouseEnter = useCallback(() => {
    if (trigger === 'hover') {
      setIsOpen(true);
    }
  }, [trigger]);
  
  const handleMouseLeave = useCallback(() => {
    if (trigger === 'hover') {
      setIsOpen(false);
    }
  }, [trigger]);
  
  // Close menus
  const closeMenus = useCallback(() => {
    setIsOpen(false);
    setContextMenu(null);
    setShowPanel(false);
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcut to open action panel
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowPanel(true);
      }
      
      // Individual action shortcuts
      actions.forEach(action => {
        if (action.shortcut && !action.disabled) {
          const keys = action.shortcut.toLowerCase().split('+');
          const hasCtrl = keys.includes('ctrl') || keys.includes('cmd');
          const hasShift = keys.includes('shift');
          const hasAlt = keys.includes('alt');
          const key = keys[keys.length - 1];
          
          if (
            (hasCtrl && (e.ctrlKey || e.metaKey)) &&
            (hasShift ? e.shiftKey : !e.shiftKey) &&
            (hasAlt ? e.altKey : !e.altKey) &&
            e.key.toLowerCase() === key
          ) {
            e.preventDefault();
            action.onClick();
          }
        }
      });
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
  
  return (
    <>
      <div
        ref={triggerRef}
        className={`relative ${className}`}
        onClick={handleTrigger}
        onContextMenu={handleContextMenu}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children || (
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        )}
        
        {/* Dropdown Menu */}
        {isOpen && trigger !== 'contextmenu' && (
          <div className="absolute z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-48">
            {/* Visible Actions */}
            {visibleActions.map(action => (
              <button
                key={action.id}
                onClick={() => {
                  action.onClick();
                  closeMenus();
                }}
                disabled={action.disabled}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2 text-left text-sm transition-colors
                  ${action.disabled 
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                    : action.destructive
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <div className="flex-shrink-0">
                  {action.icon}
                </div>
                
                <div className="flex-1">
                  <div className="font-medium">{action.label}</div>
                  {action.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {action.description}
                    </div>
                  )}
                </div>
                
                {showShortcuts && action.shortcut && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                    {action.shortcut}
                  </div>
                )}
                
                {action.featured && (
                  <Star className="w-4 h-4 text-yellow-500" />
                )}
              </button>
            ))}
            
            {/* More Actions Button */}
            {hiddenActions.length > 0 && (
              <>
                {visibleActions.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                )}
                
                <button
                  onClick={() => {
                    setShowPanel(true);
                    closeMenus();
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>More actions ({hiddenActions.length})</span>
                  <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                    Ctrl+K
                  </div>
                </button>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={actions}
          onClose={() => setContextMenu(null)}
        />
      )}
      
      {/* Action Panel */}
      <ActionPanel
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
        actions={actions}
      />
    </>
  );
};

// Predefined action creators
export const createCommonActions = (item: any): QuickAction[] => [
  {
    id: 'view',
    label: 'View Details',
    icon: <Eye className="w-4 h-4" />,
    shortcut: 'Ctrl+I',
    description: 'View item details',
    category: 'View',
    onClick: () => console.log('View', item),
    featured: true
  },
  {
    id: 'edit',
    label: 'Edit',
    icon: <Edit3 className="w-4 h-4" />,
    shortcut: 'Ctrl+E',
    description: 'Edit item',
    category: 'Edit',
    onClick: () => console.log('Edit', item),
    featured: true
  },
  {
    id: 'copy',
    label: 'Duplicate',
    icon: <Copy className="w-4 h-4" />,
    shortcut: 'Ctrl+D',
    description: 'Create a copy',
    category: 'Edit',
    onClick: () => console.log('Copy', item)
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: <Archive className="w-4 h-4" />,
    description: 'Archive item',
    category: 'Organize',
    onClick: () => console.log('Archive', item)
  },
  {
    id: 'tag',
    label: 'Add Tags',
    icon: <Tag className="w-4 h-4" />,
    description: 'Add or edit tags',
    category: 'Organize',
    onClick: () => console.log('Tag', item)
  },
  {
    id: 'share',
    label: 'Share',
    icon: <Share2 className="w-4 h-4" />,
    description: 'Share with others',
    category: 'Share',
    onClick: () => console.log('Share', item)
  },
  {
    id: 'download',
    label: 'Export',
    icon: <Download className="w-4 h-4" />,
    description: 'Export data',
    category: 'Share',
    onClick: () => console.log('Download', item)
  },
  {
    id: 'history',
    label: 'View History',
    icon: <Clock className="w-4 h-4" />,
    description: 'View change history',
    category: 'View',
    onClick: () => console.log('History', item)
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    shortcut: 'Delete',
    description: 'Delete permanently',
    category: 'Danger',
    onClick: () => console.log('Delete', item),
    destructive: true
  }
];

export default QuickActions;
export type { QuickAction, QuickActionsProps };
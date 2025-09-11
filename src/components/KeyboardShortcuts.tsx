import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { Keyboard, X, Command, Zap } from 'lucide-react';

interface KeyboardShortcutsProps {
  onAddItem?: () => void;
  onSearch?: () => void;
  onExport?: () => void;
  onBulkOperations?: () => void;
  onScanBarcode?: () => void;
  onToggleTheme?: () => void;
  onNavigate?: (page: string) => void;
}

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  category: string;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onAddItem,
  onSearch,
  onExport,
  onBulkOperations,
  onScanBarcode,
  onToggleTheme,
  onNavigate
}) => {
  const { isDark } = useTheme();
  const { showInfo } = useNotification();
  const [showHelp, setShowHelp] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const shortcuts: Shortcut[] = [
    // Navigation
    { key: 'Ctrl+1', description: 'Go to Dashboard', action: () => onNavigate?.('dashboard'), category: 'Navigation' },
    { key: 'Ctrl+2', description: 'Go to Items', action: () => onNavigate?.('items'), category: 'Navigation' },
    { key: 'Ctrl+3', description: 'Go to Movements', action: () => onNavigate?.('movements'), category: 'Navigation' },
    { key: 'Ctrl+4', description: 'Go to Transactions', action: () => onNavigate?.('transactions'), category: 'Navigation' },
    { key: 'Ctrl+5', description: 'Go to Receipts', action: () => onNavigate?.('receipts'), category: 'Navigation' },
    { key: 'Ctrl+6', description: 'Go to Analytics', action: () => onNavigate?.('analytics'), category: 'Navigation' },
    { key: 'Ctrl+7', description: 'Go to Settings', action: () => onNavigate?.('settings'), category: 'Navigation' },
    
    // Actions
    { key: 'Ctrl+N', description: 'Add New Item', action: () => onAddItem?.(), category: 'Actions' },
    { key: 'Ctrl+F', description: 'Focus Search', action: () => onSearch?.(), category: 'Actions' },
    { key: 'Ctrl+E', description: 'Export Data', action: () => onExport?.(), category: 'Actions' },
    { key: 'Ctrl+B', description: 'Bulk Operations', action: () => onBulkOperations?.(), category: 'Actions' },
    { key: 'Ctrl+S', description: 'Scan Barcode', action: () => onScanBarcode?.(), category: 'Actions' },
    
    // Interface
    { key: 'Ctrl+D', description: 'Toggle Dark Mode', action: () => onToggleTheme?.(), category: 'Interface' },
    { key: 'Ctrl+?', description: 'Show Keyboard Shortcuts', action: () => setShowHelp(true), category: 'Interface' },
    { key: 'Escape', description: 'Close Modals/Cancel', action: () => {}, category: 'Interface' },
    
    // Quick Actions
    { key: 'Alt+A', description: 'Select All Items', action: () => {}, category: 'Quick Actions' },
    { key: 'Alt+C', description: 'Clear Selection', action: () => {}, category: 'Quick Actions' },
    { key: 'Alt+R', description: 'Refresh Data', action: () => window.location.reload(), category: 'Quick Actions' }
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    setPressedKeys(prev => new Set([...prev, key]));

    // Check for shortcuts
    const isCtrl = event.ctrlKey || event.metaKey;
    const isAlt = event.altKey;
    const isShift = event.shiftKey;

    // Prevent default browser shortcuts for our custom ones
    const shortcutKey = [
      isCtrl && 'ctrl',
      isAlt && 'alt', 
      isShift && 'shift',
      key
    ].filter(Boolean).join('+');

    const matchedShortcut = shortcuts.find(s => 
      s.key.toLowerCase().replace(/\s/g, '') === shortcutKey.replace(/\s/g, '')
    );

    if (matchedShortcut) {
      event.preventDefault();
      matchedShortcut.action();
      
      // Show notification for successful shortcut
      showInfo(
        'Shortcut Activated',
        `${matchedShortcut.key}: ${matchedShortcut.description}`
      );
    }

    // Special cases
    if (isCtrl) {
      switch (key) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
          event.preventDefault();
          break;
        case 'n':
        case 'f':
        case 'e':
        case 'b':
        case 's':
        case 'd':
          event.preventDefault();
          break;
        case '/':
        case '?':
          event.preventDefault();
          setShowHelp(true);
          break;
      }
    }

    if (key === 'escape') {
      setShowHelp(false);
    }
  }, [shortcuts, showInfo]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const themeClasses = {
    modal: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    overlay: 'bg-black bg-opacity-50',
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-600',
      muted: isDark ? 'text-gray-400' : 'text-gray-500'
    },
    button: isDark ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300',
    category: isDark ? 'bg-gray-700' : 'bg-gray-50',
    key: isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800'
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  const formatKey = (key: string) => {
    return key
      .replace('Ctrl', '⌘')
      .replace('Alt', '⌥')
      .replace('Shift', '⇧')
      .replace('+', ' + ');
  };

  return (
    <>
      {/* Keyboard Shortcut Indicator */}
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setShowHelp(true)}
          className={`p-3 rounded-full shadow-lg transition-all duration-200 ${themeClasses.button} border`}
          title="Keyboard Shortcuts (Ctrl+?)"
        >
          <Keyboard className="h-5 w-5" />
        </button>
      </div>

      {/* Visual Key Press Indicator */}
      {pressedKeys.size > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`${themeClasses.modal} rounded-lg border shadow-lg p-3`}>
            <div className="flex items-center gap-2">
              <Zap className={`h-4 w-4 ${themeClasses.text.secondary}`} />
              <div className="flex gap-1">
                {Array.from(pressedKeys).map(key => (
                  <span
                    key={key}
                    className={`px-2 py-1 rounded text-xs font-mono ${themeClasses.key}`}
                  >
                    {key.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${themeClasses.overlay}`}>
          <div className={`${themeClasses.modal} rounded-lg border shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden`}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Keyboard className={`h-6 w-6 ${themeClasses.text.secondary}`} />
                <div>
                  <h3 className={`text-xl font-semibold ${themeClasses.text.primary}`}>
                    Keyboard Shortcuts
                  </h3>
                  <p className={`text-sm ${themeClasses.text.secondary}`}>
                    Speed up your workflow with these keyboard shortcuts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className={`p-2 rounded-md ${themeClasses.button}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                  <div key={category}>
                    <h4 className={`text-lg font-semibold ${themeClasses.text.primary} mb-3 flex items-center gap-2`}>
                      <Command className="h-4 w-4" />
                      {category}
                    </h4>
                    <div className="space-y-2">
                      {categoryShortcuts.map((shortcut, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg ${themeClasses.category}`}
                        >
                          <span className={`text-sm ${themeClasses.text.primary}`}>
                            {shortcut.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {shortcut.key.split('+').map((key, keyIndex) => (
                              <React.Fragment key={keyIndex}>
                                <kbd className={`px-2 py-1 rounded text-xs font-mono ${themeClasses.key} border`}>
                                  {formatKey(key.trim())}
                                </kbd>
                                {keyIndex < shortcut.key.split('+').length - 1 && (
                                  <span className={`text-xs ${themeClasses.text.muted}`}>+</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
              <div className={`text-sm ${themeClasses.text.secondary}`}>
                💡 Tip: Press <kbd className={`px-2 py-1 rounded text-xs font-mono ${themeClasses.key} border`}>Ctrl+?</kbd> anytime to open this help
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className={`px-4 py-2 rounded-md ${themeClasses.button}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyboardShortcuts;
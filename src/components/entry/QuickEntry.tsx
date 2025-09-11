import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Zap, Plus, Check, X, ArrowRight, ArrowDown, Save, RotateCcw, Keyboard } from 'lucide-react';
import { EnhancedBarcodeScanner, BarcodeResult } from '../barcode/EnhancedBarcodeScanner';

interface QuickEntryField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'barcode';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  autoFocus?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
  shortcuts?: {
    key: string;
    value: any;
    description: string;
  }[];
}

interface QuickEntryData {
  [key: string]: any;
}

interface QuickEntryProps {
  fields: QuickEntryField[];
  onSubmit: (data: QuickEntryData) => Promise<void> | void;
  onCancel?: () => void;
  initialData?: QuickEntryData;
  
  // Options
  showShortcuts?: boolean;
  enableBarcode?: boolean;
  autoAdvance?: boolean;
  submitOnEnter?: boolean;
  clearOnSubmit?: boolean;
  
  // Templates
  templates?: Array<{
    name: string;
    data: QuickEntryData;
    shortcut?: string;
  }>;
  
  className?: string;
}

const QuickEntry: React.FC<QuickEntryProps> = ({
  fields,
  onSubmit,
  onCancel,
  initialData = {},
  showShortcuts = true,
  enableBarcode = true,
  autoAdvance = true,
  submitOnEnter = true,
  clearOnSubmit = true,
  templates = [],
  className = ''
}) => {
  const [data, setData] = useState<QuickEntryData>(initialData);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeField, setBarcodeField] = useState<string | null>(null);
  const [showShortcutsPanel, setShowShortcutsPanel] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement>>({});
  const formRef = useRef<HTMLFormElement>(null);
  
  // Get current field
  const currentField = fields[currentFieldIndex];
  
  // Validate field
  const validateField = useCallback((field: QuickEntryField, value: any): string | null => {
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.label} is required`;
    }
    
    if (value && field.type === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return `${field.label} must be a valid number`;
      }
      
      if (field.validation?.min !== undefined && numValue < field.validation.min) {
        return `${field.label} must be at least ${field.validation.min}`;
      }
      
      if (field.validation?.max !== undefined && numValue > field.validation.max) {
        return `${field.label} must be no more than ${field.validation.max}`;
      }
    }
    
    if (value && field.validation?.pattern && !field.validation.pattern.test(value)) {
      return `${field.label} format is invalid`;
    }
    
    return null;
  }, []);
  
  // Update field value
  const updateField = useCallback((fieldKey: string, value: any) => {
    setData(prev => ({ ...prev, [fieldKey]: value }));
    
    // Clear error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldKey];
      return newErrors;
    });
    
    // Validate field
    const field = fields.find(f => f.key === fieldKey);
    if (field) {
      const error = validateField(field, value);
      if (error) {
        setErrors(prev => ({ ...prev, [fieldKey]: error }));
      }
    }
  }, [fields, validateField]);
  
  // Move to next field
  const moveToNextField = useCallback(() => {
    if (currentFieldIndex < fields.length - 1) {
      setCurrentFieldIndex(prev => prev + 1);
    }
  }, [currentFieldIndex, fields.length]);
  
  // Move to previous field
  const moveToPreviousField = useCallback(() => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(prev => prev - 1);
    }
  }, [currentFieldIndex]);
  
  // Focus current field
  const focusCurrentField = useCallback(() => {
    const currentFieldKey = fields[currentFieldIndex]?.key;
    if (currentFieldKey && inputRefs.current[currentFieldKey]) {
      setTimeout(() => {
        inputRefs.current[currentFieldKey]?.focus();
      }, 0);
    }
  }, [currentFieldIndex, fields]);
  
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Global shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          handleSubmit();
          break;
          
        case 'Escape':
          e.preventDefault();
          if (onCancel) {
            onCancel();
          }
          break;
          
        case 'r':
          e.preventDefault();
          handleReset();
          break;
          
        case 'b':
          if (enableBarcode) {
            e.preventDefault();
            const barcodeFields = fields.filter(f => f.type === 'barcode');
            if (barcodeFields.length > 0) {
              setBarcodeField(barcodeFields[0].key);
              setShowBarcodeScanner(true);
            }
          }
          break;
          
        case '?':
          e.preventDefault();
          setShowShortcutsPanel(!showShortcutsPanel);
          break;
      }
    }
    
    // Template shortcuts
    if (e.altKey) {
      const templateIndex = parseInt(e.key) - 1;
      if (templateIndex >= 0 && templateIndex < templates.length) {
        e.preventDefault();
        applyTemplate(templates[templateIndex]);
      }
    }
    
    // Field shortcuts
    if (currentField?.shortcuts) {
      const shortcut = currentField.shortcuts.find(s => s.key === e.key);
      if (shortcut) {
        e.preventDefault();
        updateField(currentField.key, shortcut.value);
        if (autoAdvance) {
          moveToNextField();
        }
      }
    }
  }, [currentField, enableBarcode, fields, showShortcutsPanel, templates, autoAdvance, updateField, moveToNextField, onCancel]);
  
  // Handle field key events
  const handleFieldKeyDown = useCallback((e: React.KeyboardEvent, fieldKey: string) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (submitOnEnter && currentFieldIndex === fields.length - 1) {
          handleSubmit();
        } else if (autoAdvance) {
          moveToNextField();
        }
        break;
        
      case 'Tab':
        if (e.shiftKey) {
          e.preventDefault();
          moveToPreviousField();
        } else {
          e.preventDefault();
          moveToNextField();
        }
        break;
        
      case 'ArrowDown':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          moveToNextField();
        }
        break;
        
      case 'ArrowUp':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          moveToPreviousField();
        }
        break;
    }
  }, [currentFieldIndex, fields.length, submitOnEnter, autoAdvance, moveToNextField, moveToPreviousField]);
  
  // Apply template
  const applyTemplate = useCallback((template: { name: string; data: QuickEntryData }) => {
    setData(template.data);
    setErrors({});
    setCurrentFieldIndex(0);
    focusCurrentField();
  }, [focusCurrentField]);
  
  // Handle barcode scan
  const handleBarcodeScan = useCallback((result: BarcodeResult) => {
    if (barcodeField) {
      updateField(barcodeField, result.text);
      setShowBarcodeScanner(false);
      setBarcodeField(null);
      
      if (autoAdvance) {
        moveToNextField();
      }
    }
  }, [barcodeField, updateField, autoAdvance, moveToNextField]);
  
  // Validate all fields
  const validateAllFields = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    fields.forEach(field => {
      const error = validateField(field, data[field.key]);
      if (error) {
        newErrors[field.key] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  }, [fields, data, validateField]);
  
  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!validateAllFields()) {
      // Focus first field with error
      const firstErrorField = fields.find(field => errors[field.key]);
      if (firstErrorField) {
        const fieldIndex = fields.findIndex(f => f.key === firstErrorField.key);
        setCurrentFieldIndex(fieldIndex);
        focusCurrentField();
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(data);
      setSubmitCount(prev => prev + 1);
      
      if (clearOnSubmit) {
        setData(initialData);
        setCurrentFieldIndex(0);
        focusCurrentField();
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateAllFields, errors, fields, data, onSubmit, clearOnSubmit, initialData, focusCurrentField]);
  
  // Handle reset
  const handleReset = useCallback(() => {
    setData(initialData);
    setErrors({});
    setCurrentFieldIndex(0);
    focusCurrentField();
  }, [initialData, focusCurrentField]);
  
  // Setup keyboard listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  // Focus current field when index changes
  useEffect(() => {
    focusCurrentField();
  }, [currentFieldIndex, focusCurrentField]);
  
  // Auto-focus first field on mount
  useEffect(() => {
    const firstAutoFocusField = fields.find(f => f.autoFocus);
    if (firstAutoFocusField) {
      const fieldIndex = fields.findIndex(f => f.key === firstAutoFocusField.key);
      setCurrentFieldIndex(fieldIndex);
    }
    
    setTimeout(focusCurrentField, 100);
  }, [fields, focusCurrentField]);
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span>Quick Entry</span>
          </h3>
          
          {submitCount > 0 && (
            <div className="text-sm text-green-600 dark:text-green-400">
              {submitCount} entries submitted
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Templates */}
          {templates.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) {
                  const template = templates.find(t => t.name === e.target.value);
                  if (template) {
                    applyTemplate(template);
                  }
                  e.target.value = '';
                }
              }}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Templates</option>
              {templates.map((template, index) => (
                <option key={template.name} value={template.name}>
                  {template.name} {template.shortcut && `(Alt+${index + 1})`}
                </option>
              ))}
            </select>
          )}
          
          {/* Shortcuts Help */}
          {showShortcuts && (
            <button
              onClick={() => setShowShortcutsPanel(!showShortcutsPanel)}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Keyboard className="w-4 h-4" />
              <span>Shortcuts</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Progress Indicator */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentFieldIndex + 1) / fields.length) * 100}%` }}
          />
        </div>
        
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentFieldIndex + 1} / {fields.length}
        </span>
      </div>
      
      {/* Form */}
      <form ref={formRef} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
        {fields.map((field, index) => {
          const isCurrentField = index === currentFieldIndex;
          const hasError = Boolean(errors[field.key]);
          
          return (
            <div
              key={field.key}
              className={`
                p-4 border-2 rounded-lg transition-all duration-200
                ${isCurrentField 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : hasError 
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                  {isCurrentField && <ArrowRight className="inline w-4 h-4 ml-2 text-blue-500" />}
                </label>
                
                <div className="flex items-center space-x-2">
                  {field.type === 'barcode' && enableBarcode && (
                    <button
                      type="button"
                      onClick={() => {
                        setBarcodeField(field.key);
                        setShowBarcodeScanner(true);
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Scan Barcode
                    </button>
                  )}
                  
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {index + 1}
                  </span>
                </div>
              </div>
              
              {field.type === 'select' ? (
                <select
                  ref={(el) => {
                    if (el) inputRefs.current[field.key] = el;
                  }}
                  value={data[field.key] || ''}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  onKeyDown={(e) => handleFieldKeyDown(e, field.key)}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-all duration-200
                    ${hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                    ${isCurrentField ? 'ring-2 ring-blue-500' : ''}
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                  `}
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  ref={(el) => {
                    if (el) inputRefs.current[field.key] = el;
                  }}
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={data[field.key] || ''}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  onKeyDown={(e) => handleFieldKeyDown(e, field.key)}
                  placeholder={field.placeholder}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-all duration-200
                    ${hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                    ${isCurrentField ? 'ring-2 ring-blue-500' : ''}
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                  `}
                />
              )}
              
              {/* Field shortcuts */}
              {field.shortcuts && field.shortcuts.length > 0 && isCurrentField && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {field.shortcuts.map(shortcut => (
                    <button
                      key={shortcut.key}
                      type="button"
                      onClick={() => {
                        updateField(field.key, shortcut.value);
                        if (autoAdvance) {
                          moveToNextField();
                        }
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title={shortcut.description}
                    >
                      {shortcut.key}: {shortcut.value}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Error message */}
              {hasError && (
                <div className="mt-1 text-sm text-red-500 flex items-center space-x-1">
                  <X className="w-4 h-4" />
                  <span>{errors[field.key]}</span>
                </div>
              )}
            </div>
          );
        })}
        
        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center space-x-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset (Ctrl+R)</span>
            </button>
            
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center space-x-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel (Esc)</span>
              </button>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSubmitting ? 'Submitting...' : 'Submit (Ctrl+Enter)'}</span>
          </button>
        </div>
      </form>
      
      {/* Shortcuts Panel */}
      {showShortcutsPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Keyboard Shortcuts
                </h3>
                
                <button
                  onClick={() => setShowShortcutsPanel(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium text-gray-700 dark:text-gray-300">Ctrl+Enter</div>
                  <div className="text-gray-600 dark:text-gray-400">Submit form</div>
                  
                  <div className="font-medium text-gray-700 dark:text-gray-300">Ctrl+R</div>
                  <div className="text-gray-600 dark:text-gray-400">Reset form</div>
                  
                  <div className="font-medium text-gray-700 dark:text-gray-300">Escape</div>
                  <div className="text-gray-600 dark:text-gray-400">Cancel</div>
                  
                  <div className="font-medium text-gray-700 dark:text-gray-300">Tab / ↓</div>
                  <div className="text-gray-600 dark:text-gray-400">Next field</div>
                  
                  <div className="font-medium text-gray-700 dark:text-gray-300">Shift+Tab / ↑</div>
                  <div className="text-gray-600 dark:text-gray-400">Previous field</div>
                  
                  <div className="font-medium text-gray-700 dark:text-gray-300">Enter</div>
                  <div className="text-gray-600 dark:text-gray-400">Next field / Submit</div>
                  
                  {enableBarcode && (
                    <>
                      <div className="font-medium text-gray-700 dark:text-gray-300">Ctrl+B</div>
                      <div className="text-gray-600 dark:text-gray-400">Open barcode scanner</div>
                    </>
                  )}
                  
                  <div className="font-medium text-gray-700 dark:text-gray-300">Ctrl+?</div>
                  <div className="text-gray-600 dark:text-gray-400">Show shortcuts</div>
                </div>
                
                {templates.length > 0 && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Templates</div>
                    {templates.map((template, index) => (
                      <div key={template.name} className="grid grid-cols-2 gap-2">
                        <div className="font-medium text-gray-700 dark:text-gray-300">Alt+{index + 1}</div>
                        <div className="text-gray-600 dark:text-gray-400">{template.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Barcode Scanner */}
      {showBarcodeScanner && (
        <EnhancedBarcodeScanner
          isOpen={showBarcodeScanner}
          onClose={() => {
            setShowBarcodeScanner(false);
            setBarcodeField(null);
          }}
          onScan={handleBarcodeScan}
          continuous={false}
        />
      )}
    </div>
  );
};

export default QuickEntry;
export type { QuickEntryField, QuickEntryData, QuickEntryProps };
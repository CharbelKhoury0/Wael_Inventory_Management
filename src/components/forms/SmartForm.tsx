import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, CheckCircle, Save, Clock, RotateCcw } from 'lucide-react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  email?: boolean;
  number?: boolean;
  min?: number;
  max?: number;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date' | 'file';
  validation?: ValidationRule;
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: any;
  conditional?: {
    field: string;
    value: any;
    operator?: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  };
  autoComplete?: string;
  helpText?: string;
}

interface FormStep {
  title: string;
  description?: string;
  fields: FormField[];
}

interface SmartFormProps {
  steps?: FormStep[];
  fields?: FormField[];
  onSubmit: (data: any) => Promise<void> | void;
  onAutoSave?: (data: any) => void;
  autoSaveInterval?: number;
  className?: string;
  submitText?: string;
  enableAutoSave?: boolean;
  enableProgress?: boolean;
  template?: string;
  onTemplateLoad?: (template: string) => any;
}

interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
  lastSaved?: Date;
}

const SmartForm: React.FC<SmartFormProps> = ({
  steps,
  fields,
  onSubmit,
  onAutoSave,
  autoSaveInterval = 30000,
  className = '',
  submitText = 'Submit',
  enableAutoSave = true,
  enableProgress = true,
  template,
  onTemplateLoad
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formState, setFormState] = useState<FormState>({
    values: {},
    errors: {},
    touched: {},
    isSubmitting: false,
    isDirty: false
  });
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const formRef = useRef<HTMLFormElement>(null);
  
  const isMultiStep = Boolean(steps && steps.length > 1);
  const currentFields = isMultiStep ? steps![currentStep]?.fields || [] : fields || [];
  const totalSteps = isMultiStep ? steps!.length : 1;
  
  // Initialize form with default values
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    const allFields = isMultiStep ? steps!.flatMap(step => step.fields) : fields || [];
    
    allFields.forEach(field => {
      if (field.defaultValue !== undefined) {
        initialValues[field.name] = field.defaultValue;
      }
    });
    
    if (template && onTemplateLoad) {
      const templateData = onTemplateLoad(template);
      Object.assign(initialValues, templateData);
    }
    
    setFormState(prev => ({
      ...prev,
      values: initialValues
    }));
  }, [steps, fields, template, onTemplateLoad, isMultiStep]);
  
  // Auto-save functionality
  useEffect(() => {
    if (!enableAutoSave || !onAutoSave || !formState.isDirty) return;
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      onAutoSave(formState.values);
      setFormState(prev => ({
        ...prev,
        lastSaved: new Date(),
        isDirty: false
      }));
    }, autoSaveInterval);
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formState.values, formState.isDirty, enableAutoSave, onAutoSave, autoSaveInterval]);
  
  const validateField = useCallback((field: FormField, value: any): string | null => {
    if (!field.validation) return null;
    
    const { required, minLength, maxLength, pattern, custom, email, number, min, max } = field.validation;
    
    if (required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.label} is required`;
    }
    
    if (value && typeof value === 'string') {
      if (minLength && value.length < minLength) {
        return `${field.label} must be at least ${minLength} characters`;
      }
      
      if (maxLength && value.length > maxLength) {
        return `${field.label} must be no more than ${maxLength} characters`;
      }
      
      if (pattern && !pattern.test(value)) {
        return `${field.label} format is invalid`;
      }
      
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return `${field.label} must be a valid email address`;
      }
    }
    
    if (number && value !== '' && value !== null && value !== undefined) {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return `${field.label} must be a valid number`;
      }
      
      if (min !== undefined && numValue < min) {
        return `${field.label} must be at least ${min}`;
      }
      
      if (max !== undefined && numValue > max) {
        return `${field.label} must be no more than ${max}`;
      }
    }
    
    if (custom) {
      return custom(value);
    }
    
    return null;
  }, []);
  
  const validateForm = useCallback((fieldsToValidate: FormField[] = currentFields): boolean => {
    const newErrors: Record<string, string> = {};
    
    fieldsToValidate.forEach(field => {
      if (shouldShowField(field)) {
        const error = validateField(field, formState.values[field.name]);
        if (error) {
          newErrors[field.name] = error;
        }
      }
    });
    
    setFormState(prev => ({ ...prev, errors: newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [currentFields, formState.values, validateField]);
  
  const shouldShowField = useCallback((field: FormField): boolean => {
    if (!field.conditional) return true;
    
    const { field: conditionField, value: conditionValue, operator = 'equals' } = field.conditional;
    const fieldValue = formState.values[conditionField];
    
    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'contains':
        return String(fieldValue).includes(String(conditionValue));
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue);
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue);
      default:
        return true;
    }
  }, [formState.values]);
  
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setFormState(prev => {
      const newValues = { ...prev.values, [fieldName]: value };
      const field = currentFields.find(f => f.name === fieldName);
      const error = field ? validateField(field, value) : null;
      
      return {
        ...prev,
        values: newValues,
        errors: {
          ...prev.errors,
          [fieldName]: error || ''
        },
        touched: {
          ...prev.touched,
          [fieldName]: true
        },
        isDirty: true
      };
    });
  }, [currentFields, validateField]);
  
  const handleNextStep = useCallback(() => {
    if (validateForm()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
    }
  }, [validateForm, totalSteps]);
  
  const handlePrevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const allFields = isMultiStep ? steps!.flatMap(step => step.fields) : fields || [];
    if (!validateForm(allFields)) return;
    
    setFormState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      await onSubmit(formState.values);
      setFormState(prev => ({ ...prev, isDirty: false }));
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [validateForm, onSubmit, formState.values, isMultiStep, steps, fields]);
  
  const resetForm = useCallback(() => {
    const allFields = isMultiStep ? steps!.flatMap(step => step.fields) : fields || [];
    const initialValues: Record<string, any> = {};
    
    allFields.forEach(field => {
      if (field.defaultValue !== undefined) {
        initialValues[field.name] = field.defaultValue;
      }
    });
    
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isDirty: false
    });
    
    setCurrentStep(0);
  }, [isMultiStep, steps, fields]);
  
  const renderField = useCallback((field: FormField) => {
    if (!shouldShowField(field)) return null;
    
    const value = formState.values[field.name] || '';
    const error = formState.errors[field.name];
    const touched = formState.touched[field.name];
    
    const baseClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
      error && touched ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`;
    
    return (
      <div key={field.name} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {field.label}
          {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {field.type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={`${baseClasses} min-h-[100px] resize-vertical`}
            autoComplete={field.autoComplete}
          />
        ) : field.type === 'select' ? (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={baseClasses}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.type === 'checkbox' ? (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{field.placeholder}</span>
          </label>
        ) : (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={baseClasses}
            autoComplete={field.autoComplete}
          />
        )}
        
        {field.helpText && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{field.helpText}</p>
        )}
        
        {error && touched && (
          <div className="flex items-center space-x-1 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        
        {!error && touched && value && (
          <div className="flex items-center space-x-1 text-green-500 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Valid</span>
          </div>
        )}
      </div>
    );
  }, [formState, shouldShowField, handleFieldChange]);
  
  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* Progress Indicator */}
      {isMultiStep && enableProgress && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {steps![currentStep].title}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>
          
          {steps![currentStep].description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {steps![currentStep].description}
            </p>
          )}
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Auto-save Status */}
      {enableAutoSave && (
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-2">
            {formState.isDirty ? (
              <>
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Unsaved changes</span>
              </>
            ) : formState.lastSaved ? (
              <>
                <Save className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Saved at {formState.lastSaved.toLocaleTimeString()}
                </span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Auto-save enabled</span>
              </>
            )}
          </div>
          
          <button
            type="button"
            onClick={resetForm}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      )}
      
      {/* Form */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {currentFields.map(renderField)}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          {isMultiStep && currentStep > 0 && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Previous
            </button>
          )}
          
          <div className="ml-auto">
            {isMultiStep && currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={formState.isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {formState.isSubmitting ? 'Submitting...' : submitText}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default SmartForm;
export type { FormField, FormStep, ValidationRule, SmartFormProps };
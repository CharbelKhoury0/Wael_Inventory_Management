import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Plus, Trash2, Edit3, Copy, Eye, Settings } from 'lucide-react';
import { FormField, FormStep } from './SmartForm';

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  steps?: FormStep[];
  createdAt: Date;
  updatedAt: Date;
}

interface FormBuilderProps {
  onSave: (template: FormTemplate) => void;
  onPreview: (fields: FormField[], steps?: FormStep[]) => void;
  initialTemplate?: FormTemplate;
  className?: string;
}

const FIELD_TYPES = [
  { type: 'text', label: 'Text Input', icon: '📝' },
  { type: 'email', label: 'Email', icon: '📧' },
  { type: 'number', label: 'Number', icon: '🔢' },
  { type: 'textarea', label: 'Text Area', icon: '📄' },
  { type: 'select', label: 'Dropdown', icon: '📋' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { type: 'date', label: 'Date', icon: '📅' },
  { type: 'file', label: 'File Upload', icon: '📎' }
];

const FormBuilder: React.FC<FormBuilderProps> = ({
  onSave,
  onPreview,
  initialTemplate,
  className = ''
}) => {
  const [template, setTemplate] = useState<FormTemplate>(
    initialTemplate || {
      id: '',
      name: '',
      description: '',
      fields: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  );
  
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [isMultiStep, setIsMultiStep] = useState(Boolean(template.steps));
  const [currentStep, setCurrentStep] = useState(0);
  
  const createNewField = useCallback((type: string): FormField => {
    const baseField: FormField = {
      name: `field_${Date.now()}`,
      label: `New ${type} Field`,
      type: type as any,
      placeholder: `Enter ${type}...`,
      validation: {}
    };
    
    if (type === 'select') {
      baseField.options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' }
      ];
    }
    
    return baseField;
  }, []);
  
  const addField = useCallback((type: string) => {
    const newField = createNewField(type);
    
    if (isMultiStep && template.steps) {
      const updatedSteps = [...template.steps];
      if (!updatedSteps[currentStep]) {
        updatedSteps[currentStep] = {
          title: `Step ${currentStep + 1}`,
          fields: []
        };
      }
      updatedSteps[currentStep].fields.push(newField);
      
      setTemplate(prev => ({
        ...prev,
        steps: updatedSteps,
        updatedAt: new Date()
      }));
    } else {
      setTemplate(prev => ({
        ...prev,
        fields: [...prev.fields, newField],
        updatedAt: new Date()
      }));
    }
    
    setSelectedField(newField);
  }, [createNewField, isMultiStep, template.steps, currentStep]);
  
  const updateField = useCallback((updatedField: FormField) => {
    if (isMultiStep && template.steps) {
      const updatedSteps = template.steps.map(step => ({
        ...step,
        fields: step.fields.map(field => 
          field.name === updatedField.name ? updatedField : field
        )
      }));
      
      setTemplate(prev => ({
        ...prev,
        steps: updatedSteps,
        updatedAt: new Date()
      }));
    } else {
      setTemplate(prev => ({
        ...prev,
        fields: prev.fields.map(field => 
          field.name === updatedField.name ? updatedField : field
        ),
        updatedAt: new Date()
      }));
    }
    
    setSelectedField(updatedField);
  }, [isMultiStep, template.steps]);
  
  const deleteField = useCallback((fieldName: string) => {
    if (isMultiStep && template.steps) {
      const updatedSteps = template.steps.map(step => ({
        ...step,
        fields: step.fields.filter(field => field.name !== fieldName)
      }));
      
      setTemplate(prev => ({
        ...prev,
        steps: updatedSteps,
        updatedAt: new Date()
      }));
    } else {
      setTemplate(prev => ({
        ...prev,
        fields: prev.fields.filter(field => field.name !== fieldName),
        updatedAt: new Date()
      }));
    }
    
    if (selectedField?.name === fieldName) {
      setSelectedField(null);
    }
  }, [isMultiStep, template.steps, selectedField]);
  
  const duplicateField = useCallback((field: FormField) => {
    const duplicatedField = {
      ...field,
      name: `${field.name}_copy_${Date.now()}`,
      label: `${field.label} (Copy)`
    };
    
    if (isMultiStep && template.steps) {
      const updatedSteps = [...template.steps];
      const stepIndex = updatedSteps.findIndex(step => 
        step.fields.some(f => f.name === field.name)
      );
      
      if (stepIndex !== -1) {
        const fieldIndex = updatedSteps[stepIndex].fields.findIndex(f => f.name === field.name);
        updatedSteps[stepIndex].fields.splice(fieldIndex + 1, 0, duplicatedField);
      }
      
      setTemplate(prev => ({
        ...prev,
        steps: updatedSteps,
        updatedAt: new Date()
      }));
    } else {
      const fieldIndex = template.fields.findIndex(f => f.name === field.name);
      const updatedFields = [...template.fields];
      updatedFields.splice(fieldIndex + 1, 0, duplicatedField);
      
      setTemplate(prev => ({
        ...prev,
        fields: updatedFields,
        updatedAt: new Date()
      }));
    }
  }, [isMultiStep, template.steps, template.fields]);
  
  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    
    if (isMultiStep && template.steps) {
      const updatedSteps = [...template.steps];
      const currentFields = [...updatedSteps[currentStep].fields];
      const [reorderedField] = currentFields.splice(sourceIndex, 1);
      currentFields.splice(destIndex, 0, reorderedField);
      
      updatedSteps[currentStep] = {
        ...updatedSteps[currentStep],
        fields: currentFields
      };
      
      setTemplate(prev => ({
        ...prev,
        steps: updatedSteps,
        updatedAt: new Date()
      }));
    } else {
      const updatedFields = [...template.fields];
      const [reorderedField] = updatedFields.splice(sourceIndex, 1);
      updatedFields.splice(destIndex, 0, reorderedField);
      
      setTemplate(prev => ({
        ...prev,
        fields: updatedFields,
        updatedAt: new Date()
      }));
    }
  }, [isMultiStep, template.steps, template.fields, currentStep]);
  
  const addStep = useCallback(() => {
    const newStep: FormStep = {
      title: `Step ${(template.steps?.length || 0) + 1}`,
      description: '',
      fields: []
    };
    
    setTemplate(prev => ({
      ...prev,
      steps: [...(prev.steps || []), newStep],
      updatedAt: new Date()
    }));
  }, [template.steps]);
  
  const updateStep = useCallback((stepIndex: number, updates: Partial<FormStep>) => {
    if (!template.steps) return;
    
    const updatedSteps = template.steps.map((step, index) => 
      index === stepIndex ? { ...step, ...updates } : step
    );
    
    setTemplate(prev => ({
      ...prev,
      steps: updatedSteps,
      updatedAt: new Date()
    }));
  }, [template.steps]);
  
  const deleteStep = useCallback((stepIndex: number) => {
    if (!template.steps || template.steps.length <= 1) return;
    
    const updatedSteps = template.steps.filter((_, index) => index !== stepIndex);
    
    setTemplate(prev => ({
      ...prev,
      steps: updatedSteps,
      updatedAt: new Date()
    }));
    
    if (currentStep >= updatedSteps.length) {
      setCurrentStep(updatedSteps.length - 1);
    }
  }, [template.steps, currentStep]);
  
  const toggleMultiStep = useCallback(() => {
    if (isMultiStep) {
      // Convert steps to single form
      const allFields = template.steps?.flatMap(step => step.fields) || [];
      setTemplate(prev => ({
        ...prev,
        fields: allFields,
        steps: undefined,
        updatedAt: new Date()
      }));
    } else {
      // Convert single form to steps
      const step: FormStep = {
        title: 'Step 1',
        description: '',
        fields: template.fields
      };
      
      setTemplate(prev => ({
        ...prev,
        fields: [],
        steps: [step],
        updatedAt: new Date()
      }));
    }
    
    setIsMultiStep(!isMultiStep);
    setCurrentStep(0);
  }, [isMultiStep, template.steps, template.fields]);
  
  const handleSave = useCallback(() => {
    const templateToSave = {
      ...template,
      id: template.id || `template_${Date.now()}`,
      updatedAt: new Date()
    };
    
    onSave(templateToSave);
  }, [template, onSave]);
  
  const handlePreview = useCallback(() => {
    onPreview(template.fields, template.steps);
  }, [template.fields, template.steps, onPreview]);
  
  const currentFields = isMultiStep && template.steps 
    ? template.steps[currentStep]?.fields || []
    : template.fields;
  
  return (
    <div className={`flex h-full ${className}`}>
      {/* Field Palette */}
      <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Field Types
        </h3>
        
        <div className="space-y-2">
          {FIELD_TYPES.map(fieldType => (
            <button
              key={fieldType.type}
              onClick={() => addField(fieldType.type)}
              className="w-full flex items-center space-x-3 p-3 text-left bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-xl">{fieldType.icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {fieldType.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Form Builder */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={template.name}
                onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Form Template Name"
                className="w-full text-xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMultiStep}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  isMultiStep 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {isMultiStep ? 'Multi-Step' : 'Single Form'}
              </button>
              
              <button
                onClick={handlePreview}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
              
              <button
                onClick={handleSave}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
          
          <textarea
            value={template.description}
            onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Form description..."
            className="w-full text-sm bg-transparent border-none outline-none text-gray-600 dark:text-gray-400 placeholder-gray-500 resize-none"
            rows={2}
          />
          
          {/* Step Navigation */}
          {isMultiStep && template.steps && (
            <div className="flex items-center space-x-2 mt-4">
              {template.steps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    currentStep === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {step.title}
                </button>
              ))}
              
              <button
                onClick={addStep}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Step</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Form Fields */}
        <div className="flex-1 p-4 overflow-y-auto">
          {isMultiStep && template.steps && (
            <div className="mb-4">
              <input
                type="text"
                value={template.steps[currentStep]?.title || ''}
                onChange={(e) => updateStep(currentStep, { title: e.target.value })}
                placeholder="Step title"
                className="text-lg font-medium bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 mb-2"
              />
              
              <textarea
                value={template.steps[currentStep]?.description || ''}
                onChange={(e) => updateStep(currentStep, { description: e.target.value })}
                placeholder="Step description..."
                className="w-full text-sm bg-transparent border-none outline-none text-gray-600 dark:text-gray-400 placeholder-gray-500 resize-none"
                rows={2}
              />
            </div>
          )}
          
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="form-fields">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {currentFields.map((field, index) => (
                    <Draggable key={field.name} draggableId={field.name} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${
                            snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                          } ${
                            selectedField?.name === field.name ? 'ring-2 ring-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div
                              {...provided.dragHandleProps}
                              className="flex items-center space-x-2 cursor-move"
                            >
                              <span className="text-gray-400">⋮⋮</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {field.label}
                              </span>
                              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {field.type}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => setSelectedField(field)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => duplicateField(field)}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => deleteField(field.name)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {field.placeholder || 'No placeholder'}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  
                  {currentFields.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <p>No fields added yet.</p>
                      <p className="text-sm">Drag field types from the left panel to get started.</p>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
      
      {/* Field Properties Panel */}
      {selectedField && (
        <div className="w-80 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Field Properties
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Field Name
              </label>
              <input
                type="text"
                value={selectedField.name}
                onChange={(e) => updateField({ ...selectedField, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Label
              </label>
              <input
                type="text"
                value={selectedField.label}
                onChange={(e) => updateField({ ...selectedField, label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={selectedField.placeholder || ''}
                onChange={(e) => updateField({ ...selectedField, placeholder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Help Text
              </label>
              <textarea
                value={selectedField.helpText || ''}
                onChange={(e) => updateField({ ...selectedField, helpText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Validation</h4>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedField.validation?.required || false}
                  onChange={(e) => updateField({
                    ...selectedField,
                    validation: { ...selectedField.validation, required: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Required</span>
              </label>
              
              {selectedField.type === 'text' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Min Length
                    </label>
                    <input
                      type="number"
                      value={selectedField.validation?.minLength || ''}
                      onChange={(e) => updateField({
                        ...selectedField,
                        validation: { ...selectedField.validation, minLength: Number(e.target.value) || undefined }
                      })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Max Length
                    </label>
                    <input
                      type="number"
                      value={selectedField.validation?.maxLength || ''}
                      onChange={(e) => updateField({
                        ...selectedField,
                        validation: { ...selectedField.validation, maxLength: Number(e.target.value) || undefined }
                      })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </>
              )}
              
              {selectedField.type === 'number' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Minimum Value
                    </label>
                    <input
                      type="number"
                      value={selectedField.validation?.min || ''}
                      onChange={(e) => updateField({
                        ...selectedField,
                        validation: { ...selectedField.validation, min: Number(e.target.value) || undefined }
                      })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Maximum Value
                    </label>
                    <input
                      type="number"
                      value={selectedField.validation?.max || ''}
                      onChange={(e) => updateField({
                        ...selectedField,
                        validation: { ...selectedField.validation, max: Number(e.target.value) || undefined }
                      })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </>
              )}
            </div>
            
            {selectedField.type === 'select' && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Options</h4>
                <div className="space-y-2">
                  {selectedField.options?.map((option, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={option.value}
                        onChange={(e) => {
                          const newOptions = [...(selectedField.options || [])];
                          newOptions[index] = { ...option, value: e.target.value };
                          updateField({ ...selectedField, options: newOptions });
                        }}
                        placeholder="Value"
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      <input
                        type="text"
                        value={option.label}
                        onChange={(e) => {
                          const newOptions = [...(selectedField.options || [])];
                          newOptions[index] = { ...option, label: e.target.value };
                          updateField({ ...selectedField, options: newOptions });
                        }}
                        placeholder="Label"
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      <button
                        onClick={() => {
                          const newOptions = selectedField.options?.filter((_, i) => i !== index) || [];
                          updateField({ ...selectedField, options: newOptions });
                        }}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => {
                      const newOptions = [...(selectedField.options || []), { value: '', label: '' }];
                      updateField({ ...selectedField, options: newOptions });
                    }}
                    className="w-full py-2 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
                  >
                    Add Option
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormBuilder;
export type { FormTemplate };
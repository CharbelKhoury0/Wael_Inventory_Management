import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Trash2, Edit, Save, Play, Copy, Download, Upload, Settings, Users, Clock, CheckCircle, XCircle, ArrowRight, ArrowDown, Zap, AlertTriangle, Eye, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  type: 'task' | 'approval' | 'review' | 'condition' | 'notification' | 'automation';
  position: { x: number; y: number };
  config: {
    assignees?: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>;
    approvalType?: 'individual' | 'group' | 'any' | 'majority';
    requiredApprovals?: number;
    timeoutHours?: number;
    escalationTo?: string;
    conditions?: Array<{
      field: string;
      operator: 'equals' | 'greaterThan' | 'lessThan' | 'contains' | 'exists';
      value: any;
    }>;
    notifications?: Array<{
      type: 'email' | 'sms' | 'push' | 'slack';
      recipients: string[];
      template: string;
      timing: 'immediate' | 'delayed';
      delay?: number;
    }>;
    automations?: Array<{
      action: 'update_field' | 'send_email' | 'create_task' | 'webhook';
      config: Record<string, any>;
    }>;
    formFields?: Array<{
      id: string;
      name: string;
      type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file';
      required: boolean;
      options?: string[];
    }>;
  };
  connections: Array<{
    targetStepId: string;
    condition?: {
      field: string;
      operator: string;
      value: any;
    };
    label?: string;
  }>;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
  steps: WorkflowStep[];
  triggers: Array<{
    type: 'manual' | 'scheduled' | 'event' | 'webhook';
    config: Record<string, any>;
  }>;
  variables: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    defaultValue?: any;
    description?: string;
  }>;
  permissions: Array<{
    role: string;
    actions: string[];
  }>;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

interface WorkflowBuilderProps {
  workflows: Workflow[];
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  }>;
  roles: Array<{
    id: string;
    name: string;
    permissions: string[];
  }>;
  categories: string[];
  onWorkflowSave?: (workflow: Workflow) => void;
  onWorkflowDelete?: (workflowId: string) => void;
  onWorkflowDuplicate?: (workflowId: string) => void;
  onWorkflowActivate?: (workflowId: string) => void;
  onWorkflowTest?: (workflowId: string, testData: any) => void;
  currentUser: {
    id: string;
    name: string;
    role: string;
    permissions: string[];
  };
  className?: string;
}

const STEP_TYPES = [
  {
    type: 'task',
    name: 'Task',
    description: 'Assign a task to users',
    icon: CheckCircle,
    color: 'blue'
  },
  {
    type: 'approval',
    name: 'Approval',
    description: 'Require approval from users',
    icon: Users,
    color: 'green'
  },
  {
    type: 'review',
    name: 'Review',
    description: 'Review and provide feedback',
    icon: Eye,
    color: 'purple'
  },
  {
    type: 'condition',
    name: 'Condition',
    description: 'Branch based on conditions',
    icon: ArrowRight,
    color: 'yellow'
  },
  {
    type: 'notification',
    name: 'Notification',
    description: 'Send notifications',
    icon: AlertTriangle,
    color: 'orange'
  },
  {
    type: 'automation',
    name: 'Automation',
    description: 'Automated actions',
    icon: Zap,
    color: 'red'
  }
];

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  workflows,
  users,
  roles,
  categories,
  onWorkflowSave,
  onWorkflowDelete,
  onWorkflowDuplicate,
  onWorkflowActivate,
  onWorkflowTest,
  currentUser,
  className = ''
}) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showStepConfig, setShowStepConfig] = useState(false);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [draggedStepType, setDraggedStepType] = useState<string | null>(null);
  const [showWorkflowSettings, setShowWorkflowSettings] = useState(false);
  const [testData, setTestData] = useState<Record<string, any>>({});
  const [showTestModal, setShowTestModal] = useState(false);
  
  // Create new workflow
  const createNewWorkflow = useCallback(() => {
    const newWorkflow: Workflow = {
      id: `workflow_${Date.now()}`,
      name: 'New Workflow',
      description: '',
      category: categories[0] || 'General',
      version: 1,
      status: 'draft',
      steps: [],
      triggers: [{
        type: 'manual',
        config: {}
      }],
      variables: [],
      permissions: [{
        role: currentUser.role,
        actions: ['view', 'edit', 'execute']
      }],
      createdBy: {
        id: currentUser.id,
        name: currentUser.name
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setSelectedWorkflow(newWorkflow);
    setIsEditing(true);
  }, [categories, currentUser]);
  
  // Add step to workflow
  const addStep = useCallback((type: string, position: { x: number; y: number }) => {
    if (!selectedWorkflow) return;
    
    const stepType = STEP_TYPES.find(st => st.type === type);
    if (!stepType) return;
    
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      name: stepType.name,
      description: stepType.description,
      type: type as WorkflowStep['type'],
      position,
      config: {
        assignees: [],
        conditions: [],
        notifications: [],
        automations: [],
        formFields: []
      },
      connections: []
    };
    
    setSelectedWorkflow({
      ...selectedWorkflow,
      steps: [...selectedWorkflow.steps, newStep],
      updatedAt: new Date()
    });
    
    toast.success(`${stepType.name} step added`);
  }, [selectedWorkflow]);
  
  // Update step
  const updateStep = useCallback((stepId: string, updates: Partial<WorkflowStep>) => {
    if (!selectedWorkflow) return;
    
    setSelectedWorkflow({
      ...selectedWorkflow,
      steps: selectedWorkflow.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      ),
      updatedAt: new Date()
    });
  }, [selectedWorkflow]);
  
  // Delete step
  const deleteStep = useCallback((stepId: string) => {
    if (!selectedWorkflow) return;
    
    setSelectedWorkflow({
      ...selectedWorkflow,
      steps: selectedWorkflow.steps.filter(step => step.id !== stepId),
      updatedAt: new Date()
    });
    
    toast.success('Step deleted');
  }, [selectedWorkflow]);
  
  // Connect steps
  const connectSteps = useCallback((fromStepId: string, toStepId: string, condition?: any) => {
    if (!selectedWorkflow) return;
    
    setSelectedWorkflow({
      ...selectedWorkflow,
      steps: selectedWorkflow.steps.map(step => {
        if (step.id === fromStepId) {
          return {
            ...step,
            connections: [...step.connections, {
              targetStepId: toStepId,
              condition,
              label: condition ? 'Conditional' : 'Default'
            }]
          };
        }
        return step;
      }),
      updatedAt: new Date()
    });
  }, [selectedWorkflow]);
  
  // Save workflow
  const saveWorkflow = useCallback(() => {
    if (!selectedWorkflow || !onWorkflowSave) return;
    
    // Validate workflow
    if (!selectedWorkflow.name.trim()) {
      toast.error('Workflow name is required');
      return;
    }
    
    if (selectedWorkflow.steps.length === 0) {
      toast.error('Workflow must have at least one step');
      return;
    }
    
    onWorkflowSave(selectedWorkflow);
    setIsEditing(false);
    toast.success('Workflow saved successfully');
  }, [selectedWorkflow, onWorkflowSave]);
  
  // Test workflow
  const testWorkflow = useCallback(() => {
    if (!selectedWorkflow || !onWorkflowTest) return;
    
    onWorkflowTest(selectedWorkflow.id, testData);
    setShowTestModal(false);
    toast.success('Workflow test started');
  }, [selectedWorkflow, testData, onWorkflowTest]);
  
  // Handle drag and drop
  const handleDragStart = useCallback((e: React.DragEvent, stepType: string) => {
    setDraggedStepType(stepType);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedStepType) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    addStep(draggedStepType, position);
    setDraggedStepType(null);
  }, [draggedStepType, addStep]);
  
  // Get step icon
  const getStepIcon = useCallback((type: string) => {
    const stepType = STEP_TYPES.find(st => st.type === type);
    return stepType?.icon || CheckCircle;
  }, []);
  
  // Get step color
  const getStepColor = useCallback((type: string) => {
    const stepType = STEP_TYPES.find(st => st.type === type);
    return stepType?.color || 'gray';
  }, []);
  
  return (
    <div className={`h-full flex ${className}`}>
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Workflows
            </h2>
            
            <button
              onClick={createNewWorkflow}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>
          </div>
          
          {/* Search */}
          <input
            type="text"
            placeholder="Search workflows..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Workflows List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {workflows.map(workflow => (
            <div
              key={workflow.id}
              onClick={() => {
                setSelectedWorkflow(workflow);
                setIsEditing(false);
              }}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedWorkflow?.id === workflow.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {workflow.name}
                </h3>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  workflow.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                  workflow.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {workflow.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                {workflow.description || 'No description'}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{workflow.steps.length} steps</span>
                <span>v{workflow.version}</span>
              </div>
            </div>
          ))}
          
          {workflows.length === 0 && (
            <div className="text-center py-8">
              <Settings className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No workflows yet
              </p>
            </div>
          )}
        </div>
        
        {/* Step Types Palette */}
        {isEditing && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Drag to add steps
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              {STEP_TYPES.map(stepType => {
                const Icon = stepType.icon;
                
                return (
                  <div
                    key={stepType.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, stepType.type)}
                    className={`p-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-move hover:border-${stepType.color}-500 transition-colors`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className={`w-4 h-4 text-${stepType.color}-500`} />
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {stepType.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedWorkflow ? (
          <>
            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {selectedWorkflow.name}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedWorkflow.description || 'No description'}
                    </p>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedWorkflow.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                    selectedWorkflow.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {selectedWorkflow.status}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      
                      <button
                        onClick={() => setShowTestModal(true)}
                        className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <Play className="w-4 h-4" />
                        <span>Test</span>
                      </button>
                      
                      {onWorkflowDuplicate && (
                        <button
                          onClick={() => onWorkflowDuplicate(selectedWorkflow.id)}
                          className="flex items-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Duplicate</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={saveWorkflow}
                        className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex items-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => setShowWorkflowSettings(true)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Canvas */}
            <div
              className="flex-1 bg-gray-50 dark:bg-gray-900 relative overflow-auto"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {selectedWorkflow.steps.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {isEditing ? 'Drag steps to build your workflow' : 'No steps in this workflow'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {isEditing ? 'Use the step palette on the left to add workflow steps' : 'Edit this workflow to add steps'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8">
                  {selectedWorkflow.steps.map(step => {
                    const Icon = getStepIcon(step.type);
                    const color = getStepColor(step.type);
                    
                    return (
                      <div
                        key={step.id}
                        style={{
                          position: 'absolute',
                          left: step.position.x,
                          top: step.position.y
                        }}
                        className={`bg-white dark:bg-gray-800 border-2 border-${color}-500 rounded-lg p-4 w-48 cursor-pointer hover:shadow-lg transition-all`}
                        onClick={() => {
                          setSelectedStep(step);
                          setShowStepConfig(true);
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`w-5 h-5 text-${color}-500`} />
                          
                          {isEditing && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteStep(step.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          {step.name}
                        </h4>
                        
                        {step.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {step.description}
                          </p>
                        )}
                        
                        {step.config.assignees && step.config.assignees.length > 0 && (
                          <div className="mt-2 flex items-center space-x-1">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {step.config.assignees.length} assignee{step.config.assignees.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Connections */}
                  <svg className="absolute inset-0 pointer-events-none">
                    {selectedWorkflow.steps.map(step => 
                      step.connections.map((connection, index) => {
                        const targetStep = selectedWorkflow.steps.find(s => s.id === connection.targetStepId);
                        if (!targetStep) return null;
                        
                        const startX = step.position.x + 96; // Half width of step card
                        const startY = step.position.y + 32; // Approximate center height
                        const endX = targetStep.position.x + 96;
                        const endY = targetStep.position.y + 32;
                        
                        return (
                          <g key={`${step.id}-${connection.targetStepId}-${index}`}>
                            <line
                              x1={startX}
                              y1={startY}
                              x2={endX}
                              y2={endY}
                              stroke="#6B7280"
                              strokeWidth="2"
                              markerEnd="url(#arrowhead)"
                            />
                            
                            {connection.label && (
                              <text
                                x={(startX + endX) / 2}
                                y={(startY + endY) / 2 - 5}
                                textAnchor="middle"
                                className="text-xs fill-gray-600 dark:fill-gray-400"
                              >
                                {connection.label}
                              </text>
                            )}
                          </g>
                        );
                      })
                    )}
                    
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 10 3.5, 0 7"
                          fill="#6B7280"
                        />
                      </marker>
                    </defs>
                  </svg>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Select a workflow to view
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Choose a workflow from the sidebar or create a new one
              </p>
              
              <button
                onClick={createNewWorkflow}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Workflow</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Test Modal */}
      {showTestModal && selectedWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Test Workflow
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Enter test data to simulate workflow execution
            </p>
            
            <div className="space-y-3 mb-4">
              {selectedWorkflow.variables.map(variable => (
                <div key={variable.name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {variable.name}
                  </label>
                  <input
                    type={variable.type === 'number' ? 'number' : variable.type === 'date' ? 'date' : 'text'}
                    value={testData[variable.name] || ''}
                    onChange={(e) => setTestData(prev => ({
                      ...prev,
                      [variable.name]: e.target.value
                    }))}
                    placeholder={variable.description}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={testWorkflow}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Run Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilder;
export type { WorkflowStep, Workflow, WorkflowBuilderProps };
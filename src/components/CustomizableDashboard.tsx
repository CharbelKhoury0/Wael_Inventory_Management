import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import InteractiveChart from './InteractiveCharts';
import {
  Grid,
  Plus,
  Settings,
  Eye,
  EyeOff,
  Move,
  Trash2,
  Copy,
  Download,
  Upload,
  Save,
  RotateCcw,
  Layout,
  Maximize2,
  Minimize2,
  BarChart3,
  PieChart,
  Activity,
  TrendingUp,
  Target,
  Users,
  Package,
  DollarSign,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface Widget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'text' | 'image';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  config: {
    chartType?: 'bar' | 'line' | 'pie' | 'area' | 'gauge' | 'heatmap';
    dataSource?: string;
    filters?: Record<string, any>;
    colors?: string[];
    refreshInterval?: number;
    [key: string]: any;
  };
  data?: any[];
}

interface DashboardLayout {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  theme: 'light' | 'dark' | 'auto';
  gridSize: { cols: number; rows: number };
  createdAt: string;
  updatedAt: string;
}

interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'executive' | 'operations' | 'analytics' | 'custom';
  widgets: Omit<Widget, 'id'>[];
  preview: string;
}

const WIDGET_TYPES = [
  { type: 'chart', icon: BarChart3, label: 'Chart', description: 'Interactive data visualization' },
  { type: 'metric', icon: Target, label: 'Metric Card', description: 'Key performance indicator' },
  { type: 'table', icon: Grid, label: 'Data Table', description: 'Tabular data display' },
  { type: 'text', icon: Type, label: 'Text Widget', description: 'Custom text content' }
];

const CHART_TYPES = [
  { type: 'bar', icon: BarChart3, label: 'Bar Chart' },
  { type: 'line', icon: Activity, label: 'Line Chart' },
  { type: 'pie', icon: PieChart, label: 'Pie Chart' },
  { type: 'area', icon: TrendingUp, label: 'Area Chart' },
  { type: 'gauge', icon: Target, label: 'Gauge Chart' },
  { type: 'heatmap', icon: Grid, label: 'Heatmap' }
];

const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'executive',
    name: 'Executive Overview',
    description: 'High-level KPIs and trends for executives',
    category: 'executive',
    preview: '/api/templates/executive-preview.png',
    widgets: [
      {
        type: 'metric',
        title: 'Total Revenue',
        position: { x: 0, y: 0 },
        size: { width: 3, height: 2 },
        visible: true,
        config: { dataSource: 'revenue', icon: 'DollarSign', color: 'green' }
      },
      {
        type: 'chart',
        title: 'Revenue Trend',
        position: { x: 3, y: 0 },
        size: { width: 6, height: 4 },
        visible: true,
        config: { chartType: 'line', dataSource: 'revenue-trend' }
      },
      {
        type: 'chart',
        title: 'Category Distribution',
        position: { x: 9, y: 0 },
        size: { width: 3, height: 4 },
        visible: true,
        config: { chartType: 'pie', dataSource: 'category-distribution' }
      }
    ]
  },
  {
    id: 'operations',
    name: 'Operations Dashboard',
    description: 'Operational metrics and real-time monitoring',
    category: 'operations',
    preview: '/api/templates/operations-preview.png',
    widgets: [
      {
        type: 'metric',
        title: 'Active Orders',
        position: { x: 0, y: 0 },
        size: { width: 2, height: 2 },
        visible: true,
        config: { dataSource: 'active-orders', icon: 'Package', color: 'blue' }
      },
      {
        type: 'chart',
        title: 'Inventory Levels',
        position: { x: 2, y: 0 },
        size: { width: 5, height: 3 },
        visible: true,
        config: { chartType: 'bar', dataSource: 'inventory-levels' }
      },
      {
        type: 'chart',
        title: 'Warehouse Utilization',
        position: { x: 7, y: 0 },
        size: { width: 3, height: 3 },
        visible: true,
        config: { chartType: 'gauge', dataSource: 'warehouse-utilization' }
      }
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics Deep Dive',
    description: 'Detailed analytics and forecasting',
    category: 'analytics',
    preview: '/api/templates/analytics-preview.png',
    widgets: [
      {
        type: 'chart',
        title: 'Demand Forecast',
        position: { x: 0, y: 0 },
        size: { width: 6, height: 4 },
        visible: true,
        config: { chartType: 'area', dataSource: 'demand-forecast' }
      },
      {
        type: 'chart',
        title: 'Performance Heatmap',
        position: { x: 6, y: 0 },
        size: { width: 6, height: 4 },
        visible: true,
        config: { chartType: 'heatmap', dataSource: 'performance-heatmap' }
      }
    ]
  }
];

interface CustomizableDashboardProps {
  initialLayout?: DashboardLayout;
  onLayoutChange?: (layout: DashboardLayout) => void;
  dataSource?: Record<string, any[]>;
  enableTemplates?: boolean;
  enableExport?: boolean;
  enableSharing?: boolean;
}

const MetricWidget: React.FC<{ widget: Widget; isDark: boolean }> = ({ widget, isDark }) => {
  const { config } = widget;
  const IconComponent = config.icon === 'DollarSign' ? DollarSign : 
                       config.icon === 'Package' ? Package :
                       config.icon === 'Users' ? Users :
                       config.icon === 'Clock' ? Clock :
                       config.icon === 'AlertTriangle' ? AlertTriangle : Target;
  
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 h-full`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[config.color as keyof typeof colorClasses] || 'bg-gray-500'}`}>
          <IconComponent className="h-5 w-5 text-white" />
        </div>
        <div className="text-right">
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">12%</span>
          </div>
        </div>
      </div>
      <div>
        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
          {widget.title}
        </p>
        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {config.value || '1,234'}
        </p>
        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          vs last month
        </p>
      </div>
    </div>
  );
};

const WidgetContainer: React.FC<{
  widget: Widget;
  index: number;
  isDark: boolean;
  isEditing: boolean;
  onEdit: (widget: Widget) => void;
  onDelete: (widgetId: string) => void;
  onToggleVisibility: (widgetId: string) => void;
}> = ({ widget, index, isDark, isEditing, onEdit, onDelete, onToggleVisibility }) => {
  const [isHovered, setIsHovered] = useState(false);

  const renderWidget = () => {
    switch (widget.type) {
      case 'metric':
        return <MetricWidget widget={widget} isDark={isDark} />;
      case 'chart':
        return (
          <InteractiveChart
            data={widget.data || []}
            type={widget.config.chartType || 'bar'}
            title={widget.title}
            height={200}
            enableExport={false}
            enableFullscreen={false}
            colors={widget.config.colors}
          />
        );
      case 'table':
        return (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 h-full`}>
            <h3 className={`font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{widget.title}</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className={`text-left py-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Item</th>
                    <th className={`text-left py-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(widget.data || []).slice(0, 5).map((row, i) => (
                    <tr key={i} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <td className={`py-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.name}</td>
                      <td className={`py-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 h-full flex items-center justify-center`}>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Widget type not supported</p>
          </div>
        );
    }
  };

  return (
    <Draggable draggableId={widget.id} index={index} isDragDisabled={!isEditing}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`relative transition-all duration-200 ${
            snapshot.isDragging ? 'z-50 rotate-2 scale-105' : ''
          } ${!widget.visible ? 'opacity-50' : ''}`}
          style={{
            ...provided.draggableProps.style,
            gridColumn: `span ${widget.size.width}`,
            gridRow: `span ${widget.size.height}`
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Widget Controls */}
          {isEditing && (isHovered || snapshot.isDragging) && (
            <div className="absolute top-2 right-2 z-10 flex gap-1">
              <button
                onClick={() => onToggleVisibility(widget.id)}
                className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-colors"
                title={widget.visible ? 'Hide widget' : 'Show widget'}
              >
                {widget.visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
              <button
                onClick={() => onEdit(widget)}
                className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-colors"
                title="Edit widget"
              >
                <Settings className="h-3 w-3" />
              </button>
              <button
                onClick={() => onDelete(widget.id)}
                className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-colors"
                title="Delete widget"
              >
                <Trash2 className="h-3 w-3" />
              </button>
              <div
                {...provided.dragHandleProps}
                className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-colors cursor-move"
                title="Drag to move"
              >
                <Move className="h-3 w-3" />
              </div>
            </div>
          )}
          
          {renderWidget()}
        </div>
      )}
    </Draggable>
  );
};

const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({
  initialLayout,
  onLayoutChange,
  dataSource = {},
  enableTemplates = true,
  enableExport = true,
  enableSharing = true
}) => {
  const { isDark } = useTheme();
  const [layout, setLayout] = useState<DashboardLayout>(
    initialLayout || {
      id: 'default',
      name: 'My Dashboard',
      description: 'Custom dashboard',
      widgets: [],
      theme: 'auto',
      gridSize: { cols: 12, rows: 8 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [savedLayouts, setSavedLayouts] = useState<DashboardLayout[]>([]);

  // Load saved layouts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-layouts');
    if (saved) {
      setSavedLayouts(JSON.parse(saved));
    }
  }, []);

  // Save layout to localStorage
  const saveLayout = useCallback((layoutToSave: DashboardLayout) => {
    const updated = {
      ...layoutToSave,
      updatedAt: new Date().toISOString()
    };
    
    const existing = savedLayouts.findIndex(l => l.id === updated.id);
    const newLayouts = existing >= 0 
      ? savedLayouts.map((l, i) => i === existing ? updated : l)
      : [...savedLayouts, updated];
    
    setSavedLayouts(newLayouts);
    localStorage.setItem('dashboard-layouts', JSON.stringify(newLayouts));
    onLayoutChange?.(updated);
  }, [savedLayouts, onLayoutChange]);

  // Generate sample data for widgets
  const generateSampleData = useCallback((dataSourceKey: string) => {
    if (dataSource[dataSourceKey]) {
      return dataSource[dataSourceKey];
    }
    
    // Generate sample data based on data source key
    switch (dataSourceKey) {
      case 'revenue-trend':
        return Array.from({ length: 12 }, (_, i) => ({
          name: `Month ${i + 1}`,
          value: Math.floor(Math.random() * 100000) + 50000
        }));
      case 'category-distribution':
        return [
          { name: 'Electronics', value: 35 },
          { name: 'Clothing', value: 25 },
          { name: 'Books', value: 20 },
          { name: 'Home', value: 20 }
        ];
      case 'inventory-levels':
        return Array.from({ length: 8 }, (_, i) => ({
          name: `Product ${i + 1}`,
          value: Math.floor(Math.random() * 1000) + 100
        }));
      default:
        return Array.from({ length: 5 }, (_, i) => ({
          name: `Item ${i + 1}`,
          value: Math.floor(Math.random() * 100) + 10
        }));
    }
  }, [dataSource]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const newWidgets = Array.from(layout.widgets);
    const [reorderedWidget] = newWidgets.splice(result.source.index, 1);
    newWidgets.splice(result.destination.index, 0, reorderedWidget);

    const updatedLayout = { ...layout, widgets: newWidgets };
    setLayout(updatedLayout);
    saveLayout(updatedLayout);
  }, [layout, saveLayout]);

  const addWidget = useCallback((type: string, chartType?: string) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: type as Widget['type'],
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      position: { x: 0, y: 0 },
      size: { width: type === 'metric' ? 3 : 6, height: type === 'metric' ? 2 : 4 },
      visible: true,
      config: {
        chartType: chartType as any,
        dataSource: 'sample-data',
        colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B']
      },
      data: generateSampleData('sample-data')
    };

    const updatedLayout = {
      ...layout,
      widgets: [...layout.widgets, newWidget]
    };
    setLayout(updatedLayout);
    saveLayout(updatedLayout);
    setShowWidgetPicker(false);
  }, [layout, saveLayout, generateSampleData]);

  const deleteWidget = useCallback((widgetId: string) => {
    const updatedLayout = {
      ...layout,
      widgets: layout.widgets.filter(w => w.id !== widgetId)
    };
    setLayout(updatedLayout);
    saveLayout(updatedLayout);
  }, [layout, saveLayout]);

  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    const updatedLayout = {
      ...layout,
      widgets: layout.widgets.map(w => 
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      )
    };
    setLayout(updatedLayout);
    saveLayout(updatedLayout);
  }, [layout, saveLayout]);

  const loadTemplate = useCallback((template: DashboardTemplate) => {
    const newLayout: DashboardLayout = {
      id: `template-${template.id}-${Date.now()}`,
      name: template.name,
      description: template.description,
      widgets: template.widgets.map((widget, index) => ({
        ...widget,
        id: `widget-${Date.now()}-${index}`,
        data: generateSampleData(widget.config.dataSource || 'sample-data')
      })),
      theme: 'auto',
      gridSize: { cols: 12, rows: 8 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setLayout(newLayout);
    saveLayout(newLayout);
    setShowTemplates(false);
  }, [generateSampleData, saveLayout]);

  const exportLayout = useCallback(() => {
    const dataStr = JSON.stringify(layout, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${layout.name.replace(/\s+/g, '_')}_dashboard.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [layout]);

  const importLayout = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedLayout = JSON.parse(e.target?.result as string);
        setLayout(importedLayout);
        saveLayout(importedLayout);
      } catch (error) {
        console.error('Failed to import layout:', error);
      }
    };
    reader.readAsText(file);
  }, [saveLayout]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Dashboard Header */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {layout.name}
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {layout.description}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {enableTemplates && (
              <button
                onClick={() => setShowTemplates(true)}
                className={`px-4 py-2 border rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                <Layout className="h-4 w-4 mr-2 inline" />
                Templates
              </button>
            )}
            
            {enableExport && (
              <div className="flex gap-1">
                <button
                  onClick={exportLayout}
                  className={`px-4 py-2 border rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  <Download className="h-4 w-4 mr-2 inline" />
                  Export
                </button>
                <label className={`px-4 py-2 border rounded-lg transition-colors cursor-pointer ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  <Upload className="h-4 w-4 mr-2 inline" />
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={importLayout}
                    className="hidden"
                  />
                </label>
              </div>
            )}
            
            <button
              onClick={() => saveLayout(layout)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="h-4 w-4 mr-2 inline" />
              Save
            </button>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isEditing 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700 border' : 'border-gray-300 text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              {isEditing ? 'Done' : 'Edit'}
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-6">
        {isEditing && (
          <div className="mb-6">
            <button
              onClick={() => setShowWidgetPicker(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Widget
            </button>
          </div>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${layout.gridSize.cols}, 1fr)`,
                  gridTemplateRows: `repeat(${layout.gridSize.rows}, minmax(100px, 1fr))`
                }}
              >
                {layout.widgets.map((widget, index) => (
                  <WidgetContainer
                    key={widget.id}
                    widget={widget}
                    index={index}
                    isDark={isDark}
                    isEditing={isEditing}
                    onEdit={setEditingWidget}
                    onDelete={deleteWidget}
                    onToggleVisibility={toggleWidgetVisibility}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Widget Picker Modal */}
      {showWidgetPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add Widget</h3>
              <button
                onClick={() => setShowWidgetPicker(false)}
                className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WIDGET_TYPES.map((widgetType) => (
                  <div key={widgetType.type}>
                    <button
                      onClick={() => {
                        if (widgetType.type === 'chart') {
                          // Show chart type selector
                        } else {
                          addWidget(widgetType.type);
                        }
                      }}
                      className={`w-full p-4 border rounded-lg transition-colors text-left ${isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <widgetType.icon className="h-6 w-6 text-blue-600" />
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {widgetType.label}
                        </span>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {widgetType.description}
                      </p>
                    </button>
                    
                    {widgetType.type === 'chart' && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {CHART_TYPES.map((chartType) => (
                          <button
                            key={chartType.type}
                            onClick={() => addWidget('chart', chartType.type)}
                            className={`p-2 border rounded text-sm transition-colors ${isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}
                          >
                            <chartType.icon className="h-4 w-4 mx-auto mb-1" />
                            {chartType.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard Templates</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DASHBOARD_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className={`border rounded-lg overflow-hidden transition-colors ${isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Layout className="h-12 w-12 text-white" />
                    </div>
                    <div className="p-4">
                      <h4 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {template.name}
                      </h4>
                      <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {template.description}
                      </p>
                      <button
                        onClick={() => loadTemplate(template)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomizableDashboard;
export type { Widget, DashboardLayout, DashboardTemplate };
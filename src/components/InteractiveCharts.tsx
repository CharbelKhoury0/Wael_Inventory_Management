import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Scatter,
  ScatterChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList,
  Brush,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import {
  Download,
  Maximize2,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Settings,
  TrendingUp,
  AlertTriangle,
  Eye,
  Layers,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ChartData {
  [key: string]: any;
}

interface DrillDownLevel {
  level: number;
  title: string;
  data: ChartData[];
  breadcrumb: string[];
}

interface InteractiveChartProps {
  data: ChartData[];
  type: 'bar' | 'line' | 'pie' | 'area' | 'composed' | 'scatter' | 'radar' | 'treemap' | 'funnel' | 'heatmap' | 'gauge';
  title: string;
  xKey?: string;
  yKey?: string;
  colorKey?: string;
  enableDrillDown?: boolean;
  drillDownLevels?: DrillDownLevel[];
  enableZoom?: boolean;
  enableBrush?: boolean;
  enableExport?: boolean;
  enableFullscreen?: boolean;
  height?: number;
  width?: string;
  colors?: string[];
  onDataClick?: (data: any, index: number) => void;
  onDrillDown?: (level: number, data: any) => void;
  customTooltip?: React.ComponentType<any>;
  annotations?: Array<{
    type: 'line' | 'area';
    value: number;
    label: string;
    color: string;
  }>;
}

interface HeatmapData {
  x: string;
  y: string;
  value: number;
  color?: string;
}

interface GaugeData {
  value: number;
  min: number;
  max: number;
  target?: number;
  label: string;
}

const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const CustomTooltip: React.FC<any> = ({ active, payload, label, isDark }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} border rounded-lg shadow-lg p-3`}>
        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const HeatmapChart: React.FC<{ data: HeatmapData[]; width: number; height: number; isDark: boolean }> = ({ 
  data, 
  width, 
  height, 
  isDark 
}) => {
  const xValues = [...new Set(data.map(d => d.x))];
  const yValues = [...new Set(data.map(d => d.y))];
  const cellWidth = width / xValues.length;
  const cellHeight = height / yValues.length;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  
  const getColor = (value: number) => {
    const intensity = (value - minValue) / (maxValue - minValue);
    return `rgba(59, 130, 246, ${intensity})`;
  };

  return (
    <svg width={width} height={height}>
      {data.map((cell, index) => {
        const x = xValues.indexOf(cell.x) * cellWidth;
        const y = yValues.indexOf(cell.y) * cellHeight;
        
        return (
          <g key={index}>
            <rect
              x={x}
              y={y}
              width={cellWidth}
              height={cellHeight}
              fill={cell.color || getColor(cell.value)}
              stroke={isDark ? '#374151' : '#E5E7EB'}
              strokeWidth={1}
            />
            <text
              x={x + cellWidth / 2}
              y={y + cellHeight / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={isDark ? '#E5E7EB' : '#374151'}
              fontSize={12}
            >
              {cell.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const GaugeChart: React.FC<{ data: GaugeData; size: number; isDark: boolean }> = ({ data, size, isDark }) => {
  const { value, min, max, target, label } = data;
  const radius = size / 2 - 20;
  const centerX = size / 2;
  const centerY = size / 2;
  
  const percentage = (value - min) / (max - min);
  const angle = percentage * 180 - 90; // -90 to 90 degrees
  
  const targetAngle = target ? ((target - min) / (max - min)) * 180 - 90 : null;
  
  const getColor = () => {
    if (percentage < 0.3) return '#EF4444';
    if (percentage < 0.7) return '#F59E0B';
    return '#10B981';
  };

  return (
    <svg width={size} height={size}>
      {/* Background arc */}
      <path
        d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
        fill="none"
        stroke={isDark ? '#374151' : '#E5E7EB'}
        strokeWidth={8}
      />
      
      {/* Value arc */}
      <path
        d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 ${percentage > 0.5 ? 1 : 0} 1 ${
          centerX + radius * Math.cos((angle * Math.PI) / 180)
        } ${
          centerY + radius * Math.sin((angle * Math.PI) / 180)
        }`}
        fill="none"
        stroke={getColor()}
        strokeWidth={8}
        strokeLinecap="round"
      />
      
      {/* Target line */}
      {targetAngle !== null && (
        <line
          x1={centerX + (radius - 15) * Math.cos((targetAngle * Math.PI) / 180)}
          y1={centerY + (radius - 15) * Math.sin((targetAngle * Math.PI) / 180)}
          x2={centerX + (radius + 5) * Math.cos((targetAngle * Math.PI) / 180)}
          y2={centerY + (radius + 5) * Math.sin((targetAngle * Math.PI) / 180)}
          stroke="#8B5CF6"
          strokeWidth={3}
        />
      )}
      
      {/* Center circle */}
      <circle
        cx={centerX}
        cy={centerY}
        r={8}
        fill={getColor()}
      />
      
      {/* Value text */}
      <text
        x={centerX}
        y={centerY + 30}
        textAnchor="middle"
        fill={isDark ? '#E5E7EB' : '#374151'}
        fontSize={16}
        fontWeight="bold"
      >
        {value.toLocaleString()}
      </text>
      
      {/* Label text */}
      <text
        x={centerX}
        y={centerY + 50}
        textAnchor="middle"
        fill={isDark ? '#9CA3AF' : '#6B7280'}
        fontSize={12}
      >
        {label}
      </text>
    </svg>
  );
};

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  type,
  title,
  xKey = 'name',
  yKey = 'value',
  colorKey,
  enableDrillDown = false,
  drillDownLevels = [],
  enableZoom = false,
  enableBrush = false,
  enableExport = true,
  enableFullscreen = true,
  height = 300,
  width = '100%',
  colors = DEFAULT_COLORS,
  onDataClick,
  onDrillDown,
  customTooltip,
  annotations = []
}) => {
  const { isDark } = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomDomain, setZoomDomain] = useState<{ left?: number; right?: number }>({});
  const [selectedData, setSelectedData] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const currentData = useMemo(() => {
    if (enableDrillDown && drillDownLevels[currentLevel]) {
      return drillDownLevels[currentLevel].data;
    }
    return data;
  }, [data, enableDrillDown, drillDownLevels, currentLevel]);

  const filteredData = useMemo(() => {
    if (Object.keys(filters).length === 0) return currentData;
    
    return currentData.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return item[key]?.toString().toLowerCase().includes(value.toLowerCase());
      });
    });
  }, [currentData, filters]);

  const handleDataClick = useCallback((data: any, index: number) => {
    setSelectedData(data);
    onDataClick?.(data, index);
    
    if (enableDrillDown && currentLevel < drillDownLevels.length - 1) {
      setCurrentLevel(prev => prev + 1);
      onDrillDown?.(currentLevel + 1, data);
    }
  }, [onDataClick, enableDrillDown, currentLevel, drillDownLevels.length, onDrillDown]);

  const handleExport = useCallback(async (format: 'png' | 'pdf' | 'svg') => {
    if (!chartRef.current) return;

    try {
      if (format === 'png') {
        const canvas = await html2canvas(chartRef.current);
        const link = document.createElement('a');
        link.download = `${title.replace(/\s+/g, '_')}_chart.png`;
        link.href = canvas.toDataURL();
        link.click();
      } else if (format === 'pdf') {
        const canvas = await html2canvas(chartRef.current);
        const pdf = new jsPDF();
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 10, 10, 190, 100);
        pdf.save(`${title.replace(/\s+/g, '_')}_chart.pdf`);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [title]);

  const resetZoom = useCallback(() => {
    setZoomDomain({});
  }, []);

  const goBack = useCallback(() => {
    if (currentLevel > 0) {
      setCurrentLevel(prev => prev - 1);
    }
  }, [currentLevel]);

  const renderChart = () => {
    const commonProps = {
      data: filteredData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    const TooltipComponent = customTooltip || ((props: any) => <CustomTooltip {...props} isDark={isDark} />);

    switch (type) {
      case 'bar':
        return (
          <BarChart {...commonProps} onClick={handleDataClick}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
            <XAxis dataKey={xKey} stroke={isDark ? '#9CA3AF' : '#6B7280'} />
            <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} />
            <Tooltip content={<TooltipComponent />} />
            <Legend />
            {enableBrush && <Brush dataKey={xKey} height={30} stroke={colors[0]} />}
            <Bar dataKey={yKey} fill={colors[0]} onClick={handleDataClick}>
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
            {annotations.map((annotation, index) => (
              annotation.type === 'line' ? (
                <ReferenceLine
                  key={index}
                  y={annotation.value}
                  stroke={annotation.color}
                  strokeDasharray="5 5"
                  label={annotation.label}
                />
              ) : (
                <ReferenceArea
                  key={index}
                  y1={annotation.value}
                  y2={annotation.value + 10}
                  fill={annotation.color}
                  fillOpacity={0.3}
                />
              )
            ))}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
            <XAxis dataKey={xKey} stroke={isDark ? '#9CA3AF' : '#6B7280'} />
            <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} />
            <Tooltip content={<TooltipComponent />} />
            <Legend />
            {enableBrush && <Brush dataKey={xKey} height={30} stroke={colors[0]} />}
            <Line 
              type="monotone" 
              dataKey={yKey} 
              stroke={colors[0]} 
              strokeWidth={2}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
            />
          </LineChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill={colors[0]}
              dataKey={yKey}
              onClick={handleDataClick}
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<TooltipComponent />} />
          </PieChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
            <XAxis dataKey={xKey} stroke={isDark ? '#9CA3AF' : '#6B7280'} />
            <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} />
            <Tooltip content={<TooltipComponent />} />
            <Legend />
            {enableBrush && <Brush dataKey={xKey} height={30} stroke={colors[0]} />}
            <Area 
              type="monotone" 
              dataKey={yKey} 
              stroke={colors[0]} 
              fill={colors[0]}
              fillOpacity={0.6}
            />
          </AreaChart>
        );

      case 'treemap':
        return (
          <Treemap
            {...commonProps}
            dataKey={yKey}
            ratio={4/3}
            stroke={isDark ? '#374151' : '#E5E7EB'}
            fill={colors[0]}
          >
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Treemap>
        );

      case 'funnel':
        return (
          <FunnelChart {...commonProps}>
            <Tooltip content={<TooltipComponent />} />
            <Funnel
              dataKey={yKey}
              data={filteredData}
              isAnimationActive
            >
              <LabelList position="center" fill="#fff" stroke="none" />
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Funnel>
          </FunnelChart>
        );

      case 'heatmap':
        return (
          <HeatmapChart 
            data={filteredData as HeatmapData[]} 
            width={400} 
            height={height} 
            isDark={isDark}
          />
        );

      case 'gauge':
        return (
          <GaugeChart 
            data={filteredData[0] as GaugeData} 
            size={height} 
            isDark={isDark}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border shadow-lg ${isFullscreen ? 'fixed inset-0 z-50 p-8' : ''}`}>
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {enableDrillDown && drillDownLevels[currentLevel] ? drillDownLevels[currentLevel].title : title}
          </h3>
          {enableDrillDown && currentLevel > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {enableZoom && (
            <button
              onClick={resetZoom}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="Reset Zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="Filters"
          >
            <Filter className="h-4 w-4" />
          </button>
          
          {enableExport && (
            <div className="relative group">
              <button className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <Download className="h-4 w-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <button
                  onClick={() => handleExport('png')}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export as PNG
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export as PDF
                </button>
              </div>
            </div>
          )}
          
          {enableFullscreen && (
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.keys(filteredData[0] || {}).map(key => (
              <div key={key}>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
                <input
                  type="text"
                  value={filters[key] || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, [key]: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder={`Filter by ${key}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div ref={chartRef} className="p-4">
        <ResponsiveContainer width={width} height={isFullscreen ? window.innerHeight - 200 : height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Chart Info */}
      {selectedData && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Selected Data:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(selectedData).map(([key, value]) => (
              <div key={key}>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{key}:</span>
                <span className={`ml-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {typeof value === 'number' ? value.toLocaleString() : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveChart;
export type { InteractiveChartProps, DrillDownLevel, HeatmapData, GaugeData };
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  Calendar,
  Filter,
  Search,
  X,
  ChevronDown,
  Save,
  Star,
  Clock,
  Tag,
  MapPin,
  User,
  Package,
  DollarSign,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Download,
  Settings,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Type
} from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
  color?: string;
}

interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'boolean' | 'tags';
  options?: FilterOption[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  validation?: (value: any) => string | null;
  dependencies?: string[]; // Fields that affect this field's options
}

interface FilterValue {
  [key: string]: any;
}

interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: FilterValue;
  isDefault?: boolean;
  isFavorite?: boolean;
  createdAt: string;
  usageCount: number;
  category?: string;
}

interface AdvancedFiltersProps {
  fields: FilterField[];
  initialFilters?: FilterValue;
  onFiltersChange: (filters: FilterValue) => void;
  onSearch?: (query: string) => void;
  enablePresets?: boolean;
  enableExport?: boolean;
  enableRealTimeUpdate?: boolean;
  debounceMs?: number;
  maxVisibleFilters?: number;
  showResultCount?: boolean;
  resultCount?: number;
  loading?: boolean;
}

const SAMPLE_PRESETS: FilterPreset[] = [
  {
    id: 'recent-items',
    name: 'Recent Items',
    description: 'Items added in the last 7 days',
    filters: {
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      status: ['active']
    },
    isDefault: false,
    isFavorite: true,
    createdAt: '2024-01-01',
    usageCount: 45,
    category: 'time'
  },
  {
    id: 'low-stock',
    name: 'Low Stock Alert',
    description: 'Items with quantity below 10',
    filters: {
      quantity: { min: 0, max: 10 },
      status: ['active']
    },
    isDefault: false,
    isFavorite: true,
    createdAt: '2024-01-01',
    usageCount: 32,
    category: 'inventory'
  },
  {
    id: 'high-value',
    name: 'High Value Items',
    description: 'Items worth more than $1000',
    filters: {
      price: { min: 1000 },
      category: ['electronics', 'jewelry']
    },
    isDefault: false,
    isFavorite: false,
    createdAt: '2024-01-01',
    usageCount: 18,
    category: 'value'
  }
];

const DateRangePicker: React.FC<{
  value: { start?: string; end?: string };
  onChange: (value: { start?: string; end?: string }) => void;
  isDark: boolean;
}> = ({ value, onChange, isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const quickRanges = [
    { label: 'Today', getValue: () => ({ start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] }) },
    { label: 'Yesterday', getValue: () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return { start: yesterday.toISOString().split('T')[0], end: yesterday.toISOString().split('T')[0] };
    }},
    { label: 'Last 7 days', getValue: () => ({
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    })},
    { label: 'Last 30 days', getValue: () => ({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    })},
    { label: 'This month', getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
    }}
  ];

  const formatDateRange = (range: { start?: string; end?: string }) => {
    if (!range.start && !range.end) return 'Select date range';
    if (range.start === range.end) return range.start;
    return `${range.start || 'Start'} - ${range.end || 'End'}`;
  };

  const applyRange = () => {
    onChange(tempValue);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg text-left flex items-center justify-between transition-colors ${
          isDark ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600' : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
        }`}
      >
        <span className="flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          {formatDateRange(value)}
        </span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 mt-1 w-80 border rounded-lg shadow-lg z-50 ${
          isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
        }`}>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={tempValue.start || ''}
                  onChange={(e) => setTempValue({ ...tempValue, start: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  End Date
                </label>
                <input
                  type="date"
                  value={tempValue.end || ''}
                  onChange={(e) => setTempValue({ ...tempValue, end: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Quick Ranges
              </label>
              <div className="grid grid-cols-2 gap-2">
                {quickRanges.map((range) => (
                  <button
                    key={range.label}
                    onClick={() => setTempValue(range.getValue())}
                    className={`px-3 py-2 text-sm border rounded transition-colors ${
                      isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setTempValue({ start: '', end: '' });
                  onChange({ start: '', end: '' });
                  setIsOpen(false);
                }}
                className={`px-3 py-2 text-sm border rounded transition-colors ${
                  isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Clear
              </button>
              <button
                onClick={applyRange}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MultiSelect: React.FC<{
  options: FilterOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  isDark: boolean;
}> = ({ options, value, onChange, placeholder, isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = useMemo(() => {
    return options.filter(option => 
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const selectedLabels = value.map(v => options.find(o => o.value === v)?.label).filter(Boolean);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg text-left flex items-center justify-between transition-colors ${
          isDark ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600' : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
        }`}
      >
        <span className="truncate">
          {selectedLabels.length > 0 ? (
            selectedLabels.length === 1 ? selectedLabels[0] : `${selectedLabels.length} selected`
          ) : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 mt-1 w-full border rounded-lg shadow-lg z-50 max-h-64 overflow-hidden ${
          isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
        }`}>
          <div className="p-2">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg text-sm ${
                  isDark ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-opacity-50 transition-colors ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  {option.color && (
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>
                    {option.label}
                  </span>
                  {option.count !== undefined && (
                    <span className={`ml-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      ({option.count})
                    </span>
                  )}
                </div>
                {value.includes(option.value) && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const NumberRangeInput: React.FC<{
  value: { min?: number; max?: number };
  onChange: (value: { min?: number; max?: number }) => void;
  placeholder: { min: string; max: string };
  isDark: boolean;
}> = ({ value, onChange, placeholder, isDark }) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        placeholder={placeholder.min}
        value={value.min || ''}
        onChange={(e) => onChange({ ...value, min: e.target.value ? Number(e.target.value) : undefined })}
        className={`flex-1 px-3 py-2 border rounded-lg ${
          isDark ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
        }`}
      />
      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>to</span>
      <input
        type="number"
        placeholder={placeholder.max}
        value={value.max || ''}
        onChange={(e) => onChange({ ...value, max: e.target.value ? Number(e.target.value) : undefined })}
        className={`flex-1 px-3 py-2 border rounded-lg ${
          isDark ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
        }`}
      />
    </div>
  );
};

const TagsInput: React.FC<{
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  isDark: boolean;
  suggestions?: string[];
}> = ({ value, onChange, placeholder, isDark, suggestions = [] }) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter(s => 
    s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s)
  );

  const addTag = (tag: string) => {
    if (tag.trim() && !value.includes(tag.trim())) {
      onChange([...value, tag.trim()]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div className={`min-h-[42px] px-3 py-2 border rounded-lg flex flex-wrap items-center gap-1 ${
        isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'
      }`}>
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-blue-600"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          placeholder={value.length === 0 ? placeholder : ''}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(inputValue.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className={`flex-1 min-w-[120px] bg-transparent outline-none ${
            isDark ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
          }`}
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className={`absolute top-full left-0 mt-1 w-full border rounded-lg shadow-lg z-50 max-h-32 overflow-y-auto ${
          isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
        }`}>
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => addTag(suggestion)}
              className={`w-full px-3 py-2 text-left transition-colors ${
                isDark ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const FilterField: React.FC<{
  field: FilterField;
  value: any;
  onChange: (value: any) => void;
  isDark: boolean;
  allFilters: FilterValue;
}> = ({ field, value, onChange, isDark, allFilters }) => {
  const IconComponent = field.icon;

  const renderInput = () => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${
              isDark ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
            }`}
          />
        );
      
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${
              isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
            }`}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} {option.count !== undefined ? `(${option.count})` : ''}
              </option>
            ))}
          </select>
        );
      
      case 'multiselect':
        return (
          <MultiSelect
            options={field.options || []}
            value={value || []}
            onChange={onChange}
            placeholder={field.placeholder || 'Select options...'}
            isDark={isDark}
          />
        );
      
      case 'daterange':
        return (
          <DateRangePicker
            value={value || { start: '', end: '' }}
            onChange={onChange}
            isDark={isDark}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${
              isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
            }`}
          />
        );
      
      case 'number':
        return (
          <NumberRangeInput
            value={value || { min: undefined, max: undefined }}
            onChange={onChange}
            placeholder={{ min: 'Min', max: 'Max' }}
            isDark={isDark}
          />
        );
      
      case 'boolean':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              className="mr-2"
            />
            <span className={isDark ? 'text-white' : 'text-gray-900'}>
              {field.placeholder || field.label}
            </span>
          </label>
        );
      
      case 'tags':
        return (
          <TagsInput
            value={value || []}
            onChange={onChange}
            placeholder={field.placeholder || 'Add tags...'}
            isDark={isDark}
            suggestions={field.options?.map(o => o.value) || []}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        <div className="flex items-center gap-2">
          {IconComponent && <IconComponent className="h-4 w-4" />}
          {field.label}
        </div>
      </label>
      {renderInput()}
    </div>
  );
};

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  fields,
  initialFilters = {},
  onFiltersChange,
  onSearch,
  enablePresets = true,
  enableExport = true,
  enableRealTimeUpdate = true,
  debounceMs = 300,
  maxVisibleFilters = 6,
  showResultCount = true,
  resultCount = 0,
  loading = false
}) => {
  const { isDark } = useTheme();
  const [filters, setFilters] = useState<FilterValue>(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>(SAMPLE_PRESETS);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');

  // Debounced filter updates
  useEffect(() => {
    if (!enableRealTimeUpdate) return;
    
    const timer = setTimeout(() => {
      onFiltersChange(filters);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [filters, onFiltersChange, enableRealTimeUpdate, debounceMs]);

  // Search debouncing
  useEffect(() => {
    if (!onSearch) return;
    
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch, debounceMs]);

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
    if (!enableRealTimeUpdate) {
      onFiltersChange({});
    }
  }, [onFiltersChange, enableRealTimeUpdate]);

  const applyFilters = useCallback(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const savePreset = useCallback(() => {
    if (!newPresetName.trim()) return;
    
    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName,
      description: newPresetDescription,
      filters,
      isDefault: false,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      usageCount: 0,
      category: 'custom'
    };
    
    setPresets(prev => [...prev, newPreset]);
    setNewPresetName('');
    setNewPresetDescription('');
    setShowSavePreset(false);
  }, [newPresetName, newPresetDescription, filters]);

  const loadPreset = useCallback((preset: FilterPreset) => {
    setFilters(preset.filters);
    setShowPresets(false);
    
    // Update usage count
    setPresets(prev => prev.map(p => 
      p.id === preset.id ? { ...p, usageCount: p.usageCount + 1 } : p
    ));
    
    if (!enableRealTimeUpdate) {
      onFiltersChange(preset.filters);
    }
  }, [onFiltersChange, enableRealTimeUpdate]);

  const togglePresetFavorite = useCallback((presetId: string) => {
    setPresets(prev => prev.map(p => 
      p.id === presetId ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  }, []);

  const exportFilters = useCallback(() => {
    const exportData = {
      filters,
      searchQuery,
      timestamp: new Date().toISOString(),
      resultCount
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `filters_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filters, searchQuery, resultCount]);

  const hasActiveFilters = Object.values(filters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== undefined && v !== '');
    }
    return value !== undefined && value !== '' && value !== false;
  });

  const visibleFields = showAllFilters ? fields : fields.slice(0, maxVisibleFilters);
  const hiddenFieldsCount = fields.length - maxVisibleFilters;

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Filters</h3>
            {hasActiveFilters && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Active
              </span>
            )}
          </div>
          
          {showResultCount && (
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                `${resultCount.toLocaleString()} results`
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {enablePresets && (
            <button
              onClick={() => setShowPresets(true)}
              className={`px-3 py-2 border rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <Star className="h-4 w-4 mr-2 inline" />
              Presets
            </button>
          )}
          
          {enableExport && (
            <button
              onClick={exportFilters}
              className={`px-3 py-2 border rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <Download className="h-4 w-4 mr-2 inline" />
              Export
            </button>
          )}
          
          <button
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className={`px-3 py-2 border rounded-lg transition-colors ${
              hasActiveFilters
                ? isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'border-gray-300 text-gray-400 cursor-not-allowed'
            }`}
          >
            Clear All
          </button>
          
          {!enableRealTimeUpdate && (
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {onSearch && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                isDark ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>
      )}

      {/* Filter Fields */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleFields.map((field) => (
            <FilterField
              key={field.key}
              field={field}
              value={filters[field.key]}
              onChange={(value) => updateFilter(field.key, value)}
              isDark={isDark}
              allFilters={filters}
            />
          ))}
        </div>
        
        {hiddenFieldsCount > 0 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAllFilters(!showAllFilters)}
              className={`px-4 py-2 border rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              {showAllFilters ? (
                <>
                  <Minus className="h-4 w-4 mr-2 inline" />
                  Show Less
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2 inline" />
                  Show {hiddenFieldsCount} More Filters
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Presets Modal */}
      {showPresets && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Filter Presets</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSavePreset(true)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  Save Current
                </button>
                <button
                  onClick={() => setShowPresets(false)}
                  className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid gap-4">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className={`p-4 border rounded-lg transition-colors ${isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {preset.name}
                        </h4>
                        <button
                          onClick={() => togglePresetFavorite(preset.id)}
                          className={`transition-colors ${
                            preset.isFavorite ? 'text-yellow-500' : isDark ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                          }`}
                        >
                          <Star className={`h-4 w-4 ${preset.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          preset.category === 'time' ? 'bg-blue-100 text-blue-800' :
                          preset.category === 'inventory' ? 'bg-green-100 text-green-800' :
                          preset.category === 'value' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {preset.category}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Used {preset.usageCount} times
                        </span>
                      </div>
                    </div>
                    
                    {preset.description && (
                      <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {preset.description}
                      </p>
                    )}
                    
                    <button
                      onClick={() => loadPreset(preset)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Apply Preset
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Preset Modal */}
      {showSavePreset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-md w-full`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Save Filter Preset</h3>
              <button
                onClick={() => setShowSavePreset(false)}
                className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Preset Name
                </label>
                <input
                  type="text"
                  placeholder="Enter preset name..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDark ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Describe this filter preset..."
                  value={newPresetDescription}
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg resize-none ${
                    isDark ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowSavePreset(false)}
                  className={`px-4 py-2 border rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={savePreset}
                  disabled={!newPresetName.trim()}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    newPresetName.trim()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Save Preset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
export type { FilterField, FilterValue, FilterPreset, AdvancedFiltersProps };
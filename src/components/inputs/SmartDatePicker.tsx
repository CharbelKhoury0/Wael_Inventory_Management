import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface SmartDatePickerProps {
  value?: Date | DateRange | null;
  onChange: (value: Date | DateRange | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  
  // Date picker features
  mode?: 'single' | 'range';
  showTime?: boolean;
  format?: string;
  minDate?: Date;
  maxDate?: Date;
  
  // Shortcuts
  showShortcuts?: boolean;
  customShortcuts?: Array<{
    label: string;
    value: Date | DateRange;
  }>;
  
  // UI options
  showClearButton?: boolean;
  showTodayButton?: boolean;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  
  // Events
  onFocus?: () => void;
  onBlur?: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_SHORTCUTS = [
  { label: 'Today', value: new Date() },
  { label: 'Yesterday', value: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { label: 'This Week', value: {
    start: new Date(Date.now() - new Date().getDay() * 24 * 60 * 60 * 1000),
    end: new Date()
  }},
  { label: 'Last Week', value: {
    start: new Date(Date.now() - (new Date().getDay() + 7) * 24 * 60 * 60 * 1000),
    end: new Date(Date.now() - new Date().getDay() * 24 * 60 * 60 * 1000)
  }},
  { label: 'This Month', value: {
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  }},
  { label: 'Last Month', value: {
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    end: new Date(new Date().getFullYear(), new Date().getMonth(), 0)
  }},
  { label: 'Last 30 Days', value: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  }},
  { label: 'Last 90 Days', value: {
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    end: new Date()
  }}
];

const SmartDatePicker: React.FC<SmartDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  label,
  error,
  disabled = false,
  required = false,
  className = '',
  mode = 'single',
  showTime = false,
  format = 'MM/dd/yyyy',
  minDate,
  maxDate,
  showShortcuts = true,
  customShortcuts,
  showClearButton = true,
  showTodayButton = true,
  weekStartsOn = 0,
  onFocus,
  onBlur
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<DateRange>({ start: null, end: null });
  const [timeValue, setTimeValue] = useState({ hours: 0, minutes: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Format date for display
  const formatDate = useCallback((date: Date): string => {
    if (!date) return '';
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    if (showTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('en-US', options);
  }, [showTime]);
  
  // Get display value
  const getDisplayValue = useCallback((): string => {
    if (!value) return '';
    
    if (mode === 'single' && value instanceof Date) {
      return formatDate(value);
    }
    
    if (mode === 'range' && typeof value === 'object' && 'start' in value) {
      const range = value as DateRange;
      if (range.start && range.end) {
        return `${formatDate(range.start)} - ${formatDate(range.end)}`;
      } else if (range.start) {
        return `${formatDate(range.start)} - ...`;
      }
    }
    
    return '';
  }, [value, mode, formatDate]);
  
  // Generate calendar days
  const getCalendarDays = useCallback((month: Date): Date[] => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - ((firstDay.getDay() - weekStartsOn + 7) % 7));
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [weekStartsOn]);
  
  // Check if date is in current month
  const isCurrentMonth = useCallback((date: Date, month: Date): boolean => {
    return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
  }, []);
  
  // Check if date is today
  const isToday = useCallback((date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);
  
  // Check if date is selected
  const isSelected = useCallback((date: Date): boolean => {
    if (!value) return false;
    
    if (mode === 'single' && value instanceof Date) {
      return date.toDateString() === value.toDateString();
    }
    
    if (mode === 'range' && typeof value === 'object' && 'start' in value) {
      const range = value as DateRange;
      if (range.start && range.end) {
        return date >= range.start && date <= range.end;
      } else if (range.start) {
        return date.toDateString() === range.start.toDateString();
      }
    }
    
    return false;
  }, [value, mode]);
  
  // Check if date is in range (for range mode)
  const isInRange = useCallback((date: Date): boolean => {
    if (mode !== 'range') return false;
    
    const range = (value as DateRange) || selectedRange;
    if (!range.start || !range.end) return false;
    
    return date > range.start && date < range.end;
  }, [mode, value, selectedRange]);
  
  // Check if date is disabled
  const isDisabled = useCallback((date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  }, [minDate, maxDate]);
  
  // Handle date selection
  const handleDateSelect = useCallback((date: Date) => {
    if (isDisabled(date)) return;
    
    if (mode === 'single') {
      const selectedDate = new Date(date);
      if (showTime) {
        selectedDate.setHours(timeValue.hours, timeValue.minutes);
      }
      onChange(selectedDate);
      setIsOpen(false);
    } else {
      const range = (value as DateRange) || { start: null, end: null };
      
      if (!range.start || (range.start && range.end)) {
        // Start new range
        const newRange = { start: date, end: null };
        setSelectedRange(newRange);
        onChange(newRange);
      } else {
        // Complete range
        const start = range.start;
        const end = date;
        
        const newRange = {
          start: start <= end ? start : end,
          end: start <= end ? end : start
        };
        
        setSelectedRange({ start: null, end: null });
        onChange(newRange);
        setIsOpen(false);
      }
    }
  }, [mode, value, selectedRange, onChange, isDisabled, showTime, timeValue]);
  
  // Handle shortcut selection
  const handleShortcutSelect = useCallback((shortcutValue: Date | DateRange) => {
    onChange(shortcutValue);
    setIsOpen(false);
  }, [onChange]);
  
  // Navigate months
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  }, []);
  
  // Handle time change
  const handleTimeChange = useCallback((type: 'hours' | 'minutes', value: number) => {
    setTimeValue(prev => ({ ...prev, [type]: value }));
  }, []);
  
  // Handle clear
  const handleClear = useCallback(() => {
    onChange(null);
    setSelectedRange({ start: null, end: null });
  }, [onChange]);
  
  // Handle today button
  const handleToday = useCallback(() => {
    const today = new Date();
    if (mode === 'single') {
      onChange(today);
    } else {
      onChange({ start: today, end: today });
    }
    setIsOpen(false);
  }, [mode, onChange]);
  
  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      setIsOpen(true);
    }
  }, []);
  
  const shortcuts = customShortcuts || DEFAULT_SHORTCUTS;
  const calendarDays = getCalendarDays(currentMonth);
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={getDisplayValue()}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          readOnly
          onClick={() => !disabled && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          className={`
            w-full px-3 py-2 pr-10 border rounded-lg cursor-pointer transition-all duration-200
            ${error ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300 dark:border-gray-600'}
            ${disabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-800 hover:border-gray-400'}
            ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
            text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none
          `}
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {showClearButton && value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          <Calendar className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center space-x-1">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}
      
      {/* Date Picker Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="flex">
            {/* Shortcuts */}
            {showShortcuts && (
              <div className="w-48 border-r border-gray-200 dark:border-gray-700 p-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quick Select
                </h4>
                
                <div className="space-y-1">
                  {shortcuts.map((shortcut, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleShortcutSelect(shortcut.value)}
                      className="w-full text-left px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      {shortcut.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Calendar */}
            <div className="p-3">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => navigateMonth('prev')}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                
                <button
                  type="button"
                  onClick={() => navigateMonth('next')}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map((day, index) => {
                  const adjustedIndex = (index + weekStartsOn) % 7;
                  return (
                    <div
                      key={day}
                      className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center py-1"
                    >
                      {WEEKDAYS[adjustedIndex]}
                    </div>
                  );
                })}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  const isCurrentMonthDay = isCurrentMonth(date, currentMonth);
                  const isTodayDay = isToday(date);
                  const isSelectedDay = isSelected(date);
                  const isInRangeDay = isInRange(date);
                  const isDisabledDay = isDisabled(date);
                  
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDateSelect(date)}
                      disabled={isDisabledDay}
                      className={`
                        w-8 h-8 text-xs rounded transition-colors
                        ${!isCurrentMonthDay ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}
                        ${isTodayDay ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''}
                        ${isSelectedDay ? 'bg-blue-600 text-white' : ''}
                        ${isInRangeDay ? 'bg-blue-100 dark:bg-blue-900' : ''}
                        ${isDisabledDay ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
              
              {/* Time Picker */}
              {showTime && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    
                    <select
                      value={timeValue.hours}
                      onChange={(e) => handleTimeChange('hours', Number(e.target.value))}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    
                    <span className="text-gray-500">:</span>
                    
                    <select
                      value={timeValue.minutes}
                      onChange={(e) => handleTimeChange('minutes', Number(e.target.value))}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                {showTodayButton && (
                  <button
                    type="button"
                    onClick={handleToday}
                    className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                  >
                    Today
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartDatePicker;
export type { DateRange, SmartDatePickerProps };
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Upload, Download, FileText, Check, X, AlertCircle, Plus, Trash2, Edit3, Save } from 'lucide-react';
import SmartFileUpload, { UploadedFile } from '../inputs/SmartFileUpload';

interface BulkDataField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'date' | 'select';
  required?: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
}

interface BulkDataRow {
  id: string;
  data: Record<string, any>;
  status: 'pending' | 'valid' | 'invalid' | 'processing' | 'completed' | 'error';
  errors: Record<string, string>;
  isSelected: boolean;
}

interface BulkDataEntryProps {
  fields: BulkDataField[];
  data?: BulkDataRow[];
  onChange: (data: BulkDataRow[]) => void;
  onSubmit?: (data: BulkDataRow[]) => Promise<void>;
  onImport?: (data: any[]) => BulkDataRow[];
  onExport?: (data: BulkDataRow[]) => void;
  
  // Options
  allowAdd?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  allowImport?: boolean;
  allowExport?: boolean;
  maxRows?: number;
  
  // Templates
  templates?: Array<{
    name: string;
    data: Record<string, any>;
  }>;
  
  className?: string;
}

const BulkDataEntry: React.FC<BulkDataEntryProps> = ({
  fields,
  data = [],
  onChange,
  onSubmit,
  onImport,
  onExport,
  allowAdd = true,
  allowEdit = true,
  allowDelete = true,
  allowImport = true,
  allowExport = true,
  maxRows = 1000,
  templates = [],
  className = ''
}) => {
  const [rows, setRows] = useState<BulkDataRow[]>(data);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFiles, setImportFiles] = useState<UploadedFile[]>([]);
  const [importMapping, setImportMapping] = useState<Record<string, string>>({});
  const [importPreview, setImportPreview] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Validate a single row
  const validateRow = useCallback((row: BulkDataRow): BulkDataRow => {
    const errors: Record<string, string> = {};
    let isValid = true;
    
    fields.forEach(field => {
      const value = row.data[field.key];
      
      // Required field validation
      if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        errors[field.key] = `${field.label} is required`;
        isValid = false;
        return;
      }
      
      // Type-specific validation
      if (value) {
        switch (field.type) {
          case 'number':
            const numValue = Number(value);
            if (isNaN(numValue)) {
              errors[field.key] = `${field.label} must be a valid number`;
              isValid = false;
            } else {
              if (field.validation?.min !== undefined && numValue < field.validation.min) {
                errors[field.key] = `${field.label} must be at least ${field.validation.min}`;
                isValid = false;
              }
              if (field.validation?.max !== undefined && numValue > field.validation.max) {
                errors[field.key] = `${field.label} must be no more than ${field.validation.max}`;
                isValid = false;
              }
            }
            break;
            
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors[field.key] = `${field.label} must be a valid email address`;
              isValid = false;
            }
            break;
            
          case 'select':
            if (field.options && !field.options.includes(value)) {
              errors[field.key] = `${field.label} must be one of: ${field.options.join(', ')}`;
              isValid = false;
            }
            break;
        }
        
        // Pattern validation
        if (field.validation?.pattern && !field.validation.pattern.test(value)) {
          errors[field.key] = `${field.label} format is invalid`;
          isValid = false;
        }
      }
    });
    
    return {
      ...row,
      status: isValid ? 'valid' : 'invalid',
      errors
    };
  }, [fields]);
  
  // Validate all rows
  const validateAllRows = useCallback((rowsToValidate: BulkDataRow[]): BulkDataRow[] => {
    return rowsToValidate.map(validateRow);
  }, [validateRow]);
  
  // Add new row
  const addRow = useCallback((template?: Record<string, any>) => {
    if (rows.length >= maxRows) {
      alert(`Maximum ${maxRows} rows allowed`);
      return;
    }
    
    const newRow: BulkDataRow = {
      id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: template || {},
      status: 'pending',
      errors: {},
      isSelected: false
    };
    
    const updatedRows = [...rows, newRow];
    setRows(updatedRows);
    onChange(updatedRows);
    setEditingRow(newRow.id);
  }, [rows, maxRows, onChange]);
  
  // Update row data
  const updateRow = useCallback((rowId: string, data: Record<string, any>) => {
    const updatedRows = rows.map(row => {
      if (row.id === rowId) {
        const updatedRow = { ...row, data: { ...row.data, ...data } };
        return validateRow(updatedRow);
      }
      return row;
    });
    
    setRows(updatedRows);
    onChange(updatedRows);
  }, [rows, onChange, validateRow]);
  
  // Delete rows
  const deleteRows = useCallback((rowIds: string[]) => {
    const updatedRows = rows.filter(row => !rowIds.includes(row.id));
    setRows(updatedRows);
    onChange(updatedRows);
    setSelectedRows(new Set());
  }, [rows, onChange]);
  
  // Toggle row selection
  const toggleRowSelection = useCallback((rowId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  }, [selectedRows]);
  
  // Select all rows
  const selectAllRows = useCallback((select: boolean) => {
    if (select) {
      setSelectedRows(new Set(rows.map(row => row.id)));
    } else {
      setSelectedRows(new Set());
    }
  }, [rows]);
  
  // Parse CSV content
  const parseCSV = useCallback((content: string): any[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }
    
    return data;
  }, []);
  
  // Handle file import
  const handleFileImport = useCallback(async (files: UploadedFile[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    if (!file.file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }
    
    try {
      const content = await file.file.text();
      const parsedData = parseCSV(content);
      
      if (parsedData.length === 0) {
        alert('No data found in CSV file');
        return;
      }
      
      setImportPreview(parsedData.slice(0, 5)); // Show first 5 rows for preview
      
      // Auto-map fields based on column names
      const autoMapping: Record<string, string> = {};
      const csvHeaders = Object.keys(parsedData[0]);
      
      fields.forEach(field => {
        const matchingHeader = csvHeaders.find(header => 
          header.toLowerCase().includes(field.key.toLowerCase()) ||
          header.toLowerCase().includes(field.label.toLowerCase())
        );
        
        if (matchingHeader) {
          autoMapping[field.key] = matchingHeader;
        }
      });
      
      setImportMapping(autoMapping);
      setImportFiles(files);
    } catch (error) {
      console.error('CSV parsing error:', error);
      alert('Error parsing CSV file');
    }
  }, [fields, parseCSV]);
  
  // Execute import
  const executeImport = useCallback(async () => {
    if (importFiles.length === 0) return;
    
    try {
      const content = await importFiles[0].file.text();
      const parsedData = parseCSV(content);
      
      // Map data according to field mapping
      const mappedData = parsedData.map(row => {
        const mappedRow: Record<string, any> = {};
        
        Object.entries(importMapping).forEach(([fieldKey, csvColumn]) => {
          if (csvColumn && row[csvColumn] !== undefined) {
            mappedRow[fieldKey] = row[csvColumn];
          }
        });
        
        return mappedRow;
      });
      
      // Convert to BulkDataRow format
      let importedRows: BulkDataRow[];
      
      if (onImport) {
        importedRows = onImport(mappedData);
      } else {
        importedRows = mappedData.map((data, index) => ({
          id: `imported_${Date.now()}_${index}`,
          data,
          status: 'pending' as const,
          errors: {},
          isSelected: false
        }));
      }
      
      // Validate imported rows
      const validatedRows = validateAllRows(importedRows);
      
      // Add to existing rows
      const updatedRows = [...rows, ...validatedRows];
      setRows(updatedRows);
      onChange(updatedRows);
      
      // Close import dialog
      setShowImportDialog(false);
      setImportFiles([]);
      setImportMapping({});
      setImportPreview([]);
      
      alert(`Imported ${validatedRows.length} rows`);
    } catch (error) {
      console.error('Import error:', error);
      alert('Error importing data');
    }
  }, [importFiles, parseCSV, importMapping, onImport, validateAllRows, rows, onChange]);
  
  // Export to CSV
  const exportToCSV = useCallback(() => {
    if (rows.length === 0) {
      alert('No data to export');
      return;
    }
    
    const headers = fields.map(field => field.label);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        fields.map(field => {
          const value = row.data[field.key] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `bulk_data_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    if (onExport) {
      onExport(rows);
    }
  }, [rows, fields, onExport]);
  
  // Submit data
  const handleSubmit = useCallback(async () => {
    if (!onSubmit) return;
    
    const validRows = rows.filter(row => row.status === 'valid');
    
    if (validRows.length === 0) {
      alert('No valid rows to submit');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(validRows);
      
      // Mark submitted rows as completed
      const updatedRows = rows.map(row => 
        row.status === 'valid' ? { ...row, status: 'completed' as const } : row
      );
      
      setRows(updatedRows);
      onChange(updatedRows);
      
      alert(`Successfully submitted ${validRows.length} rows`);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Error submitting data');
    } finally {
      setIsSubmitting(false);
    }
  }, [rows, onSubmit, onChange]);
  
  // Statistics
  const stats = useMemo(() => {
    const total = rows.length;
    const valid = rows.filter(row => row.status === 'valid').length;
    const invalid = rows.filter(row => row.status === 'invalid').length;
    const completed = rows.filter(row => row.status === 'completed').length;
    const pending = rows.filter(row => row.status === 'pending').length;
    
    return { total, valid, invalid, completed, pending };
  }, [rows]);
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Bulk Data Entry
          </h3>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
            <span>Total: {stats.total}</span>
            <span className="text-green-600">Valid: {stats.valid}</span>
            <span className="text-red-600">Invalid: {stats.invalid}</span>
            <span className="text-blue-600">Completed: {stats.completed}</span>
            <span className="text-yellow-600">Pending: {stats.pending}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Templates */}
          {templates.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) {
                  const template = templates.find(t => t.name === e.target.value);
                  if (template) {
                    addRow(template.data);
                  }
                  e.target.value = '';
                }
              }}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Use Template</option>
              {templates.map(template => (
                <option key={template.name} value={template.name}>
                  {template.name}
                </option>
              ))}
            </select>
          )}
          
          {/* Add Row */}
          {allowAdd && (
            <button
              onClick={() => addRow()}
              className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Row</span>
            </button>
          )}
          
          {/* Import */}
          {allowImport && (
            <button
              onClick={() => setShowImportDialog(true)}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import CSV</span>
            </button>
          )}
          
          {/* Export */}
          {allowExport && rows.length > 0 && (
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          )}
          
          {/* Delete Selected */}
          {allowDelete && selectedRows.size > 0 && (
            <button
              onClick={() => deleteRows(Array.from(selectedRows))}
              className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete ({selectedRows.size})</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Data Table */}
      {rows.length > 0 ? (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="w-12 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === rows.length && rows.length > 0}
                      onChange={(e) => selectAllRows(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  
                  <th className="w-16 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  
                  {fields.map(field => (
                    <th
                      key={field.key}
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </th>
                  ))}
                  
                  <th className="w-24 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {rows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    className={`
                      ${selectedRows.has(row.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                      ${row.status === 'invalid' ? 'bg-red-50 dark:bg-red-900/20' : ''}
                      ${row.status === 'valid' ? 'bg-green-50 dark:bg-green-900/20' : ''}
                      ${row.status === 'completed' ? 'bg-gray-50 dark:bg-gray-800' : ''}
                    `}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={() => toggleRowSelection(row.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    
                    <td className="px-3 py-2">
                      <div className="flex items-center">
                        {row.status === 'valid' && <Check className="w-4 h-4 text-green-500" />}
                        {row.status === 'invalid' && <X className="w-4 h-4 text-red-500" />}
                        {row.status === 'pending' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                        {row.status === 'completed' && <Check className="w-4 h-4 text-blue-500" />}
                      </div>
                    </td>
                    
                    {fields.map(field => (
                      <td key={field.key} className="px-3 py-2">
                        {editingRow === row.id ? (
                          <div className="space-y-1">
                            {field.type === 'select' ? (
                              <select
                                value={row.data[field.key] || ''}
                                onChange={(e) => updateRow(row.id, { [field.key]: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              >
                                <option value="">Select...</option>
                                {field.options?.map(option => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                value={row.data[field.key] || ''}
                                onChange={(e) => updateRow(row.id, { [field.key]: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            )}
                            
                            {row.errors[field.key] && (
                              <div className="text-xs text-red-500">
                                {row.errors[field.key]}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className={`text-sm ${
                              row.errors[field.key] ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            {row.data[field.key] || '-'}
                            
                            {row.errors[field.key] && (
                              <div className="text-xs text-red-500 mt-1">
                                {row.errors[field.key]}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    ))}
                    
                    <td className="px-3 py-2">
                      <div className="flex items-center space-x-1">
                        {allowEdit && (
                          <button
                            onClick={() => setEditingRow(editingRow === row.id ? null : row.id)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title={editingRow === row.id ? 'Save' : 'Edit'}
                          >
                            {editingRow === row.id ? (
                              <Save className="w-4 h-4" />
                            ) : (
                              <Edit3 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        
                        {allowDelete && (
                          <button
                            onClick={() => deleteRows([row.id])}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No data entries yet.</p>
          <p className="text-sm">Add rows manually or import from CSV.</p>
        </div>
      )}
      
      {/* Submit Button */}
      {onSubmit && stats.valid > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSubmitting ? 'Submitting...' : `Submit ${stats.valid} Valid Rows`}</span>
          </button>
        </div>
      )}
      
      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Import CSV Data
                </h3>
                
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {importFiles.length === 0 ? (
                <SmartFileUpload
                  value={importFiles}
                  onChange={handleFileImport}
                  accept=".csv"
                  maxFiles={1}
                  multiple={false}
                  label="Select CSV File"
                />
              ) : (
                <div className="space-y-4">
                  {/* Field Mapping */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Map CSV Columns to Fields
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {fields.map(field => (
                        <div key={field.key} className="flex items-center space-x-2">
                          <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          
                          <select
                            value={importMapping[field.key] || ''}
                            onChange={(e) => setImportMapping(prev => ({
                              ...prev,
                              [field.key]: e.target.value
                            }))}
                            className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            <option value="">-- Skip --</option>
                            {importPreview.length > 0 && Object.keys(importPreview[0]).map(column => (
                              <option key={column} value={column}>
                                {column}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Preview */}
                  {importPreview.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Preview (First 5 rows)
                      </h4>
                      
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                {Object.keys(importPreview[0]).map(column => (
                                  <th key={column} className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                    {column}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                              {importPreview.map((row, index) => (
                                <tr key={index}>
                                  {Object.values(row).map((value, cellIndex) => (
                                    <td key={cellIndex} className="px-3 py-2 text-gray-900 dark:text-gray-100">
                                      {String(value)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setShowImportDialog(false);
                        setImportFiles([]);
                        setImportMapping({});
                        setImportPreview([]);
                      }}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={executeImport}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Import Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkDataEntry;
export type { BulkDataField, BulkDataRow, BulkDataEntryProps };
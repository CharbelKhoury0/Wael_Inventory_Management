import { useNotification } from '../contexts/NotificationContext';

// Types for export data
export interface ExportColumn {
  key: string;
  label: string;
  width?: number;
  format?: (value: any) => string;
}

export interface ExportOptions {
  filename: string;
  title?: string;
  subtitle?: string;
  columns: ExportColumn[];
  data: any[];
  includeTimestamp?: boolean;
}

// CSV Export Function
export const exportToCSV = (options: ExportOptions): void => {
  try {
    const { filename, columns, data, includeTimestamp = true } = options;
    
    // Create CSV headers
    const headers = columns.map(col => col.label).join(',');
    
    // Create CSV rows
    const rows = data.map(item => {
      return columns.map(col => {
        let value = item[col.key];
        
        // Apply formatting if provided
        if (col.format && value !== undefined && value !== null) {
          value = col.format(value);
        }
        
        // Handle null/undefined values
        if (value === null || value === undefined) {
          value = '';
        }
        
        // Escape commas and quotes in CSV
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      }).join(',');
    });
    
    // Combine headers and rows
    const csvContent = [headers, ...rows].join('\n');
    
    // Add BOM for proper UTF-8 encoding
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;
    
    // Create and download file
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
    const finalFilename = `${filename}${timestamp}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw new Error('Failed to export CSV file');
  }
};

// PDF Export Function (using HTML to PDF conversion)
export const exportToPDF = async (options: ExportOptions): Promise<void> => {
  try {
    const { filename, title, subtitle, columns, data, includeTimestamp = true } = options;
    
    // Create HTML content for PDF
    const htmlContent = generatePDFHTML({
      title: title || filename,
      subtitle,
      columns,
      data,
      includeTimestamp
    });
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please check your popup blocker.');
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
    
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export PDF file');
  }
};

// Generate HTML content for PDF
const generatePDFHTML = (options: {
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  data: any[];
  includeTimestamp: boolean;
}): string => {
  const { title, subtitle, columns, data, includeTimestamp } = options;
  const timestamp = new Date().toLocaleString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @media print {
          @page {
            margin: 0.5in;
            size: A4;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
          }
          .timestamp {
            font-size: 10px;
            color: #999;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
            font-size: 11px;
          }
          td {
            font-size: 10px;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
        }
        
        @media screen {
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 16px;
            color: #666;
            margin-bottom: 5px;
          }
          .timestamp {
            font-size: 12px;
            color: #999;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">${title}</div>
          ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
          ${includeTimestamp ? `<div class="timestamp">Generated on ${timestamp}</div>` : ''}
        </div>
        
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th style="${col.width ? `width: ${col.width}px;` : ''}">${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>
                ${columns.map(col => {
                  let value = item[col.key];
                  if (col.format && value !== undefined && value !== null) {
                    value = col.format(value);
                  }
                  if (value === null || value === undefined) {
                    value = '';
                  }
                  return `<td>${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Wael Inventory Management System - ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Hook for using export functionality with notifications
export const useExport = () => {
  const { showSuccess, showError, showLoading, dismissToast } = useNotification();
  
  const exportData = async (type: 'csv' | 'pdf', options: ExportOptions) => {
    const loadingId = showLoading(`Exporting ${type.toUpperCase()}...`);
    
    try {
      if (type === 'csv') {
        exportToCSV(options);
      } else {
        await exportToPDF(options);
      }
      
      dismissToast(loadingId);
      showSuccess(
        `${type.toUpperCase()} exported successfully`,
        `${options.filename} has been downloaded`
      );
    } catch (error) {
      dismissToast(loadingId);
      showError(
        `Failed to export ${type.toUpperCase()}`,
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    }
  };
  
  return { exportData };
};

// Utility functions for common export scenarios
export const createItemsExportColumns = (): ExportColumn[] => [
  { key: 'sku', label: 'SKU', width: 100 },
  { key: 'name', label: 'Name', width: 200 },
  { key: 'category', label: 'Category', width: 120 },
  { key: 'quantity', label: 'Quantity', width: 80, format: (val) => val?.toString() || '0' },
  { key: 'price', label: 'Price', width: 100, format: (val) => `$${val?.toFixed(2) || '0.00'}` },
  { key: 'location', label: 'Location', width: 120 },
  { key: 'minStock', label: 'Min Stock', width: 80, format: (val) => val?.toString() || '0' },
  { key: 'lastUpdated', label: 'Last Updated', width: 150, format: (val) => val ? new Date(val).toLocaleDateString() : '' }
];

export const createMovementsExportColumns = (): ExportColumn[] => [
  { key: 'id', label: 'Movement ID', width: 120 },
  { key: 'type', label: 'Type', width: 80 },
  { key: 'transportType', label: 'Transport', width: 100 },
  { key: 'driverName', label: 'Driver', width: 150 },
  { key: 'timestamp', label: 'Date/Time', width: 150, format: (val) => val ? new Date(val).toLocaleString() : '' },
  { key: 'status', label: 'Status', width: 100 },
  { key: 'origin', label: 'Origin', width: 120 },
  { key: 'destination', label: 'Destination', width: 120 }
];

export const createTransactionsExportColumns = (): ExportColumn[] => [
  { key: 'id', label: 'Transaction ID', width: 120 },
  { key: 'type', label: 'Type', width: 80 },
  { key: 'itemName', label: 'Item', width: 200 },
  { key: 'quantity', label: 'Quantity', width: 80, format: (val) => val?.toString() || '0' },
  { key: 'unitPrice', label: 'Unit Price', width: 100, format: (val) => `$${val?.toFixed(2) || '0.00'}` },
  { key: 'totalValue', label: 'Total Value', width: 120, format: (val) => `$${val?.toFixed(2) || '0.00'}` },
  { key: 'date', label: 'Date', width: 100, format: (val) => val ? new Date(val).toLocaleDateString() : '' },
  { key: 'status', label: 'Status', width: 100 }
];
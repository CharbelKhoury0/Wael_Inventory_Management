import { useNotification } from '../contexts/NotificationContext';

// Types for print data
export interface PrintColumn {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
}

export interface PrintOptions {
  title: string;
  subtitle?: string;
  columns: PrintColumn[];
  data: any[];
  includeTimestamp?: boolean;
  includeFooter?: boolean;
  pageSize?: 'A4' | 'Letter' | 'A5';
  orientation?: 'portrait' | 'landscape';
  fontSize?: 'small' | 'medium' | 'large';
  companyInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
}

export interface ReceiptPrintOptions {
  receiptId: string;
  date: string;
  supplier: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax?: number;
  total: number;
  notes?: string;
  companyInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

// Generate print-optimized HTML
const generatePrintHTML = (options: PrintOptions): string => {
  const {
    title,
    subtitle,
    columns,
    data,
    includeTimestamp = true,
    includeFooter = true,
    pageSize = 'A4',
    orientation = 'portrait',
    fontSize = 'medium',
    companyInfo
  } = options;

  const timestamp = new Date().toLocaleString();
  const fontSizes = {
    small: { base: '10px', title: '16px', subtitle: '12px' },
    medium: { base: '12px', title: '20px', subtitle: '14px' },
    large: { base: '14px', title: '24px', subtitle: '16px' }
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @media print {
          @page {
            size: ${pageSize} ${orientation};
            margin: 0.5in;
          }
          
          * {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            font-size: ${fontSizes[fontSize].base};
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 0;
          }
          
          .no-print {
            display: none !important;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .avoid-break {
            page-break-inside: avoid;
          }
        }
        
        body {
          font-family: 'Arial', sans-serif;
          font-size: ${fontSizes[fontSize].base};
          line-height: 1.4;
          color: #333;
          margin: 20px;
          background: white;
        }
        
        .container {
          max-width: 100%;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #333;
        }
        
        .company-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        
        .company-logo {
          max-width: 150px;
          max-height: 80px;
        }
        
        .company-details {
          text-align: right;
          font-size: ${fontSizes[fontSize].base};
        }
        
        .title {
          font-size: ${fontSizes[fontSize].title};
          font-weight: bold;
          margin-bottom: 10px;
          color: #000;
        }
        
        .subtitle {
          font-size: ${fontSizes[fontSize].subtitle};
          color: #666;
          margin-bottom: 10px;
        }
        
        .timestamp {
          font-size: calc(${fontSizes[fontSize].base} - 1px);
          color: #999;
        }
        
        .content {
          margin: 20px 0;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: white;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          vertical-align: top;
        }
        
        th {
          background-color: #f8f9fa;
          font-weight: bold;
          font-size: calc(${fontSizes[fontSize].base} - 1px);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        td {
          font-size: ${fontSizes[fontSize].base};
        }
        
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: calc(${fontSizes[fontSize].base} - 1px);
          color: #666;
        }
        
        .summary {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }
        
        .no-print {
          margin: 20px 0;
          text-align: center;
        }
        
        .print-button {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          margin: 0 5px;
        }
        
        .print-button:hover {
          background-color: #0056b3;
        }
        
        @media screen {
          .container {
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            border-radius: 8px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${companyInfo ? `
          <div class="company-info">
            <div>
              ${companyInfo.logo ? `<img src="${companyInfo.logo}" alt="Company Logo" class="company-logo">` : ''}
            </div>
            <div class="company-details">
              <strong>${companyInfo.name}</strong><br>
              ${companyInfo.address ? `${companyInfo.address}<br>` : ''}
              ${companyInfo.phone ? `Phone: ${companyInfo.phone}<br>` : ''}
              ${companyInfo.email ? `Email: ${companyInfo.email}` : ''}
            </div>
          </div>
        ` : ''}
        
        <div class="header">
          <div class="title">${title}</div>
          ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
          ${includeTimestamp ? `<div class="timestamp">Generated on ${timestamp}</div>` : ''}
        </div>
        
        <div class="no-print">
          <button class="print-button" onclick="window.print()">🖨️ Print</button>
          <button class="print-button" onclick="window.close()">❌ Close</button>
        </div>
        
        <div class="content">
          <table class="avoid-break">
            <thead>
              <tr>
                ${columns.map(col => `
                  <th style="${col.width ? `width: ${col.width};` : ''} text-align: ${col.align || 'left'}">
                    ${col.label}
                  </th>
                `).join('')}
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
                    return `<td style="text-align: ${col.align || 'left'}">${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <strong>Summary:</strong> ${data.length} record${data.length !== 1 ? 's' : ''} displayed
          </div>
        </div>
        
        ${includeFooter ? `
          <div class="footer">
            <p>Wael Inventory Management System - ${new Date().getFullYear()}</p>
            <p>This document was generated automatically on ${timestamp}</p>
          </div>
        ` : ''}
      </div>
      
      <script>
        // Auto-focus print dialog on load
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;
};

// Generate receipt HTML
const generateReceiptHTML = (options: ReceiptPrintOptions): string => {
  const {
    receiptId,
    date,
    supplier,
    items,
    subtotal,
    tax = 0,
    total,
    notes,
    companyInfo
  } = options;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt ${receiptId}</title>
      <style>
        @media print {
          @page {
            size: A4 portrait;
            margin: 0.5in;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
          }
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          margin: 20px;
          background: white;
        }
        
        .receipt {
          max-width: 400px;
          margin: 0 auto;
          border: 2px solid #000;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 15px;
          margin-bottom: 15px;
        }
        
        .company-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .receipt-title {
          font-size: 16px;
          font-weight: bold;
          margin: 15px 0;
        }
        
        .receipt-info {
          margin-bottom: 15px;
        }
        
        .receipt-info div {
          margin-bottom: 3px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        
        .items-table th,
        .items-table td {
          padding: 5px;
          text-align: left;
          border-bottom: 1px dotted #000;
        }
        
        .items-table th {
          font-weight: bold;
          border-bottom: 1px solid #000;
        }
        
        .text-right {
          text-align: right;
        }
        
        .totals {
          border-top: 1px solid #000;
          padding-top: 10px;
          margin-top: 15px;
        }
        
        .totals div {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        
        .total-line {
          font-weight: bold;
          font-size: 14px;
          border-top: 1px solid #000;
          padding-top: 5px;
          margin-top: 5px;
        }
        
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px dashed #000;
          font-size: 10px;
        }
        
        .notes {
          margin: 15px 0;
          padding: 10px;
          border: 1px dashed #000;
          background-color: #f9f9f9;
        }
        
        .no-print {
          margin: 20px 0;
          text-align: center;
        }
        
        .print-button {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          margin: 0 5px;
        }
        
        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          ${companyInfo ? `
            <div class="company-name">${companyInfo.name}</div>
            ${companyInfo.address ? `<div>${companyInfo.address}</div>` : ''}
            ${companyInfo.phone ? `<div>Phone: ${companyInfo.phone}</div>` : ''}
            ${companyInfo.email ? `<div>Email: ${companyInfo.email}</div>` : ''}
          ` : ''}
          <div class="receipt-title">RECEIPT</div>
        </div>
        
        <div class="receipt-info">
          <div><strong>Receipt #:</strong> ${receiptId}</div>
          <div><strong>Date:</strong> ${date}</div>
          <div><strong>Supplier:</strong> ${supplier}</div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">$${item.unitPrice.toFixed(2)}</td>
                <td class="text-right">$${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div>
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          ${tax > 0 ? `
            <div>
              <span>Tax:</span>
              <span>$${tax.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-line">
            <span>TOTAL:</span>
            <span>$${total.toFixed(2)}</span>
          </div>
        </div>
        
        ${notes ? `
          <div class="notes">
            <strong>Notes:</strong><br>
            ${notes}
          </div>
        ` : ''}
        
        <div class="footer">
          <div>Thank you for your business!</div>
          <div>Generated on ${new Date().toLocaleString()}</div>
        </div>
      </div>
      
      <div class="no-print">
        <button class="print-button" onclick="window.print()">🖨️ Print Receipt</button>
        <button class="print-button" onclick="window.close()">❌ Close</button>
      </div>
      
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;
};

// Print table data
export const printTable = (options: PrintOptions): void => {
  try {
    const htmlContent = generatePrintHTML(options);
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please check your popup blocker.');
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Focus the print window
    printWindow.focus();
  } catch (error) {
    console.error('Error printing table:', error);
    throw new Error('Failed to print table');
  }
};

// Print receipt
export const printReceipt = (options: ReceiptPrintOptions): void => {
  try {
    const htmlContent = generateReceiptHTML(options);
    
    const printWindow = window.open('', '_blank', 'width=500,height=700');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please check your popup blocker.');
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Focus the print window
    printWindow.focus();
  } catch (error) {
    console.error('Error printing receipt:', error);
    throw new Error('Failed to print receipt');
  }
};

// Hook for using print functionality with notifications
export const usePrint = () => {
  const { showSuccess, showError, showLoading, dismissToast } = useNotification();
  
  const printData = async (type: 'table' | 'receipt', options: PrintOptions | ReceiptPrintOptions) => {
    const loadingId = showLoading('Preparing print...');
    
    try {
      if (type === 'table') {
        printTable(options as PrintOptions);
      } else {
        printReceipt(options as ReceiptPrintOptions);
      }
      
      dismissToast(loadingId);
      showSuccess(
        'Print Ready',
        'Print dialog has been opened'
      );
    } catch (error) {
      dismissToast(loadingId);
      showError(
        'Print Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    }
  };
  
  return { printData };
};

// Utility functions for common print scenarios
export const createItemsPrintColumns = (): PrintColumn[] => [
  { key: 'sku', label: 'SKU', width: '15%' },
  { key: 'name', label: 'Name', width: '25%' },
  { key: 'category', label: 'Category', width: '15%' },
  { key: 'quantity', label: 'Qty', width: '10%', align: 'right', format: (val) => val?.toString() || '0' },
  { key: 'price', label: 'Price', width: '15%', align: 'right', format: (val) => `$${val?.toFixed(2) || '0.00'}` },
  { key: 'location', label: 'Location', width: '20%' }
];

export const createMovementsPrintColumns = (): PrintColumn[] => [
  { key: 'id', label: 'ID', width: '15%' },
  { key: 'type', label: 'Type', width: '10%' },
  { key: 'transportType', label: 'Transport', width: '15%' },
  { key: 'driverName', label: 'Driver', width: '20%' },
  { key: 'timestamp', label: 'Date/Time', width: '20%', format: (val) => val ? new Date(val).toLocaleString() : '' },
  { key: 'status', label: 'Status', width: '20%' }
];

export const createTransactionsPrintColumns = (): PrintColumn[] => [
  { key: 'id', label: 'ID', width: '15%' },
  { key: 'type', label: 'Type', width: '10%' },
  { key: 'itemName', label: 'Item', width: '25%' },
  { key: 'quantity', label: 'Qty', width: '10%', align: 'right', format: (val) => val?.toString() || '0' },
  { key: 'unitPrice', label: 'Unit Price', width: '15%', align: 'right', format: (val) => `$${val?.toFixed(2) || '0.00'}` },
  { key: 'totalValue', label: 'Total', width: '15%', align: 'right', format: (val) => `$${val?.toFixed(2) || '0.00'}` },
  { key: 'date', label: 'Date', width: '10%', format: (val) => val ? new Date(val).toLocaleDateString() : '' }
];
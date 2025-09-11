import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Item, Movement, Transaction, Alert } from '../store/inventoryStore';
import type { PredictionResult, InventoryOptimization } from './predictiveAnalytics';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
  }
}

interface AutoTableOptions {
  startY?: number;
  head?: string[][];
  body?: string[][];
  theme?: string;
  headStyles?: Record<string, unknown>;
  bodyStyles?: Record<string, unknown>;
  columnStyles?: Record<string, unknown>;
  styles?: Record<string, unknown>;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  pageBreak?: string;
  showHead?: boolean;
  showFoot?: boolean;
  tableWidth?: string | number;
  tableLineColor?: number[];
  tableLineWidth?: number;
}

export interface ReportConfig {
  title: string;
  subtitle?: string;
  includeCharts: boolean;
  includePredictions: boolean;
  includeRecommendations: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
  warehouseInfo: {
    name: string;
    address: string;
    manager: string;
    contact: string;
  };
}

export interface ReportData {
  items: Item[];
  movements: Movement[];
  transactions: Transaction[];
  alerts: Alert[];
  predictions?: PredictionResult[];
  optimization?: InventoryOptimization;
  metrics: {
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
    turnoverRate: number;
    fillRate: number;
    utilizationRate: number;
  };
}

export class PDFReportGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number;
  private currentY: number;
  private lineHeight: number;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.margin = 20;
    this.currentY = this.margin;
    this.lineHeight = 7;
  }

  private addNewPageIfNeeded(requiredHeight: number = 20): void {
    if (this.currentY + requiredHeight > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private addHeader(config: ReportConfig): void {
    // Company logo placeholder
    this.doc.setFillColor(59, 130, 246); // Blue color
    this.doc.rect(this.margin, this.margin, 30, 15, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('WAEL', this.margin + 15, this.margin + 9, { align: 'center' });
    
    // Report title
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(config.title, this.pageWidth - this.margin, this.margin + 8, { align: 'right' });
    
    if (config.subtitle) {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(config.subtitle, this.pageWidth - this.margin, this.margin + 16, { align: 'right' });
    }
    
    // Date and warehouse info
    this.currentY = this.margin + 25;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    this.doc.text(`Report Generated: ${reportDate}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Warehouse: ${config.warehouseInfo.name}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Manager: ${config.warehouseInfo.manager}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    // Horizontal line
    this.currentY += 5;
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private addExecutiveSummary(data: ReportData): void {
    this.addNewPageIfNeeded(60);
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Executive Summary', this.margin, this.currentY);
    this.currentY += 15;
    
    // Key metrics in a grid
    const metrics = [
      { label: 'Total Items', value: data.metrics.totalItems.toLocaleString(), unit: 'items' },
      { label: 'Total Value', value: `$${(data.metrics.totalValue / 1000).toFixed(0)}K`, unit: '' },
      { label: 'Low Stock Items', value: data.metrics.lowStockCount.toString(), unit: 'items' },
      { label: 'Turnover Rate', value: data.metrics.turnoverRate.toFixed(1), unit: 'x/year' },
      { label: 'Fill Rate', value: `${data.metrics.fillRate.toFixed(1)}%`, unit: '' },
      { label: 'Utilization', value: `${data.metrics.utilizationRate.toFixed(1)}%`, unit: '' }
    ];
    
    const boxWidth = (this.pageWidth - 2 * this.margin - 20) / 3;
    const boxHeight = 25;
    
    metrics.forEach((metric, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = this.margin + col * (boxWidth + 10);
      const y = this.currentY + row * (boxHeight + 10);
      
      // Box background
      this.doc.setFillColor(248, 250, 252);
      this.doc.rect(x, y, boxWidth, boxHeight, 'F');
      
      // Border
      this.doc.setDrawColor(226, 232, 240);
      this.doc.rect(x, y, boxWidth, boxHeight);
      
      // Metric value
      this.doc.setFontSize(18);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(59, 130, 246);
      this.doc.text(metric.value, x + boxWidth / 2, y + 12, { align: 'center' });
      
      // Metric label
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 116, 139);
      this.doc.text(metric.label, x + boxWidth / 2, y + 20, { align: 'center' });
    });
    
    this.currentY += 70;
  }

  private addInventoryTable(items: Item[]): void {
    this.addNewPageIfNeeded(40);
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Inventory Details', this.margin, this.currentY);
    this.currentY += 10;
    
    const tableData = items.slice(0, 50).map(item => [
      item.sku,
      item.name.substring(0, 30) + (item.name.length > 30 ? '...' : ''),
      item.category,
      item.quantity.toString(),
      `$${item.price.toFixed(2)}`,
      `$${(item.quantity * item.price).toFixed(2)}`,
      item.quantity <= item.minStock ? 'Low' : 'OK'
    ]);
    
    this.doc.autoTable({
      startY: this.currentY,
      head: [['SKU', 'Name', 'Category', 'Qty', 'Price', 'Value', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 45 },
        2: { cellWidth: 25 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 15, halign: 'center' }
      },
      didDrawCell: (data: { column: { index: number }; cell: { raw: string } }) => {
        if (data.column.index === 6 && data.cell.raw === 'Low') {
          this.doc.setTextColor(239, 68, 68);
          this.doc.setFont('helvetica', 'bold');
        }
      }
    });
    
    this.currentY = (this.doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  private addMovementsTable(movements: Movement[]): void {
    this.addNewPageIfNeeded(40);
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Recent Movements', this.margin, this.currentY);
    this.currentY += 10;
    
    const tableData = movements.slice(0, 30).map(movement => [
      movement.id,
      movement.type,
      movement.transportType,
      movement.truckPlate || movement.containerId || '',
      movement.driverName,
      new Date(movement.timestamp).toLocaleDateString(),
      movement.status
    ]);
    
    this.doc.autoTable({
      startY: this.currentY,
      head: [['ID', 'Type', 'Transport', 'Vehicle/Container', 'Driver', 'Date', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
        5: { cellWidth: 25 },
        6: { cellWidth: 20, halign: 'center' }
      }
    });
    
    this.currentY = (this.doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  private addPredictionsTable(predictions: PredictionResult[]): void {
    if (!predictions || predictions.length === 0) return;
    
    this.addNewPageIfNeeded(40);
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Predictive Analytics', this.margin, this.currentY);
    this.currentY += 10;
    
    const tableData = predictions.slice(0, 20).map(pred => [
      pred.itemName.substring(0, 25) + (pred.itemName.length > 25 ? '...' : ''),
      pred.currentStock.toString(),
      pred.predictedDemand.toString(),
      pred.recommendedReorderPoint.toString(),
      pred.recommendedOrderQuantity.toString(),
      `${pred.stockoutRisk}%`,
      `${pred.confidence}%`
    ]);
    
    this.doc.autoTable({
      startY: this.currentY,
      head: [['Item', 'Current', 'Predicted', 'Reorder Pt', 'Order Qty', 'Risk', 'Confidence']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [147, 51, 234],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 25, halign: 'center' }
      },
      didDrawCell: (data: { column: { index: number }; cell: { raw: string } }) => {
        if (data.column.index === 5) {
          const risk = parseInt(data.cell.raw.replace('%', ''));
          if (risk > 50) {
            this.doc.setTextColor(239, 68, 68);
            this.doc.setFont('helvetica', 'bold');
          }
        }
      }
    });
    
    this.currentY = (this.doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  private addRecommendations(optimization: InventoryOptimization): void {
    if (!optimization) return;
    
    this.addNewPageIfNeeded(60);
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Optimization Recommendations', this.margin, this.currentY);
    this.currentY += 15;
    
    // Cost summary
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Cost Analysis:', this.margin, this.currentY);
    this.currentY += 10;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Total Carrying Cost: $${optimization.totalCarryingCost.toLocaleString()}`, this.margin + 5, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Total Ordering Cost: $${optimization.totalOrderingCost.toLocaleString()}`, this.margin + 5, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Total Stockout Cost: $${optimization.totalStockoutCost.toLocaleString()}`, this.margin + 5, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Optimized Inventory Value: $${optimization.optimizedInventoryValue.toLocaleString()}`, this.margin + 5, this.currentY);
    this.currentY += 15;
    
    // High priority recommendations
    const highPriorityRecs = optimization.recommendations.filter(rec => rec.priority === 'high').slice(0, 10);
    
    if (highPriorityRecs.length > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('High Priority Actions:', this.margin, this.currentY);
      this.currentY += 10;
      
      const tableData = highPriorityRecs.map((rec, index) => [
        (index + 1).toString(),
        rec.action.toUpperCase(),
        rec.currentLevel.toString(),
        rec.recommendedLevel.toString(),
        rec.reasoning.substring(0, 60) + (rec.reasoning.length > 60 ? '...' : '')
      ]);
      
      this.doc.autoTable({
        startY: this.currentY,
        head: [['#', 'Action', 'Current', 'Recommended', 'Reasoning']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [239, 68, 68],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 85 }
        }
      });
      
      this.currentY = (this.doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Footer line
      this.doc.setDrawColor(200, 200, 200);
      this.doc.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);
      
      // Footer text
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 116, 139);
      
      this.doc.text(
        'Wael Inventory Management System - Confidential Report',
        this.margin,
        this.pageHeight - 8
      );
      
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth - this.margin,
        this.pageHeight - 8,
        { align: 'right' }
      );
    }
  }

  public async generateReport(config: ReportConfig, data: ReportData): Promise<Blob> {
    // Reset document
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.currentY = this.margin;
    
    // Add content
    this.addHeader(config);
    this.addExecutiveSummary(data);
    this.addInventoryTable(data.items);
    this.addMovementsTable(data.movements);
    
    if (config.includePredictions && data.predictions) {
      this.addPredictionsTable(data.predictions);
    }
    
    if (config.includeRecommendations && data.optimization) {
      this.addRecommendations(data.optimization);
    }
    
    this.addFooter();
    
    return this.doc.output('blob');
  }

  public async generateScheduledReport(
    config: ReportConfig,
    data: ReportData,
    schedule: 'daily' | 'weekly' | 'monthly'
  ): Promise<Blob> {
    // Add schedule-specific content
    const scheduledConfig = {
      ...config,
      title: `${config.title} - ${schedule.charAt(0).toUpperCase() + schedule.slice(1)} Report`,
      subtitle: `Automated ${schedule} inventory analysis`
    };
    
    return this.generateReport(scheduledConfig, data);
  }
}

// Utility functions
export const downloadPDF = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const generateInventoryReport = async (
  data: ReportData,
  warehouseInfo: ReportConfig['warehouseInfo'],
  options: Partial<ReportConfig> = {}
): Promise<Blob> => {
  const generator = new PDFReportGenerator();
  
  const config: ReportConfig = {
    title: 'Inventory Management Report',
    subtitle: 'Comprehensive Analysis and Insights',
    includeCharts: true,
    includePredictions: true,
    includeRecommendations: true,
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    warehouseInfo,
    ...options
  };
  
  return generator.generateReport(config, data);
};

export const generateExecutiveReport = async (
  data: ReportData,
  warehouseInfo: ReportConfig['warehouseInfo']
): Promise<Blob> => {
  const generator = new PDFReportGenerator();
  
  const config: ReportConfig = {
    title: 'Executive Summary Report',
    subtitle: 'Key Performance Indicators and Strategic Insights',
    includeCharts: false,
    includePredictions: true,
    includeRecommendations: true,
    dateRange: {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    warehouseInfo
  };
  
  return generator.generateReport(config, data);
};

export const generateComplianceReport = async (
  data: ReportData,
  warehouseInfo: ReportConfig['warehouseInfo']
): Promise<Blob> => {
  const generator = new PDFReportGenerator();
  
  const config: ReportConfig = {
    title: 'Compliance and Audit Report',
    subtitle: 'Regulatory Compliance and Audit Trail',
    includeCharts: false,
    includePredictions: false,
    includeRecommendations: false,
    dateRange: {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    warehouseInfo
  };
  
  return generator.generateReport(config, data);
};

// Install required packages
// npm install jspdf jspdf-autotable html2canvas
// npm install @types/jspdf
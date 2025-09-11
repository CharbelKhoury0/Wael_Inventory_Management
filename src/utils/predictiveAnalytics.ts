import type { Item, Movement, Transaction } from '../store/inventoryStore';

export interface PredictionResult {
  itemId: string;
  itemName: string;
  currentStock: number;
  predictedDemand: number;
  recommendedReorderPoint: number;
  recommendedOrderQuantity: number;
  stockoutRisk: number;
  daysUntilStockout: number;
  confidence: number;
  seasonalFactor: number;
  trendFactor: number;
}

export interface DemandForecast {
  period: string;
  predictedDemand: number;
  confidence: number;
  seasonalIndex: number;
  trendComponent: number;
}

export interface InventoryOptimization {
  totalCarryingCost: number;
  totalOrderingCost: number;
  totalStockoutCost: number;
  optimizedInventoryValue: number;
  recommendations: Array<{
    itemId: string;
    action: 'increase' | 'decrease' | 'maintain';
    currentLevel: number;
    recommendedLevel: number;
    reasoning: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export class PredictiveAnalyticsEngine {
  private items: Item[];
  private movements: Movement[];
  private transactions: Transaction[];
  private historicalData: Map<string, number[]> = new Map();

  constructor(items: Item[], movements: Movement[], transactions: Transaction[]) {
    this.items = items;
    this.movements = movements;
    this.transactions = transactions;
    this.buildHistoricalData();
  }

  private buildHistoricalData(): void {
    // Build historical demand data for each item
    this.items.forEach(item => {
      const itemTransactions = this.transactions.filter(t => 
        t.itemName.toLowerCase().includes(item.name.toLowerCase()) && 
        t.type === 'Outbound'
      );
      
      // Group by month and calculate monthly demand
      const monthlyDemand: number[] = [];
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthDemand = itemTransactions
          .filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= monthStart && transactionDate <= monthEnd;
          })
          .reduce((sum, t) => sum + t.quantity, 0);
        
        monthlyDemand.push(monthDemand);
      }
      
      this.historicalData.set(item.id, monthlyDemand);
    });
  }

  /**
   * Calculate seasonal index using moving averages
   */
  private calculateSeasonalIndex(data: number[], period: number = 12): number[] {
    if (data.length < period) {
      return new Array(data.length).fill(1);
    }

    const seasonalIndices: number[] = [];
    const movingAverages: number[] = [];
    
    // Calculate centered moving averages
    for (let i = 0; i < data.length; i++) {
      if (i >= Math.floor(period / 2) && i < data.length - Math.floor(period / 2)) {
        const sum = data.slice(i - Math.floor(period / 2), i + Math.ceil(period / 2)).reduce((a, b) => a + b, 0);
        movingAverages[i] = sum / period;
      } else {
        movingAverages[i] = data[i];
      }
    }
    
    // Calculate seasonal indices
    for (let i = 0; i < data.length; i++) {
      if (movingAverages[i] > 0) {
        seasonalIndices[i] = data[i] / movingAverages[i];
      } else {
        seasonalIndices[i] = 1;
      }
    }
    
    return seasonalIndices;
  }

  /**
   * Calculate trend using linear regression
   */
  private calculateTrend(data: number[]): { slope: number; intercept: number } {
    const n = data.length;
    if (n < 2) return { slope: 0, intercept: data[0] || 0 };
    
    const xSum = (n * (n - 1)) / 2;
    const ySum = data.reduce((sum, val) => sum + val, 0);
    const xySum = data.reduce((sum, val, index) => sum + val * index, 0);
    const x2Sum = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;
    
    return { slope, intercept };
  }

  /**
   * Predict future demand using exponential smoothing with trend and seasonality
   */
  public predictDemand(itemId: string, periodsAhead: number = 3): DemandForecast[] {
    const historicalDemand = this.historicalData.get(itemId) || [];
    
    if (historicalDemand.length === 0) {
      return Array.from({ length: periodsAhead }, (_, i) => ({
        period: `Month ${i + 1}`,
        predictedDemand: 0,
        confidence: 0,
        seasonalIndex: 1,
        trendComponent: 0
      }));
    }

    // Calculate seasonal indices and trend
    const seasonalIndices = this.calculateSeasonalIndex(historicalDemand);
    const trend = this.calculateTrend(historicalDemand);
    
    // Exponential smoothing parameters (for future implementation)
    // const alpha = 0.3; // Level smoothing
    // const beta = 0.2;  // Trend smoothing
    // const gamma = 0.1; // Seasonal smoothing
    
    const level = historicalDemand[historicalDemand.length - 1] || 0;
    const trendComponent = trend.slope;
    
    const forecasts: DemandForecast[] = [];
    
    for (let i = 0; i < periodsAhead; i++) {
      const seasonalIndex = seasonalIndices[(historicalDemand.length + i) % 12] || 1;
      const forecast = (level + trendComponent * (i + 1)) * seasonalIndex;
      
      // Calculate confidence based on historical variance
      const variance = this.calculateVariance(historicalDemand);
      const confidence = Math.max(60, 95 - (variance / 100) - (i * 5));
      
      forecasts.push({
        period: `Month ${i + 1}`,
        predictedDemand: Math.max(0, Math.round(forecast)),
        confidence: Math.round(confidence),
        seasonalIndex,
        trendComponent
      });
    }
    
    return forecasts;
  }

  private calculateVariance(data: number[]): number {
    if (data.length < 2) return 0;
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
    
    return variance;
  }

  /**
   * Calculate optimal reorder point using safety stock
   */
  public calculateReorderPoint(itemId: string, serviceLevel: number = 0.95): number {
    const item = this.items.find(i => i.id === itemId);
    if (!item) return 0;

    const historicalDemand = this.historicalData.get(itemId) || [];
    if (historicalDemand.length === 0) return item.minStock;

    // Calculate average demand and standard deviation
    const avgDemand = historicalDemand.reduce((sum, val) => sum + val, 0) / historicalDemand.length;
    const variance = this.calculateVariance(historicalDemand);
    const stdDev = Math.sqrt(variance);
    
    // Assume lead time of 1 month (can be made configurable)
    const leadTime = 1;
    const leadTimeDemand = avgDemand * leadTime;
    
    // Z-score for service level (95% = 1.645, 99% = 2.33)
    const zScore = serviceLevel === 0.99 ? 2.33 : serviceLevel === 0.95 ? 1.645 : 1.28;
    
    // Safety stock calculation
    const safetyStock = zScore * stdDev * Math.sqrt(leadTime);
    
    return Math.round(leadTimeDemand + safetyStock);
  }

  /**
   * Calculate Economic Order Quantity (EOQ)
   */
  public calculateEOQ(itemId: string, annualDemand?: number): number {
    const item = this.items.find(i => i.id === itemId);
    if (!item) return 0;

    const historicalDemand = this.historicalData.get(itemId) || [];
    const demand = annualDemand || (historicalDemand.reduce((sum, val) => sum + val, 0) * 12 / historicalDemand.length);
    
    // Estimated costs (can be made configurable)
    const orderingCost = 50; // Cost per order
    const carryingCostRate = 0.25; // 25% of item value per year
    const carryingCost = item.price * carryingCostRate;
    
    if (carryingCost === 0) return Math.round(demand / 12); // Monthly demand as fallback
    
    const eoq = Math.sqrt((2 * demand * orderingCost) / carryingCost);
    
    return Math.round(eoq);
  }

  /**
   * Generate comprehensive predictions for all items
   */
  public generatePredictions(): PredictionResult[] {
    return this.items.map(item => {
      const forecasts = this.predictDemand(item.id, 3);
      const avgPredictedDemand = forecasts.reduce((sum, f) => sum + f.predictedDemand, 0) / forecasts.length;
      const reorderPoint = this.calculateReorderPoint(item.id);
      const eoq = this.calculateEOQ(item.id);
      
      // Calculate stockout risk
      const daysUntilStockout = avgPredictedDemand > 0 ? (item.quantity / (avgPredictedDemand / 30)) : 999;
      const stockoutRisk = daysUntilStockout < 30 ? (30 - daysUntilStockout) / 30 * 100 : 0;
      
      // Calculate seasonal and trend factors
      const historicalDemand = this.historicalData.get(item.id) || [];
      const seasonalIndices = this.calculateSeasonalIndex(historicalDemand);
      const trend = this.calculateTrend(historicalDemand);
      
      const currentSeasonalFactor = seasonalIndices[seasonalIndices.length - 1] || 1;
      const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length;
      
      return {
        itemId: item.id,
        itemName: item.name,
        currentStock: item.quantity,
        predictedDemand: Math.round(avgPredictedDemand),
        recommendedReorderPoint: reorderPoint,
        recommendedOrderQuantity: eoq,
        stockoutRisk: Math.round(stockoutRisk),
        daysUntilStockout: Math.round(daysUntilStockout),
        confidence: Math.round(avgConfidence),
        seasonalFactor: currentSeasonalFactor,
        trendFactor: trend.slope
      };
    });
  }

  /**
   * Generate inventory optimization recommendations
   */
  public optimizeInventory(): InventoryOptimization {
    const predictions = this.generatePredictions();
    
    // Calculate total costs
    let totalCarryingCost = 0;
    let totalOrderingCost = 0;
    let totalStockoutCost = 0;
    
    const recommendations = predictions.map(pred => {
      const item = this.items.find(i => i.id === pred.itemId)!;
      
      // Calculate carrying cost
      const carryingCost = item.quantity * item.price * 0.25; // 25% annual rate
      totalCarryingCost += carryingCost;
      
      // Estimate ordering cost (simplified)
      const ordersPerYear = pred.predictedDemand * 12 / pred.recommendedOrderQuantity;
      const orderingCost = ordersPerYear * 50; // $50 per order
      totalOrderingCost += orderingCost;
      
      // Estimate stockout cost
      const stockoutCost = pred.stockoutRisk * item.price * 0.1; // 10% of item value
      totalStockoutCost += stockoutCost;
      
      // Generate recommendation
      let action: 'increase' | 'decrease' | 'maintain' = 'maintain';
      let reasoning = 'Current stock level is optimal';
      let priority: 'high' | 'medium' | 'low' = 'low';
      
      if (pred.currentStock < pred.recommendedReorderPoint) {
        action = 'increase';
        reasoning = `Stock below reorder point. Risk of stockout in ${pred.daysUntilStockout} days`;
        priority = pred.stockoutRisk > 50 ? 'high' : 'medium';
      } else if (pred.currentStock > pred.recommendedOrderQuantity * 2) {
        action = 'decrease';
        reasoning = 'Excess inventory detected. Consider reducing stock to optimize carrying costs';
        priority = 'medium';
      }
      
      return {
        itemId: pred.itemId,
        action,
        currentLevel: pred.currentStock,
        recommendedLevel: action === 'increase' ? pred.recommendedReorderPoint + pred.recommendedOrderQuantity : 
                         action === 'decrease' ? pred.recommendedOrderQuantity : pred.currentStock,
        reasoning,
        priority
      };
    });
    
    const optimizedInventoryValue = this.items.reduce((sum, item) => {
      const rec = recommendations.find(r => r.itemId === item.id);
      const optimalLevel = rec ? rec.recommendedLevel : item.quantity;
      return sum + (optimalLevel * item.price);
    }, 0);
    
    return {
      totalCarryingCost,
      totalOrderingCost,
      totalStockoutCost,
      optimizedInventoryValue,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
    };
  }

  /**
   * Generate ABC analysis for inventory classification
   */
  public generateABCAnalysis(): Array<{
    itemId: string;
    itemName: string;
    annualValue: number;
    category: 'A' | 'B' | 'C';
    cumulativePercentage: number;
  }> {
    // Calculate annual value for each item
    const itemValues = this.items.map(item => {
      const historicalDemand = this.historicalData.get(item.id) || [];
      const avgMonthlyDemand = historicalDemand.length > 0 
        ? historicalDemand.reduce((sum, val) => sum + val, 0) / historicalDemand.length 
        : item.quantity / 12;
      const annualDemand = avgMonthlyDemand * 12;
      const annualValue = annualDemand * item.price;
      
      return {
        itemId: item.id,
        itemName: item.name,
        annualValue,
        category: 'C' as 'A' | 'B' | 'C',
        cumulativePercentage: 0
      };
    });
    
    // Sort by annual value (descending)
    itemValues.sort((a, b) => b.annualValue - a.annualValue);
    
    // Calculate cumulative percentages and assign categories
    const totalValue = itemValues.reduce((sum, item) => sum + item.annualValue, 0);
    let cumulativeValue = 0;
    
    return itemValues.map(item => {
      cumulativeValue += item.annualValue;
      const cumulativePercentage = (cumulativeValue / totalValue) * 100;
      
      let category: 'A' | 'B' | 'C';
      if (cumulativePercentage <= 80) {
        category = 'A'; // Top 80% of value
      } else if (cumulativePercentage <= 95) {
        category = 'B'; // Next 15% of value
      } else {
        category = 'C'; // Bottom 5% of value
      }
      
      return {
        ...item,
        category,
        cumulativePercentage: Math.round(cumulativePercentage * 100) / 100
      };
    });
  }
}

/**
 * Utility function to create predictive analytics engine
 */
export const createPredictiveEngine = (items: Item[], movements: Movement[], transactions: Transaction[]) => {
  return new PredictiveAnalyticsEngine(items, movements, transactions);
};

/**
 * Generate automated alerts based on predictions
 */
export const generatePredictiveAlerts = (predictions: PredictionResult[]) => {
  const alerts = [];
  
  for (const pred of predictions) {
    // High stockout risk alert
    if (pred.stockoutRisk > 70) {
      alerts.push({
        id: `stockout_risk_${pred.itemId}`,
        type: 'prediction' as const,
        severity: 'high' as const,
        title: 'High Stockout Risk',
        message: `${pred.itemName} has ${pred.stockoutRisk}% stockout risk. Consider reordering ${pred.recommendedOrderQuantity} units.`,
        itemId: pred.itemId,
        actionRequired: true
      });
    }
    
    // Low confidence prediction alert
    if (pred.confidence < 70) {
      alerts.push({
        id: `low_confidence_${pred.itemId}`,
        type: 'prediction' as const,
        severity: 'medium' as const,
        title: 'Low Prediction Confidence',
        message: `Demand prediction for ${pred.itemName} has low confidence (${pred.confidence}%). Consider manual review.`,
        itemId: pred.itemId,
        actionRequired: false
      });
    }
    
    // Immediate reorder needed
    if (pred.currentStock <= pred.recommendedReorderPoint) {
      alerts.push({
        id: `reorder_needed_${pred.itemId}`,
        type: 'prediction' as const,
        severity: 'critical' as const,
        title: 'Reorder Point Reached',
        message: `${pred.itemName} has reached reorder point. Current: ${pred.currentStock}, Reorder at: ${pred.recommendedReorderPoint}`,
        itemId: pred.itemId,
        actionRequired: true
      });
    }
  }
  
  return alerts;
};
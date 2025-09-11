import express, { Request, Response } from 'express';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const TransactionSchema = z.object({
  type: z.enum(['Inbound', 'Outbound']),
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  totalValue: z.number().positive('Total value must be positive'),
  status: z.enum(['Completed', 'Pending', 'Cancelled']).default('Pending'),
  supplier: z.string().optional(),
  customer: z.string().optional(),
  notes: z.string().optional(),
  itemId: z.string().optional(),
  warehouseLocation: z.string().optional()
});

const UpdateTransactionSchema = TransactionSchema.partial();

// In-memory storage (replace with database in production)
let transactions: any[] = [
  {
    id: 'TXN-2025-001',
    type: 'Inbound',
    itemName: 'Industrial Safety Helmets',
    quantity: 100,
    unitPrice: 45.00,
    totalValue: 4500.00,
    date: new Date().toISOString().split('T')[0],
    status: 'Completed',
    supplier: 'SafetyFirst Lebanon',
    notes: 'Bulk order for port operations',
    timestamp: new Date().toISOString()
  },
  {
    id: 'TXN-2025-002',
    type: 'Outbound',
    itemName: 'Container Securing Chains',
    quantity: 25,
    unitPrice: 120.00,
    totalValue: 3000.00,
    date: new Date().toISOString().split('T')[0],
    status: 'Completed',
    customer: 'Beirut Port Authority',
    notes: 'Emergency replacement order',
    timestamp: new Date().toISOString()
  },
  {
    id: 'TXN-2025-003',
    type: 'Inbound',
    itemName: 'Marine LED Signal Lights',
    quantity: 50,
    unitPrice: 75.00,
    totalValue: 3750.00,
    date: new Date().toISOString().split('T')[0],
    status: 'Pending',
    supplier: 'Maritime Electronics Ltd',
    notes: 'Awaiting quality inspection',
    timestamp: new Date().toISOString()
  }
];

// GET /api/transactions - Get all transactions with optional filtering
router.get('/', (req: Request, res: Response) => {
  try {
    const { type, status, search, startDate, endDate, limit, offset } = req.query;
    let filteredTransactions = [...transactions];
    
    // Filter by type
    if (type && type !== 'all') {
      filteredTransactions = filteredTransactions.filter(transaction => transaction.type === type);
    }
    
    // Filter by status
    if (status && status !== 'all') {
      filteredTransactions = filteredTransactions.filter(transaction => transaction.status === status);
    }
    
    // Search filter
    if (search) {
      const searchTerm = search.toString().toLowerCase();
      filteredTransactions = filteredTransactions.filter(transaction => 
        transaction.id.toLowerCase().includes(searchTerm) ||
        transaction.itemName.toLowerCase().includes(searchTerm) ||
        (transaction.supplier && transaction.supplier.toLowerCase().includes(searchTerm)) ||
        (transaction.customer && transaction.customer.toLowerCase().includes(searchTerm))
      );
    }
    
    // Date range filter
    if (startDate) {
      filteredTransactions = filteredTransactions.filter(transaction => 
        new Date(transaction.date) >= new Date(startDate.toString())
      );
    }
    
    if (endDate) {
      filteredTransactions = filteredTransactions.filter(transaction => 
        new Date(transaction.date) <= new Date(endDate.toString())
      );
    }
    
    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Pagination
    const total = filteredTransactions.length;
    const limitNum = limit ? parseInt(limit.toString()) : undefined;
    const offsetNum = offset ? parseInt(offset.toString()) : 0;
    
    if (limitNum) {
      filteredTransactions = filteredTransactions.slice(offsetNum, offsetNum + limitNum);
    }
    
    res.json({
      success: true,
      data: filteredTransactions,
      total,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
});

// GET /api/transactions/:id - Get transaction by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transaction = transactions.find(transaction => transaction.id === id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction'
    });
  }
});

// POST /api/transactions - Create new transaction
router.post('/', (req: Request, res: Response) => {
  try {
    const validation = TransactionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
    }
    
    // Validate total value calculation
    const calculatedTotal = validation.data.quantity * validation.data.unitPrice;
    if (Math.abs(calculatedTotal - validation.data.totalValue) > 0.01) {
      return res.status(400).json({
        success: false,
        error: 'Total value does not match quantity × unit price'
      });
    }
    
    const newTransaction = {
      id: `TXN-${new Date().getFullYear()}-${String(transactions.length + 1).padStart(3, '0')}`,
      ...validation.data,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    };
    
    transactions.unshift(newTransaction);
    
    res.status(201).json({
      success: true,
      data: newTransaction,
      message: 'Transaction created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create transaction'
    });
  }
});

// PUT /api/transactions/:id - Update transaction
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validation = UpdateTransactionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
    }
    
    const transactionIndex = transactions.findIndex(transaction => transaction.id === id);
    if (transactionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    // Validate total value calculation if relevant fields are being updated
    const updatedData = { ...transactions[transactionIndex], ...validation.data };
    if (validation.data.quantity || validation.data.unitPrice || validation.data.totalValue) {
      const calculatedTotal = updatedData.quantity * updatedData.unitPrice;
      if (Math.abs(calculatedTotal - updatedData.totalValue) > 0.01) {
        return res.status(400).json({
          success: false,
          error: 'Total value does not match quantity × unit price'
        });
      }
    }
    
    const updatedTransaction = {
      ...transactions[transactionIndex],
      ...validation.data,
      timestamp: new Date().toISOString()
    };
    
    transactions[transactionIndex] = updatedTransaction;
    
    res.json({
      success: true,
      data: updatedTransaction,
      message: 'Transaction updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update transaction'
    });
  }
});

// PATCH /api/transactions/:id/status - Update transaction status
router.patch('/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['Completed', 'Pending', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }
    
    const transactionIndex = transactions.findIndex(transaction => transaction.id === id);
    if (transactionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    transactions[transactionIndex] = {
      ...transactions[transactionIndex],
      status,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: transactions[transactionIndex],
      message: 'Transaction status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update transaction status'
    });
  }
});

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transactionIndex = transactions.findIndex(transaction => transaction.id === id);
    
    if (transactionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    // Only allow deletion of pending or cancelled transactions
    if (transactions[transactionIndex].status === 'Completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete completed transactions'
      });
    }
    
    const deletedTransaction = transactions.splice(transactionIndex, 1)[0];
    
    res.json({
      success: true,
      data: deletedTransaction,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete transaction'
    });
  }
});

// GET /api/transactions/stats/summary - Get transaction statistics
router.get('/stats/summary', (req: Request, res: Response) => {
  try {
    const { period } = req.query; // 'today', 'week', 'month', 'year'
    
    let filteredTransactions = [...transactions];
    const now = new Date();
    
    // Filter by period
    switch (period) {
      case 'today':
        const today = now.toISOString().split('T')[0];
        filteredTransactions = transactions.filter(t => t.date === today);
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredTransactions = transactions.filter(t => new Date(t.date) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        filteredTransactions = transactions.filter(t => new Date(t.date) >= monthAgo);
        break;
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        filteredTransactions = transactions.filter(t => new Date(t.date) >= yearAgo);
        break;
    }
    
    const totalTransactions = filteredTransactions.length;
    const inboundTransactions = filteredTransactions.filter(t => t.type === 'Inbound');
    const outboundTransactions = filteredTransactions.filter(t => t.type === 'Outbound');
    const completedTransactions = filteredTransactions.filter(t => t.status === 'Completed');
    const pendingTransactions = filteredTransactions.filter(t => t.status === 'Pending');
    const cancelledTransactions = filteredTransactions.filter(t => t.status === 'Cancelled');
    
    const totalInboundValue = inboundTransactions.reduce((sum, t) => sum + t.totalValue, 0);
    const totalOutboundValue = outboundTransactions.reduce((sum, t) => sum + t.totalValue, 0);
    const totalValue = filteredTransactions.reduce((sum, t) => sum + t.totalValue, 0);
    
    const avgTransactionValue = totalTransactions > 0 ? totalValue / totalTransactions : 0;
    
    res.json({
      success: true,
      data: {
        period: period || 'all',
        totalTransactions,
        inboundCount: inboundTransactions.length,
        outboundCount: outboundTransactions.length,
        completedCount: completedTransactions.length,
        pendingCount: pendingTransactions.length,
        cancelledCount: cancelledTransactions.length,
        totalValue,
        totalInboundValue,
        totalOutboundValue,
        avgTransactionValue,
        netValue: totalInboundValue - totalOutboundValue
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction statistics'
    });
  }
});

// GET /api/transactions/stats/daily - Get daily transaction statistics
router.get('/stats/daily', (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days.toString());
    
    const dailyStats: { [key: string]: any } = {};
    
    // Initialize last N days
    for (let i = 0; i < daysNum; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = {
        date: dateStr,
        inbound: 0,
        outbound: 0,
        inboundValue: 0,
        outboundValue: 0,
        total: 0,
        totalValue: 0
      };
    }
    
    // Aggregate transaction data
    transactions.forEach(transaction => {
      if (dailyStats[transaction.date]) {
        const stats = dailyStats[transaction.date];
        if (transaction.type === 'Inbound') {
          stats.inbound++;
          stats.inboundValue += transaction.totalValue;
        } else {
          stats.outbound++;
          stats.outboundValue += transaction.totalValue;
        }
        stats.total++;
        stats.totalValue += transaction.totalValue;
      }
    });
    
    const result = Object.values(dailyStats).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch daily transaction statistics'
    });
  }
});

export default router;
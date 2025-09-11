import express, { Request, Response } from 'express';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const ReceiptItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.string().min(1, 'Unit price is required'),
  total: z.string().min(1, 'Total is required')
});

const ReceiptSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name is required'),
  type: z.enum(['Inbound', 'Outbound']),
  status: z.enum(['Pending', 'Received', 'Rejected']).default('Pending'),
  totalAmount: z.string().min(1, 'Total amount is required'),
  poNumber: z.string().min(1, 'PO number is required'),
  items: z.array(ReceiptItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  expectedDate: z.string().optional(),
  receivedDate: z.string().optional()
});

const UpdateReceiptSchema = ReceiptSchema.partial();

// In-memory storage (replace with database in production)
let receipts: any[] = [
  {
    id: 'RCP-2025-124',
    supplierName: 'SafetyFirst Lebanon',
    type: 'Inbound',
    date: new Date().toISOString().split('T')[0],
    status: 'Received',
    totalAmount: '$4,500.00',
    poNumber: 'PO-4821',
    items: [
      { name: 'Industrial Safety Helmets', quantity: 100, unitPrice: '$45.00', total: '$4,500.00' }
    ],
    notes: 'Quality inspection completed successfully.',
    timestamp: new Date().toISOString(),
    receivedDate: new Date().toISOString().split('T')[0]
  },
  {
    id: 'RCP-2025-125',
    supplierName: 'Maritime Electronics Ltd',
    type: 'Inbound',
    date: new Date().toISOString().split('T')[0],
    status: 'Pending',
    totalAmount: '$3,750.00',
    poNumber: 'PO-4822',
    items: [
      { name: 'Marine LED Signal Lights', quantity: 50, unitPrice: '$75.00', total: '$3,750.00' }
    ],
    notes: 'Pending final inspection before confirmation.',
    timestamp: new Date().toISOString(),
    expectedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },
  {
    id: 'RCP-2025-126',
    supplierName: 'FilterTech Inc',
    type: 'Inbound',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Received',
    totalAmount: '$3,890.00',
    poNumber: 'PO-4823',
    items: [
      { name: 'Hydraulic Oil Filters', quantity: 200, unitPrice: '$15.50', total: '$3,100.00' },
      { name: 'Air Filters', quantity: 50, unitPrice: '$15.80', total: '$790.00' }
    ],
    notes: 'Items received and stored in maintenance section.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    receivedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }
];

// GET /api/receipts - Get all receipts with optional filtering
router.get('/', (req: Request, res: Response) => {
  try {
    const { type, status, search, startDate, endDate, limit, offset } = req.query;
    let filteredReceipts = [...receipts];
    
    // Filter by type
    if (type && type !== 'all') {
      filteredReceipts = filteredReceipts.filter(receipt => receipt.type === type);
    }
    
    // Filter by status
    if (status && status !== 'all') {
      filteredReceipts = filteredReceipts.filter(receipt => receipt.status === status);
    }
    
    // Search filter
    if (search) {
      const searchTerm = search.toString().toLowerCase();
      filteredReceipts = filteredReceipts.filter(receipt => 
        receipt.id.toLowerCase().includes(searchTerm) ||
        receipt.supplierName.toLowerCase().includes(searchTerm) ||
        receipt.poNumber.toLowerCase().includes(searchTerm) ||
        receipt.items.some((item: any) => item.name.toLowerCase().includes(searchTerm))
      );
    }
    
    // Date range filter
    if (startDate) {
      filteredReceipts = filteredReceipts.filter(receipt => 
        new Date(receipt.date) >= new Date(startDate.toString())
      );
    }
    
    if (endDate) {
      filteredReceipts = filteredReceipts.filter(receipt => 
        new Date(receipt.date) <= new Date(endDate.toString())
      );
    }
    
    // Sort by date (newest first)
    filteredReceipts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Pagination
    const total = filteredReceipts.length;
    const limitNum = limit ? parseInt(limit.toString()) : undefined;
    const offsetNum = offset ? parseInt(offset.toString()) : 0;
    
    if (limitNum) {
      filteredReceipts = filteredReceipts.slice(offsetNum, offsetNum + limitNum);
    }
    
    res.json({
      success: true,
      data: filteredReceipts,
      total,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipts'
    });
  }
});

// GET /api/receipts/:id - Get receipt by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const receipt = receipts.find(receipt => receipt.id === id);
    
    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }
    
    res.json({
      success: true,
      data: receipt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipt'
    });
  }
});

// POST /api/receipts - Create new receipt
router.post('/', (req: Request, res: Response) => {
  try {
    const validation = ReceiptSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
    }
    
    // Check for duplicate PO number
    const existingReceipt = receipts.find(receipt => receipt.poNumber === validation.data.poNumber);
    if (existingReceipt) {
      return res.status(409).json({
        success: false,
        error: 'Receipt with this PO number already exists'
      });
    }
    
    const newReceipt = {
      id: `RCP-${new Date().getFullYear()}-${String(receipts.length + 124).padStart(3, '0')}`,
      ...validation.data,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    };
    
    receipts.unshift(newReceipt);
    
    res.status(201).json({
      success: true,
      data: newReceipt,
      message: 'Receipt created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create receipt'
    });
  }
});

// PUT /api/receipts/:id - Update receipt
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validation = UpdateReceiptSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
    }
    
    const receiptIndex = receipts.findIndex(receipt => receipt.id === id);
    if (receiptIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }
    
    // Check for duplicate PO number if PO number is being updated
    if (validation.data.poNumber) {
      const existingReceipt = receipts.find(receipt => 
        receipt.poNumber === validation.data.poNumber && receipt.id !== id
      );
      if (existingReceipt) {
        return res.status(409).json({
          success: false,
          error: 'Receipt with this PO number already exists'
        });
      }
    }
    
    const updatedReceipt = {
      ...receipts[receiptIndex],
      ...validation.data,
      timestamp: new Date().toISOString()
    };
    
    receipts[receiptIndex] = updatedReceipt;
    
    res.json({
      success: true,
      data: updatedReceipt,
      message: 'Receipt updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update receipt'
    });
  }
});

// PATCH /api/receipts/:id/status - Update receipt status
router.patch('/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!['Pending', 'Received', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }
    
    const receiptIndex = receipts.findIndex(receipt => receipt.id === id);
    if (receiptIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }
    
    const updateData: any = {
      status,
      timestamp: new Date().toISOString()
    };
    
    // Add received date if status is being set to 'Received'
    if (status === 'Received') {
      updateData.receivedDate = new Date().toISOString().split('T')[0];
    }
    
    // Update notes if provided
    if (notes) {
      updateData.notes = notes;
    }
    
    receipts[receiptIndex] = {
      ...receipts[receiptIndex],
      ...updateData
    };
    
    res.json({
      success: true,
      data: receipts[receiptIndex],
      message: 'Receipt status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update receipt status'
    });
  }
});

// DELETE /api/receipts/:id - Delete receipt
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const receiptIndex = receipts.findIndex(receipt => receipt.id === id);
    
    if (receiptIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }
    
    // Only allow deletion of pending or rejected receipts
    if (receipts[receiptIndex].status === 'Received') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete received receipts'
      });
    }
    
    const deletedReceipt = receipts.splice(receiptIndex, 1)[0];
    
    res.json({
      success: true,
      data: deletedReceipt,
      message: 'Receipt deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete receipt'
    });
  }
});

// GET /api/receipts/stats/summary - Get receipt statistics
router.get('/stats/summary', (req: Request, res: Response) => {
  try {
    const { period } = req.query; // 'today', 'week', 'month', 'year'
    
    let filteredReceipts = [...receipts];
    const now = new Date();
    
    // Filter by period
    switch (period) {
      case 'today':
        const today = now.toISOString().split('T')[0];
        filteredReceipts = receipts.filter(r => r.date === today);
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredReceipts = receipts.filter(r => new Date(r.date) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        filteredReceipts = receipts.filter(r => new Date(r.date) >= monthAgo);
        break;
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        filteredReceipts = receipts.filter(r => new Date(r.date) >= yearAgo);
        break;
    }
    
    const totalReceipts = filteredReceipts.length;
    const inboundReceipts = filteredReceipts.filter(r => r.type === 'Inbound');
    const outboundReceipts = filteredReceipts.filter(r => r.type === 'Outbound');
    const pendingReceipts = filteredReceipts.filter(r => r.status === 'Pending');
    const receivedReceipts = filteredReceipts.filter(r => r.status === 'Received');
    const rejectedReceipts = filteredReceipts.filter(r => r.status === 'Rejected');
    
    // Calculate total values (remove currency symbols and parse)
    const parseAmount = (amount: string) => {
      return parseFloat(amount.replace(/[$,]/g, ''));
    };
    
    const totalValue = filteredReceipts.reduce((sum, r) => sum + parseAmount(r.totalAmount), 0);
    const inboundValue = inboundReceipts.reduce((sum, r) => sum + parseAmount(r.totalAmount), 0);
    const outboundValue = outboundReceipts.reduce((sum, r) => sum + parseAmount(r.totalAmount), 0);
    const pendingValue = pendingReceipts.reduce((sum, r) => sum + parseAmount(r.totalAmount), 0);
    
    const avgReceiptValue = totalReceipts > 0 ? totalValue / totalReceipts : 0;
    
    // Get top suppliers
    const supplierStats: { [key: string]: { count: number; value: number } } = {};
    filteredReceipts.forEach(receipt => {
      if (!supplierStats[receipt.supplierName]) {
        supplierStats[receipt.supplierName] = { count: 0, value: 0 };
      }
      supplierStats[receipt.supplierName].count++;
      supplierStats[receipt.supplierName].value += parseAmount(receipt.totalAmount);
    });
    
    const topSuppliers = Object.entries(supplierStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    res.json({
      success: true,
      data: {
        period: period || 'all',
        totalReceipts,
        inboundCount: inboundReceipts.length,
        outboundCount: outboundReceipts.length,
        pendingCount: pendingReceipts.length,
        receivedCount: receivedReceipts.length,
        rejectedCount: rejectedReceipts.length,
        totalValue,
        inboundValue,
        outboundValue,
        pendingValue,
        avgReceiptValue,
        topSuppliers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipt statistics'
    });
  }
});

// GET /api/receipts/overdue - Get overdue receipts
router.get('/overdue', (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const overdueReceipts = receipts.filter(receipt => 
      receipt.status === 'Pending' && 
      receipt.expectedDate && 
      receipt.expectedDate < today
    );
    
    res.json({
      success: true,
      data: overdueReceipts,
      total: overdueReceipts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overdue receipts'
    });
  }
});

export default router;
import express, { Request, Response } from 'express';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const ItemSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
  location: z.string().min(1, 'Location is required'),
  category: z.string().min(1, 'Category is required'),
  minStock: z.number().int().min(0, 'Minimum stock must be non-negative'),
  barcode: z.string().optional(),
  supplier: z.string().optional()
});

const UpdateItemSchema = ItemSchema.partial();

// In-memory storage (replace with database in production)
let items: any[] = [
  {
    id: '1',
    sku: 'SFT-001',
    name: 'Industrial Safety Helmets',
    title: 'Heavy-Duty Safety Helmet - ANSI Certified',
    description: 'Professional-grade safety helmets designed for Lebanese port workers and industrial operations.',
    price: 45.00,
    quantity: 250,
    location: 'BRT-A-01-05',
    category: 'Safety Equipment',
    minStock: 50,
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2',
    sku: 'CNT-002',
    name: 'Container Securing Chains',
    title: 'Heavy-Duty Container Chain Set - Marine Grade',
    description: 'High-strength marine-grade chains specifically designed for securing containers in Lebanese ports.',
    price: 120.00,
    quantity: 75,
    location: 'BRT-B-02-08',
    category: 'Container Equipment',
    minStock: 15,
    lastUpdated: new Date().toISOString()
  }
];

// GET /api/items - Get all items with optional filtering
router.get('/', (req: Request, res: Response) => {
  try {
    const { category, search, lowStock } = req.query;
    let filteredItems = [...items];
    
    // Filter by category
    if (category && category !== 'All') {
      filteredItems = filteredItems.filter(item => item.category === category);
    }
    
    // Search filter
    if (search) {
      const searchTerm = search.toString().toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.sku.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Low stock filter
    if (lowStock === 'true') {
      filteredItems = filteredItems.filter(item => item.quantity <= item.minStock);
    }
    
    res.json({
      success: true,
      data: filteredItems,
      total: filteredItems.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch items'
    });
  }
});

// GET /api/items/:id - Get item by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = items.find(item => item.id === id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch item'
    });
  }
});

// POST /api/items - Create new item
router.post('/', (req: Request, res: Response) => {
  try {
    const validation = ItemSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
    }
    
    // Check for duplicate SKU
    const existingItem = items.find(item => item.sku === validation.data.sku);
    if (existingItem) {
      return res.status(409).json({
        success: false,
        error: 'Item with this SKU already exists'
      });
    }
    
    const newItem = {
      id: `ITEM-${Date.now()}`,
      ...validation.data,
      lastUpdated: new Date().toISOString()
    };
    
    items.push(newItem);
    
    res.status(201).json({
      success: true,
      data: newItem,
      message: 'Item created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create item'
    });
  }
});

// PUT /api/items/:id - Update item
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validation = UpdateItemSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
    }
    
    const itemIndex = items.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }
    
    // Check for duplicate SKU if SKU is being updated
    if (validation.data.sku) {
      const existingItem = items.find(item => item.sku === validation.data.sku && item.id !== id);
      if (existingItem) {
        return res.status(409).json({
          success: false,
          error: 'Item with this SKU already exists'
        });
      }
    }
    
    const updatedItem = {
      ...items[itemIndex],
      ...validation.data,
      lastUpdated: new Date().toISOString()
    };
    
    items[itemIndex] = updatedItem;
    
    res.json({
      success: true,
      data: updatedItem,
      message: 'Item updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update item'
    });
  }
});

// PATCH /api/items/:id/quantity - Update item quantity
router.patch('/:id/quantity', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body;
    
    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quantity value'
      });
    }
    
    const itemIndex = items.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }
    
    let newQuantity: number;
    
    switch (operation) {
      case 'add':
        newQuantity = items[itemIndex].quantity + quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, items[itemIndex].quantity - quantity);
        break;
      case 'set':
      default:
        newQuantity = quantity;
        break;
    }
    
    items[itemIndex] = {
      ...items[itemIndex],
      quantity: newQuantity,
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: items[itemIndex],
      message: 'Item quantity updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update item quantity'
    });
  }
});

// DELETE /api/items/:id - Delete item
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const itemIndex = items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }
    
    const deletedItem = items.splice(itemIndex, 1)[0];
    
    res.json({
      success: true,
      data: deletedItem,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete item'
    });
  }
});

// GET /api/items/stats/summary - Get inventory statistics
router.get('/stats/summary', (req: Request, res: Response) => {
  try {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const lowStockItems = items.filter(item => item.quantity <= item.minStock);
    const outOfStockItems = items.filter(item => item.quantity === 0);
    const categories = [...new Set(items.map(item => item.category))];
    
    res.json({
      success: true,
      data: {
        totalItems,
        totalValue,
        totalProducts: items.length,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        categoriesCount: categories.length,
        categories
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory statistics'
    });
  }
});

export default router;
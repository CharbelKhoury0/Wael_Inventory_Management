import express, { Request, Response } from 'express';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const TruckInfoSchema = z.object({
  plateNumber: z.string().min(1, 'Plate number is required'),
  trailerInfo: z.string().optional(),
  capacity: z.string().optional()
});

const ContainerInfoSchema = z.object({
  containerId: z.string().min(1, 'Container ID is required'),
  sealNumber: z.string().optional(),
  size: z.string().optional(),
  type: z.string().optional()
});

const ProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  type: z.string().min(1, 'Product type is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  condition: z.enum(['Good', 'Damaged', 'Excellent']),
  value: z.number().optional(),
  description: z.string().optional(),
  barcode: z.string().optional()
});

const MovementSchema = z.object({
  type: z.enum(['Arrival', 'Departure']),
  transportType: z.enum(['Container', 'Truck']),
  truckPlate: z.string().optional(),
  containerId: z.string().optional(),
  truckInfo: TruckInfoSchema.optional(),
  containerInfo: ContainerInfoSchema.optional(),
  driverName: z.string().min(1, 'Driver name is required'),
  driverPhone: z.string().optional(),
  driverEmail: z.string().email().optional().or(z.literal('')),
  status: z.enum(['Completed', 'In Progress', 'Pending']).default('In Progress'),
  notes: z.string().optional(),
  products: z.array(ProductSchema).optional(),
  origin: z.string().optional(),
  destination: z.string().optional()
}).refine((data) => {
  // Validate transport type specific requirements
  if (data.transportType === 'Container') {
    return data.containerInfo && data.containerInfo.containerId;
  }
  if (data.transportType === 'Truck') {
    return data.truckInfo && data.truckInfo.plateNumber;
  }
  return true;
}, {
  message: 'Transport type specific information is required'
});

const UpdateMovementSchema = MovementSchema.partial();

// In-memory storage (replace with database in production)
let movements: any[] = [
  {
    id: 'MOV-001',
    type: 'Arrival',
    transportType: 'Container',
    truckPlate: 'LB-123-456',
    containerId: 'CONT-001',
    containerInfo: {
      containerId: 'CONT-001',
      sealNumber: 'SEAL-12345',
      size: '40ft',
      type: 'Standard'
    },
    driverName: 'Ahmad Khalil',
    driverPhone: '+961-70-123456',
    driverEmail: 'ahmad.khalil@transport.lb',
    timestamp: new Date().toLocaleString(),
    status: 'Completed',
    origin: 'Beirut Port',
    destination: 'Warehouse A',
    notes: 'Cargo inspection completed',
    isLocked: true,
    arrivalTime: new Date().toLocaleString()
  },
  {
    id: 'MOV-002',
    type: 'Departure',
    transportType: 'Truck',
    truckPlate: 'LB-789-012',
    truckInfo: {
      plateNumber: 'LB-789-012',
      trailerInfo: 'Semi-trailer',
      capacity: '25 tons'
    },
    driverName: 'Fatima Mansour',
    driverPhone: '+961-71-789012',
    timestamp: new Date().toLocaleString(),
    status: 'Completed',
    origin: 'Warehouse B',
    destination: 'Tripoli Port',
    isLocked: false,
    departureTime: new Date().toLocaleString()
  }
];

let containerContents: any[] = [
  {
    containerId: 'CONT-001',
    products: [
      {
        id: 'PROD-001',
        name: 'Electronics Components',
        type: 'Electronics',
        quantity: 50,
        unit: 'boxes',
        condition: 'Good',
        value: 25000,
        description: 'Various electronic components for manufacturing'
      }
    ],
    isLocked: true,
    lastUpdated: new Date().toLocaleString(),
    totalValue: 25000,
    totalItems: 50
  }
];

// GET /api/movements - Get all movements with optional filtering
router.get('/', (req: Request, res: Response) => {
  try {
    const { type, transportType, status, search } = req.query;
    let filteredMovements = [...movements];
    
    // Filter by type
    if (type && type !== 'all') {
      filteredMovements = filteredMovements.filter(movement => movement.type === type);
    }
    
    // Filter by transport type
    if (transportType && transportType !== 'all') {
      filteredMovements = filteredMovements.filter(movement => movement.transportType === transportType);
    }
    
    // Filter by status
    if (status && status !== 'all') {
      filteredMovements = filteredMovements.filter(movement => movement.status === status);
    }
    
    // Search filter
    if (search) {
      const searchTerm = search.toString().toLowerCase();
      filteredMovements = filteredMovements.filter(movement => 
        movement.id.toLowerCase().includes(searchTerm) ||
        movement.driverName.toLowerCase().includes(searchTerm) ||
        (movement.truckPlate && movement.truckPlate.toLowerCase().includes(searchTerm)) ||
        (movement.containerId && movement.containerId.toLowerCase().includes(searchTerm))
      );
    }
    
    res.json({
      success: true,
      data: filteredMovements,
      total: filteredMovements.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movements'
    });
  }
});

// GET /api/movements/:id - Get movement by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const movement = movements.find(movement => movement.id === id);
    
    if (!movement) {
      return res.status(404).json({
        success: false,
        error: 'Movement not found'
      });
    }
    
    res.json({
      success: true,
      data: movement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movement'
    });
  }
});

// POST /api/movements - Create new movement
router.post('/', (req: Request, res: Response) => {
  try {
    const validation = MovementSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
    }
    
    // Check for duplicate container if it's a container movement
    if (validation.data.transportType === 'Container' && validation.data.containerInfo?.containerId) {
      const existingMovement = movements.find(m => 
        m.containerId === validation.data.containerInfo?.containerId && 
        m.status !== 'Completed'
      );
      if (existingMovement) {
        return res.status(409).json({
          success: false,
          error: 'A container with this ID is already active'
        });
      }
    }
    
    const newMovement = {
      id: `MOV-${Date.now().toString().slice(-6)}`,
      ...validation.data,
      timestamp: new Date().toLocaleString(),
      isLocked: false,
      arrivalTime: validation.data.type === 'Arrival' ? new Date().toLocaleString() : undefined,
      departureTime: validation.data.type === 'Departure' ? new Date().toLocaleString() : undefined
    };
    
    movements.unshift(newMovement);
    
    // Initialize container contents if it's a container arrival
    if (newMovement.type === 'Arrival' && newMovement.transportType === 'Container' && newMovement.containerId) {
      const existingContainer = containerContents.find(cc => cc.containerId === newMovement.containerId);
      if (!existingContainer) {
        const newContainer = {
          containerId: newMovement.containerId,
          products: [],
          isLocked: false,
          lastUpdated: new Date().toLocaleString(),
          totalValue: 0,
          totalItems: 0
        };
        containerContents.push(newContainer);
      }
    }
    
    res.status(201).json({
      success: true,
      data: newMovement,
      message: 'Movement created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create movement'
    });
  }
});

// PUT /api/movements/:id - Update movement
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validation = UpdateMovementSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
    }
    
    const movementIndex = movements.findIndex(movement => movement.id === id);
    if (movementIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Movement not found'
      });
    }
    
    const updatedMovement = {
      ...movements[movementIndex],
      ...validation.data,
      timestamp: new Date().toLocaleString()
    };
    
    movements[movementIndex] = updatedMovement;
    
    res.json({
      success: true,
      data: updatedMovement,
      message: 'Movement updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update movement'
    });
  }
});

// DELETE /api/movements/:id - Delete movement
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const movementIndex = movements.findIndex(movement => movement.id === id);
    
    if (movementIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Movement not found'
      });
    }
    
    const deletedMovement = movements.splice(movementIndex, 1)[0];
    
    res.json({
      success: true,
      data: deletedMovement,
      message: 'Movement deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete movement'
    });
  }
});

// GET /api/movements/containers/:containerId - Get container contents
router.get('/containers/:containerId', (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;
    const container = containerContents.find(cc => cc.containerId === containerId);
    
    if (!container) {
      return res.status(404).json({
        success: false,
        error: 'Container not found'
      });
    }
    
    res.json({
      success: true,
      data: container
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch container contents'
    });
  }
});

// POST /api/movements/containers/:containerId/products - Add product to container
router.post('/containers/:containerId/products', (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;
    const validation = ProductSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
    }
    
    const containerIndex = containerContents.findIndex(cc => cc.containerId === containerId);
    if (containerIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Container not found'
      });
    }
    
    const newProduct = {
      id: `PROD-${Date.now().toString().slice(-6)}`,
      ...validation.data
    };
    
    containerContents[containerIndex].products.push(newProduct);
    
    // Update totals
    const container = containerContents[containerIndex];
    container.totalItems = container.products.reduce((sum: number, p: any) => sum + p.quantity, 0);
    container.totalValue = container.products.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
    container.lastUpdated = new Date().toLocaleString();
    
    res.status(201).json({
      success: true,
      data: newProduct,
      message: 'Product added to container successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add product to container'
    });
  }
});

// PATCH /api/movements/containers/:containerId/lock - Toggle container lock
router.patch('/containers/:containerId/lock', (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;
    const containerIndex = containerContents.findIndex(cc => cc.containerId === containerId);
    
    if (containerIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Container not found'
      });
    }
    
    containerContents[containerIndex].isLocked = !containerContents[containerIndex].isLocked;
    containerContents[containerIndex].lastUpdated = new Date().toLocaleString();
    
    // Update related movements
    movements.forEach(movement => {
      if (movement.containerId === containerId) {
        movement.isLocked = containerContents[containerIndex].isLocked;
      }
    });
    
    res.json({
      success: true,
      data: containerContents[containerIndex],
      message: `Container ${containerContents[containerIndex].isLocked ? 'locked' : 'unlocked'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to toggle container lock'
    });
  }
});

// GET /api/movements/stats/summary - Get movement statistics
router.get('/stats/summary', (req: Request, res: Response) => {
  try {
    const totalMovements = movements.length;
    const arrivals = movements.filter(m => m.type === 'Arrival').length;
    const departures = movements.filter(m => m.type === 'Departure').length;
    const containerMovements = movements.filter(m => m.transportType === 'Container').length;
    const truckMovements = movements.filter(m => m.transportType === 'Truck').length;
    const pendingMovements = movements.filter(m => m.status === 'Pending').length;
    const inProgressMovements = movements.filter(m => m.status === 'In Progress').length;
    const completedMovements = movements.filter(m => m.status === 'Completed').length;
    
    res.json({
      success: true,
      data: {
        totalMovements,
        arrivals,
        departures,
        containerMovements,
        truckMovements,
        pendingMovements,
        inProgressMovements,
        completedMovements,
        totalContainers: containerContents.length,
        lockedContainers: containerContents.filter(cc => cc.isLocked).length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movement statistics'
    });
  }
});

export default router;
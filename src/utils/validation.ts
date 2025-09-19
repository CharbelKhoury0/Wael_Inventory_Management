// Input Validation and Sanitization Utilities
import { z } from 'zod';
import DOMPurify from 'dompurify';

// Validation Schemas
export const ItemSchema = z.object({
  sku: z.string()
    .min(3, 'SKU must be at least 3 characters')
    .max(20, 'SKU must not exceed 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'SKU can only contain uppercase letters, numbers, and hyphens'),
  
  name: z.string()
    .min(1, 'Item name is required')
    .max(100, 'Item name must not exceed 100 characters'),
  
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  
  quantity: z.number()
    .int('Quantity must be a whole number')
    .min(0, 'Quantity cannot be negative'),
  
  price: z.number()
    .min(0, 'Price cannot be negative')
    .max(999999.99, 'Price is too high'),
  
  location: z.string()
    .min(1, 'Location is required')
    .max(50, 'Location must not exceed 50 characters'),
  
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category must not exceed 50 characters'),
  
  minStock: z.number()
    .int('Minimum stock must be a whole number')
    .min(0, 'Minimum stock cannot be negative'),
  
  supplier: z.string()
    .max(100, 'Supplier name must not exceed 100 characters')
    .optional(),
  
  barcode: z.string()
    .regex(/^[0-9]{8,13}$/, 'Barcode must be 8-13 digits')
    .optional(),
});

export const TransactionSchema = z.object({
  type: z.enum(['Inbound', 'Outbound', 'Adjustment']),
  itemId: z.string().uuid('Invalid item ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  reference: z.string().min(1, 'Reference is required').max(50),
  notes: z.string().max(500).optional(),
});

export const MovementSchema = z.object({
  type: z.enum(['Arrival', 'Departure']),
  transportType: z.enum(['Container', 'Truck']),
  driverName: z.string().min(1, 'Driver name is required').max(100),
  driverPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  truckPlate: z.string().min(1, 'Truck plate is required').max(20),
  containerId: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
});

export const ReceiptSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name is required').max(100),
  type: z.enum(['Inbound', 'Outbound']),
  poNumber: z.string().max(50).optional(),
  items: z.array(z.object({
    name: z.string().min(1).max(100),
    quantity: z.number().int().min(1),
    unitPrice: z.string().regex(/^\d+(\.\d{2})?$/, 'Invalid price format'),
    total: z.string().regex(/^\d+(\.\d{2})?$/, 'Invalid total format'),
  })).min(1, 'At least one item is required'),
  notes: z.string().max(500).optional(),
});

// Sanitization Functions
export class SanitizationService {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHTML(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [],
    });
  }

  /**
   * Sanitize and normalize text input
   */
  static sanitizeText(input: string): string {
    return this.sanitizeHTML(input.trim());
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(input: string | number): number {
    const num = typeof input === 'string' ? parseFloat(input) : input;
    return isNaN(num) ? 0 : num;
  }

  /**
   * Sanitize object recursively
   */
  static sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = {} as T;
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key as keyof T] = this.sanitizeText(value) as T[keyof T];
      } else if (typeof value === 'number') {
        sanitized[key as keyof T] = value as T[keyof T];
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key as keyof T] = this.sanitizeObject(value) as T[keyof T];
      } else if (Array.isArray(value)) {
        sanitized[key as keyof T] = value.map(item => 
          typeof item === 'object' ? this.sanitizeObject(item) : this.sanitizeText(String(item))
        ) as T[keyof T];
      } else {
        sanitized[key as keyof T] = value;
      }
    }
    
    return sanitized;
  }
}

// Validation Hook
export const useFormValidation = <T>(schema: z.ZodSchema<T>) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  const validate = useCallback((data: unknown): data is T => {
    try {
      schema.parse(data);
      setErrors({});
      setIsValid(true);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        setIsValid(false);
      }
      return false;
    }
  }, [schema]);

  const validateField = useCallback((field: string, value: any): boolean => {
    try {
      const fieldSchema = schema.shape[field as keyof typeof schema.shape];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setErrors(prev => ({ ...prev, [field]: '' }));
        return true;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0]?.message || 'Invalid value' }));
      }
    }
    return false;
  }, [schema]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setIsValid(false);
  }, []);

  return {
    validate,
    validateField,
    clearErrors,
    errors,
    isValid,
    hasErrors: Object.keys(errors).length > 0,
  };
};

// Rate Limiting Utility
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isAllowed(
    identifier: string,
    maxAttempts: number = 100,
    windowMs: number = 60000
  ): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const userAttempts = this.attempts.get(identifier) || [];
    const recentAttempts = userAttempts.filter(time => time > windowStart);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    
    // Cleanup old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      this.cleanup();
    }
    
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    const oneHourAgo = now - 3600000; // 1 hour
    
    for (const [identifier, attempts] of this.attempts.entries()) {
      const recentAttempts = attempts.filter(time => time > oneHourAgo);
      if (recentAttempts.length === 0) {
        this.attempts.delete(identifier);
      } else {
        this.attempts.set(identifier, recentAttempts);
      }
    }
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Export validation utilities
export const validateItem = (data: unknown) => ItemSchema.safeParse(data);
export const validateTransaction = (data: unknown) => TransactionSchema.safeParse(data);
export const validateMovement = (data: unknown) => MovementSchema.safeParse(data);
export const validateReceipt = (data: unknown) => ReceiptSchema.safeParse(data);

// Global rate limiter instance
export const rateLimiter = new RateLimiter();
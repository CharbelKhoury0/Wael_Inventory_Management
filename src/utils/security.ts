// Security Utilities and Authentication
import { jwtDecode } from 'jwt-decode';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'clerk' | 'viewer';
  permissions: Permission[];
  warehouseAccess: string[];
  lastLogin?: string;
  isActive: boolean;
}

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Authentication Service
export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private tokens: AuthTokens | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.loadFromStorage();
    this.setupTokenRefresh();
  }

  private loadFromStorage(): void {
    try {
      const storedTokens = localStorage.getItem('auth_tokens');
      const storedUser = localStorage.getItem('current_user');
      
      if (storedTokens && storedUser) {
        this.tokens = JSON.parse(storedTokens);
        this.currentUser = JSON.parse(storedUser);
        
        // Check if tokens are still valid
        if (this.tokens && this.tokens.expiresAt < Date.now()) {
          this.clearAuth();
        }
      }
    } catch (error) {
      console.error('Failed to load auth from storage:', error);
      this.clearAuth();
    }
  }

  private saveToStorage(): void {
    if (this.tokens && this.currentUser) {
      localStorage.setItem('auth_tokens', JSON.stringify(this.tokens));
      localStorage.setItem('current_user', JSON.stringify(this.currentUser));
    }
  }

  private clearAuth(): void {
    this.currentUser = null;
    this.tokens = null;
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('current_user');
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private setupTokenRefresh(): void {
    if (this.tokens) {
      const timeUntilExpiry = this.tokens.expiresAt - Date.now();
      const refreshTime = Math.max(timeUntilExpiry - 300000, 60000); // Refresh 5 min before expiry, min 1 min
      
      this.refreshTimer = setTimeout(() => {
        this.refreshTokens();
      }, refreshTime);
    }
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      
      this.tokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + (data.expiresIn * 1000),
      };
      
      this.currentUser = data.user;
      this.saveToStorage();
      this.setupTokenRefresh();
      
      return this.currentUser;
    } catch (error) {
      this.clearAuth();
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.tokens) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: this.tokens.refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.clearAuth();
    }
  }

  async refreshTokens(): Promise<boolean> {
    if (!this.tokens?.refreshToken) {
      this.clearAuth();
      return false;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.tokens.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      this.tokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + (data.expiresIn * 1000),
      };
      
      this.saveToStorage();
      this.setupTokenRefresh();
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuth();
      return false;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getAccessToken(): string | null {
    return this.tokens?.accessToken || null;
  }

  isAuthenticated(): boolean {
    return !!(this.currentUser && this.tokens && this.tokens.expiresAt > Date.now());
  }

  hasPermission(resource: string, action: string): boolean {
    if (!this.currentUser) return false;
    
    // Admin has all permissions
    if (this.currentUser.role === 'admin') return true;
    
    return this.currentUser.permissions.some(permission => 
      permission.resource === resource && permission.actions.includes(action as any)
    );
  }

  hasWarehouseAccess(warehouseId: string): boolean {
    if (!this.currentUser) return false;
    
    // Admin has access to all warehouses
    if (this.currentUser.role === 'admin') return true;
    
    return this.currentUser.warehouseAccess.includes(warehouseId);
  }
}

// Permission checking hook
export const usePermissions = () => {
  const authService = AuthService.getInstance();
  
  const hasPermission = useCallback((resource: string, action: string): boolean => {
    return authService.hasPermission(resource, action);
  }, [authService]);
  
  const hasWarehouseAccess = useCallback((warehouseId: string): boolean => {
    return authService.hasWarehouseAccess(warehouseId);
  }, [authService]);
  
  const requirePermission = useCallback((resource: string, action: string): void => {
    if (!hasPermission(resource, action)) {
      throw new Error(`Insufficient permissions: ${resource}:${action}`);
    }
  }, [hasPermission]);
  
  return { hasPermission, hasWarehouseAccess, requirePermission };
};

// CSRF Protection
export class CSRFService {
  private static token: string | null = null;
  
  static async getToken(): Promise<string> {
    if (!this.token) {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      this.token = data.token;
    }
    return this.token;
  }
  
  static async addToRequest(options: RequestInit = {}): Promise<RequestInit> {
    const token = await this.getToken();
    return {
      ...options,
      headers: {
        ...options.headers,
        'X-CSRF-Token': token,
      },
    };
  }
}

// Input sanitization for security
export class SecurityUtils {
  // Prevent XSS attacks
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  // Validate file uploads
  static validateFileUpload(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File type not allowed' };
    }
    
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size exceeds 10MB limit' };
    }
    
    // Check for malicious file names
    const dangerousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.pif$/i,
      /\.com$/i,
      /\.jar$/i,
      /\.js$/i,
      /\.vbs$/i,
      /\.php$/i,
    ];
    
    if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
      return { isValid: false, error: 'Potentially dangerous file type' };
    }
    
    return { isValid: true };
  }

  // Generate secure random strings
  static generateSecureId(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Hash sensitive data
  static async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Validate JWT token structure (client-side validation only)
  static validateJWTStructure(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Decode header and payload to check structure
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      
      return !!(header.alg && header.typ && payload.exp && payload.iat);
    } catch {
      return false;
    }
  }
}

// Audit logging service
export class AuditService {
  static async logAction(action: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AuthService.getInstance().getAccessToken()}`,
        },
        body: JSON.stringify({
          ...action,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  }
}

// Security monitoring hook
export const useSecurityMonitoring = () => {
  const authService = AuthService.getInstance();
  
  useEffect(() => {
    // Monitor for suspicious activity
    const checkSecurity = () => {
      // Check for multiple failed login attempts
      const failedAttempts = parseInt(localStorage.getItem('failed_login_attempts') || '0');
      if (failedAttempts > 5) {
        console.warn('Multiple failed login attempts detected');
        // Could trigger additional security measures
      }
      
      // Check for token tampering
      const token = authService.getAccessToken();
      if (token && !SecurityUtils.validateJWTStructure(token)) {
        console.error('Invalid token structure detected');
        authService.logout();
      }
    };
    
    const interval = setInterval(checkSecurity, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [authService]);
  
  const reportSecurityEvent = useCallback((event: {
    type: 'suspicious_activity' | 'unauthorized_access' | 'data_breach';
    details: Record<string, any>;
  }) => {
    console.warn('Security event:', event);
    
    // In production, send to security monitoring service
    fetch('/api/security/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getAccessToken()}`,
      },
      body: JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    }).catch(error => {
      console.error('Failed to report security event:', error);
    });
  }, [authService]);
  
  return { reportSecurityEvent };
};

// Export singleton instance
export const authService = AuthService.getInstance();
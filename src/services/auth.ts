// ============================================================================
// AUTH SERVICE - Servicio de Autenticación (Legacy)
// ============================================================================
// NOTA: Este servicio ahora es un stub. La autenticación real se maneja
// a través de authStore.ts y authApi.ts usando el backend REST.
// Se mantiene este archivo para compatibilidad con código legacy.

import type { User, LoginCredentials } from '@/types';

// Funciones simples para desarrollo (NO usar en producción)
function simpleVerifyPassword(inputPassword: string, storedPassword: string): boolean {
  // Para desarrollo, verificamos si coincide con el hash simple o la contraseña plana
  return inputPassword === storedPassword ||
         storedPassword === `dev_hash_${inputPassword}` ||
         inputPassword === storedPassword.replace('dev_hash_', '');
}

export function simpleHash(password: string): string {
  // Para desarrollo, simplemente retornamos la contraseña con un prefijo
  // En producción real, esto se haría en el backend con bcrypt
  return `dev_hash_${password}`;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface SessionToken {
  userId: string;
  role: string;
  exp: number;
  iat: number;
}

export class AuthService {
  private static readonly TOKEN_KEY = 'dental_clinic_token';
  private static readonly REFRESH_TOKEN_KEY = 'dental_clinic_refresh_token';
  private static readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Login with email and password
  // NOTA: Este método es un stub. Use authStore.login() para autenticación real con API.
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.warn('⚠️ AuthService.login: Este método es un stub. Use authStore.login() para autenticación con API.');
    return {
      success: false,
      message: 'Use authStore.login() para autenticación con el backend'
    };
  }

  // Logout user
  static async logout(): Promise<void> {
    try {
      // Get token directly without validation to avoid recursion
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (token) {
        const payload = this.decodeToken(token);
        if (payload && payload.userId) {
          await this.logAuthEvent('LOGOUT', payload.userId, 'SUCCESS');
        }
      }
    } catch (error) {
    } finally {
      // Clear tokens regardless of logging success
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }

  // Get current authenticated user
  // ⚠️ CRÍTICO: Esta función solo LEE, NO debe eliminar tokens
  static getCurrentUser(): User | null {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) return null;

      const payload = this.decodeToken(token);
      if (!payload || this.isTokenExpired(payload)) {
        // 🔒 CRÍTICO: NO eliminar tokens aquí - solo es una función de lectura
        return null; // Simplemente retornar null, NO eliminar tokens
      }

      return payload.user;
    } catch (error) {
      // 🔒 CRÍTICO: NO eliminar tokens en caso de error - solo retornar null
      return null;
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Check if user has specific role
  static hasRole(role: string | string[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }

  // Check if user has admin privileges
  static isAdmin(): boolean {
    return this.hasRole(['admin', 'super_admin']);
  }

  // Check if user is super admin
  static isSuperAdmin(): boolean {
    return this.hasRole('super_admin');
  }

  // Check if user is a doctor
  static isDoctor(): boolean {
    return this.hasRole(['doctor', 'admin', 'super_admin']);
  }

  // Check if user is a receptionist
  static isReceptionist(): boolean {
    return this.hasRole(['receptionist', 'admin', 'super_admin']);
  }

  // Check if user can access laboratory/imaging features
  static canAccessLaboratory(): boolean {
    return this.hasRole(['imaging_technician', 'admin', 'super_admin', 'doctor']);
  }

  // Check if user can access specific sede
  static canAccessSede(sedeId: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Super admin can access all sedes
    if (user.role === 'super_admin') return true;

    // Patients and external clients can access any sede
    if (user.role === 'patient' || user.role === 'external_client') return true;

    // Check if user belongs to this sede
    if (user.sedeId === sedeId) return true;

    // Check if user has multi-sede access
    if (user.sedesAcceso?.includes(sedeId)) return true;

    return false;
  }

  // Get user's accessible sedes
  static getUserSedes(): string[] {
    const user = this.getCurrentUser();
    if (!user) return [];

    // Super admin, patients and external clients can access all
    if (user.role === 'super_admin' || user.role === 'patient' || user.role === 'external_client') {
      return ['*']; // Special indicator for all sedes
    }

    const sedes: string[] = [];

    // Primary sede
    if (user.sedeId) {
      sedes.push(user.sedeId);
    }

    // Additional sedes
    if (user.sedesAcceso && user.sedesAcceso.length > 0) {
      sedes.push(...user.sedesAcceso);
    }

    return [...new Set(sedes)]; // Remove duplicates
  }

  // Refresh authentication token
  // NOTA: Este método es un stub. Use authStore para manejo de sesión con API.
  static async refreshToken(): Promise<AuthResponse> {
    console.warn('⚠️ AuthService.refreshToken: Este método es un stub. Use authStore para manejo de sesión con API.');
    return {
      success: false,
      message: 'Use authStore para manejo de sesión con el backend'
    };
  }

  // Generate JWT-like token (base64 encoded)
  private static generateToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sedeId: user.sedeId, // Add sede information
      sedesAcceso: user.sedesAcceso,
      user: this.sanitizeUser(user),
      iat: Date.now(),
      exp: Date.now() + this.TOKEN_EXPIRY
    };

    return btoa(JSON.stringify(payload));
  }

  // Generate refresh token
  private static generateRefreshToken(user: User): string {
    const payload = {
      userId: user.id,
      role: user.role,
      iat: Date.now(),
      exp: Date.now() + this.REFRESH_TOKEN_EXPIRY
    };

    return btoa(JSON.stringify(payload));
  }

  // Decode token
  private static decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token));
    } catch {
      return null;
    }
  }

  // Check if token is expired
  private static isTokenExpired(payload: any): boolean {
    return Date.now() > payload.exp;
  }

  // Remove sensitive data from user object
  private static sanitizeUser(user: User): User {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser as User;
  }

  // Generate UUID fallback
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Log authentication events (stub - logging should be handled by backend)
  private static async logAuthEvent(
    action: string,
    userId: string,
    status: string,
    details?: any
  ): Promise<void> {
    // No-op: logging should be handled by the backend
  }

  // Update user profile
  // NOTA: Este método es un stub. Use la API de backend para actualizar perfil.
  static async updateProfile(updates: Partial<User['profile']>): Promise<AuthResponse> {
    console.warn('⚠️ AuthService.updateProfile: Este método es un stub. Use la API de backend para actualizar perfil.');
    return {
      success: false,
      message: 'Use la API de backend para actualizar perfil'
    };
  }

  // Get user permissions based on role
  static getPermissions(): string[] {
    const user = this.getCurrentUser();
    if (!user) return [];

    const rolePermissions = {
      super_admin: [
        'read:sedes', 'write:sedes', 'delete:sedes',
        'read:users', 'write:users', 'delete:users',
        'read:patients', 'write:patients', 'delete:patients',
        'read:appointments', 'write:appointments', 'delete:appointments',
        'read:medical_records', 'write:medical_records',
        'read:payments', 'write:payments',
        'read:laboratory', 'write:laboratory',
        'read:reports', 'write:reports',
        'read:settings', 'write:settings',
        'manage:all_sedes'
      ],
      admin: [
        'read:users', 'write:users', 'delete:users',
        'read:patients', 'write:patients', 'delete:patients',
        'read:appointments', 'write:appointments', 'delete:appointments',
        'read:medical_records', 'write:medical_records',
        'read:payments', 'write:payments',
        'read:laboratory', 'write:laboratory',
        'read:reports', 'write:reports',
        'read:settings', 'write:settings'
      ],
      doctor: [
        'read:patients', 'write:patients',
        'read:appointments', 'write:appointments',
        'read:medical_records', 'write:medical_records',
        'read:laboratory', 'write:laboratory',
        'read:reports'
      ],
      receptionist: [
        'read:patients', 'write:patients',
        'read:appointments', 'write:appointments',
        'read:payments', 'write:payments'
      ],
      imaging_technician: [
        'read:imaging_studies', 'write:imaging_studies',
        'read:appointments', 'update:imaging_status',
        'read:laboratory', 'write:laboratory',
        'read:lab_reports'
      ],
      patient: [
        'read:own_appointments',
        'read:own_medical_records',
        'read:own_payments'
      ],
      external_client: [
        'read:own_lab_requests',
        'read:own_lab_results'
      ]
    };

    return rolePermissions[user.role as keyof typeof rolePermissions] || [];
  }

  // Check if user has specific permission
  static hasPermission(permission: string): boolean {
    const permissions = this.getPermissions();
    return permissions.includes(permission);
  }

  // Setup automatic token refresh
  static setupTokenRefresh(): void {
    const refreshInterval = setInterval(async () => {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) {
        clearInterval(refreshInterval);
        return;
      }

      const payload = this.decodeToken(token);
      if (!payload) {
        clearInterval(refreshInterval);
        return;
      }

      // Refresh token when it's about to expire (5 minutes before)
      const timeUntilExpiry = payload.exp - Date.now();
      if (timeUntilExpiry < 5 * 60 * 1000) {
        await this.refreshToken();
      }
    }, 60 * 1000); // Check every minute

    // Clear interval on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(refreshInterval);
    });
  }
}

// Initialize token refresh on service load
if (typeof window !== 'undefined') {
  AuthService.setupTokenRefresh();
}
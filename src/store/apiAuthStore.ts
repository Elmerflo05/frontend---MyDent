/**
 * Store de Autenticación para API Real
 * NUEVO store que usa ApiAuthService en lugar de AuthService (IndexedDB)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import ApiAuthService from '@/services/api/authService';
import type { User, LoginCredentials } from '@/types';
import { logger } from '@/lib/logger';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<User['profile']>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccess: (resource: string) => boolean;
}

type AuthStore = AuthState & AuthActions;

export const useApiAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginCredentials): Promise<boolean> => {
        logger.auth('ApiAuthStore: Login iniciado', { email: credentials.email });
        set({ isLoading: true, error: null });

        try {
          logger.auth('ApiAuthStore: Llamando a ApiAuthService.login');
          const response = await ApiAuthService.login(credentials);

          logger.auth('ApiAuthStore: ApiAuthService retornó', {
            success: response.success,
            hasUser: !!response.user,
            userRole: response.user?.role,
            message: response.message
          });

          if (response.success && response.user) {
            logger.store('apiAuthStore', 'Login exitoso, actualizando store');
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            logger.store('apiAuthStore', 'Store actualizado');
            return true;
          } else {
            logger.warn('ApiAuthStore: Login falló', response.message);
            set({
              error: response.message || 'Error de autenticación',
              isLoading: false
            });
            return false;
          }
        } catch (error) {
          logger.error('ApiAuthStore: Error en login', error);
          set({
            error: error instanceof Error ? error.message : 'Error de conexión',
            isLoading: false
          });
          return false;
        }
      },

      logout: async (): Promise<void> => {
        logger.auth('ApiAuthStore: Logout iniciado');
        set({ isLoading: true });

        try {
          await ApiAuthService.logout();
          logger.auth('ApiAuthStore: Logout exitoso');
        } catch (error) {
          logger.error('ApiAuthStore: Error en logout', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      refreshUser: async (): Promise<void> => {
        logger.auth('ApiAuthStore: Refresh user iniciado');

        const currentUser = ApiAuthService.getCurrentUser();

        if (currentUser) {
          logger.auth('ApiAuthStore: Usuario encontrado en token', {
            email: currentUser.email,
            role: currentUser.role
          });
          set({
            user: currentUser,
            isAuthenticated: true,
            error: null
          });
        } else {
          logger.auth('ApiAuthStore: No hay usuario autenticado');
          set({
            user: null,
            isAuthenticated: false,
            error: null
          });
        }
      },

      updateProfile: async (updates: Partial<User['profile']>): Promise<boolean> => {
        logger.auth('ApiAuthStore: Update profile iniciado');
        set({ isLoading: true, error: null });

        try {
          // TODO: Implementar endpoint de actualización de perfil en el backend
          // Por ahora solo actualizamos localmente
          const { user } = get();
          if (!user) {
            set({
              error: 'Usuario no autenticado',
              isLoading: false
            });
            return false;
          }

          const updatedUser = {
            ...user,
            profile: {
              ...user.profile,
              ...updates
            }
          };

          set({
            user: updatedUser,
            isLoading: false,
            error: null
          });

          // Guardar en localStorage
          localStorage.setItem('dental_clinic_user', JSON.stringify(updatedUser));

          logger.auth('ApiAuthStore: Profile actualizado');
          return true;
        } catch (error) {
          logger.error('ApiAuthStore: Error al actualizar perfil', error);
          set({
            error: error instanceof Error ? error.message : 'Error de conexión',
            isLoading: false
          });
          return false;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string): Promise<boolean> => {
        logger.auth('ApiAuthStore: Change password iniciado');
        set({ isLoading: true, error: null });

        try {
          // TODO: Implementar endpoint de cambio de contraseña en el backend
          logger.warn('ApiAuthStore: Cambio de contraseña no implementado en API');
          set({
            error: 'Funcionalidad no disponible por el momento',
            isLoading: false
          });
          return false;
        } catch (error) {
          logger.error('ApiAuthStore: Error al cambiar contraseña', error);
          set({
            error: error instanceof Error ? error.message : 'Error de conexión',
            isLoading: false
          });
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      hasRole: (role: string | string[]): boolean => {
        return ApiAuthService.hasRole(role);
      },

      hasPermission: (permission: string): boolean => {
        return ApiAuthService.hasPermission(permission);
      },

      canAccess: (resource: string): boolean => {
        const { user } = get();
        if (!user) return false;

        // Define access rules
        const accessRules: Record<string, string[]> = {
          'sedes': ['super_admin'],
          'admin': ['super_admin', 'admin'],
          'patients': ['super_admin', 'admin', 'doctor', 'receptionist'],
          'appointments': ['super_admin', 'admin', 'doctor', 'receptionist'],
          'medical_records': ['super_admin', 'admin', 'doctor'],
          'laboratory': ['super_admin', 'admin', 'doctor', 'imaging_technician'],
          'payments': ['super_admin', 'admin', 'receptionist'],
          'reports': ['super_admin', 'admin', 'doctor'],
          'settings': ['super_admin', 'admin']
        };

        const allowedRoles = accessRules[resource];
        return allowedRoles ? allowedRoles.includes(user.role) : false;
      }
    }),
    {
      name: 'api-auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Selector hooks for better performance
export const useApiUser = () => useApiAuthStore((state) => state.user);
export const useApiIsAuthenticated = () => useApiAuthStore((state) => state.isAuthenticated);
export const useApiAuthLoading = () => useApiAuthStore((state) => state.isLoading);
export const useApiAuthError = () => useApiAuthStore((state) => state.error);

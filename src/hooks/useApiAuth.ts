/**
 * Hook de Autenticación para API Real
 * NUEVO hook que usa ApiAuthStore en lugar de AuthStore
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApiAuthStore } from '@/store/apiAuthStore';
import type { User, LoginCredentials } from '@/types';
import { logger } from '@/lib/logger';

export interface UseApiAuthReturn {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<User['profile']>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  clearError: () => void;

  // Permission checks
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccess: (resource: string) => boolean;

  // Role shortcuts
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isReceptionist: boolean;
  isLabTechnician: boolean;
  isPatient: boolean;
  isExternalClient: boolean;
}

export const useApiAuth = (): UseApiAuthReturn => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
    updateProfile,
    changePassword,
    clearError,
    hasRole,
    hasPermission,
    canAccess
  } = useApiAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    if (!isAuthenticated && !user) {
      logger.auth('useApiAuth: Inicializando, refrescando usuario');
      refreshUser();
    }
  }, []); // Empty deps to run only once on mount

  // Auto-redirect logic
  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login') {
      const publicRoutes = ['/login', '/register', '/forgot-password', '/'];
      if (!publicRoutes.includes(location.pathname)) {
        logger.auth('useApiAuth: Usuario no autenticado, redirigiendo a login');
        navigate('/login', { replace: true, state: { from: location } });
      }
    }
  }, [isAuthenticated, navigate, location]);

  // Enhanced logout with navigation
  const handleLogout = async (): Promise<void> => {
    logger.auth('useApiAuth: Cerrando sesión');
    await logout();
    navigate('/login', { replace: true });
  };

  // Enhanced login with navigation
  const handleLogin = async (credentials: LoginCredentials): Promise<boolean> => {
    logger.auth('useApiAuth: handleLogin iniciado', { email: credentials.email });

    const success = await login(credentials);
    logger.auth('useApiAuth: login() retornó', { success });

    if (success) {
      logger.debug('useApiAuth: Login exitoso, esperando hidratación del store (150ms)');
      // Wait for the store to be fully hydrated
      await new Promise(resolve => setTimeout(resolve, 150));

      logger.auth('useApiAuth: Llamando a refreshUser');
      // Force a refresh to ensure we have the latest user data
      await refreshUser();

      // Get the latest state
      const store = useApiAuthStore.getState();
      const freshUser = store.user;
      const isAuth = store.isAuthenticated;

      logger.auth('useApiAuth: Después de refresh', {
        user: freshUser?.email,
        role: freshUser?.role,
        authenticated: isAuth
      });

      if (freshUser && isAuth) {
        const defaultRoute = getDefaultRoute(freshUser.role);
        const from = (location.state as any)?.from?.pathname || defaultRoute;

        // Ensure we're not trying to navigate to login page
        const targetRoute = (from === '/login' || from === '/') ? defaultRoute : from;

        logger.info('useApiAuth: Navegando a', { targetRoute });

        // Use replace to avoid adding to history
        navigate(targetRoute, { replace: true });
      } else {
        logger.error('useApiAuth: Verificación de autenticación falló después del login');
        navigate('/login', { replace: true });
      }
    } else {
      logger.warn('useApiAuth: Login falló, no se navegará');
    }

    return success;
  };

  // Get default route based on user role
  const getDefaultRoute = (role: string): string => {
    switch (role) {
      case 'super_admin':
        return '/admin/sedes';
      case 'admin':
        return '/admin/dashboard';
      case 'doctor':
        return '/clinic/dashboard';
      case 'receptionist':
        return '/clinic/dashboard';
      case 'imaging_technician':
        return '/laboratory/dashboard';
      case 'patient':
        return '/patient/dashboard';
      case 'external_client':
        return '/laboratory/requests';
      default:
        return '/dashboard';
    }
  };

  // Role shortcuts
  const isSuperAdmin = hasRole('super_admin');
  const isAdmin = hasRole(['admin', 'super_admin']);
  const isDoctor = hasRole('doctor');
  const isReceptionist = hasRole('receptionist');
  const isImagingTechnician = hasRole('imaging_technician');
  const isPatient = hasRole('patient');
  const isExternalClient = hasRole('external_client');

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login: handleLogin,
    logout: handleLogout,
    refreshUser,
    updateProfile,
    changePassword,
    clearError,

    // Permission checks
    hasRole,
    hasPermission,
    canAccess,

    // Role shortcuts
    isSuperAdmin,
    isAdmin,
    isDoctor,
    isReceptionist,
    isLabTechnician: isImagingTechnician,
    isPatient,
    isExternalClient
  };
};

// Hook for requiring authentication
export const useRequireApiAuth = (requiredRoles?: string[]): UseApiAuthReturn => {
  const auth = useApiAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.isAuthenticated) {
        navigate('/login', { replace: true });
        return;
      }

      if (requiredRoles && !auth.hasRole(requiredRoles)) {
        navigate('/unauthorized', { replace: true });
        return;
      }
    }
  }, [auth.isAuthenticated, auth.isLoading, auth.hasRole, navigate, requiredRoles]);

  return auth;
};

// Hook for guest-only pages (login, register)
export const useGuestOnlyApi = (): UseApiAuthReturn => {
  const auth = useApiAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      const defaultRoute = getDefaultRoute(auth.user.role);
      navigate(defaultRoute, { replace: true });
    }
  }, [auth.isAuthenticated, auth.user, navigate]);

  return auth;
};

// Hook for checking specific permissions
export const useApiPermissions = (permissions: string[]): {
  hasAllPermissions: boolean;
  hasAnyPermission: boolean;
  missingPermissions: string[];
} => {
  const auth = useApiAuth();

  const hasAllPermissions = permissions.every(permission =>
    auth.hasPermission(permission)
  );

  const hasAnyPermission = permissions.some(permission =>
    auth.hasPermission(permission)
  );

  const missingPermissions = permissions.filter(permission =>
    !auth.hasPermission(permission)
  );

  return {
    hasAllPermissions,
    hasAnyPermission,
    missingPermissions
  };
};

// Hook for role-based component rendering
export const useApiRoleAccess = (allowedRoles: string[]): boolean => {
  const auth = useApiAuth();
  return auth.isAuthenticated && auth.hasRole(allowedRoles);
};

// Helper function (extracted to avoid duplication)
function getDefaultRoute(role: string): string {
  switch (role) {
    case 'super_admin':
      return '/admin/sedes';
    case 'admin':
      return '/admin/dashboard';
    case 'doctor':
      return '/clinic/dashboard';
    case 'receptionist':
      return '/clinic/dashboard';
    case 'imaging_technician':
      return '/laboratory/dashboard';
    case 'patient':
      return '/patient/dashboard';
    case 'external_client':
      return '/laboratory/requests';
    default:
      return '/dashboard';
  }
}

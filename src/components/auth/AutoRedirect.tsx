import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface AutoRedirectProps {
  children: React.ReactNode;
}

/**
 * Componente que envuelve rutas públicas y redirige automáticamente
 * a usuarios autenticados a su dashboard apropiado.
 *
 * Previene bucles infinitos de redirección al verificar la autenticación
 * ANTES de renderizar cualquier contenido público.
 *
 * @example
 * <AutoRedirect>
 *   <HomePage />
 * </AutoRedirect>
 */
export const AutoRedirect = ({ children }: AutoRedirectProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);

  // 🔧 CRÍTICO: Esperar a que termine la hidratación del store desde localStorage
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Si está autenticado, redirigir al dashboard apropiado según su rol
  if (isAuthenticated && user) {
    const getDefaultRoute = (role: string): string => {
      switch (role) {
        case 'super_admin':
          return '/admin/sedes';
        case 'admin':
          return '/admin/dashboard';
        case 'doctor':
          return '/clinic/dashboard';
        case 'receptionist':
          return '/clinic/appointments';
        case 'lab_technician':
          return '/laboratory/dashboard';
        case 'prosthesis_technician':
          return '/prosthesis-lab/dashboard';
        case 'patient':
          return '/patient/dashboard';
        case 'external_client':
          return '/laboratory/requests';
        case 'imaging_technician':
          return '/laboratory/requests'; // O la ruta específica para imaging technician
        default:
          return '/login';
      }
    };

    const route = getDefaultRoute(user.role);
    return <Navigate to={route} replace />;
  }

  // Usuario no autenticado, mostrar contenido público
  return <>{children}</>;
};

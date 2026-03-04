import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { router } from '@/router';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import useAdministratorStore from '@/store/administratorStore';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import { FullScreenLoading } from '@/components/common/LoadingSpinner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { paymentCronJob } from '@/services/healthPlan/PaymentCronJob';
import { logger } from '@/lib/logger';
import { optimizedMotionConfig } from '@/utils/animationConfig';

function App() {
  const { theme, globalLoading, setGlobalLoading } = useAppStore();
  const { refreshUser, setHasHydrated } = useAuthStore();
  const { initializeAdministrators } = useAdministratorStore();
  const { loadCatalogsFromDB } = useOdontogramConfigStore();

  // 🔧 Fallback: marcar como hidratado después de un pequeño delay
  // Por si el callback de Zustand no se ejecuta
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentState = useAuthStore.getState();
      if (!currentState._hasHydrated) {
        setHasHydrated(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [setHasHydrated]);

  // Initialize application
  useEffect(() => {
    async function initializeApp() {
      try {
        setGlobalLoading(true);

        logger.info('Iniciando aplicación...');

        // Initialize auth - la autenticación ahora usa API/backend
        await refreshUser();

        // ✅ SOLO inicializar datos que requieren auth SI hay usuario autenticado
        const { isAuthenticated, user } = useAuthStore.getState();
        if (isAuthenticated) {
          logger.info('Usuario autenticado, inicializando datos protegidos...');

          // 🔒 SOLO cargar datos administrativos para roles que los necesitan
          // Pacientes y clientes externos NO necesitan ni tienen permiso para ver estos datos
          const adminRoles = ['super_admin', 'admin', 'doctor', 'receptionist', 'imaging_technician'];
          const isAdminUser = user && adminRoles.includes(user.role);

          // Cargar catálogos de odontograma para TODOS los usuarios autenticados (incluyendo doctores)
          // Los precios de las condiciones son necesarios para la atención integral
          logger.info('Cargando catálogos de odontograma desde BD...');
          try {
            await loadCatalogsFromDB();
            logger.info('✅ Catálogos de odontograma cargados exitosamente');
          } catch (error) {
            logger.error('❌ Error al cargar catálogos de odontograma:', error);
            logger.warn('⚠️ Usando configuración visual por defecto como fallback');
          }

          if (isAdminUser) {
            logger.info(`Usuario con rol "${user?.role}" - Cargando datos administrativos...`);

            // Initialize administrators store (solo para roles administrativos)
            await initializeAdministrators();
          } else {
            logger.info(`Usuario con rol "${user?.role}" - Omitiendo carga de datos administrativos (no requeridos)`);
          }
        } else {
          logger.info('Usuario no autenticado, omitiendo inicialización de datos protegidos');
        }

        // Initialize payment cron job for health plans
        logger.info('Iniciando PaymentCronJob...');
        paymentCronJob.start();
        logger.info('PaymentCronJob iniciado correctamente');

      } catch (error) {
        logger.error('Failed to initialize application', error);
      } finally {
        setGlobalLoading(false);
      }
    }

    initializeApp();

    // Cleanup: detener el cron job cuando se desmonte la app
    return () => {
      logger.info('Deteniendo PaymentCronJob...');
      paymentCronJob.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Show loading screen during initialization
  if (globalLoading) {
    return <FullScreenLoading text="Iniciando aplicación..." />;
  }

  return (
    <ErrorBoundary>
      <MotionConfig {...optimizedMotionConfig}>
        <div className="min-h-screen bg-background text-foreground">
          <AnimatePresence mode="wait">
            <motion.div
              key="app"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="min-h-screen"
            >
              <RouterProvider router={router} />
            </motion.div>
          </AnimatePresence>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: theme === 'dark' ? '#1f2937' : '#ffffff',
                color: theme === 'dark' ? '#f9fafb' : '#111827',
                border: '1px solid',
                borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
              }
            }}
          />
        </div>
      </MotionConfig>
    </ErrorBoundary>
  );
}

export default App;

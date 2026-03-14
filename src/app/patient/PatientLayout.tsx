import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Activity,
  CreditCard,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Heart,
  Phone,
  Mail,
  Clock,
  Stethoscope,
  FileCheck,
  TestTube,
  Gift,
  Building2,
  Shield,
  CalendarX
} from 'lucide-react';
import { routeConfig } from '@/router';
import { useAuthStore } from '@/store/authStore';
import { useAppSettingsStore } from '@/store/appSettingsStore';
import NotificationBell from '@/components/notifications/NotificationBell';
import type { Patient } from '@/types';
import { patientsApi } from '@/services/api/patientsApi';
import { notificationsApi } from '@/services/api/notificationsApi';
import { incomePaymentsApi } from '@/services/api/incomePaymentsApi';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import AppointmentNotificationModal, { AppointmentNotification } from '@/components/patient/AppointmentNotificationModal';
import PaymentPendingModal from '@/components/patient/PaymentPendingModal';
import { formatDateToYMD } from '@/utils/dateUtils';
import { SessionTimeoutProvider } from '@/components/common/SessionTimeoutProvider';

// Estados de cita activos para mostrar en el widget
const ACTIVE_APPOINTMENT_STATES = [0, 1, 2, 3, 7];

interface NextAppointmentInfo {
  date: string;
  time: string;
  doctorName: string;
  specialty: string;
}

const PatientLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [appointmentNotifications, setAppointmentNotifications] = useState<AppointmentNotification[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasPendingDebts, setHasPendingDebts] = useState(false);
  const [nextAppointment, setNextAppointment] = useState<NextAppointmentInfo | null>(null);
  const { user, logout } = useAuthStore();
  const { loadSettings } = useAppSettingsStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadPatientData();
    loadNextAppointment();
    loadSettings();
  }, [user]);

  // Cargar notificaciones de citas al iniciar
  useEffect(() => {
    if (user?.id) {
      loadAppointmentNotifications();
    }
  }, [user?.id]);

  // Verificar si hay pagos pendientes al iniciar
  useEffect(() => {
    if (user?.profile?.patientId) {
      checkPendingDebts();
    }
  }, [user?.profile?.patientId]);

  const checkPendingDebts = async () => {
    try {
      const response = await incomePaymentsApi.getPatientPendingDebts(user!.profile!.patientId!);
      // Solo mostrar modal si hay deudas pendientes o parciales con balance > 0
      const pendingDebts = response.debts.filter(
        d => (d.payment_status === 'pending' || d.payment_status === 'partial')
          && parseFloat(String(d.balance || 0)) > 0
      );
      if (pendingDebts.length > 0) {
        setHasPendingDebts(true);
        // Mostrar modal automáticamente después de un pequeño delay
        setTimeout(() => setShowPaymentModal(true), 500);
      }
    } catch (error) {
      console.error('Error al verificar pagos pendientes:', error);
    }
  };

  const loadAppointmentNotifications = async () => {
    try {
      const response = await notificationsApi.getNotifications({
        is_read: false,
        limit: 10
      });

      if (response.success && response.data) {
        // Filtrar solo notificaciones de citas (aprobación, reprogramación, cancelación)
        const appointmentTypes = ['appointment_confirmed', 'appointment_rescheduled', 'appointment_cancelled', 'appointment_rejected'];
        const filtered = response.data.filter((n: any) =>
          appointmentTypes.includes(n.notification_type)
        );

        if (filtered.length > 0) {
          setAppointmentNotifications(filtered);
          setShowNotificationModal(true);
        }
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: number) => {
    try {
      await notificationsApi.markAsRead(notificationId);
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  const handleCloseNotificationModal = () => {
    setShowNotificationModal(false);
    setAppointmentNotifications([]);
  };

  const loadPatientData = async () => {
    if (!user?.profile?.patientId) return;

    try {
      const response = await patientsApi.getPatientById(user.profile.patientId);

      const patient: Patient = {
        id: response.data.patient_id?.toString() || '',
        dni: response.data.identification || '',
        firstName: response.data.first_name || '',
        lastName: response.data.last_name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        birthDate: response.data.birth_date ? new Date(response.data.birth_date) : new Date(),
        gender: response.data.gender === 'M' ? 'male' : response.data.gender === 'F' ? 'female' : 'other',
        address: response.data.address || '',
        isActive: response.data.is_active !== false,
        createdAt: new Date(response.data.created_at || Date.now()),
        companyId: response.data.company_id?.toString()
      };

      setPatientData(patient);
    } catch (error) {
    }
  };

  const loadNextAppointment = async () => {
    if (!user?.profile?.patientId) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const response = await appointmentsApi.getAppointments({
        patient_id: user.profile.patientId,
        limit: 50
      });

      // Filtrar citas activas de hoy o futuras
      const upcomingAppointments = response.data
        .filter((apt: any) => {
          const dateOnly = (apt.appointment_date || '').split('T')[0];
          const [year, month, day] = dateOnly.split('-').map(Number);
          const aptDate = new Date(year, month - 1, day, 0, 0, 0, 0);
          const isTodayOrFuture = aptDate >= today;
          const isActive = ACTIVE_APPOINTMENT_STATES.includes(apt.appointment_status_id);
          return isTodayOrFuture && isActive;
        })
        .sort((a: any, b: any) => {
          const dateA = (a.appointment_date || '').split('T')[0];
          const dateB = (b.appointment_date || '').split('T')[0];
          if (dateA !== dateB) return dateA.localeCompare(dateB);
          return (a.start_time || '').localeCompare(b.start_time || '');
        });

      if (upcomingAppointments.length > 0) {
        const apt = upcomingAppointments[0];
        const dateOnly = (apt.appointment_date || '').split('T')[0];
        const [year, month, day] = dateOnly.split('-').map(Number);
        const aptDate = new Date(year, month - 1, day);
        const todayStr = formatDateToYMD(new Date());

        // Formatear fecha
        let dateStr: string;
        if (dateOnly === todayStr) {
          dateStr = 'Hoy';
        } else {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (dateOnly === formatDateToYMD(tomorrow)) {
            dateStr = 'Mañana';
          } else {
            dateStr = aptDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
          }
        }

        // Formatear hora
        const timeStr = apt.start_time || '00:00:00';
        const timeParts = timeStr.split(':');
        const formattedTime = `${timeParts[0]}:${timeParts[1]}`;

        setNextAppointment({
          date: dateStr,
          time: formattedTime,
          doctorName: apt.dentist_name ? `Dr. ${apt.dentist_name.split(' ')[0]}` : 'Doctor',
          specialty: apt.specialty_name || 'Consulta General'
        });
      } else {
        setNextAppointment(null);
      }
    } catch (error) {
      setNextAppointment(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get patient-specific routes
  const getPatientRoutes = () => {
    const routes = [...routeConfig.patient];

    // Find the health plans route and modify it if patient has company
    const healthPlanIndex = routes.findIndex(r => r.path === '/patient/health-plans');

    if (healthPlanIndex !== -1 && patientData?.companyId) {
      routes[healthPlanIndex] = {
        ...routes[healthPlanIndex],
        label: 'Plan Empresarial',
        icon: 'Building2'
      };
    }

    return routes;
  };

  const getIcon = (iconName: string) => {
    const icons = {
      LayoutDashboard,
      Calendar,
      FileText,
      Activity,
      CreditCard,
      User,
      Settings,
      Stethoscope,
      FileCheck,
      TestTube,
      Gift,
      Heart,
      Building2,
      Shield
    };
    const IconComponent = icons[iconName as keyof typeof icons];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />;
  };

  return (
    <SessionTimeoutProvider>
      <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar - Persistent on desktop, collapsible on mobile */}
      <aside
        className={`
          bg-white shadow-lg flex flex-col h-full overflow-hidden flex-shrink-0 w-64 border-r border-gray-200
          fixed lg:static inset-y-0 left-0 z-50
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header - Fixed */}
        <div className="flex-shrink-0 p-6 border-b border-gray-200">
          <div className="flex items-center justify-center">
            <img
              src="/mydentLogo.png"
              alt="MyDent Logo"
              className="w-full h-auto max-h-20 object-contain"
            />
          </div>
        </div>

        {/* Patient Info Card */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-teal-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center ring-2 ring-white">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate">
                {user?.profile?.firstName} {user?.profile?.lastName}
              </div>
              <div className="text-xs text-teal-600 font-medium">Paciente</div>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-teal-600" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-teal-600" />
              <span>{user?.profile?.phone || 'No registrado'}</span>
            </div>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="px-3 space-y-1">
            {getPatientRoutes().map((route) => (
              <NavLink
                key={route.path}
                to={route.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
                onClick={() => setIsSidebarOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal-600 rounded-r-full" />
                    )}
                    <span className={`flex-shrink-0 ${isActive ? 'text-teal-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                      {getIcon(route.icon)}
                    </span>
                    <span className="truncate">{route.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Quick Actions & Logout - Fixed */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
          {nextAppointment ? (
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-3 mb-3 border border-teal-200">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-semibold text-teal-900">Próxima Cita</span>
              </div>
              <div className="text-xs font-medium text-teal-700">
                {nextAppointment.date}, {nextAppointment.time}
              </div>
              <div className="text-xs text-teal-600">
                {nextAppointment.doctorName} - {nextAppointment.specialty}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1.5">
                <CalendarX className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-600">Sin citas próximas</span>
              </div>
              <NavLink
                to="/patient/appointments"
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                Solicitar cita →
              </NavLink>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Hamburger button - Only visible on mobile */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Bienvenido, {user?.profile?.firstName}
                </h2>
                <p className="text-sm text-gray-600">
                  Gestiona tu información médica y citas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <NotificationBell />

              {/* Emergency Contact */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm">
                <Phone className="w-4 h-4" />
                <span>Emergencia: 911</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          style={{ marginLeft: '0' }}
        />
      )}

      {/* Modal de notificaciones de citas */}
      <AppointmentNotificationModal
        isOpen={showNotificationModal}
        onClose={handleCloseNotificationModal}
        notifications={appointmentNotifications}
        onMarkAsRead={handleMarkNotificationAsRead}
      />

      {/* Modal de pagos pendientes */}
      {user?.profile?.patientId && (
        <PaymentPendingModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          patientId={user.profile.patientId}
          onPaymentSubmitted={() => {
            checkPendingDebts();
          }}
        />
      )}
      </div>
    </SessionTimeoutProvider>
  );
};

export default PatientLayout;
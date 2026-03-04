import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { formatDateToYMD } from '@/utils/dateUtils';
import { useAuth } from '@/hooks/useAuth';
import { patientsApi } from '@/services/api/patientsApi';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import { dentistsApi } from '@/services/api/dentistsApi';

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
}

interface TodayAppointment {
  id: string;
  patient: string;
  time: string;
  service: string;
  status: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0
  });
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Obtener fecha de hoy en formato YYYY-MM-DD
      const today = formatDateToYMD(new Date());

      // Preparar filtros para citas
      const appointmentFilters: any = {
        date_from: today,
        date_to: today,
        limit: 100
      };

      // Si es doctor, SOLO filtrar por dentist_id (no por sede)
      // El doctor puede atender en múltiples sedes
      if (user?.role === 'doctor') {
        // Obtener dentist_id del doctor actual
        const dentistsRes = await dentistsApi.getDentists({ limit: 100 });
        const currentDentist = dentistsRes.data.find(
          (d: any) => d.user_id?.toString() === user.id?.toString()
        );
        if (currentDentist) {
          appointmentFilters.dentist_id = currentDentist.dentist_id;
        }
      } else if (user?.role !== 'super_admin' && user?.branch_id) {
        // Para otros roles (admin, recepcionista), filtrar por sede
        appointmentFilters.branch_id = user.branch_id;
      }

      // Cargar datos en paralelo
      const [patientsRes, appointmentsRes] = await Promise.all([
        patientsApi.getPatients({ limit: 1, page: 1 }), // Solo necesitamos el total
        appointmentsApi.getAppointments(appointmentFilters)
      ]);

      // Procesar estadísticas
      const totalPatients = patientsRes.pagination?.total || patientsRes.data?.length || 0;
      const appointments = appointmentsRes.data || [];

      // Mapear estados del backend
      // Status codes: confirmed, pending_approval, completed, cancelled, no_show, in_progress, arrived, rejected
      const completedCount = appointments.filter((a: any) =>
        a.status_code === 'completed'
      ).length;

      const pendingCount = appointments.filter((a: any) =>
        a.status_code === 'confirmed' || a.status_code === 'pending_approval' || a.status_code === 'arrived'
      ).length;

      setStats({
        totalPatients,
        todayAppointments: appointments.length,
        completedAppointments: completedCount,
        pendingAppointments: pendingCount
      });

      // Mapear citas de hoy para mostrar en la lista
      const mappedAppointments: TodayAppointment[] = appointments
        .slice(0, 5) // Solo mostrar las primeras 5
        .map((apt: any) => ({
          id: apt.appointment_id?.toString() || '',
          patient: apt.patient_name || 'Paciente',
          time: apt.start_time?.substring(0, 5) || '00:00',
          service: apt.reason || 'Consulta General',
          status: mapStatusCode(apt.status_code)
        }));

      setTodayAppointments(mappedAppointments);

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mapear códigos de estado del backend a códigos del frontend
  const mapStatusCode = (statusCode: string): string => {
    switch (statusCode) {
      case 'completed': return 'completed';
      case 'in_progress': return 'in-progress';
      case 'arrived': return 'in-progress';
      case 'confirmed': return 'scheduled';
      case 'pending_approval': return 'pending';
      case 'cancelled': return 'cancelled';
      case 'no_show': return 'cancelled';
      case 'rejected': return 'cancelled';
      default: return 'scheduled';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'scheduled':
        return <Calendar className="w-4 h-4 text-gray-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'in-progress':
        return 'En Progreso';
      case 'scheduled':
        return 'Programada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Pendiente';
    }
  };

  // Calcular porcentaje de citas completadas
  const completionRate = stats.todayAppointments > 0
    ? Math.round((stats.completedAppointments / stats.todayAppointments) * 100)
    : 0;

  const statsCards = [
    {
      title: 'Pacientes Total',
      value: stats.totalPatients.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Citas Hoy',
      value: stats.todayAppointments.toString(),
      icon: Calendar,
      color: 'bg-clinic-primary'
    },
    {
      title: 'Citas Pendientes',
      value: stats.pendingAppointments.toString(),
      icon: Clock,
      color: 'bg-amber-500'
    },
    {
      title: 'Completadas Hoy',
      value: `${completionRate}%`,
      icon: CheckCircle,
      color: 'bg-green-500'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-clinic-primary mx-auto mb-2" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Bienvenido, Dr. {user?.profile?.firstName || 'Doctor'}
            </h1>
            <p className="text-gray-600">
              Resumen de actividades del día {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="w-16 h-16 bg-clinic-primary/10 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-clinic-primary" />
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Appointments */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Citas de Hoy</h3>
            <span className="text-sm text-gray-500">{stats.todayAppointments} citas</span>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No hay citas programadas para hoy</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {appointment.time}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{appointment.patient}</p>
                      <p className="text-sm text-gray-600">{appointment.service}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(appointment.status)}
                    <span className="text-sm text-gray-600">
                      {getStatusText(appointment.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={() => navigate('/clinic/appointments')}
              className="w-full py-2 text-clinic-primary hover:bg-clinic-primary/5 rounded-lg transition-colors font-medium"
            >
              Ver todas las citas
            </button>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Acciones Rápidas</h3>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/clinic/patients?action=new')}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-blue-50 rounded-lg transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Nuevo Paciente</p>
                <p className="text-sm text-gray-600">Registrar un paciente nuevo</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </button>

            <button
              onClick={() => navigate('/clinic/appointments')}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-green-50 rounded-lg transition-colors group"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Agendar Cita</p>
                <p className="text-sm text-gray-600">Programar nueva cita</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
            </button>

            {user?.role !== 'receptionist' && (
              <button
                onClick={() => navigate('/clinic/medical-records')}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-purple-50 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Historial Médico</p>
                  <p className="text-sm text-gray-600">Consultar historiales</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  FileText,
  Activity,
  Heart,
  AlertCircle,
  CheckCircle,
  Phone,
  User,
  Stethoscope,
  Pill,
  TrendingUp,
  MessageCircle,
  Bell,
  MapPin,
  CreditCard,
  Star,
  Tag,
  Percent
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  PatientDashboardApiService,
  type DashboardStats,
  type UpcomingAppointment,
  type RecentActivity,
  type Promotion
} from '../services/patientDashboardApiService';

// Portal de paciente siempre usa tema cyan
const USE_CYAN_THEME = true;

const PatientDashboard = () => {
  const { user } = useAuthStore();

  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedTreatments: 0,
    pendingPayments: 0,
    totalVisits: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      if (!user?.profile?.patientId) {
        setIsLoading(false);
        return;
      }

      const patientId = user.profile.patientId;


      // Cargar todas las secciones en paralelo
      const [statsData, appointmentsData, activityData, promotionsData] = await Promise.all([
        PatientDashboardApiService.loadDashboardStats(patientId),
        PatientDashboardApiService.loadUpcomingAppointments(patientId, 5),
        PatientDashboardApiService.loadRecentActivity(patientId, 10),
        PatientDashboardApiService.loadActivePromotions()
      ]);

      setStats(statsData);
      setUpcomingAppointments(appointmentsData);
      setRecentActivity(activityData);

      // Deduplicar promociones por ID para evitar warnings de React
      const uniquePromotions = promotionsData.filter((promo, index, self) =>
        index === self.findIndex((p) => p.id === promo.id)
      );

      // Mostrar todas las promociones de clínica
      // TODO: Implementar lógica para filtrar según si el usuario es cliente nuevo o continuador
      setActivePromotions(uniquePromotions.slice(0, 3)); // Mostrar máximo 3 promociones únicas
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment': return Calendar;
      case 'payment': return CreditCard;
      case 'treatment': return Activity;
      case 'prescription': return Pill;
      default: return Bell;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                ¡Hola, {user?.profile?.firstName}! 👋
              </h1>
              <p className="text-teal-100 mb-4">
                Bienvenido a tu portal de salud dental
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  <span>Tu salud es nuestra prioridad</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Última visita: 15 Enero 2024</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <Stethoscope className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Citas de Hoy - Card destacado */}
          <div className={`bg-white rounded-xl p-6 shadow-sm border-2 ${stats.todayAppointments > 0 ? 'border-teal-500 bg-teal-50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Citas de Hoy</p>
                <p className={`text-2xl font-bold ${stats.todayAppointments > 0 ? 'text-teal-700' : 'text-gray-900'}`}>
                  {stats.todayAppointments}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.todayAppointments > 0 ? 'bg-teal-200' : 'bg-teal-100'}`}>
                <Clock className={`w-6 h-6 ${stats.todayAppointments > 0 ? 'text-teal-700' : 'text-teal-600'}`} />
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/patient/appointments"
                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                {stats.todayAppointments > 0 ? 'Ver detalles →' : 'Ver citas →'}
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Próximas Citas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/patient/appointments"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Ver citas →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tratamientos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedTreatments}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link 
                to="/patient/treatments"
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Ver tratamientos →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pagos Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link 
                to="/patient/billing"
                className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
              >
                Ver facturación →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Visitas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVisits}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${USE_CYAN_THEME ? 'bg-cyan-100' : 'bg-purple-100'}`}>
                <TrendingUp className={`w-6 h-6 ${USE_CYAN_THEME ? 'text-cyan-600' : 'text-purple-600'}`} />
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/patient/medical-history"
                className={`text-sm font-medium ${USE_CYAN_THEME ? 'text-cyan-600 hover:text-cyan-700' : 'text-purple-600 hover:text-purple-700'}`}
              >
                Ver historial →
              </Link>
            </div>
          </div>
        </div>

        {/* Promociones Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Promociones</h2>
            </div>
            <Link
              to="/patient/promotions"
              className="text-teal-600 hover:text-teal-700 text-sm font-medium"
            >
              Ver todas
            </Link>
          </div>

          {activePromotions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activePromotions.map((promo) => (
                <div
                  key={promo.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-teal-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{promo.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{promo.description}</p>
                    </div>
                    <div className="ml-2 w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Percent className="w-5 h-5 text-teal-600" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Discount Badge */}
                    <div className="inline-flex items-center px-3 py-1 bg-teal-600 text-white rounded-lg text-sm font-medium">
                      {promo.discountType === 'percentage' && `${promo.discountValue}% de descuento`}
                      {promo.discountType === 'fixed' && `S/ ${promo.discountValue} de descuento`}
                      {promo.discountType === 'service' && 'Servicio gratis'}
                    </div>

                    {/* Validity Dates */}
                    <div className="text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          Válido hasta {new Date(promo.endDate).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Promo Code */}
                    {promo.code && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Código:</span>
                          <span className="text-sm font-mono font-medium text-teal-700 bg-teal-50 px-2 py-1 rounded">
                            {promo.code}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay promociones activas</h3>
              <p className="text-sm text-gray-600 mb-4">
                Por el momento no tenemos promociones disponibles, pero vuelve pronto para descuentos especiales.
              </p>
              <Link
                to="/patient/promotions"
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
              >
                Ver todas las promociones
              </Link>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Próximas Citas</h2>
                <Link 
                  to="/patient/appointments"
                  className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                >
                  Ver todas
                </Link>
              </div>

              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatDate(appointment.date)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {appointment.time} - {appointment.specialty}
                          </div>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{appointment.doctorName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{appointment.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {upcomingAppointments.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay citas programadas</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Programa una cita para mantener tu salud dental
                  </p>
                  <Link 
                    to="/patient/appointments"
                    className="mt-4 inline-flex items-center px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Solicitar Cita
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
                <Bell className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const IconComponent = getActivityIcon(activity.type);
                  const colorClass = getActivityColor(activity.status);
                  
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.date.toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Health Tips */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Tip de Salud</h3>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                <strong>¡Cepíllate correctamente!</strong><br />
                Usa movimientos circulares suaves durante 2 minutos, dos veces al día. No olvides la lengua y usa hilo dental diariamente.
              </div>
              
              <div className="flex items-center gap-2 text-xs text-green-600">
                <Star className="w-3 h-3" />
                <span>Tip del día</span>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900">Contacto de Emergencia</h3>
              <p className="text-sm text-red-700">
                Para emergencias dentales, llama al <strong>(01) 234-5678</strong> las 24 horas
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PatientDashboard;
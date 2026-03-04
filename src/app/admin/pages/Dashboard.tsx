import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  Calendar,
  DollarSign,
  Building2,
  Filter,
  ChevronDown,
  UserCheck,
  Stethoscope,
  Activity,
  UserPlus,
  CalendarPlus,
  FileText,
  Settings,
  ClipboardList,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import useSedeStore from '@/store/sedeStore';
import { EstadisticasOdontologicasAPIService, type RecentActivity } from '@/services/estadisticasOdontologicasAPI';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    obtenerSedesActivas,
    obtenerSedePorId
  } = useSedeStore();

  const [showSedeDropdown, setShowSedeDropdown] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const sedes = obtenerSedesActivas();
  const isSuperAdmin = user?.role === 'super_admin';

  // Para admin de sede: usar su branch_id, para super_admin: puede seleccionar
  const userBranchId = user?.branch_id?.toString() || user?.sedeId;
  const [selectedSedeId, setSelectedSedeId] = useState(() => {
    // Si es admin de sede, forzar a su sede
    if (!isSuperAdmin && userBranchId) {
      return userBranchId;
    }
    return 'todas';
  });

  // Forzar sede del admin cuando cambia el usuario
  useEffect(() => {
    if (!isSuperAdmin && userBranchId) {
      setSelectedSedeId(userBranchId);
    }
  }, [isSuperAdmin, userBranchId]);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      setLoading(true);
      try {
        if (selectedSedeId === 'todas') {
          const estadisticasGlobales = await EstadisticasOdontologicasAPIService.calcularEstadisticasGlobales();
          setStats(estadisticasGlobales);
        } else {
          const estadisticasSede = await EstadisticasOdontologicasAPIService.calcularEstadisticasSede(selectedSedeId);
          setStats({
            totalSedes: 1,
            ...estadisticasSede
          });
        }
      } catch (error) {
        setStats({
          totalSedes: selectedSedeId === 'todas' ? sedes.length : 1,
          totalPacientes: 0,
          totalDoctores: 0,
          totalPersonal: 0,
          citasDelDia: 0,
          ingresosMes: 0
        });
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, [selectedSedeId, sedes.length]);

  // Cargar actividad reciente
  useEffect(() => {
    const cargarActividades = async () => {
      setLoadingActivities(true);
      try {
        const actividadReciente = await EstadisticasOdontologicasAPIService.obtenerActividadReciente(5);
        setActivities(actividadReciente);
      } catch (error) {
        console.error('Error al cargar actividad reciente:', error);
        setActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    };

    cargarActividades();
  }, []);

  const getSelectedSedeName = () => {
    if (selectedSedeId === 'todas') return 'Todas las Sedes';
    const sede = obtenerSedePorId(selectedSedeId);
    return sede?.nombre || 'Sede no encontrada';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount || 0);
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'new_patient': return 'bg-blue-500';
      case 'appointment': return 'bg-orange-500';
      case 'payment': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    if (diffDays < 7) return `${diffDays} d`;
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Dashboard {isSuperAdmin ? 'Super Administrador' : 'Administrador'}
            </h1>
            <p className="text-gray-600 mb-3">
              {isSuperAdmin ?
                'Control total del sistema multi-sede' :
                'Gestión completa de tu sede'
              }
            </p>
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 w-fit">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Solo Clínicas Odontológicas
              </span>
              <span className="text-xs text-blue-600">
                (Centro de Imágenes separado)
              </span>
            </div>
          </div>
          <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filtro por Sede - Solo para Super Admin */}
      {isSuperAdmin && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Filtro por Sede
              </h2>
              <p className="text-sm text-gray-600">
                Selecciona una sede específica o visualiza datos globales
              </p>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSedeDropdown(!showSedeDropdown)}
                className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">
                  {getSelectedSedeName()}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showSedeDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showSedeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                >
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setSelectedSedeId('todas');
                        setShowSedeDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${
                        selectedSedeId === 'todas' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span className="font-medium">Todas las Sedes</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-6">Vista global del sistema</p>
                    </button>

                    {sedes.map((sede) => (
                      <button
                        key={sede.id}
                        onClick={() => {
                          setSelectedSedeId(sede.id);
                          setShowSedeDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${
                          selectedSedeId === sede.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span className="font-medium">{sede.nombre}</span>
                        </div>
                        <p className="text-xs text-gray-500 ml-6">{sede.codigo}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info de Sede para Admin */}
      {!isSuperAdmin && userBranchId && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-700 font-medium">
                Sede: {getSelectedSedeName()}
              </p>
              <p className="text-xs text-blue-600">
                Estás viendo estadísticas exclusivas de tu sede asignada
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {isSuperAdmin && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                {loading ? (
                  <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedSedeId === 'todas' ? stats?.totalSedes || 0 : 1}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  {selectedSedeId === 'todas' ? 'Sedes Activas' : 'Sede Seleccionada'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              {loading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalPacientes || 0}
                </p>
              )}
              <p className="text-sm text-gray-600">Pacientes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              {loading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalDoctores || 0}
                </p>
              )}
              <p className="text-sm text-gray-600">Doctores</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              {loading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalPersonal || 0}
                </p>
              )}
              <p className="text-sm text-gray-600">Personal Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              {loading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.citasDelDia || 0}
                </p>
              )}
              <p className="text-sm text-gray-600">Citas Hoy</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              {loading ? (
                <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(stats?.ingresosMes || 0)}
                </p>
              )}
              <p className="text-sm text-gray-600">Ingresos Mes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button
            onClick={() => navigate('/admin/patients')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Nuevo Paciente</span>
          </button>

          <button
            onClick={() => navigate('/admin/appointments')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition-colors group"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <CalendarPlus className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">Nueva Cita</span>
          </button>

          <button
            onClick={() => navigate('/admin/patients')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors group"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <ClipboardList className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">Ver Pacientes</span>
          </button>

          <button
            onClick={() => navigate('/admin/users')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:bg-purple-50 hover:border-purple-300 transition-colors group"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Personal</span>
          </button>

          <button
            onClick={() => navigate('/admin/payments')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 transition-colors group"
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">Pagos</span>
          </button>

          <button
            onClick={() => navigate('/admin/reports')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 transition-colors group"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Reportes</span>
          </button>
        </div>
      </div>

      {/* Estado del Sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Estado del Sistema
            </h3>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Disponibilidad</span>
              <span className="text-sm font-medium text-green-600">99.9%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Rendimiento</span>
              <span className="text-sm font-medium text-green-600">Óptimo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Última actualización</span>
              <span className="text-sm font-medium text-gray-900">Hace 2 min</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Actividad Reciente
            </h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-3">
            {loadingActivities ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div className="h-4 w-48 bg-gray-200 rounded"></div>
                    <div className="h-3 w-12 bg-gray-200 rounded ml-auto"></div>
                  </div>
                ))}
              </>
            ) : activities.length > 0 ? (
              activities.map((activity, index) => (
                <div key={`${activity.type}-${activity.id}-${index}`} className="flex items-center gap-3">
                  <div className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full`}></div>
                  <span className="text-sm text-gray-600 truncate flex-1">{activity.description}</span>
                  <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
                    {formatTimeAgo(activity.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No hay actividad reciente
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mensaje para datos vacíos */}
      {sedes.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay sedes registradas</h3>
          <p className="text-gray-600">
            Crea la primera sede para comenzar a ver las estadísticas del sistema.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default Dashboard;
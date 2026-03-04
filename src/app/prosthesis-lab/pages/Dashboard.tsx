import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  TestTube2,
  Timer,
  Activity,
  DollarSign
} from 'lucide-react';
import { useProsthesisStore } from '@/store/prosthesisStore';
import { useAuth } from '@/hooks/useAuth';
import { ProsthesisRequest } from '@/types';
import { parseLocalDate } from '@/utils/dateUtils';

interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface RecentActivity {
  id: string;
  type: 'created' | 'status_change' | 'received';
  description: string;
  time: string;
  status?: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const {
    statistics,
    requests,
    fetchRequests,
    refreshStatistics,
    getOverdueRequests,
    loading
  } = useProsthesisStore();

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    // Cargar datos al montar el componente
    const loadData = async () => {
      await fetchRequests(user?.sedeId);
      await refreshStatistics(user?.sedeId);
    };

    loadData();
  }, [user?.sedeId]);

  useEffect(() => {
    // Generar actividad reciente basada en las solicitudes
    if (requests.length > 0) {
      const activity: RecentActivity[] = requests
        .slice(0, 8)
        .map(req => ({
          id: req.id,
          type: req.receptionDate ? 'received' :
                req.status === 'in_progress' ? 'status_change' : 'created',
          description: `${req.prosthesisName} - ${req.description}`,
          time: new Date(req.updatedAt).toLocaleString('es-ES'),
          status: req.status
        }));

      setRecentActivity(activity);
    }
  }, [requests]);

  const overdueRequests = getOverdueRequests();

  const statCards: StatCard[] = [
    {
      title: 'Total Solicitudes',
      value: statistics?.total || 0,
      change: `+${statistics?.thisMonth || 0} este mes`,
      changeType: 'increase',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'En Proceso',
      value: statistics?.in_progress || 0,
      change: `${statistics?.sent || 0} enviadas`,
      changeType: 'neutral',
      icon: TestTube2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Completadas',
      value: statistics?.received || 0,
      change: `${Math.round(((statistics?.received || 0) / (statistics?.total || 1)) * 100)}% del total`,
      changeType: 'increase',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Atrasadas',
      value: overdueRequests.length,
      change: overdueRequests.length > 0 ? 'Requiere atención' : 'Todo al día',
      changeType: overdueRequests.length > 0 ? 'decrease' : 'increase',
      icon: AlertTriangle,
      color: overdueRequests.length > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: overdueRequests.length > 0 ? 'bg-red-100' : 'bg-green-100'
    }
  ];

  const quickActions = [
    {
      title: 'Nueva Solicitud',
      description: 'Crear solicitud de prótesis',
      icon: Package,
      color: 'bg-emerald-500 hover:bg-emerald-600',
      action: () => {
        // Navegar a nueva solicitud
        window.location.href = '/prosthesis-lab/requests?action=new';
      }
    },
    {
      title: 'Recibir Prótesis',
      description: 'Marcar prótesis como recibida',
      icon: CheckCircle,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => {
        window.location.href = '/prosthesis-lab/reception';
      }
    },
    {
      title: 'Ver Reportes',
      description: 'Análisis y estadísticas',
      icon: TrendingUp,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => {
        window.location.href = '/prosthesis-lab/analytics';
      }
    }
  ];

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'created':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'status_change':
        return <Activity className="w-4 h-4 text-orange-600" />;
      case 'received':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'sent':
        return 'Enviado';
      case 'in_progress':
        return 'En Proceso';
      case 'received':
        return 'Recibido';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard - Laboratorio de Prótesis</h1>
          <p className="text-gray-600">
            Resumen general del estado de las solicitudes protésicas
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
              {card.change && (
                <div className="mt-4 flex items-center">
                  {card.changeType === 'increase' && <TrendingUp className="w-4 h-4 text-green-500 mr-1" />}
                  {card.changeType === 'decrease' && <TrendingDown className="w-4 h-4 text-red-500 mr-1" />}
                  <span className={`text-sm ${
                    card.changeType === 'increase' ? 'text-green-600' :
                    card.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {card.change}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Acciones rápidas */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  onClick={action.action}
                  className={`w-full flex items-center p-4 rounded-lg text-white transition-colors ${action.color}`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm opacity-90">{action.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Actividad reciente */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.description}
                    </p>
                    <div className="flex items-center mt-1 space-x-2">
                      <p className="text-xs text-gray-500">{activity.time}</p>
                      {activity.status && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                          {getStatusText(activity.status)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No hay actividad reciente</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Solicitudes atrasadas (si las hay) */}
      {overdueRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-red-50 border border-red-200 rounded-lg p-6"
        >
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-red-900">
              Solicitudes Atrasadas ({overdueRequests.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdueRequests.slice(0, 6).map((request) => (
              <div key={request.id} className="bg-white p-4 rounded-lg border border-red-200">
                <h4 className="font-medium text-gray-900">{request.prosthesisName}</h4>
                <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-red-600 font-medium">
                    Vencía: {parseLocalDate(request.tentativeDate).toLocaleDateString('es-ES')}
                  </span>
                  <span className={`px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {overdueRequests.length > 6 && (
            <div className="mt-4 text-center">
              <button className="text-red-600 hover:text-red-800 font-medium text-sm">
                Ver todas las solicitudes atrasadas ({overdueRequests.length - 6} más)
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Métricas adicionales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Rendimiento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">
              {statistics?.avgProcessingTime || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Días promedio de procesamiento</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {Math.round(((statistics?.received || 0) / (statistics?.total || 1)) * 100)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Tasa de completitud</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {statistics?.thisMonth || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Solicitudes este mes</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
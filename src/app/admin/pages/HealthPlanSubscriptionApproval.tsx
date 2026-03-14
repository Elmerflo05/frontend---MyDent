/**
 * HealthPlanSubscriptionApproval - Panel de Aprobacion de Suscripciones
 * Para SuperAdmin: Gestionar solicitudes pendientes de planes de salud
 */

import { useState, useEffect, useMemo } from 'react';
import { useHealthPlanSubscriptionsStore } from '@/store/healthPlanSubscriptionsStore';
import { formatTimestampToLima } from '@/utils/dateUtils';
import {
  ClipboardCheck,
  Clock,
  CheckCircle,
  XCircle,
  User,
  FileText,
  CreditCard,
  Calendar,
  Image,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  X,
  DollarSign,
  Shield
} from 'lucide-react';
import type { SubscriptionData } from '@/services/api/healthPlanSubscriptionsApi';

export default function HealthPlanSubscriptionApproval() {
  const {
    pendingSubscriptions,
    stats,
    loading,
    error,
    loadPendingSubscriptions,
    loadStats,
    approveSubscription,
    rejectSubscription,
    clearError
  } = useHealthPlanSubscriptionsStore();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<number | 'all'>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionData | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  // Cargar datos al montar
  useEffect(() => {
    loadPendingSubscriptions();
    loadStats();
  }, [loadPendingSubscriptions, loadStats]);

  // Filtrar suscripciones
  const filteredSubscriptions = useMemo(() => {
    let result = [...pendingSubscriptions];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (sub) =>
          sub.patient_name?.toLowerCase().includes(search) ||
          sub.identification_number?.toLowerCase().includes(search) ||
          sub.subscription_number?.toLowerCase().includes(search)
      );
    }

    if (filterPlan !== 'all') {
      result = result.filter((sub) => sub.health_plan_id === filterPlan);
    }

    return result;
  }, [pendingSubscriptions, searchTerm, filterPlan]);

  // Manejar aprobacion
  const handleApprove = async (subscription: SubscriptionData) => {
    if (!confirm('Esta seguro de aprobar esta suscripcion? El plan se activara por 1 anio.')) {
      return;
    }

    setProcessingId(subscription.subscription_id);
    try {
      await approveSubscription(subscription.subscription_id);
      await loadStats();
      setSelectedSubscription(null);
    } catch (err) {
      // Error se maneja en el store
    } finally {
      setProcessingId(null);
    }
  };

  // Manejar rechazo
  const handleReject = async () => {
    if (!selectedSubscription || !rejectionReason.trim()) return;

    setProcessingId(selectedSubscription.subscription_id);
    try {
      await rejectSubscription(selectedSubscription.subscription_id, rejectionReason);
      await loadStats();
      setShowRejectModal(false);
      setSelectedSubscription(null);
      setRejectionReason('');
    } catch (err) {
      // Error se maneja en el store
    } finally {
      setProcessingId(null);
    }
  };

  // Formatear fecha de solicitud usando el campo pre-formateado del backend
  // o usando la función formatTimestampToLima como fallback
  const formatFechaSolicitud = (subscription: { fecha_solicitud_formatted?: string; date_time_registration?: string }) => {
    // Preferir el campo ya formateado del backend (convertido a zona horaria Lima en SQL)
    if (subscription.fecha_solicitud_formatted) {
      return subscription.fecha_solicitud_formatted;
    }
    // Fallback: formatear date_time_registration en el cliente
    if (subscription.date_time_registration) {
      return formatTimestampToLima(subscription.date_time_registration, 'datetime');
    }
    return '-';
  };

  // Obtener planes unicos para filtro
  const uniquePlans = useMemo(() => {
    const plans = new Map<number, string>();
    pendingSubscriptions.forEach((sub) => {
      if (sub.health_plan_id && sub.plan_name) {
        plans.set(sub.health_plan_id, sub.plan_name);
      }
    });
    return Array.from(plans.entries());
  }, [pendingSubscriptions]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Aprobacion de Suscripciones</h1>
            <p className="text-gray-600">
              Gestiona las solicitudes de suscripcion a planes de salud
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.total_pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Activas</p>
                <p className="text-2xl font-bold text-green-700">{stats.total_active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Rechazadas</p>
                <p className="text-2xl font-bold text-red-700">{stats.total_rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="bg-white border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Ingresos Mensuales</p>
                <p className="text-2xl font-bold text-blue-700">
                  S/ {(typeof stats.total_monthly_revenue === 'number' ? stats.total_monthly_revenue : parseFloat(stats.total_monthly_revenue || 0)).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>
      )}

      {/* Stats by Plan */}
      {stats?.by_plan && stats.by_plan.length > 0 && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.by_plan.map((planStats) => (
            <div
              key={planStats.plan_code}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-teal-600" />
                <h4 className="font-semibold text-gray-900">{planStats.plan_name}</h4>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">
                  Activas: <span className="font-semibold text-green-600">{planStats.active_subscriptions}</span>
                </p>
                <p className="text-gray-600">
                  Pendientes: <span className="font-semibold text-yellow-600">{planStats.pending_subscriptions}</span>
                </p>
                <p className="text-gray-600">
                  Ingresos: <span className="font-semibold text-blue-600">S/ {(typeof planStats.monthly_revenue === 'number' ? planStats.monthly_revenue : parseFloat(planStats.monthly_revenue || 0)).toFixed(2)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI o numero de suscripcion..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Plan Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterPlan === 'all' ? 'all' : filterPlan}
              onChange={(e) => setFilterPlan(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">Todos los planes</option>
              {uniquePlans.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => {
              loadPendingSubscriptions();
              loadStats();
            }}
            disabled={loading}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Subscriptions List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="mt-4 text-gray-600">Cargando solicitudes...</p>
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ClipboardCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No hay solicitudes pendientes</p>
          <p className="text-gray-500 text-sm mt-2">
            Las nuevas solicitudes apareceran aqui
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubscriptions.map((subscription) => (
            <div
              key={subscription.subscription_id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Info del Paciente y Plan */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {subscription.patient_name || 'Paciente'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          DNI: {subscription.identification_number || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Plan
                        </p>
                        <p className="text-sm font-semibold text-teal-700">
                          {subscription.plan_name || 'Plan'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Mensualidad
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          S/ {(typeof subscription.monthly_fee === 'number' ? subscription.monthly_fee : parseFloat(subscription.monthly_fee || 0)).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          Metodo de Pago
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {subscription.payment_method || 'No especificado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Fecha Solicitud
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatFechaSolicitud(subscription)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Voucher y Acciones */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Ver Voucher */}
                    {subscription.voucher_url && (
                      <button
                        onClick={() => {
                          setSelectedSubscription(subscription);
                          setShowVoucherModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Image className="w-4 h-4" />
                        Ver Voucher
                      </button>
                    )}

                    {/* Aprobar */}
                    <button
                      onClick={() => handleApprove(subscription)}
                      disabled={processingId === subscription.subscription_id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {processingId === subscription.subscription_id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ThumbsUp className="w-4 h-4" />
                      )}
                      Aprobar
                    </button>

                    {/* Rechazar */}
                    <button
                      onClick={() => {
                        setSelectedSubscription(subscription);
                        setShowRejectModal(true);
                      }}
                      disabled={processingId === subscription.subscription_id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      Rechazar
                    </button>
                  </div>
                </div>

                {/* Notas */}
                {subscription.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notas:</span> {subscription.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Voucher */}
      {showVoucherModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Voucher de Pago</h3>
                <button
                  onClick={() => {
                    setShowVoucherModal(false);
                    setSelectedSubscription(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Info del paciente */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Paciente</p>
                  <p className="font-semibold text-gray-900">{selectedSubscription.patient_name}</p>
                  <p className="text-sm text-gray-600">DNI: {selectedSubscription.identification_number}</p>
                </div>

                {/* Imagen del Voucher */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {selectedSubscription.voucher_url ? (
                    <img
                      src={`${(import.meta.env.VITE_API_URL || 'http://localhost:4015/api').replace('/api', '')}${selectedSubscription.voucher_url}`}
                      alt="Voucher de pago"
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Image className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No hay imagen de voucher</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowVoucherModal(false);
                    setSelectedSubscription(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => handleApprove(selectedSubscription)}
                  disabled={processingId === selectedSubscription.subscription_id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Aprobar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rechazo */}
      {showRejectModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Rechazar Suscripcion</h3>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Paciente: <span className="font-semibold">{selectedSubscription.patient_name}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Plan: <span className="font-semibold">{selectedSubscription.plan_name}</span>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del Rechazo *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ingrese el motivo del rechazo..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || processingId === selectedSubscription.subscription_id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {processingId === selectedSubscription.subscription_id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    'Confirmar Rechazo'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

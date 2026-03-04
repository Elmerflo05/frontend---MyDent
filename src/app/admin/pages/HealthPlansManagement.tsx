// ============================================================================
// HEALTH PLANS MANAGEMENT - Panel de Gestion de Planes de Salud (Admin)
// Con seccion de Solicitudes Pendientes de Aprobacion
// ============================================================================

import { useState, useEffect } from 'react';
import { useHealthPlanStore } from '@/store/healthPlanStore';
import { useHealthPlanSubscriptionsStore } from '@/store/healthPlanSubscriptionsStore';
import { useAuthStore } from '@/store/authStore';
import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  Users,
  FileText,
  Search,
  Clock,
  Shield,
  Settings,
  ClipboardCheck
} from 'lucide-react';
import type { BaseHealthPlan, HealthPlanType, HealthPlanStatus } from '@/types/healthPlans';
import { getPlanBenefitText } from '@/types/healthPlans';
import EditHealthPlanModal from '@/components/healthPlans/EditHealthPlanModal';
import HealthPlanSettingsPage from './HealthPlanSettings';
import HealthPlanTermsManagement from './HealthPlanTermsManagement';
import HealthPlanSubscriptionApproval from './HealthPlanSubscriptionApproval';

export default function HealthPlansManagement() {
  const { user } = useAuthStore();
  const {
    plans,
    loading,
    error,
    loadPlans,
    loadPlansBySede,
    deletePlan,
    activatePlan,
    deactivatePlan,
    clearError
  } = useHealthPlanStore();

  // Store de suscripciones pendientes
  const {
    pendingSubscriptions,
    stats: subscriptionStats,
    loadPendingSubscriptions,
    loadStats
  } = useHealthPlanSubscriptionsStore();

  const [editingPlan, setEditingPlan] = useState<BaseHealthPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<HealthPlanType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<HealthPlanStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'plans' | 'pending' | 'settings' | 'terms'>('plans');

  // Debug: Mostrar estadisticas de planes
  const plansStats = {
    total: plans.length,
    active: plans.filter(p => p.status === 'active').length,
    inactive: plans.filter(p => p.status === 'inactive').length,
    draft: plans.filter(p => p.status === 'draft').length
  };

  // Verificar si es super admin (puede editar) o admin de sede (solo lectura)
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';
  const canEdit = isSuperAdmin; // Solo super admin puede editar

  useEffect(() => {
    if (isSuperAdmin) {
      // Super admin: cargar todos los planes y solicitudes
      loadPlans();
      loadPendingSubscriptions();
      loadStats();
    } else if (isAdmin) {
      // Administrador de sede: cargar todos los planes activos (solo lectura)
      // Los planes de salud son globales, no específicos de sede
      loadPlans();
    }
  }, [user, isSuperAdmin, isAdmin]);

  const handleDelete = async (planId: string) => {
    if (window.confirm('¿Está seguro de eliminar este plan? Esta acción no se puede deshacer.')) {
      try {
        await deletePlan(planId);
        alert('Plan eliminado exitosamente');
      } catch (err) {
        alert(error || 'Error al eliminar el plan');
      }
    }
  };

  const handleActivate = async (planId: string) => {
    try {
      await activatePlan(planId);
      alert('Plan activado exitosamente');
    } catch (err) {
      alert(error || 'Error al activar el plan');
    }
  };

  const handleDeactivate = async (planId: string) => {
    if (window.confirm('¿Está seguro de desactivar este plan?')) {
      try {
        await deactivatePlan(planId);
        alert('Plan desactivado exitosamente');
      } catch (err) {
        alert(error || 'Error al desactivar el plan');
      }
    }
  };

  // Filtrar planes
  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || plan.type === filterType;
    const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: HealthPlanStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: HealthPlanType) => {
    const labels = {
      basic: 'Básico',
      standard: 'Estándar',
      premium: 'Premium',
      family: 'Familiar'
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: HealthPlanStatus) => {
    const labels = {
      active: 'Activo',
      inactive: 'Inactivo',
      draft: 'Borrador'
    };
    return labels[status] || status;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion de Planes de Salud</h1>
            <p className="text-gray-600">Administra los planes de salud y aprueba solicitudes</p>
          </div>
        </div>
      </div>

      {/* Stats Panel - Ahora incluye solicitudes pendientes */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Planes</p>
              <p className="text-2xl font-bold text-gray-900">{plansStats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Activos</p>
              <p className="text-2xl font-bold text-green-700">{plansStats.active}</p>
            </div>
            <Users className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactivos</p>
              <p className="text-2xl font-bold text-gray-700">{plansStats.inactive}</p>
            </div>
            <PowerOff className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        {/* Solicitudes Pendientes - Solo para super admin */}
        {canEdit && (
          <div
            className="bg-white border-2 border-orange-300 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveTab('pending')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Solicitudes Pendientes</p>
                <p className="text-2xl font-bold text-orange-700">
                  {subscriptionStats?.total_pending || pendingSubscriptions.length}
                </p>
              </div>
              <div className="relative">
                <Clock className="w-8 h-8 text-orange-400" />
                {pendingSubscriptions.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs - Solo mostrar pestaña de solicitudes para super admin */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('plans')}
            className={`pb-3 px-1 font-semibold transition-colors relative ${
              activeTab === 'plans'
                ? 'text-teal-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Planes de Salud
            {activeTab === 'plans' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />
            )}
          </button>
          {canEdit && (
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-3 px-1 font-semibold transition-colors relative flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'text-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              Aprobar Suscripciones
              {pendingSubscriptions.length > 0 && (
                <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingSubscriptions.length}
                </span>
              )}
              {activeTab === 'pending' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />
              )}
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => setActiveTab('terms')}
              className={`pb-3 px-1 font-semibold transition-colors relative flex items-center gap-2 ${
                activeTab === 'terms'
                  ? 'text-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              Términos y Condiciones
              {activeTab === 'terms' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />
              )}
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-3 px-1 font-semibold transition-colors relative flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'text-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              Configuración
              {activeTab === 'settings' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tab Content: Aprobar Suscripciones */}
      {activeTab === 'pending' && (
        <HealthPlanSubscriptionApproval />
      )}

      {/* Tab Content: Planes */}
      {activeTab === 'plans' && (
        <>
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
              <p className="text-red-800">{error}</p>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar planes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as HealthPlanType | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="basic">Básico</option>
            <option value="standard">Estándar</option>
            <option value="premium">Premium</option>
            <option value="family">Familiar</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as HealthPlanStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="draft">Borrador</option>
          </select>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando planes...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No se encontraron planes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const typeColors = {
              basic: 'from-blue-500 to-blue-600',
              standard: 'from-purple-500 to-purple-600',
              premium: 'from-amber-500 to-amber-600',
              family: 'from-pink-500 to-pink-600'
            };

            const typeIcons = {
              basic: '💙',
              standard: '⭐',
              premium: '👑',
              family: '👨‍👩‍👧‍👦'
            };

            return (
              <div
                key={plan.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-blue-200"
              >
                {/* Card Header - Gradient */}
                <div className={`bg-gradient-to-r ${typeColors[plan.type]} p-6 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 opacity-10 text-8xl">
                    {typeIcons[plan.type]}
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                        <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                          {getTypeLabel(plan.type)}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        plan.status === 'active' ? 'bg-green-400 text-green-900' :
                        plan.status === 'draft' ? 'bg-yellow-400 text-yellow-900' :
                        'bg-gray-400 text-gray-900'
                      }`}>
                        {getStatusLabel(plan.status)}
                      </span>
                    </div>
                    <p className="text-sm text-white text-opacity-90 line-clamp-2 mt-2">
                      {plan.description}
                    </p>
                  </div>
                </div>

                {/* Precio Destacado */}
                <div className="px-6 py-4 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
                  <div className="text-center">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-sm text-gray-600">S/</span>
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price.toFixed(0)}
                      </span>
                      <span className="text-sm text-gray-500">
                        /{plan.billingCycle === 'monthly' ? 'mes' : plan.billingCycle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body - Descripción de beneficios */}
                <div className="p-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Precios Preferenciales
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {getPlanBenefitText(plan.planCode)}
                  </p>

                  {plan.maxSubscribers && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>Límite: {plan.maxSubscribers} suscriptores</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    {/* Botones de acción solo para super admin */}
                    {canEdit ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingPlan(plan)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all hover:scale-110"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {plan.status === 'active' ? (
                          <button
                            onClick={() => handleDeactivate(plan.id)}
                            className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-all hover:scale-110"
                            title="Desactivar"
                          >
                            <PowerOff className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(plan.id)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-all hover:scale-110"
                            title="Activar"
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all hover:scale-110"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 italic">
                        Solo lectura
                      </div>
                    )}

                    <button
                      className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-semibold hover:bg-blue-50 rounded-lg transition-all"
                      onClick={() => setEditingPlan(plan)}
                    >
                      Ver detalles →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Tab Content: Términos y Condiciones */}
      {activeTab === 'terms' && (
        <HealthPlanTermsManagement />
      )}

      {/* Tab Content: Configuración */}
      {activeTab === 'settings' && (
        <HealthPlanSettingsPage />
      )}

      {/* Modal de edicion / detalle */}
      {editingPlan && (
        <EditHealthPlanModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSuccess={() => {
            setEditingPlan(null);
            // Recargar planes
            if (user?.role === 'super_admin') {
              loadPlans();
            } else if (user?.sedeId) {
              loadPlansBySede(user.sedeId);
            }
          }}
          readOnly={!canEdit}
        />
      )}
    </div>
  );
}

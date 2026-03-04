/**
 * MyHealthPlan - Portal del Paciente para Ver su Plan Activo
 * Muestra detalles del plan, vigencia, dependientes y beneficios
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useHealthPlanSubscriptionsStore } from '@/store/healthPlanSubscriptionsStore';
import { healthPlanDependentsApi, DependentData } from '@/services/api/healthPlanDependentsApi';
import { format, differenceInDays, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Shield,
  Heart,
  Star,
  Crown,
  Users,
  Check,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  UserPlus,
  X,
  RefreshCw,
  DollarSign,
  Gift,
  ChevronRight,
  FileText,
  Info,
  Trash2,
  Edit2
} from 'lucide-react';

export default function MyHealthPlan() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    patientSubscription,
    loading: subscriptionLoading,
    error: subscriptionError,
    loadPatientActiveSubscription,
    clearError
  } = useHealthPlanSubscriptionsStore();

  // Estados
  const [dependents, setDependents] = useState<DependentData[]>([]);
  const [loadingDependents, setLoadingDependents] = useState(false);
  const [showAddDependentModal, setShowAddDependentModal] = useState(false);
  const [newDependent, setNewDependent] = useState({
    first_name: '',
    last_name: '',
    identification_number: '',
    relationship: '',
    birth_date: ''
  });
  const [addingDependent, setAddingDependent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos al montar
  useEffect(() => {
    if (user?.patientId) {
      loadPatientActiveSubscription(parseInt(user.patientId));
    }
  }, [user, loadPatientActiveSubscription]);

  // Cargar dependientes cuando hay suscripcion activa
  useEffect(() => {
    if (patientSubscription?.subscription_id) {
      loadDependents();
    }
  }, [patientSubscription]);

  const loadDependents = async () => {
    if (!patientSubscription?.subscription_id) return;

    setLoadingDependents(true);
    try {
      const response = await healthPlanDependentsApi.getDependentsBySubscription(
        patientSubscription.subscription_id
      );
      setDependents(response.data);
    } catch (err) {
      console.error('Error loading dependents:', err);
    } finally {
      setLoadingDependents(false);
    }
  };

  // Calcular dias restantes
  const daysRemaining = useMemo(() => {
    if (!patientSubscription?.end_date) return null;
    const endDate = new Date(patientSubscription.end_date);
    const today = new Date();

    if (isAfter(today, endDate)) return 0;
    return differenceInDays(endDate, today);
  }, [patientSubscription]);

  // Porcentaje de tiempo transcurrido
  const progressPercentage = useMemo(() => {
    if (!patientSubscription?.start_date || !patientSubscription?.end_date) return 0;
    const startDate = new Date(patientSubscription.start_date);
    const endDate = new Date(patientSubscription.end_date);
    const today = new Date();

    const totalDays = differenceInDays(endDate, startDate);
    const elapsedDays = differenceInDays(today, startDate);

    return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
  }, [patientSubscription]);

  // Es plan familiar?
  const isFamilyPlan = patientSubscription?.plan_type === 'familiar';

  // Agregar dependiente
  const handleAddDependent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientSubscription?.subscription_id) return;

    setAddingDependent(true);
    setError(null);

    try {
      await healthPlanDependentsApi.addDependent({
        subscription_id: patientSubscription.subscription_id,
        ...newDependent
      });

      await loadDependents();
      setShowAddDependentModal(false);
      setNewDependent({
        first_name: '',
        last_name: '',
        identification_number: '',
        relationship: '',
        birth_date: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar dependiente');
    } finally {
      setAddingDependent(false);
    }
  };

  // Eliminar dependiente
  const handleRemoveDependent = async (dependentId: number) => {
    if (!confirm('Esta seguro de eliminar este dependiente?')) return;

    try {
      await healthPlanDependentsApi.removeDependent(dependentId);
      await loadDependents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar dependiente');
    }
  };

  // Iconos por tipo de plan
  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'personal': return <Shield className="w-8 h-8" />;
      case 'familiar': return <Users className="w-8 h-8" />;
      case 'planitium': return <Crown className="w-8 h-8" />;
      case 'gold': case 'oro': return <Star className="w-8 h-8" />;
      default: return <Heart className="w-8 h-8" />;
    }
  };

  // Colores por tipo de plan
  const getPlanColors = (type: string) => {
    switch (type) {
      case 'personal': return { bg: 'from-blue-500 to-blue-600', text: 'text-blue-600', light: 'bg-blue-50' };
      case 'familiar': return { bg: 'from-green-500 to-green-600', text: 'text-green-600', light: 'bg-green-50' };
      case 'planitium': return { bg: 'from-purple-500 to-purple-600', text: 'text-purple-600', light: 'bg-purple-50' };
      case 'gold': case 'oro': return { bg: 'from-amber-500 to-amber-600', text: 'text-amber-600', light: 'bg-amber-50' };
      default: return { bg: 'from-teal-500 to-teal-600', text: 'text-teal-600', light: 'bg-teal-50' };
    }
  };

  // Loading
  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando informacion del plan...</p>
        </div>
      </div>
    );
  }

  // No tiene plan activo
  if (!patientSubscription || patientSubscription.subscription_status !== 'active') {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-8 text-white text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 opacity-80" />
              <h2 className="text-2xl font-bold mb-2">No tienes un Plan Activo</h2>
              <p className="text-white/80">
                Afiliate a uno de nuestros planes y disfruta de beneficios exclusivos
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Tartrectomia (limpieza) gratuita</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Primera consulta sin costo</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Descuentos en procedimientos</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Atencion prioritaria</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/patient/health-plan-subscription')}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2"
              >
                Ver Planes Disponibles
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const colors = getPlanColors(patientSubscription.plan_type);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Error */}
        {(error || subscriptionError) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error || subscriptionError}</p>
            </div>
            <button
              onClick={() => {
                setError(null);
                clearError();
              }}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Card Principal del Plan */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          {/* Header */}
          <div className={`bg-gradient-to-r ${colors.bg} p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  {getPlanIcon(patientSubscription.plan_type)}
                </div>
                <div>
                  <p className="text-sm text-white/80">Tu Plan Activo</p>
                  <h1 className="text-2xl font-bold">{patientSubscription.plan_name}</h1>
                  <p className="text-white/80 capitalize">{patientSubscription.plan_type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/80">Numero de Suscripcion</p>
                <p className="font-mono text-lg">{patientSubscription.subscription_number}</p>
              </div>
            </div>
          </div>

          {/* Barra de Progreso de Vigencia */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Vigencia del Plan</span>
              <span className={`text-sm font-semibold ${
                daysRemaining && daysRemaining < 30 ? 'text-orange-600' : 'text-green-600'
              }`}>
                {daysRemaining} dias restantes
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  daysRemaining && daysRemaining < 30 ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{ width: `${100 - progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>
                Inicio: {format(new Date(patientSubscription.start_date), "dd MMM yyyy", { locale: es })}
              </span>
              <span>
                Vence: {format(new Date(patientSubscription.end_date!), "dd MMM yyyy", { locale: es })}
              </span>
            </div>
          </div>

          {/* Informacion del Plan */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`${colors.light} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className={`w-4 h-4 ${colors.text}`} />
                  <span className="text-sm text-gray-600">Mensualidad</span>
                </div>
                <p className={`text-xl font-bold ${colors.text}`}>
                  S/ {(typeof patientSubscription.monthly_fee === 'number' ? patientSubscription.monthly_fee : parseFloat(patientSubscription.monthly_fee || '0')).toFixed(2)}
                </p>
              </div>

              <div className={`${colors.light} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className={`w-4 h-4 ${colors.text}`} />
                  <span className="text-sm text-gray-600">Estado</span>
                </div>
                <p className={`text-xl font-bold ${colors.text}`}>Activo</p>
              </div>

              <div className={`${colors.light} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className={`w-4 h-4 ${colors.text}`} />
                  <span className="text-sm text-gray-600">Proximo Pago</span>
                </div>
                <p className={`text-xl font-bold ${colors.text}`}>
                  {patientSubscription.next_payment_date
                    ? format(new Date(patientSubscription.next_payment_date), "dd/MM", { locale: es })
                    : '-'}
                </p>
              </div>

              {isFamilyPlan && (
                <div className={`${colors.light} rounded-lg p-4`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className={`w-4 h-4 ${colors.text}`} />
                    <span className="text-sm text-gray-600">Dependientes</span>
                  </div>
                  <p className={`text-xl font-bold ${colors.text}`}>{dependents.length}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Beneficios */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Gift className={`w-6 h-6 ${colors.text}`} />
            Beneficios de tu Plan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Tartrectomia Gratuita</p>
                <p className="text-sm text-gray-600">Limpieza dental incluida una vez al anio</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Primera Consulta Gratis</p>
                <p className="text-sm text-gray-600">Evaluacion inicial sin costo</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Descuentos Exclusivos</p>
                <p className="text-sm text-gray-600">Precios especiales en todos los procedimientos</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Atencion Prioritaria</p>
                <p className="text-sm text-gray-600">Agenda preferencial de citas</p>
              </div>
            </div>

            {isFamilyPlan && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg md:col-span-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Cobertura Familiar</p>
                  <p className="text-sm text-gray-600">
                    Agrega a tus familiares directos y comparte los beneficios
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dependientes (Solo Plan Familiar) */}
        {isFamilyPlan && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className={`w-6 h-6 ${colors.text}`} />
                Dependientes
              </h2>
              <button
                onClick={() => setShowAddDependentModal(true)}
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${colors.bg} text-white rounded-lg font-semibold hover:opacity-90 transition-opacity`}
              >
                <UserPlus className="w-4 h-4" />
                Agregar
              </button>
            </div>

            {loadingDependents ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Cargando dependientes...</p>
              </div>
            ) : dependents.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No tienes dependientes registrados</p>
                <p className="text-sm text-gray-500">
                  Agrega a tus familiares para que disfruten de los beneficios del plan
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {dependents.map((dependent) => (
                  <div
                    key={dependent.dependent_id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${colors.light} rounded-full flex items-center justify-center`}>
                        <User className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {dependent.first_name} {dependent.last_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {dependent.relationship} - DNI: {dependent.identification_number}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDependent(dependent.dependent_id!)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar dependiente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Agregar Dependiente */}
        {showAddDependentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Agregar Dependiente</h3>
                  <button
                    onClick={() => setShowAddDependentModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddDependent} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={newDependent.first_name}
                        onChange={(e) => setNewDependent({ ...newDependent, first_name: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        value={newDependent.last_name}
                        onChange={(e) => setNewDependent({ ...newDependent, last_name: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DNI *
                    </label>
                    <input
                      type="text"
                      value={newDependent.identification_number}
                      onChange={(e) => setNewDependent({ ...newDependent, identification_number: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parentesco *
                    </label>
                    <select
                      value={newDependent.relationship}
                      onChange={(e) => setNewDependent({ ...newDependent, relationship: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Conyuge">Conyuge</option>
                      <option value="Hijo/a">Hijo/a</option>
                      <option value="Padre">Padre</option>
                      <option value="Madre">Madre</option>
                      <option value="Hermano/a">Hermano/a</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={newDependent.birth_date}
                      onChange={(e) => setNewDependent({ ...newDependent, birth_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddDependentModal(false)}
                      className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={addingDependent}
                      className="flex-1 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {addingDependent ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Agregar'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

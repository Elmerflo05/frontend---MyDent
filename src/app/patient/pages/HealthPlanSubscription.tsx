/**
 * HealthPlanSubscription - Portal del Paciente para Suscribirse a Planes
 * Permite seleccionar plan, metodo de pago y subir voucher
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useHealthPlanSubscriptionsStore } from '@/store/healthPlanSubscriptionsStore';
import healthPlansApi, { HealthPlanData } from '@/services/api/healthPlansApi';
import { getPlanBenefitText } from '@/types/healthPlans';
import { PAYMENT_METHODS_DETAILED, CONTACT_INFO } from '@/constants/ui';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Shield,
  Heart,
  Star,
  Crown,
  Users,
  Check,
  ArrowRight,
  ArrowLeft,
  Upload,
  Image,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  RefreshCw,
  DollarSign,
  Phone,
  FileText,
  Info
} from 'lucide-react';

// Tipos locales
interface MappedPlan {
  id: number;
  code: string;
  name: string;
  type: string;
  description: string;
  monthlyFee: number | string;
}

// Helper para formatear precios (convierte string/Decimal a número)
const formatPrice = (price: number | string | null | undefined, decimals: number = 2): string => {
  if (price === null || price === undefined || price === '') return '0';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '0';
  return numPrice.toFixed(decimals);
};

export default function HealthPlanSubscription() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    patientSubscription,
    loading: storeLoading,
    error: storeError,
    loadPatientActiveSubscription,
    createSubscription,
    clearError
  } = useHealthPlanSubscriptionsStore();

  // Estados
  const [plans, setPlans] = useState<MappedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'select' | 'payment' | 'voucher' | 'confirm' | 'success'>('select');
  const [selectedPlan, setSelectedPlan] = useState<MappedPlan | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar planes y suscripcion activa
  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar planes activos
      const activePlans = await healthPlansApi.getActivePlans();
      const mapped = mapPlans(activePlans);
      setPlans(mapped);

      // Cargar suscripcion activa si existe
      if (user?.patient_id) {
        await loadPatientActiveSubscription(user.patient_id);
      }
    } catch (err) {
      setError('Error al cargar los planes disponibles');
    } finally {
      setLoading(false);
    }
  };

  // Mapear planes del backend
  const mapPlans = (backendPlans: HealthPlanData[]): MappedPlan[] => {
    return backendPlans.map((plan) => ({
      id: plan.health_plan_id || 0,
      code: plan.plan_code || '',
      name: plan.plan_name,
      type: plan.plan_type,
      description: plan.description || '',
      monthlyFee: plan.monthly_fee || 0
    }));
  };

  // Manejar seleccion de plan
  const handleSelectPlan = (plan: MappedPlan) => {
    setSelectedPlan(plan);
    setStep('payment');
  };

  // Manejar seleccion de metodo de pago
  const handleSelectPaymentMethod = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    setStep('voucher');
  };

  // Manejar carga de voucher
  const handleVoucherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo no debe superar 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }

      setVoucherFile(file);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setVoucherPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  // Continuar a confirmacion
  const handleContinueToConfirm = () => {
    if (!voucherFile) {
      setError('Debes subir el voucher de pago');
      return;
    }
    setStep('confirm');
  };

  // Enviar suscripcion
  const handleSubmit = async () => {
    if (!selectedPlan || !user?.patient_id || !voucherFile) {
      if (!user?.patient_id) {
        setError('Error: No se encontró el ID del paciente. Por favor, cierra sesión e inicia sesión nuevamente.');
      }
      if (!voucherFile) {
        setError('Error: Debes subir el voucher de pago.');
      }
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createSubscription({
        health_plan_id: selectedPlan.id,
        patient_id: user.patient_id,
        voucher_file: voucherFile,
        payment_method: selectedPaymentMethod
      });

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset para nueva solicitud
  const handleReset = () => {
    setSelectedPlan(null);
    setSelectedPaymentMethod('');
    setVoucherFile(null);
    setVoucherPreview('');
    setStep('select');
    setError(null);
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
      case 'personal': return { bg: 'from-blue-500 to-blue-600', border: 'border-blue-300', light: 'bg-blue-50' };
      case 'familiar': return { bg: 'from-green-500 to-green-600', border: 'border-green-300', light: 'bg-green-50' };
      case 'planitium': return { bg: 'from-purple-500 to-purple-600', border: 'border-purple-300', light: 'bg-purple-50' };
      case 'gold': case 'oro': return { bg: 'from-amber-500 to-amber-600', border: 'border-amber-300', light: 'bg-amber-50' };
      default: return { bg: 'from-teal-500 to-teal-600', border: 'border-teal-300', light: 'bg-teal-50' };
    }
  };

  // Si ya tiene suscripcion activa o pendiente
  if (patientSubscription) {
    const isPending = patientSubscription.approval_status === 'pending';
    const isActive = patientSubscription.approval_status === 'approved' && patientSubscription.subscription_status === 'active';

    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${
            isPending ? 'border-yellow-300' : isActive ? 'border-green-300' : 'border-red-300'
          }`}>
            {/* Header */}
            <div className={`p-6 ${
              isPending ? 'bg-yellow-50' : isActive ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="flex items-center gap-4">
                {isPending ? (
                  <Clock className="w-12 h-12 text-yellow-600" />
                ) : isActive ? (
                  <CheckCircle className="w-12 h-12 text-green-600" />
                ) : (
                  <AlertCircle className="w-12 h-12 text-red-600" />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isPending ? 'Solicitud en Revision' : isActive ? 'Plan Activo' : 'Solicitud Rechazada'}
                  </h2>
                  <p className="text-gray-600">
                    {isPending
                      ? 'Tu solicitud esta siendo revisada por nuestro equipo'
                      : isActive
                      ? `Disfruta de los beneficios de tu plan ${patientSubscription.plan_name}`
                      : 'Tu solicitud fue rechazada'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="font-semibold text-gray-900">{patientSubscription.plan_name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Mensualidad</p>
                  <p className="font-semibold text-gray-900">
                    S/ {formatPrice(patientSubscription.monthly_fee, 2)}
                  </p>
                </div>
                {isActive && patientSubscription.end_date && (
                  <>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Fecha de Inicio</p>
                      <p className="font-semibold text-gray-900">
                        {format(new Date(patientSubscription.start_date), "dd/MM/yyyy", { locale: es })}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Vence</p>
                      <p className="font-semibold text-gray-900">
                        {format(new Date(patientSubscription.end_date), "dd/MM/yyyy", { locale: es })}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {patientSubscription.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-800">Motivo del rechazo:</p>
                  <p className="text-red-700">{patientSubscription.rejection_reason}</p>
                </div>
              )}

              {isActive && (
                <button
                  onClick={() => navigate('/patient/my-health-plan')}
                  className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold"
                >
                  Ver Mi Plan
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando planes disponibles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Afiliate a Nuestros Planes</h1>
          <p className="text-gray-600">Elige el plan que mejor se adapte a tus necesidades</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['select', 'payment', 'voucher', 'confirm'].map((s, idx) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s ? 'bg-teal-600 text-white' :
                ['select', 'payment', 'voucher', 'confirm'].indexOf(step) > idx
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {['select', 'payment', 'voucher', 'confirm'].indexOf(step) > idx ? (
                  <Check className="w-4 h-4" />
                ) : (
                  idx + 1
                )}
              </div>
              {idx < 3 && (
                <div className={`w-12 h-1 ${
                  ['select', 'payment', 'voucher', 'confirm'].indexOf(step) > idx
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {(error || storeError) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error || storeError}</p>
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

        {/* Step 1: Seleccionar Plan */}
        {step === 'select' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => {
              const colors = getPlanColors(plan.type);
              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${colors.border} hover:shadow-xl transition-all cursor-pointer`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {/* Plan Header */}
                  <div className={`bg-gradient-to-r ${colors.bg} p-6 text-white`}>
                    <div className="flex items-center justify-between">
                      {getPlanIcon(plan.type)}
                      <span className="text-sm bg-white/20 px-3 py-1 rounded-full uppercase font-semibold">
                        {plan.type}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mt-4">{plan.name}</h3>
                    <p className="text-white/80 text-sm mt-1">{plan.description}</p>
                  </div>

                  {/* Precio */}
                  <div className={`${colors.light} px-6 py-4`}>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-gray-600">S/</span>
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(plan.monthlyFee, 0)}
                      </span>
                      <span className="text-gray-600">/mes</span>
                    </div>
                  </div>

                  {/* Precios Preferenciales */}
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Precios Preferenciales:</h4>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {getPlanBenefitText(plan.code)}
                      </p>
                    </div>

                    <button className={`w-full mt-6 py-3 bg-gradient-to-r ${colors.bg} text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}>
                      Elegir Plan
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Step 2: Metodo de Pago */}
        {step === 'payment' && selectedPlan && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <button
                onClick={() => setStep('select')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Metodo de Pago</h2>
              <p className="text-gray-600 mb-6">Selecciona como realizaras el pago</p>

              {/* Plan seleccionado */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getPlanIcon(selectedPlan.type)}
                    <div>
                      <p className="font-semibold text-gray-900">{selectedPlan.name}</p>
                      <p className="text-sm text-gray-600">Mensualidad</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-teal-600">
                    S/ {formatPrice(selectedPlan.monthlyFee, 2)}
                  </p>
                </div>
              </div>

              {/* Metodos de pago */}
              <div className="grid grid-cols-2 gap-4">
                {PAYMENT_METHODS_DETAILED.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleSelectPaymentMethod(method.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                      selectedPaymentMethod === method.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{method.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Subir Voucher */}
        {step === 'voucher' && selectedPlan && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <button
                onClick={() => setStep('payment')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Subir Voucher de Pago</h2>
              <p className="text-gray-600 mb-6">Sube la imagen del comprobante de pago</p>

              {/* Info del pago */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-teal-900">Informacion de Pago</p>
                    <p className="text-sm text-teal-700 mt-1">
                      Metodo: {PAYMENT_METHODS_DETAILED.find(m => m.id === selectedPaymentMethod)?.name}
                    </p>
                    <p className="text-sm text-teal-700">
                      Monto: S/ {formatPrice(selectedPlan.monthlyFee, 2)}
                    </p>
                    {PAYMENT_METHODS_DETAILED.find(m => m.id === selectedPaymentMethod)?.number && (
                      <p className="text-sm text-teal-700">
                        Numero: {PAYMENT_METHODS_DETAILED.find(m => m.id === selectedPaymentMethod)?.number}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* QR si aplica */}
              {PAYMENT_METHODS_DETAILED.find(m => m.id === selectedPaymentMethod)?.qr && (
                <div className="text-center mb-6">
                  <img
                    src={PAYMENT_METHODS_DETAILED.find(m => m.id === selectedPaymentMethod)?.qr}
                    alt="QR de pago"
                    className="w-48 h-48 mx-auto border rounded-lg"
                  />
                  <p className="text-sm text-gray-600 mt-2">Escanea el QR para realizar el pago</p>
                </div>
              )}

              {/* Upload Area */}
              <div className="mb-6">
                <label className="block">
                  <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    voucherPreview ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-teal-500'
                  }`}>
                    {voucherPreview ? (
                      <div>
                        <img
                          src={voucherPreview}
                          alt="Preview del voucher"
                          className="max-h-48 mx-auto rounded-lg mb-4"
                        />
                        <p className="text-green-600 font-semibold flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Voucher cargado
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Haz clic para cambiar</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="font-semibold text-gray-900">Haz clic o arrastra tu voucher</p>
                        <p className="text-sm text-gray-600 mt-1">PNG, JPG hasta 5MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleVoucherChange}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                onClick={handleContinueToConfirm}
                disabled={!voucherFile}
                className="w-full py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continuar
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmar */}
        {step === 'confirm' && selectedPlan && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <button
                onClick={() => setStep('voucher')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmar Suscripcion</h2>
              <p className="text-gray-600 mb-6">Revisa los datos antes de enviar</p>

              {/* Resumen */}
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getPlanIcon(selectedPlan.type)}
                      <div>
                        <p className="font-semibold text-gray-900">{selectedPlan.name}</p>
                        <p className="text-sm text-gray-600">{selectedPlan.description}</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-teal-600">
                      S/ {formatPrice(selectedPlan.monthlyFee, 2)}/mes
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Metodo de Pago</p>
                    <p className="font-semibold text-gray-900">
                      {PAYMENT_METHODS_DETAILED.find(m => m.id === selectedPaymentMethod)?.name}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Voucher</p>
                    <p className="font-semibold text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Subido
                    </p>
                  </div>
                </div>

                {voucherPreview && (
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Vista previa del voucher:</p>
                    <img
                      src={voucherPreview}
                      alt="Voucher"
                      className="max-h-32 mx-auto rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Nota */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold">Proceso de Aprobacion</p>
                    <p>Tu solicitud sera revisada por nuestro equipo. Te notificaremos cuando sea aprobada.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Solicitud
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Exito */}
        {step === 'success' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitud Enviada</h2>
              <p className="text-gray-600 mb-6">
                Tu solicitud de suscripcion ha sido enviada exitosamente.
                Te notificaremos cuando sea aprobada.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">Plan solicitado</p>
                <p className="font-semibold text-gray-900">{selectedPlan?.name}</p>
              </div>

              <button
                onClick={() => navigate('/patient/dashboard')}
                className="w-full py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
              >
                Ir al Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

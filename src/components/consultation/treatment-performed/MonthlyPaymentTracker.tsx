/**
 * MonthlyPaymentTracker - Componente para tracking de pagos mensuales recurrentes
 *
 * Muestra:
 * - Estado del pago inicial
 * - Historial de cuotas mensuales pagadas
 * - Boton para registrar nueva cuota (guardado diferido)
 * - Boton para finalizar tratamiento (guardado diferido)
 * - Modal de confirmacion
 *
 * IMPORTANTE: Los cambios se acumulan localmente y se guardan al llamar saveAll()
 * Integrado con API real para registrar pagos y calcular comisiones.
 */

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import {
  DollarSign,
  Calendar,
  CheckCircle2,
  PlusCircle,
  Lock,
  Loader2,
  AlertTriangle,
  History,
  CreditCard,
  User,
  XCircle,
  Clock
} from 'lucide-react';
import { serviceMonthlyPaymentsApi } from '@/services/api/serviceMonthlyPaymentsApi';
import { Modal } from '@/components/common/Modal';
import type {
  ServicePaymentStatus,
  ServiceMonthlyPaymentData
} from '@/services/api/serviceMonthlyPaymentsApi';

// Interface para exponer métodos al padre
export interface MonthlyPaymentTrackerRef {
  saveAll: () => Promise<boolean>;
  getPendingCount: () => number;
  hasPendingChanges: () => boolean;
}

// Interface para pagos pendientes locales
interface PendingPayment {
  id: string;
  type: 'initial' | 'monthly';
  amount: number;
  paymentNumber?: number;
  addedAt: Date;
}

interface MonthlyPaymentTrackerProps {
  serviceId: number;
  serviceName: string;
  serviceType: 'orthodontic' | 'implant';
  consultationId: number;
  patientId: number;
  branchId: number;
  dentistId: number;
  initialPaymentAmount: number;
  monthlyPaymentAmount: number;
  readOnly?: boolean;
  onPaymentRegistered?: () => void;
  onServiceFinalized?: () => void;
  compact?: boolean;
}

export const MonthlyPaymentTracker = forwardRef<MonthlyPaymentTrackerRef, MonthlyPaymentTrackerProps>(({
  serviceId,
  serviceName,
  serviceType,
  consultationId,
  patientId,
  branchId,
  dentistId,
  initialPaymentAmount,
  monthlyPaymentAmount,
  readOnly = false,
  onPaymentRegistered,
  onServiceFinalized,
  compact = false
}, ref) => {
  // Estado
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<ServicePaymentStatus | null>(null);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizeNotes, setFinalizeNotes] = useState('');

  // Estado para cambios pendientes (guardado diferido)
  // IMPORTANTE: Usamos sessionStorage para persistir el estado entre remounts
  // Esto evita que se pierdan los pagos pendientes cuando el componente se desmonta
  // (por ejemplo, cuando se marca un checkbox en el checklist)
  const storageKey = `pendingPayments-${consultationId}-${serviceId}`;

  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>(() => {
    // Recuperar estado desde sessionStorage al montar
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Restaurar las fechas como objetos Date
        return parsed.map((p: any) => ({
          ...p,
          addedAt: new Date(p.addedAt)
        }));
      }
    } catch (e) {
      console.warn('[MonthlyPaymentTracker] Error al recuperar estado:', e);
    }
    return [];
  });

  const [pendingFinalize, setPendingFinalize] = useState(false);
  const [pendingFinalizeNotes, setPendingFinalizeNotes] = useState('');

  // Persistir pendingPayments en sessionStorage cuando cambie
  useEffect(() => {
    try {
      if (pendingPayments.length > 0) {
        sessionStorage.setItem(storageKey, JSON.stringify(pendingPayments));
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } catch (e) {
      console.warn('[MonthlyPaymentTracker] Error al persistir estado:', e);
    }
  }, [pendingPayments, storageKey]);

  // NO notificamos al padre en cada cambio para evitar re-renders
  // El padre consultará hasPendingChanges() cuando necesite (al guardar)

  // Cargar estado de pagos
  const loadPaymentStatus = useCallback(async () => {
    if (!serviceId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await serviceMonthlyPaymentsApi.getServicePaymentStatus(serviceId);

      if (response.success && response.data) {
        setPaymentStatus(response.data);
      } else {
        setError(response.message || 'Error al cargar estado de pagos');
      }
    } catch (err: any) {
      console.error('Error loading payment status:', err);
      // Si el error es 404, significa que el servicio existe pero no tiene la tabla aun
      if (err.status === 404) {
        setPaymentStatus(null);
        setError(null);
      } else {
        setError(err.message || 'Error al cargar estado de pagos');
      }
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    loadPaymentStatus();
  }, [loadPaymentStatus]);

  // Agregar pago inicial a pendientes (NO llama API directamente)
  const handleAddInitialPayment = useCallback(() => {
    if (readOnly || !initialPaymentAmount) return;

    // Verificar si ya existe un pago inicial pendiente
    const existingInitial = pendingPayments.find(p => p.type === 'initial');
    if (existingInitial) return;

    const newPending: PendingPayment = {
      id: `pending-initial-${Date.now()}`,
      type: 'initial',
      amount: initialPaymentAmount,
      addedAt: new Date()
    };

    setPendingPayments(prev => [...prev, newPending]);
  }, [readOnly, initialPaymentAmount, pendingPayments]);

  // Agregar cuota mensual a pendientes (NO llama API directamente)
  const handleAddMonthlyPayment = useCallback(() => {
    if (readOnly || !monthlyPaymentAmount) return;

    const existingMonthlyCount = paymentStatus?.summary?.monthly_count || 0;
    const pendingMonthlyCount = pendingPayments.filter(p => p.type === 'monthly').length;
    const nextNumber = existingMonthlyCount + pendingMonthlyCount + 1;

    const newPending: PendingPayment = {
      id: `pending-monthly-${Date.now()}`,
      type: 'monthly',
      amount: monthlyPaymentAmount,
      paymentNumber: nextNumber,
      addedAt: new Date()
    };

    setPendingPayments(prev => [...prev, newPending]);
  }, [readOnly, monthlyPaymentAmount, paymentStatus?.summary?.monthly_count, pendingPayments]);

  // Remover pago pendiente
  const handleRemovePendingPayment = useCallback((pendingId: string) => {
    setPendingPayments(prev => {
      const filtered = prev.filter(p => p.id !== pendingId);
      // Recalcular números de cuota para los pendientes restantes
      let monthlyCounter = (paymentStatus?.summary?.monthly_count || 0) + 1;
      return filtered.map(p => {
        if (p.type === 'monthly') {
          return { ...p, paymentNumber: monthlyCounter++ };
        }
        return p;
      });
    });
  }, [paymentStatus?.summary?.monthly_count]);

  // Marcar para finalizar (NO llama API directamente)
  const handleMarkForFinalize = useCallback(() => {
    if (readOnly) return;
    setPendingFinalize(true);
    setPendingFinalizeNotes(finalizeNotes);
    setShowFinalizeModal(false);
    setFinalizeNotes('');
  }, [readOnly, finalizeNotes]);

  // Cancelar finalización pendiente
  const handleCancelPendingFinalize = useCallback(() => {
    setPendingFinalize(false);
    setPendingFinalizeNotes('');
  }, []);

  // GUARDAR TODO: Llama a la API para todos los cambios pendientes
  const saveAll = useCallback(async (): Promise<boolean> => {
    if (pendingPayments.length === 0 && !pendingFinalize) {
      return true; // Nada que guardar
    }

    setProcessing(true);
    setError(null);

    try {
      // 1. Registrar todos los pagos pendientes en orden
      for (const pending of pendingPayments) {
        const response = await serviceMonthlyPaymentsApi.registerPayment({
          consultation_additional_service_id: serviceId,
          consultation_id: consultationId,
          patient_id: patientId,
          branch_id: branchId,
          payment_amount: pending.amount,
          payment_type: pending.type,
          registered_by_dentist_id: dentistId,
          service_name: serviceName,
          clinical_notes: pending.type === 'initial'
            ? `Pago inicial de ${serviceName}`
            : `Cuota mensual #${pending.paymentNumber} de ${serviceName}`
        });

        if (!response.success) {
          setError(response.message || `Error al registrar ${pending.type === 'initial' ? 'pago inicial' : 'cuota mensual'}`);
          return false;
        }
      }

      // 2. Finalizar servicio si está marcado
      if (pendingFinalize) {
        const response = await serviceMonthlyPaymentsApi.finalizeService(serviceId, {
          dentist_id: dentistId,
          notes: pendingFinalizeNotes
        });

        if (!response.success) {
          setError(response.message || 'Error al finalizar servicio');
          return false;
        }
        onServiceFinalized?.();
      }

      // 3. Limpiar estados pendientes
      setPendingPayments([]);
      setPendingFinalize(false);
      setPendingFinalizeNotes('');

      // 4. Recargar estado desde el backend
      await loadPaymentStatus();
      onPaymentRegistered?.();

      return true;
    } catch (err: any) {
      console.error('Error saving payments:', err);
      setError(err.message || 'Error al guardar pagos');
      return false;
    } finally {
      setProcessing(false);
    }
  }, [
    pendingPayments,
    pendingFinalize,
    pendingFinalizeNotes,
    serviceId,
    consultationId,
    patientId,
    branchId,
    dentistId,
    serviceName,
    loadPaymentStatus,
    onPaymentRegistered,
    onServiceFinalized
  ]);

  // Exponer métodos al padre via ref
  useImperativeHandle(ref, () => ({
    saveAll,
    getPendingCount: () => pendingPayments.length + (pendingFinalize ? 1 : 0),
    hasPendingChanges: () => pendingPayments.length > 0 || pendingFinalize
  }), [saveAll, pendingPayments.length, pendingFinalize]);

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Formatear monto
  const formatAmount = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('es-PE', { minimumFractionDigits: 2 });
  };

  // Estado de carga
  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg ${compact ? 'p-2' : 'p-4'}`}>
        <div className={`flex items-center justify-center gap-2 ${compact ? 'py-2' : 'py-4'}`}>
          <Loader2 className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600 animate-spin`} />
          <span className={`text-gray-600 ${compact ? 'text-xs' : ''}`}>
            {compact ? 'Cargando...' : 'Cargando estado de pagos...'}
          </span>
        </div>
      </div>
    );
  }

  // Variables derivadas del estado
  const isCompleted = paymentStatus?.summary?.is_completed || pendingFinalize;
  const initialPaid = paymentStatus?.summary?.initial_paid || false;
  const hasInitialPending = pendingPayments.some(p => p.type === 'initial');
  const monthlyCount = paymentStatus?.summary?.monthly_count || 0;
  const pendingMonthlyCount = pendingPayments.filter(p => p.type === 'monthly').length;
  const totalMonthlyCount = monthlyCount + pendingMonthlyCount;
  const totalPaid = paymentStatus?.summary?.total_paid || 0;
  const pendingTotal = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const monthlyPayments = paymentStatus?.payments?.monthly || [];
  const initialPayments = paymentStatus?.payments?.initial || [];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${compact ? 'text-xs' : ''}`}>
      {/* Header con estado del servicio */}
      <div className={`${compact ? 'px-2 py-1.5' : 'px-4 py-3'} border-b ${
        isCompleted
          ? pendingFinalize ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CreditCard className={`${compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} ${
              isCompleted
                ? pendingFinalize ? 'text-yellow-600' : 'text-green-600'
                : 'text-blue-600'
            }`} />
            <span className={`font-semibold ${compact ? 'text-xs' : ''} ${
              isCompleted
                ? pendingFinalize ? 'text-yellow-900' : 'text-green-900'
                : 'text-blue-900'
            }`}>
              {compact ? serviceName : `Control de Pagos - ${serviceName}`}
            </span>
          </div>
          {pendingFinalize && (
            <span className={`flex items-center gap-1 ${compact ? 'text-[10px] px-1.5 py-0.5' : 'text-sm px-2 py-1'} bg-yellow-100 text-yellow-700 rounded`}>
              <Clock className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
              {compact ? 'Pendiente' : 'Finalización Pendiente'}
            </span>
          )}
          {!pendingFinalize && paymentStatus?.summary?.is_completed && (
            <span className={`flex items-center gap-1 ${compact ? 'text-[10px] px-1.5 py-0.5' : 'text-sm px-2 py-1'} bg-green-100 text-green-700 rounded`}>
              <Lock className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
              {compact ? 'Finalizado' : 'Tratamiento Finalizado'}
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-600 hover:underline mt-1"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Indicador de cambios pendientes */}
      {(pendingPayments.length > 0 || pendingFinalize) && (
        <div className={`${compact ? 'mx-2 mt-2 p-1.5' : 'mx-4 mt-4 p-2'} bg-yellow-50 border border-yellow-200 rounded-lg`}>
          <div className="flex items-center gap-1.5">
            <Clock className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-yellow-600`} />
            <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-yellow-800 font-medium`}>
              {pendingPayments.length} {pendingPayments.length === 1 ? 'pago pendiente' : 'pagos pendientes'}
              {pendingFinalize && ' + Finalización'}
              {' - Se guardarán al hacer clic en "Guardar Todo"'}
            </span>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className={`${compact ? 'p-2 space-y-2' : 'p-4 space-y-4'}`}>
        {/* Pago Inicial */}
        {initialPaymentAmount > 0 && (
          <div className={`${compact ? 'p-2' : 'p-3'} rounded-lg border ${
            initialPaid || hasInitialPending
              ? hasInitialPending ? 'bg-yellow-50 border-yellow-300' : 'bg-green-50 border-green-300'
              : 'bg-gray-50 border-gray-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`}>
                {!compact && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    initialPaid ? 'bg-green-200' : hasInitialPending ? 'bg-yellow-200' : 'bg-gray-200'
                  }`}>
                    {initialPaid
                      ? <CheckCircle2 className="w-5 h-5 text-green-700" />
                      : hasInitialPending
                        ? <Clock className="w-5 h-5 text-yellow-700" />
                        : <DollarSign className="w-5 h-5 text-gray-500" />
                    }
                  </div>
                )}
                {compact && (
                  initialPaid
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
                    : hasInitialPending
                      ? <Clock className="w-3.5 h-3.5 text-yellow-700" />
                      : <DollarSign className="w-3.5 h-3.5 text-gray-500" />
                )}
                <div>
                  <div className={`${compact ? 'text-xs' : ''} font-medium ${
                    initialPaid ? 'text-green-900' : hasInitialPending ? 'text-yellow-900' : 'text-gray-700'
                  }`}>
                    {compact ? 'Inicial' : 'Pago Inicial'}
                    {hasInitialPending && <span className="text-yellow-600 ml-1">(pendiente)</span>}
                  </div>
                  {initialPaid && initialPayments[0] && !compact && (
                    <div className="text-xs text-green-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Pagado el {formatDate(initialPayments[0].payment_date)}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={`${compact ? 'text-xs' : ''} font-bold ${
                  initialPaid ? 'text-green-700' : hasInitialPending ? 'text-yellow-700' : 'text-gray-600'
                }`}>
                  S/.{formatAmount(initialPaymentAmount)}
                </div>
                {!initialPaid && !hasInitialPending && !isCompleted && !readOnly && (
                  <button
                    onClick={handleAddInitialPayment}
                    disabled={processing}
                    className={`${compact ? 'mt-0.5 text-[10px] px-2 py-0.5' : 'mt-1 text-xs px-3 py-1'} bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1`}
                  >
                    <PlusCircle className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                    {compact ? 'Agregar' : 'Agregar Pago'}
                  </button>
                )}
                {hasInitialPending && !readOnly && (
                  <button
                    onClick={() => {
                      const initialPending = pendingPayments.find(p => p.type === 'initial');
                      if (initialPending) handleRemovePendingPayment(initialPending.id);
                    }}
                    className={`${compact ? 'mt-0.5 text-[10px] px-2 py-0.5' : 'mt-1 text-xs px-3 py-1'} bg-red-100 text-red-600 rounded hover:bg-red-200 flex items-center gap-1`}
                  >
                    <XCircle className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                    {compact ? 'Quitar' : 'Quitar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cuotas Mensuales */}
        {monthlyPaymentAmount > 0 && (
          <div className={`${compact ? 'space-y-1' : 'space-y-2'}`}>
            <div className="flex items-center justify-between">
              <h4 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-gray-700 flex items-center gap-1.5`}>
                <History className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
                {compact ? `Cuotas: ${totalMonthlyCount}` : `Cuotas Mensuales: ${totalMonthlyCount} ${pendingMonthlyCount > 0 ? `(${pendingMonthlyCount} pendientes)` : ''}`}
                {!compact && !isCompleted && <span className="text-gray-400 font-normal">(de ?)</span>}
                {!compact && paymentStatus?.summary?.is_completed && !pendingFinalize && <span className="text-green-600 font-normal">(completado)</span>}
              </h4>
              <span className={`${compact ? 'text-[10px]' : 'text-sm'} text-gray-600`}>
                S/.{formatAmount(monthlyPaymentAmount)}{compact ? '' : ' c/u'}
              </span>
            </div>

            {/* Lista de cuotas pagadas */}
            {monthlyPayments.length > 0 && !compact && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-48 overflow-y-auto">
                  {monthlyPayments.map((payment: ServiceMonthlyPaymentData) => (
                    <div
                      key={payment.payment_id}
                      className="flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0 bg-green-25 hover:bg-green-50"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-900">
                          Cuota #{payment.payment_number}
                        </span>
                        <span className="text-xs text-green-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(payment.payment_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {payment.dentist_name && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {payment.dentist_name}
                          </span>
                        )}
                        <span className="text-sm font-medium text-green-700">
                          S/. {formatAmount(payment.payment_amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de cuotas pendientes */}
            {pendingPayments.filter(p => p.type === 'monthly').length > 0 && !compact && (
              <div className="border border-yellow-200 rounded-lg overflow-hidden">
                <div className="max-h-48 overflow-y-auto">
                  {pendingPayments.filter(p => p.type === 'monthly').map((pending) => (
                    <div
                      key={pending.id}
                      className="flex items-center justify-between p-2 border-b border-yellow-100 last:border-b-0 bg-yellow-50"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-yellow-900">
                          Cuota #{pending.paymentNumber} <span className="text-yellow-600">(pendiente)</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-yellow-700">
                          S/. {formatAmount(pending.amount)}
                        </span>
                        {!readOnly && (
                          <button
                            onClick={() => handleRemovePendingPayment(pending.id)}
                            className="p-1 text-red-500 hover:bg-red-100 rounded"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {monthlyPayments.length === 0 && pendingPayments.filter(p => p.type === 'monthly').length === 0 && !compact && (
              <div className="text-center py-3 text-gray-500 text-sm bg-gray-50 rounded-lg">
                No hay cuotas mensuales registradas
              </div>
            )}

            {/* Boton para agregar nueva cuota */}
            {!isCompleted && !readOnly && (
              <button
                onClick={handleAddMonthlyPayment}
                disabled={processing}
                className={`w-full flex items-center justify-center gap-1.5 ${compact ? 'py-1 px-2 text-[10px]' : 'py-2 px-4'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors`}
              >
                <PlusCircle className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
                {compact ? `+Cuota #${totalMonthlyCount + 1}` : `Agregar Cuota Mensual #${totalMonthlyCount + 1}`}
              </button>
            )}
          </div>
        )}

        {/* Resumen de pagos */}
        <div className={`bg-gray-50 rounded-lg ${compact ? 'p-2' : 'p-3'}`}>
          <div className="flex items-center justify-between">
            <span className={`${compact ? 'text-[10px]' : 'text-sm'} text-gray-600`}>
              Total guardado:
            </span>
            <span className={`${compact ? 'text-xs' : 'text-lg'} font-bold text-gray-900`}>
              S/.{formatAmount(totalPaid)}
            </span>
          </div>
          {pendingTotal > 0 && (
            <div className="flex items-center justify-between mt-1">
              <span className={`${compact ? 'text-[10px]' : 'text-sm'} text-yellow-600`}>
                + Pendiente:
              </span>
              <span className={`${compact ? 'text-xs' : 'text-lg'} font-bold text-yellow-600`}>
                S/.{formatAmount(pendingTotal)}
              </span>
            </div>
          )}
        </div>

        {/* Boton Finalizar Tratamiento */}
        {!paymentStatus?.summary?.is_completed && !readOnly && (totalMonthlyCount > 0 || initialPaid || hasInitialPending) && (
          pendingFinalize ? (
            <div className={`w-full flex items-center justify-between ${compact ? 'py-1 px-2 text-[10px]' : 'py-2 px-4'} bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-300`}>
              <div className="flex items-center gap-1.5">
                <Clock className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
                <span>{compact ? 'Finalizar pendiente' : 'Finalización marcada (pendiente de guardar)'}</span>
              </div>
              <button
                onClick={handleCancelPendingFinalize}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowFinalizeModal(true)}
              disabled={processing}
              className={`w-full flex items-center justify-center gap-1.5 ${compact ? 'py-1 px-2 text-[10px]' : 'py-2 px-4'} bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors`}
            >
              <Lock className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
              {compact ? 'Finalizar' : 'Finalizar Tratamiento'}
            </button>
          )
        )}
      </div>

      {/* Modal de confirmacion para finalizar */}
      <Modal
        isOpen={showFinalizeModal}
        onClose={() => {
          setShowFinalizeModal(false);
          setFinalizeNotes('');
        }}
        size="md"
      >
        <Modal.Header>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
            <span className="text-sm sm:text-base">Finalizar Tratamiento</span>
          </div>
        </Modal.Header>

        <Modal.Body className="p-3 sm:p-4">
          <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
            Está a punto de marcar para finalizar el tratamiento de <strong className="break-words">{serviceName}</strong>.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-yellow-800">
              <strong>Importante:</strong> La finalización se aplicará cuando haga clic en "Guardar Todo".
              Una vez finalizado, no podrá agregar más cuotas mensuales a este servicio.
            </p>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Notas de finalización (opcional)
            </label>
            <textarea
              value={finalizeNotes}
              onChange={(e) => setFinalizeNotes(e.target.value)}
              placeholder="Ej: Tratamiento completado satisfactoriamente..."
              className="w-full border border-gray-300 rounded-lg p-2 text-xs sm:text-sm resize-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              rows={3}
            />
          </div>
        </Modal.Body>

        <Modal.Footer className="flex-col-reverse sm:flex-row gap-2 sm:gap-3 p-3 sm:p-4">
          <button
            onClick={() => {
              setShowFinalizeModal(false);
              setFinalizeNotes('');
            }}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <XCircle className="w-4 h-4" />
            Cancelar
          </button>
          <button
            onClick={handleMarkForFinalize}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Marcar para Finalizar
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
});

MonthlyPaymentTracker.displayName = 'MonthlyPaymentTracker';

export default MonthlyPaymentTracker;

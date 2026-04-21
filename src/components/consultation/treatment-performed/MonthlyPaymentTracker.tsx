/**
 * MonthlyPaymentTracker - Tracker de pagos fraccionados de servicios adicionales
 * (ortodoncia, implantes y prótesis).
 *
 * Muestra:
 * - Presupuesto total, pagado y saldo restante dinámicos (fuente: backend).
 * - Estado del pago inicial (si aplica).
 * - Historial de cuotas/pagos parciales.
 * - Botones de guardado diferido: "Agregar Inicial" y "Agregar Pago" (monto libre).
 * - Finalización manual una vez iniciado el servicio.
 */

import { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
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
import type {
  ServicePaymentStatus,
  ServiceMonthlyPaymentData,
  ServicePaymentType
} from '@/services/api/serviceMonthlyPaymentsApi';
import { Modal } from '@/components/common/Modal';
import { formatPrice } from '@/utils/dentalPricing';
import { formatTimestampToLima } from '@/utils/dateUtils';

export interface MonthlyPaymentTrackerRef {
  saveAll: () => Promise<boolean>;
  getPendingCount: () => number;
  hasPendingChanges: () => boolean;
}

interface PendingPayment {
  id: string;
  type: ServicePaymentType;
  amount: number;
  addedAt: Date;
}

interface MonthlyPaymentTrackerProps {
  serviceId: number;
  serviceName: string;
  consultationId: number;
  patientId: number;
  branchId: number;
  dentistId: number;
  readOnly?: boolean;
  onPaymentRegistered?: () => void;
  onServiceFinalized?: () => void;
  compact?: boolean;
}

type AmountModalState =
  | { open: false }
  | { open: true; type: ServicePaymentType; suggested: number };

export const MonthlyPaymentTracker = forwardRef<MonthlyPaymentTrackerRef, MonthlyPaymentTrackerProps>(({
  serviceId,
  serviceName,
  consultationId,
  patientId,
  branchId,
  dentistId,
  readOnly = false,
  onPaymentRegistered,
  onServiceFinalized,
  compact = false
}, ref) => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<ServicePaymentStatus | null>(null);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizeNotes, setFinalizeNotes] = useState('');
  const [amountModal, setAmountModal] = useState<AmountModalState>({ open: false });
  const [amountInput, setAmountInput] = useState<string>('');
  const [amountError, setAmountError] = useState<string | null>(null);

  // Persistencia local de pagos pendientes para sobrevivir remounts del checklist padre.
  const storageKey = `pendingPayments-${consultationId}-${serviceId}`;

  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((p: any) => ({ ...p, addedAt: new Date(p.addedAt) }));
      }
    } catch {
      // ignorar corrupciones de sessionStorage
    }
    return [];
  });

  const [pendingFinalize, setPendingFinalize] = useState(false);
  const [pendingFinalizeNotes, setPendingFinalizeNotes] = useState('');

  useEffect(() => {
    try {
      if (pendingPayments.length > 0) {
        sessionStorage.setItem(storageKey, JSON.stringify(pendingPayments));
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } catch {
      // ignorar
    }
  }, [pendingPayments, storageKey]);

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

  const summary = paymentStatus?.summary;
  const service = paymentStatus?.service;
  const monthlyPayments = paymentStatus?.payments?.monthly || [];
  const initialPayments = paymentStatus?.payments?.initial || [];

  const expectedTotal = Number(summary?.expected_total ?? 0);
  const initialExpected = Number(summary?.initial_expected ?? 0);
  const monthlyExpected = Number(summary?.monthly_expected ?? 0);
  const initialPaid = summary?.initial_paid ?? false;
  const totalPaid = Number(summary?.total_paid ?? 0);
  const progressPercent = Number(summary?.progress_percent ?? 0);
  const backendIsCompleted = summary?.is_completed ?? false;

  const pendingTotal = useMemo(
    () => pendingPayments.reduce((acc, p) => acc + p.amount, 0),
    [pendingPayments]
  );

  const projectedTotalPaid = totalPaid + pendingTotal;
  const projectedRemaining = Math.max(expectedTotal - projectedTotalPaid, 0);
  const projectedProgress = expectedTotal > 0
    ? Math.min(100, Math.round((projectedTotalPaid / expectedTotal) * 10000) / 100)
    : 0;

  const hasInitialPending = pendingPayments.some(p => p.type === 'initial');
  const monthlyCount = summary?.monthly_count ?? 0;
  const pendingMonthlyCount = pendingPayments.filter(p => p.type === 'monthly').length;
  const totalMonthlyCount = monthlyCount + pendingMonthlyCount;

  const isCompleted = backendIsCompleted || pendingFinalize;
  const isFullyPaid = expectedTotal > 0 && projectedRemaining <= 0.0001;

  const openAmountModal = useCallback((type: ServicePaymentType) => {
    if (readOnly || !service) return;
    const suggested = type === 'initial' ? initialExpected : monthlyExpected;
    setAmountInput(suggested > 0 ? suggested.toFixed(2) : '');
    setAmountError(null);
    setAmountModal({ open: true, type, suggested });
  }, [readOnly, service, initialExpected, monthlyExpected]);

  const closeAmountModal = useCallback(() => {
    setAmountModal({ open: false });
    setAmountInput('');
    setAmountError(null);
  }, []);

  const confirmAmountModal = useCallback(() => {
    if (!amountModal.open) return;
    const raw = amountInput.replace(',', '.').trim();
    const amount = Number(raw);
    if (!raw || Number.isNaN(amount) || amount <= 0) {
      setAmountError('Ingrese un monto mayor a 0');
      return;
    }
    if (expectedTotal > 0 && amount > projectedRemaining + 0.0001) {
      setAmountError(`El monto excede el saldo disponible (${formatPrice(projectedRemaining)})`);
      return;
    }
    if (amountModal.type === 'initial' && (initialPaid || hasInitialPending)) {
      setAmountError('Ya existe un pago inicial registrado o pendiente');
      return;
    }
    setPendingPayments(prev => [
      ...prev,
      {
        id: `pending-${amountModal.type}-${Date.now()}`,
        type: amountModal.type,
        amount: Number(amount.toFixed(2)),
        addedAt: new Date()
      }
    ]);
    closeAmountModal();
  }, [amountInput, amountModal, expectedTotal, projectedRemaining, initialPaid, hasInitialPending, closeAmountModal]);

  const handleRemovePendingPayment = useCallback((pendingId: string) => {
    setPendingPayments(prev => prev.filter(p => p.id !== pendingId));
  }, []);

  const handleMarkForFinalize = useCallback(() => {
    if (readOnly) return;
    setPendingFinalize(true);
    setPendingFinalizeNotes(finalizeNotes);
    setShowFinalizeModal(false);
    setFinalizeNotes('');
  }, [readOnly, finalizeNotes]);

  const handleCancelPendingFinalize = useCallback(() => {
    setPendingFinalize(false);
    setPendingFinalizeNotes('');
  }, []);

  const saveAll = useCallback(async (): Promise<boolean> => {
    if (pendingPayments.length === 0 && !pendingFinalize) {
      return true;
    }

    setProcessing(true);
    setError(null);

    try {
      // Registrar pagos preservando el orden: inicial antes que mensuales.
      const ordered = [...pendingPayments].sort((a, b) => {
        if (a.type === b.type) return a.addedAt.getTime() - b.addedAt.getTime();
        return a.type === 'initial' ? -1 : 1;
      });

      for (const pending of ordered) {
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
            : `Pago parcial de ${serviceName}`
        });

        if (!response.success) {
          setError(response.message || 'Error al registrar pago');
          return false;
        }
      }

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

      setPendingPayments([]);
      setPendingFinalize(false);
      setPendingFinalizeNotes('');
      await loadPaymentStatus();
      onPaymentRegistered?.();
      return true;
    } catch (err: any) {
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

  useImperativeHandle(ref, () => ({
    saveAll,
    getPendingCount: () => pendingPayments.length + (pendingFinalize ? 1 : 0),
    hasPendingChanges: () => pendingPayments.length > 0 || pendingFinalize
  }), [saveAll, pendingPayments.length, pendingFinalize]);

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

  const showInitialSection = initialExpected > 0 || initialPayments.length > 0;
  const allowMonthlyAction = !isCompleted && !readOnly && expectedTotal > 0 && !isFullyPaid;
  const allowInitialAction = showInitialSection && !isCompleted && !readOnly && !initialPaid && !hasInitialPending;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${compact ? 'text-xs' : ''}`}>
      {/* Header */}
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
              {compact ? serviceName : `Estado de cuenta - ${serviceName}`}
            </span>
          </div>
          {pendingFinalize && (
            <span className={`flex items-center gap-1 ${compact ? 'text-[10px] px-1.5 py-0.5' : 'text-sm px-2 py-1'} bg-yellow-100 text-yellow-700 rounded`}>
              <Clock className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
              {compact ? 'Pendiente' : 'Finalización Pendiente'}
            </span>
          )}
          {!pendingFinalize && backendIsCompleted && (
            <span className={`flex items-center gap-1 ${compact ? 'text-[10px] px-1.5 py-0.5' : 'text-sm px-2 py-1'} bg-green-100 text-green-700 rounded`}>
              <Lock className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
              {compact ? 'Finalizado' : 'Tratamiento Finalizado'}
            </span>
          )}
        </div>
      </div>

      {/* Resumen: presupuesto + pagado + saldo */}
      <div className={`${compact ? 'px-2 py-2' : 'px-4 py-3'} bg-slate-50 border-b border-slate-200`}>
        <div className={`grid grid-cols-3 gap-2 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          <div>
            <div className="text-slate-500 uppercase tracking-wide">Presupuesto</div>
            <div className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-slate-900`}>
              {formatPrice(expectedTotal)}
            </div>
          </div>
          <div>
            <div className="text-slate-500 uppercase tracking-wide">Pagado</div>
            <div className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-emerald-700`}>
              {formatPrice(totalPaid)}
              {pendingTotal > 0 && (
                <span className="ml-1 text-yellow-600 font-medium">
                  (+{formatPrice(pendingTotal)})
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-slate-500 uppercase tracking-wide">Saldo</div>
            <div className={`${compact ? 'text-xs' : 'text-sm'} font-semibold ${projectedRemaining <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatPrice(projectedRemaining)}
            </div>
          </div>
        </div>
        {expectedTotal > 0 && (
          <div className="mt-2">
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${isFullyPaid ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${projectedProgress}%` }}
              />
            </div>
            <div className={`mt-1 ${compact ? 'text-[10px]' : 'text-xs'} text-slate-500 flex justify-between`}>
              <span>Avance: {projectedProgress.toFixed(2)}%</span>
              <span>
                {pendingTotal > 0
                  ? `${formatPrice(totalPaid)} guardado · ${formatPrice(pendingTotal)} por guardar`
                  : progressPercent.toFixed(2) + '% confirmado'}
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="text-xs text-red-600 hover:underline mt-1">
              Cerrar
            </button>
          </div>
        </div>
      )}

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

      <div className={`${compact ? 'p-2 space-y-2' : 'p-4 space-y-4'}`}>
        {/* Pago inicial */}
        {showInitialSection && (
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
                        : <DollarSign className="w-5 h-5 text-gray-500" />}
                  </div>
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
                      Pagado el {formatTimestampToLima(initialPayments[0].payment_date, 'date')}
                      {' · '}
                      {formatPrice(Number(initialPayments[0].payment_amount))}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                {!initialPaid && !hasInitialPending && (
                  <div className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
                    Sugerido
                  </div>
                )}
                <div className={`${compact ? 'text-xs' : ''} font-bold ${
                  initialPaid ? 'text-green-700' : hasInitialPending ? 'text-yellow-700' : 'text-gray-600'
                }`}>
                  {formatPrice(
                    hasInitialPending
                      ? pendingPayments.find(p => p.type === 'initial')!.amount
                      : initialPaid
                        ? Number(initialPayments[0]?.payment_amount || 0)
                        : initialExpected
                  )}
                </div>
                {allowInitialAction && (
                  <button
                    onClick={() => openAmountModal('initial')}
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
                      const p = pendingPayments.find(x => x.type === 'initial');
                      if (p) handleRemovePendingPayment(p.id);
                    }}
                    className={`${compact ? 'mt-0.5 text-[10px] px-2 py-0.5' : 'mt-1 text-xs px-3 py-1'} bg-red-100 text-red-600 rounded hover:bg-red-200 flex items-center gap-1`}
                  >
                    <XCircle className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                    Quitar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cuotas / pagos parciales */}
        <div className={`${compact ? 'space-y-1' : 'space-y-2'}`}>
          <div className="flex items-center justify-between">
            <h4 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-gray-700 flex items-center gap-1.5`}>
              <History className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
              {compact ? `Pagos: ${totalMonthlyCount}` : `Pagos registrados: ${totalMonthlyCount}`}
              {pendingMonthlyCount > 0 && !compact && (
                <span className="font-normal text-yellow-600">({pendingMonthlyCount} pendientes)</span>
              )}
              {backendIsCompleted && !pendingFinalize && !compact && (
                <span className="text-green-600 font-normal">(completado)</span>
              )}
            </h4>
            {monthlyExpected > 0 && (
              <span className={`${compact ? 'text-[10px]' : 'text-sm'} text-gray-600`}>
                Sugerido: {formatPrice(monthlyExpected)}
              </span>
            )}
          </div>

          {monthlyPayments.length > 0 && !compact && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                {monthlyPayments.map((payment: ServiceMonthlyPaymentData) => (
                  <div
                    key={payment.payment_id}
                    className="flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0 bg-green-50"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-900">
                        Pago #{payment.payment_number}
                      </span>
                      <span className="text-xs text-green-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatTimestampToLima(payment.payment_date, 'date')}
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
                        {formatPrice(Number(payment.payment_amount))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingPayments.filter(p => p.type === 'monthly').length > 0 && !compact && (
            <div className="border border-yellow-200 rounded-lg overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                {pendingPayments.filter(p => p.type === 'monthly').map((pending, idx) => (
                  <div
                    key={pending.id}
                    className="flex items-center justify-between p-2 border-b border-yellow-100 last:border-b-0 bg-yellow-50"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-900">
                        Pago #{monthlyCount + idx + 1} <span className="text-yellow-600">(pendiente)</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-yellow-700">
                        {formatPrice(pending.amount)}
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
              No hay pagos parciales registrados
            </div>
          )}

          {allowMonthlyAction && (
            <button
              onClick={() => openAmountModal('monthly')}
              disabled={processing}
              className={`w-full flex items-center justify-center gap-1.5 ${compact ? 'py-1 px-2 text-[10px]' : 'py-2 px-4'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors`}
            >
              <PlusCircle className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
              {compact ? `+ Pago` : `Registrar Pago`}
            </button>
          )}
        </div>

        {/* Finalizar */}
        {!backendIsCompleted && !readOnly && (totalMonthlyCount > 0 || initialPaid || hasInitialPending) && (
          pendingFinalize ? (
            <div className={`w-full flex items-center justify-between ${compact ? 'py-1 px-2 text-[10px]' : 'py-2 px-4'} bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-300`}>
              <div className="flex items-center gap-1.5">
                <Clock className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
                <span>{compact ? 'Finalizar pendiente' : 'Finalización marcada (pendiente de guardar)'}</span>
              </div>
              <button onClick={handleCancelPendingFinalize} className="text-red-600 hover:text-red-700">
                <XCircle className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowFinalizeModal(true)}
              disabled={processing}
              className={`w-full flex items-center justify-center gap-1.5 ${compact ? 'py-1 px-2 text-[10px]' : 'py-2 px-4'} ${isFullyPaid ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-500 hover:bg-slate-600'} text-white rounded-lg disabled:opacity-50 transition-colors`}
            >
              <Lock className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
              {compact
                ? 'Finalizar'
                : isFullyPaid
                  ? 'Finalizar Tratamiento (Saldo cubierto)'
                  : 'Finalizar Tratamiento'}
            </button>
          )
        )}
      </div>

      {/* Modal de monto */}
      <Modal
        isOpen={amountModal.open}
        onClose={closeAmountModal}
        size="md"
      >
        <Modal.Header>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
            <span className="text-sm sm:text-base">
              {amountModal.open && amountModal.type === 'initial' ? 'Pago Inicial' : 'Pago Parcial'} — {serviceName}
            </span>
          </div>
        </Modal.Header>
        <Modal.Body className="p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
            <div className="bg-slate-50 p-2 rounded">
              <div className="text-slate-500">Presupuesto</div>
              <div className="font-semibold">{formatPrice(expectedTotal)}</div>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <div className="text-slate-500">Saldo disponible</div>
              <div className="font-semibold text-rose-700">{formatPrice(projectedRemaining)}</div>
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Monto a registrar
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amountInput}
              onChange={(e) => {
                setAmountInput(e.target.value);
                setAmountError(null);
              }}
              autoFocus
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={amountModal.open && amountModal.suggested > 0 ? amountModal.suggested.toFixed(2) : '0.00'}
            />
            {amountModal.open && amountModal.suggested > 0 && (
              <p className="mt-1 text-[11px] text-slate-500">
                Sugerido según el plan: {formatPrice(amountModal.suggested)}
              </p>
            )}
            {amountError && (
              <p className="mt-1 text-xs text-red-600">{amountError}</p>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="flex-col-reverse sm:flex-row gap-2 sm:gap-3 p-3 sm:p-4">
          <button
            onClick={closeAmountModal}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <XCircle className="w-4 h-4" />
            Cancelar
          </button>
          <button
            onClick={confirmAmountModal}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Agregar a pendientes
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal de finalización */}
      <Modal
        isOpen={showFinalizeModal}
        onClose={() => { setShowFinalizeModal(false); setFinalizeNotes(''); }}
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
              Una vez finalizado, no podrá agregar más pagos a este servicio.
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
            onClick={() => { setShowFinalizeModal(false); setFinalizeNotes(''); }}
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

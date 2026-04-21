/**
 * AdditionalServicesAccountStatement
 *
 * Componente compartido de "Estado de cuenta" de servicios adicionales
 * (ortodoncia, implantes, prótesis). Se usa en:
 *   - Paciente: portal → Facturación
 *   - Admin / SA: detalles del paciente y auditoría integral
 *   - Recepción: pantalla de pagos/caja
 *
 * Consume el endpoint único GET /api/service-monthly-payments/patient/:id/statement
 * y muestra: presupuesto total, pagado, saldo, progreso y cuotas.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  CreditCard,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Calendar,
  User
} from 'lucide-react';
import { serviceMonthlyPaymentsApi } from '@/services/api/serviceMonthlyPaymentsApi';
import type {
  PatientAccountStatement,
  PatientAccountStatementService,
  AdditionalServiceType,
  ServiceMonthlyPaymentData
} from '@/services/api/serviceMonthlyPaymentsApi';
import { formatPrice } from '@/utils/dentalPricing';
import { formatTimestampToLima } from '@/utils/dateUtils';

const SERVICE_TYPE_LABEL: Record<AdditionalServiceType, string> = {
  orthodontic: 'Ortodoncia',
  implant: 'Implante',
  prosthesis: 'Prótesis'
};

const SERVICE_TYPE_TONE: Record<AdditionalServiceType, string> = {
  orthodontic: 'bg-purple-100 text-purple-800',
  implant: 'bg-cyan-100 text-cyan-800',
  prosthesis: 'bg-orange-100 text-orange-800'
};

const STATUS_LABEL = {
  pending: { label: 'Pendiente', tone: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'En curso', tone: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Finalizado', tone: 'bg-emerald-100 text-emerald-800' }
} as const;

interface Props {
  patientId: number | null | undefined;
  title?: string;
  emptyMessage?: string;
  compact?: boolean;
  /** Callback opcional cuando se carga información: recibe el aggregate total */
  onAggregateLoaded?: (aggregate: PatientAccountStatement['aggregate']) => void;
}

export const AdditionalServicesAccountStatement: React.FC<Props> = ({
  patientId,
  title = 'Estado de cuenta — Servicios adicionales',
  emptyMessage = 'El paciente no tiene servicios adicionales registrados.',
  compact = false,
  onAggregateLoaded
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statement, setStatement] = useState<PatientAccountStatement | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await serviceMonthlyPaymentsApi.getPatientAccountStatement(Number(patientId));
      if (response.success && response.data) {
        setStatement(response.data);
        onAggregateLoaded?.(response.data.aggregate);
      } else {
        setError(response.message || 'Error al cargar estado de cuenta');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar estado de cuenta');
    } finally {
      setLoading(false);
    }
  }, [patientId, onAggregateLoaded]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleExpanded = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!patientId) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{title}</h3>
        </div>
        {statement && statement.services.length > 0 && (
          <button
            onClick={load}
            className="text-xs text-blue-700 hover:underline"
          >
            Recargar
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-sm text-slate-600">Cargando estado de cuenta...</span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border-b border-red-100">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            {error}
            <button onClick={load} className="ml-2 underline text-red-700">Reintentar</button>
          </div>
        </div>
      )}

      {!loading && !error && statement && (
        <>
          {statement.services.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">{emptyMessage}</div>
          ) : (
            <>
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 ${compact ? 'text-xs' : 'text-sm'}`}>
                <AggregateBox label="Servicios" value={String(statement.aggregate.services_count)} />
                <AggregateBox label="Presupuesto total" value={formatPrice(statement.aggregate.expected_total)} />
                <AggregateBox label="Pagado" value={formatPrice(statement.aggregate.total_paid)} tone="text-emerald-700" />
                <AggregateBox
                  label="Saldo pendiente"
                  value={formatPrice(statement.aggregate.remaining_balance)}
                  tone={statement.aggregate.remaining_balance > 0 ? 'text-rose-700' : 'text-emerald-700'}
                />
              </div>

              <ul className="divide-y divide-slate-200">
                {statement.services.map(service => (
                  <ServiceRow
                    key={service.consultation_additional_service_id}
                    service={service}
                    compact={compact}
                    expanded={expanded.has(service.consultation_additional_service_id)}
                    onToggle={() => toggleExpanded(service.consultation_additional_service_id)}
                  />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
};

const AggregateBox: React.FC<{ label: string; value: string; tone?: string }> = ({
  label,
  value,
  tone = 'text-slate-900'
}) => (
  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
    <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className={`font-semibold ${tone}`}>{value}</div>
  </div>
);

interface ServiceRowProps {
  service: PatientAccountStatementService;
  compact: boolean;
  expanded: boolean;
  onToggle: () => void;
}

const ServiceRow: React.FC<ServiceRowProps> = ({ service, compact, expanded, onToggle }) => {
  const typeLabel = SERVICE_TYPE_LABEL[service.service_type] || 'Servicio';
  const typeTone = SERVICE_TYPE_TONE[service.service_type] || 'bg-slate-100 text-slate-700';
  const status = STATUS_LABEL[service.service_status] || STATUS_LABEL.pending;

  return (
    <li className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} hover:bg-slate-50 transition-colors`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${typeTone}`}>
              {typeLabel}
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${status.tone}`}>
              {status.label}
            </span>
            {service.modality && (
              <span className="text-[11px] text-slate-500">{service.modality}</span>
            )}
            {service.branch_name && (
              <span className="text-[11px] text-slate-500">· {service.branch_name}</span>
            )}
          </div>
          <div className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-slate-900 truncate`}>
            {service.service_name}
          </div>
          {service.consultation_date && (
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              Consulta: {formatTimestampToLima(service.consultation_date, 'date')}
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1 text-slate-500 hover:text-slate-900"
          aria-label={expanded ? 'Contraer' : 'Expandir'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <div className={`mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
        <Cell label="Presupuesto" value={formatPrice(service.expected_total)} />
        <Cell label="Pagado" value={formatPrice(service.total_paid)} tone="text-emerald-700" />
        <Cell
          label="Saldo"
          value={formatPrice(service.remaining_balance)}
          tone={service.remaining_balance > 0 ? 'text-rose-700' : 'text-emerald-700'}
        />
        <Cell label="Avance" value={`${service.progress_percent.toFixed(2)}%`} />
      </div>

      <div className="mt-2">
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${service.is_fully_paid ? 'bg-emerald-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(service.progress_percent, 100)}%` }}
          />
        </div>
      </div>

      {expanded && (
        <div className="mt-3">
          {service.payments.length === 0 ? (
            <div className="text-xs text-slate-500 italic">Sin pagos registrados.</div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-1 px-2 py-1 bg-slate-100 text-[11px] uppercase tracking-wide text-slate-600 font-medium">
                <div className="col-span-2">#</div>
                <div className="col-span-3">Fecha</div>
                <div className="col-span-4">Doctor</div>
                <div className="col-span-3 text-right">Monto</div>
              </div>
              <ul className="divide-y divide-slate-100">
                {service.payments.map(p => (
                  <PaymentRow key={p.payment_id} payment={p} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  );
};

const PaymentRow: React.FC<{ payment: ServiceMonthlyPaymentData }> = ({ payment }) => {
  const isInitial = payment.payment_type === 'initial';
  return (
    <li className="grid grid-cols-12 gap-1 px-2 py-1.5 text-xs items-center">
      <div className="col-span-2 flex items-center gap-1">
        {isInitial ? (
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-medium">Inicial</span>
        ) : (
          <span className="flex items-center gap-0.5 text-slate-700">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            #{payment.payment_number}
          </span>
        )}
      </div>
      <div className="col-span-3 text-slate-700 flex items-center gap-1">
        <Clock className="w-3 h-3 text-slate-400" />
        {formatTimestampToLima(payment.payment_date, 'date')}
      </div>
      <div className="col-span-4 text-slate-700 flex items-center gap-1 truncate">
        <User className="w-3 h-3 text-slate-400" />
        <span className="truncate">{payment.dentist_name || '-'}</span>
      </div>
      <div className="col-span-3 text-right font-semibold text-slate-900">
        {formatPrice(Number(payment.payment_amount))}
      </div>
    </li>
  );
};

const Cell: React.FC<{ label: string; value: string; tone?: string }> = ({
  label,
  value,
  tone = 'text-slate-900'
}) => (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className={`font-semibold ${tone}`}>{value}</div>
  </div>
);

export default AdditionalServicesAccountStatement;

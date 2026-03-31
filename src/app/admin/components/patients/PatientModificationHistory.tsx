/**
 * PatientModificationHistory
 *
 * Vertical timeline component that displays all modifications made to a
 * patient record. Each entry shows who made the change, when (timezone-aware),
 * and what fields changed (old vs new values).
 *
 * Loads data from the audit_logs table via PatientApiService.
 */

import { useState, useEffect } from 'react';
import { formatTimestampToLima } from '@/utils/dateUtils';
import { PatientApiService } from '../../services/patientApiService';
import type { PatientAuditLog } from '../../services/patientApiService';
import { Plus, Edit, Trash2, Loader2, AlertCircle, ChevronDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PatientModificationHistoryProps {
  patientId: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Human-readable Spanish labels for database column names */
const FIELD_LABELS: Record<string, string> = {
  first_name: 'Nombre',
  last_name: 'Apellido',
  identification_number: 'DNI',
  email: 'Email',
  phone: 'Telefono',
  mobile: 'Celular',
  address: 'Direccion',
  city: 'Ciudad',
  state: 'Departamento',
  country: 'Pais',
  postal_code: 'Codigo Postal',
  occupation: 'Ocupacion',
  notes: 'Notas',
  company_id: 'Empresa',
  branch_id: 'Sede',
  gender_id: 'Genero',
  blood_type_id: 'Tipo de Sangre',
  marital_status_id: 'Estado Civil',
  emergency_contact_name: 'Contacto Emergencia',
  emergency_contact_phone: 'Tel. Emergencia',
  emergency_contact_relationship: 'Relacion Emergencia',
  is_basic_registration: 'Registro Basico',
  is_new_client: 'Cliente Nuevo',
  photo_url: 'Foto',
  status: 'Estado',
  birth_date: 'Fecha de Nacimiento',
  district: 'Distrito',
  province: 'Provincia',
  department: 'Departamento',
  allergies: 'Alergias',
  chronic_diseases: 'Enfermedades Cronicas',
  current_medications: 'Medicamentos Actuales',
  insurance_company: 'Aseguradora',
  insurance_policy_number: 'N. Poliza',
  referral_source: 'Fuente de Referencia',
  profile_photo_url: 'Foto de Perfil',
  ruc: 'RUC',
  business_name: 'Razon Social',
  identification_type_id: 'Tipo Documento',
  date_time_modification: 'Fecha Modificacion',
  date_time_registration: 'Fecha Registro',
  user_id_modification: 'Usuario Modificacion',
  user_id_registration: 'Usuario Registro',
};

/** Fields that are internal/system and should not be shown to the user */
const HIDDEN_FIELDS = new Set([
  '_description',
  'updated_at',
  'created_at',
  'date_time_modification',
  'date_time_registration',
  'user_id_modification',
  'user_id_registration',
  'password',
  'password_hash',
]);

/** Action labels in Spanish */
const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Registro creado',
  UPDATE: 'Datos actualizados',
  DELETE: 'Registro eliminado',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a value for display */
const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return '(vacio)';
  if (typeof value === 'boolean') return value ? 'Si' : 'No';
  return String(value);
};

/** Get the icon component and colors for an action type */
function getActionStyle(action: string) {
  switch (action) {
    case 'CREATE':
      return {
        Icon: Plus,
        bgColor: 'bg-green-100',
        iconColor: 'text-green-600',
        borderColor: 'border-green-200',
        badgeBg: 'bg-green-50',
        badgeText: 'text-green-700',
      };
    case 'DELETE':
      return {
        Icon: Trash2,
        bgColor: 'bg-red-100',
        iconColor: 'text-red-600',
        borderColor: 'border-red-200',
        badgeBg: 'bg-red-50',
        badgeText: 'text-red-700',
      };
    case 'UPDATE':
    default:
      return {
        Icon: Edit,
        bgColor: 'bg-blue-100',
        iconColor: 'text-blue-600',
        borderColor: 'border-blue-200',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-700',
      };
  }
}

/** Get the human-readable label for a field name */
function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] || field;
}

/** Filter out hidden/internal fields from a record */
function filterFields(fields: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const key of Object.keys(fields)) {
    if (!HIDDEN_FIELDS.has(key)) {
      filtered[key] = fields[key];
    }
  }
  return filtered;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Changed fields table for UPDATE actions */
function ChangedFieldsTable({
  changedFields,
}: {
  changedFields: Record<string, { old: unknown; new: unknown }>;
}) {
  const visibleFields = Object.entries(changedFields).filter(
    ([key]) => !HIDDEN_FIELDS.has(key)
  );

  if (visibleFields.length === 0) {
    return <p className="text-sm text-gray-400 italic">Sin campos visibles modificados</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-1.5 px-2 text-gray-500 font-medium">Campo</th>
            <th className="text-left py-1.5 px-2 text-gray-500 font-medium">Valor anterior</th>
            <th className="text-left py-1.5 px-2 text-gray-500 font-medium">Valor nuevo</th>
          </tr>
        </thead>
        <tbody>
          {visibleFields.map(([field, change]) => (
            <tr key={field} className="border-b border-gray-100 last:border-0">
              <td className="py-1.5 px-2 font-medium text-gray-700">{getFieldLabel(field)}</td>
              <td className="py-1.5 px-2 text-red-600">{formatValue(change.old)}</td>
              <td className="py-1.5 px-2 text-green-600">{formatValue(change.new)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Key fields display for CREATE actions */
function CreatedFieldsSummary({
  newValues,
}: {
  newValues: Record<string, unknown>;
}) {
  const visible = filterFields(newValues);
  const entries = Object.entries(visible);

  if (entries.length === 0) {
    return <p className="text-sm text-gray-400 italic">Sin detalles disponibles</p>;
  }

  // Show only the most relevant fields for creation
  const priorityFields = [
    'first_name',
    'last_name',
    'identification_number',
    'email',
    'mobile',
    'phone',
    'birth_date',
    'gender_id',
    'address',
    'occupation',
  ];

  const fieldsToShow = entries
    .filter(([key]) => priorityFields.includes(key))
    .sort((a, b) => priorityFields.indexOf(a[0]) - priorityFields.indexOf(b[0]));

  // If no priority fields found, show all visible fields
  const displayFields = fieldsToShow.length > 0 ? fieldsToShow : entries.slice(0, 10);

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      {displayFields.map(([field, value]) => (
        <div key={field} className="flex gap-1">
          <span className="text-gray-500">{getFieldLabel(field)}:</span>
          <span className="text-gray-700 font-medium">{formatValue(value)}</span>
        </div>
      ))}
    </div>
  );
}

/** Single timeline entry card */
function TimelineEntry({ log, isLast }: { log: PatientAuditLog; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const style = getActionStyle(log.action);
  const { Icon } = style;

  const hasChangedFields = log.action === 'UPDATE' && log.changed_fields != null;
  const hasNewValues = log.action === 'CREATE' && log.new_values != null;

  // Count visible changed fields (for UPDATE)
  const visibleChangedCount = hasChangedFields
    ? Object.keys(log.changed_fields!).filter((k) => !HIDDEN_FIELDS.has(k)).length
    : 0;

  // Auto-expand if there are few changes
  const isExpandable = hasChangedFields && visibleChangedCount > 0;
  const showContent = hasNewValues || (isExpandable && expanded);

  return (
    <div className="flex gap-3">
      {/* Timeline line + icon */}
      <div className="flex flex-col items-center">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${style.bgColor} ${style.iconColor} shrink-0`}
        >
          <Icon size={16} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-4 border rounded-lg ${style.borderColor} bg-white shadow-sm`}>
        {/* Header */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${style.badgeBg} ${style.badgeText}`}
              >
                {ACTION_LABELS[log.action] || log.action}
              </span>
              <span className="text-xs text-gray-500">
                {log.table_name === 'patients' ? 'Paciente' : log.table_name}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              #{log.audit_log_id}
            </span>
          </div>

          {/* Meta info */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>
              <span className="font-medium text-gray-700">{log.user_name || 'Sistema'}</span>
              {log.user_email && (
                <span className="ml-1 text-gray-400">({log.user_email})</span>
              )}
            </span>
            <span>{formatTimestampToLima(log.timestamp, 'datetime')}</span>
            {log.ip_address && (
              <span className="text-gray-400">IP: {log.ip_address}</span>
            )}
          </div>

          {/* DELETE: show status change note */}
          {log.action === 'DELETE' && (
            <p className="mt-2 text-sm text-red-600">
              Estado del paciente cambiado a inactivo
            </p>
          )}

          {/* CREATE: always show key fields */}
          {hasNewValues && (
            <div className="mt-2">
              <CreatedFieldsSummary newValues={log.new_values!} />
            </div>
          )}

          {/* UPDATE: expandable changed fields */}
          {isExpandable && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                />
                {expanded ? 'Ocultar cambios' : `Ver ${visibleChangedCount} campo${visibleChangedCount !== 1 ? 's' : ''} modificado${visibleChangedCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}

          {/* UPDATE with no visible changed fields */}
          {log.action === 'UPDATE' && !isExpandable && (
            <p className="mt-2 text-sm text-gray-400 italic">
              Campos internos actualizados
            </p>
          )}
        </div>

        {/* Expanded content */}
        {showContent && isExpandable && (
          <div className="px-4 pb-3 border-t border-gray-100 pt-2">
            <ChangedFieldsTable changedFields={log.changed_fields!} />
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const PatientModificationHistory = ({ patientId }: PatientModificationHistoryProps) => {
  const [logs, setLogs] = useState<PatientAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await PatientApiService.loadPatientModificationHistory(patientId);
        if (!cancelled) {
          setLogs(result.logs);
          setTotal(result.total);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Error desconocido al cargar historial';
          setError(msg);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [patientId]);

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-500 mr-2" size={20} />
        <span className="text-sm text-gray-500">Cargando historial de modificaciones...</span>
      </div>
    );
  }

  // ---- Error state ----
  if (error) {
    return (
      <div className="flex items-center gap-2 py-8 px-4 text-red-600 bg-red-50 rounded-lg">
        <AlertCircle size={18} />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  // ---- Empty state ----
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Edit size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hay modificaciones registradas para este paciente.</p>
      </div>
    );
  }

  // ---- Data state ----
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          Historial de modificaciones
        </h3>
        <span className="text-xs text-gray-400">
          {total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {logs.map((log, index) => (
          <TimelineEntry
            key={log.audit_log_id}
            log={log}
            isLast={index === logs.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

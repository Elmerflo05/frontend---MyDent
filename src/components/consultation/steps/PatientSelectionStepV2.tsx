import { memo, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CalendarDays,
  Stethoscope,
  Search,
  Sun,
  UserPlus,
  UserSearch,
  UserX,
  Users,
  X,
  ChevronRight
} from 'lucide-react';
import type { Patient } from '@/types';
import { appointmentsApi, type AppointmentData } from '@/services/api/appointmentsApi';
import { formatDateToYMD } from '@/utils/dateUtils';
import { getStatusConfig } from '@/utils/appointment.utils';
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_KEY_TO_ID,
  getStatusKeyById,
  type AppointmentStatus
} from '@/types/appointment.types';

type FilterMode = 'today' | 'week' | 'all';

interface PatientSelectionStepV2Props {
  patients: Patient[];
  selectedPatient: any;
  selectedAppointment: AppointmentData | null;
  onPatientSelect: (patient: Patient) => void;
  onAppointmentSelect: (appointment: AppointmentData) => void;
  user: any;
}

// Estados que el doctor puede atender desde el paso 0 (no incluye completadas/canceladas).
const ATTENDABLE_STATUS_KEYS: AppointmentStatus[] = [
  APPOINTMENT_STATUS.SCHEDULED,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.IN_PROGRESS
];

const formatTime = (t: string) => (t ? t.substring(0, 5) : '');

const parseDate = (s: string): Date | null => {
  if (!s) return null;
  const d = s.includes('T') ? new Date(s) : new Date(s + 'T12:00:00');
  return isNaN(d.getTime()) ? null : d;
};

const formatDateLabel = (s: string): string => {
  const d = parseDate(s);
  if (!d) return s || 'Sin fecha';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const dOnly = new Date(d); dOnly.setHours(0, 0, 0, 0);
  if (dOnly.getTime() === today.getTime()) return 'Hoy';
  if (dOnly.getTime() === tomorrow.getTime()) return 'Mañana';
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
};

const getWeekRange = () => {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: formatDateToYMD(monday), end: formatDateToYMD(sunday) };
};

const normalizeDateKey = (s: string) => (s.includes('T') ? s.split('T')[0] : s);

const EmptyState = ({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) => (
  <div className="text-center py-10">
    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
      {icon}
    </div>
    <p className="text-gray-700 font-medium">{title}</p>
    {hint && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
  </div>
);

const PatientSelectionStepV2Component = ({
  patients,
  selectedPatient,
  selectedAppointment,
  onPatientSelect,
  onAppointmentSelect,
  user
}: PatientSelectionStepV2Props) => {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterMode>('today');

  // Cargar citas atendibles del dentista en la semana actual
  useEffect(() => {
    const load = async () => {
      if (!user?.dentist_id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const range = getWeekRange();

        const responses = await Promise.all(
          ATTENDABLE_STATUS_KEYS.map(key =>
            appointmentsApi.getAppointments({
              dentist_id: user.dentist_id,
              date_from: range.start,
              date_to: range.end,
              appointment_status_id: APPOINTMENT_STATUS_KEY_TO_ID[key],
              limit: 100
            })
          )
        );

        const all = responses.flatMap(r => (r.success && r.data ? r.data : []));
        const unique = all.filter(
          (a, i, arr) => i === arr.findIndex(x => x.appointment_id === a.appointment_id)
        );
        setAppointments(unique.filter(a => a.patient_id));
      } catch (err) {
        console.error('Error cargando citas:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.dentist_id]);

  const todayKey = formatDateToYMD(new Date());

  const apptsToday = useMemo(
    () => appointments
      .filter(a => normalizeDateKey(a.appointment_date) === todayKey)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')),
    [appointments, todayKey]
  );

  const apptsByDate = useMemo(() => {
    const grouped: Record<string, AppointmentData[]> = {};
    appointments.forEach(a => {
      const k = normalizeDateKey(a.appointment_date);
      (grouped[k] = grouped[k] || []).push(a);
    });
    Object.values(grouped).forEach(list =>
      list.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
    );
    return grouped;
  }, [appointments]);

  const sortedDates = useMemo(() => Object.keys(apptsByDate).sort(), [apptsByDate]);

  const q = query.trim().toLowerCase();

  const filteredAppts = useMemo(() => {
    if (!q) return [];
    return appointments.filter(a => [
      a.patient_name, a.identification_number, a.reason
    ].some(v => v?.toLowerCase().includes(q)));
  }, [appointments, q]);

  const filteredPatients = useMemo(() => {
    if (!q) return [];
    return patients.filter(p => [
      `${p.firstName} ${p.lastName}`, p.documentNumber, p.phone, p.email
    ].some(v => v?.toLowerCase().includes(q)));
  }, [patients, q]);

  const renderApptCard = (a: AppointmentData) => {
    const isSel = selectedAppointment?.appointment_id === a.appointment_id;
    const statusKey = (a.status_code as AppointmentStatus) || getStatusKeyById(a.appointment_status_id);
    const statusCfg = statusKey ? getStatusConfig(statusKey) : null;

    return (
      <button
        type="button"
        key={a.appointment_id}
        onClick={() => onAppointmentSelect(a)}
        className={`w-full text-left border rounded-xl p-4 flex items-center gap-4 transition-all ${
          isSel
            ? 'border-clinic-primary bg-clinic-light/40 shadow-[0_0_0_3px_rgba(13,148,136,0.15)]'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }`}
      >
        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
          isSel ? 'bg-clinic-primary text-white' : 'bg-gray-100 text-gray-700'
        }`}>
          <span className="text-[10px] font-medium opacity-75">HORA</span>
          <span className="text-sm font-bold leading-none">{formatTime(a.start_time)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 truncate">
              {a.patient_name || 'Paciente sin nombre'}
            </span>
            {statusCfg && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            {a.reason && (
              <span className="flex items-center gap-1 truncate">
                <Stethoscope className="w-3 h-3" />
                {a.reason}
              </span>
            )}
            {a.identification_number && (
              <>
                <span>·</span>
                <span>DNI {a.identification_number}</span>
              </>
            )}
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 flex-shrink-0 ${isSel ? 'text-clinic-primary' : 'text-gray-400'}`} />
      </button>
    );
  };

  const renderPatientCard = (p: Patient) => {
    const isSel = selectedPatient?.id === p.id && !selectedAppointment;
    const initials = `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase();
    return (
      <button
        type="button"
        key={p.id}
        onClick={() => onPatientSelect(p)}
        className={`w-full text-left border rounded-xl p-4 flex items-center gap-4 transition-all ${
          isSel
            ? 'border-clinic-primary bg-clinic-light/40 shadow-[0_0_0_3px_rgba(13,148,136,0.15)]'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-gray-600">{initials || '··'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{p.firstName} {p.lastName}</p>
          <p className="text-xs text-gray-500 truncate">
            {p.documentType} {p.documentNumber}
            {p.phone ? ` · ${p.phone}` : ''}
            {p.email ? ` · ${p.email}` : ''}
          </p>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">Sin cita</span>
      </button>
    );
  };

  const tabBase = 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition select-none cursor-pointer';
  const tabActive = 'bg-clinic-primary text-white';
  const tabIdle = 'bg-gray-100 text-gray-600 hover:bg-gray-200';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

      {/* Buscador unificado */}
      <div className="p-5 border-b border-gray-100">
        <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <UserSearch className="w-4 h-4 text-clinic-primary" />
          Iniciar atención
        </label>
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setQuery(''); }}
            placeholder="Busca por nombre, DNI, teléfono... o elige una cita de abajo"
            className="w-full pl-12 pr-12 py-3.5 text-base bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-clinic-primary focus:ring-4 focus:ring-clinic-primary/15 outline-none transition"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-200"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Tabs de filtro */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs text-gray-500 mr-1">Mostrar:</span>
          <button
            type="button"
            onClick={() => setFilter('today')}
            className={`${tabBase} ${filter === 'today' ? tabActive : tabIdle}`}
          >
            <Sun className="w-3.5 h-3.5" /> Hoy <span className="opacity-70">({apptsToday.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('week')}
            className={`${tabBase} ${filter === 'week' ? tabActive : tabIdle}`}
          >
            <CalendarDays className="w-3.5 h-3.5" /> Esta semana <span className="opacity-70">({appointments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`${tabBase} ${filter === 'all' ? tabActive : tabIdle}`}
          >
            <Users className="w-3.5 h-3.5" /> Todos los pacientes
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5 max-h-[60vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clinic-primary" />
            <span className="ml-3 text-gray-600">Cargando citas...</span>
          </div>
        ) : q ? (
          (filteredAppts.length === 0 && filteredPatients.length === 0) ? (
            <EmptyState
              icon={<UserX className="w-6 h-6 text-gray-400" />}
              title={`Sin resultados para "${query}"`}
              hint="Verifica el nombre o documento"
            />
          ) : (
            <div className="space-y-5">
              {filteredAppts.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Citas que coinciden ({filteredAppts.length})
                  </h4>
                  <div className="grid gap-2">{filteredAppts.map(renderApptCard)}</div>
                </div>
              )}
              {filteredPatients.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Pacientes que coinciden ({filteredPatients.length})
                  </h4>
                  <div className="grid gap-2">{filteredPatients.map(renderPatientCard)}</div>
                </div>
              )}
            </div>
          )
        ) : filter === 'today' ? (
          apptsToday.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-8 h-8 text-gray-400" />}
              title="No hay citas programadas para hoy"
              hint="Cambia a 'Esta semana' o 'Todos los pacientes' para atender sin cita"
            />
          ) : (
            <div className="grid gap-2">{apptsToday.map(renderApptCard)}</div>
          )
        ) : filter === 'week' ? (
          appointments.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="w-8 h-8 text-gray-400" />}
              title="No hay citas programadas esta semana"
              hint="Puedes atender un paciente sin cita desde 'Todos los pacientes'"
            />
          ) : (
            <div className="space-y-5">
              {sortedDates.map(date => (
                <div key={date}>
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateLabel(date)}
                    <span className="text-gray-400 normal-case">
                      · {apptsByDate[date].length} cita{apptsByDate[date].length > 1 ? 's' : ''}
                    </span>
                  </h4>
                  <div className="grid gap-2">{apptsByDate[date].map(renderApptCard)}</div>
                </div>
              ))}
            </div>
          )
        ) : (
          patients.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="w-8 h-8 text-gray-400" />}
              title="No hay pacientes cargados"
              hint="Escribe en el buscador para encontrar un paciente"
            />
          ) : (
            <div className="grid gap-2">{patients.map(renderPatientCard)}</div>
          )
        )}
      </div>
    </div>
  );
};

export const PatientSelectionStepV2 = memo(PatientSelectionStepV2Component);

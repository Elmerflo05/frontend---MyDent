// Configuración de estados y configuración de citas
// Siguiendo política anti-hardcodeo

export const APPOINTMENT_STATUSES = {
  PENDING_APPROVAL: 'pending_approval',  // ID 0 - Citas que requieren verificación de voucher
  SCHEDULED: 'scheduled',                // ID 1 - Citas programadas directamente por staff
  CONFIRMED: 'confirmed',                // ID 2 - Citas aprobadas y confirmadas (voucher verificado)
  IN_PROGRESS: 'in_progress',            // ID 3 - Atención médica en curso
  COMPLETED: 'completed',                // ID 4 - Atención integral completada
  CANCELLED: 'cancelled',                // ID 5 - Cita cancelada
  NO_SHOW: 'no_show',                    // ID 6 - Paciente no asistió
  RESCHEDULED: 'rescheduled',            // ID 7 - Reprogramación pendiente de aprobación
  REJECTED: 'rejected'                   // ID 8 - Cita rechazada
} as const;

export const APPOINTMENT_STATUS_CONFIG = {
  [APPOINTMENT_STATUSES.PENDING_APPROVAL]: {
    label: 'Pendiente de Aprobación',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    icon: '⏳'
  },
  [APPOINTMENT_STATUSES.SCHEDULED]: {
    label: 'Programada',
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    icon: '📅'
  },
  [APPOINTMENT_STATUSES.CONFIRMED]: {
    label: 'Confirmada',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: '✅'
  },
  [APPOINTMENT_STATUSES.IN_PROGRESS]: {
    label: 'En Proceso',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    icon: '🏥'
  },
  [APPOINTMENT_STATUSES.COMPLETED]: {
    label: 'Completada',
    color: 'emerald',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    icon: '🎉'
  },
  [APPOINTMENT_STATUSES.CANCELLED]: {
    label: 'Cancelada',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: '❌'
  },
  [APPOINTMENT_STATUSES.REJECTED]: {
    label: 'Rechazada',
    color: 'rose',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    icon: '🚫'
  },
  [APPOINTMENT_STATUSES.NO_SHOW]: {
    label: 'No Asistió',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    icon: '👻'
  },
  [APPOINTMENT_STATUSES.RESCHEDULED]: {
    label: 'Reprogramada',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    icon: '🔄'
  }
};

export const CALENDAR_VIEW_MODES = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day'
} as const;

export const APPOINTMENT_DURATIONS = {
  SHORT: 30, // 30 minutos
  MEDIUM: 60, // 1 hora
  LONG: 90, // 1.5 horas
  EXTENDED: 120 // 2 horas
};

export const WORKING_HOURS = {
  START: 8, // 8:00 AM
  END: 18, // 6:00 PM
  LUNCH_START: 12, // 12:00 PM
  LUNCH_END: 13 // 1:00 PM
};

export const CALENDAR_COLORS = {
  PRIMARY: '#3B82F6',
  SUCCESS: '#10B981', 
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
  INFO: '#8B5CF6',
  LIGHT: '#6B7280'
};
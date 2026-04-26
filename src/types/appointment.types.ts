// Constantes de estados de citas
export const APPOINTMENT_STATUS = {
  PENDING_APPROVAL: 'pending_approval',
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'rescheduled',
  REJECTED: 'rejected',
} as const;

export type AppointmentStatus = typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS];

// Constantes de tipos de citas
export const APPOINTMENT_TYPE = {
  CONSULTATION: 'consultation',
  TREATMENT: 'treatment',
  FOLLOWUP: 'followup',
  EMERGENCY: 'emergency',
} as const;

export type AppointmentType = typeof APPOINTMENT_TYPE[keyof typeof APPOINTMENT_TYPE];

// Interface para Appointment
export interface AppointmentDetails {
  id: string;
  date: Date;
  time: string;
  doctorName: string;
  specialty: string;
  location: string;
  status: AppointmentStatus;
  type: AppointmentType;
  notes?: string;
  rejection_reason?: string;
}

// Configuración de estado visual
export interface StatusConfig {
  label: string;
  color: string;
}

// Mapa numérico↔key para resolver appointment_status_id sin hardcodear IDs en consumidores.
// Fuente de verdad única: cualquier comparación numérica debe pasar por estos mapas/helper.
export const APPOINTMENT_STATUS_ID_TO_KEY: Record<number, AppointmentStatus> = {
  0: APPOINTMENT_STATUS.PENDING_APPROVAL,
  1: APPOINTMENT_STATUS.SCHEDULED,
  2: APPOINTMENT_STATUS.CONFIRMED,
  3: APPOINTMENT_STATUS.IN_PROGRESS,
  4: APPOINTMENT_STATUS.COMPLETED,
  5: APPOINTMENT_STATUS.CANCELLED,
  6: APPOINTMENT_STATUS.NO_SHOW,
  7: APPOINTMENT_STATUS.RESCHEDULED,
  8: APPOINTMENT_STATUS.REJECTED,
};

export const APPOINTMENT_STATUS_KEY_TO_ID: Record<AppointmentStatus, number> = Object.fromEntries(
  Object.entries(APPOINTMENT_STATUS_ID_TO_KEY).map(([id, key]) => [key, Number(id)])
) as Record<AppointmentStatus, number>;

export const getStatusKeyById = (id: number | undefined | null): AppointmentStatus | undefined => {
  if (id === undefined || id === null) return undefined;
  return APPOINTMENT_STATUS_ID_TO_KEY[id];
};

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

import { APPOINTMENT_STATUS, APPOINTMENT_TYPE, AppointmentStatus, AppointmentType, StatusConfig } from '@/types/appointment.types';

/**
 * Obtiene la configuración visual para un estado de cita
 */
export const getStatusConfig = (status: AppointmentStatus): StatusConfig => {
  const configs: Record<AppointmentStatus, StatusConfig> = {
    [APPOINTMENT_STATUS.PENDING_APPROVAL]: {
      label: 'Pendiente de Aprobación',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    [APPOINTMENT_STATUS.SCHEDULED]: {
      label: 'Programada',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    [APPOINTMENT_STATUS.CONFIRMED]: {
      label: 'Confirmada',
      color: 'bg-green-100 text-green-800 border-green-200',
    },
    [APPOINTMENT_STATUS.IN_PROGRESS]: {
      label: 'En Proceso',
      color: 'bg-violet-100 text-violet-800 border-violet-200',
    },
    [APPOINTMENT_STATUS.COMPLETED]: {
      label: 'Completada',
      color: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    [APPOINTMENT_STATUS.CANCELLED]: {
      label: 'Cancelada',
      color: 'bg-red-100 text-red-800 border-red-200',
    },
    [APPOINTMENT_STATUS.NO_SHOW]: {
      label: 'No Asistió',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    [APPOINTMENT_STATUS.RESCHEDULED]: {
      label: 'Reprogramada',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    [APPOINTMENT_STATUS.REJECTED]: {
      label: 'Rechazada',
      color: 'bg-red-100 text-red-800 border-red-200',
    },
  };

  return configs[status] ?? {
    label: status,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  };
};

/**
 * Obtiene la etiqueta en español para un tipo de cita
 */
export const getTypeLabel = (type: AppointmentType): string => {
  const labels: Record<AppointmentType, string> = {
    [APPOINTMENT_TYPE.CONSULTATION]: 'Consulta',
    [APPOINTMENT_TYPE.TREATMENT]: 'Tratamiento',
    [APPOINTMENT_TYPE.FOLLOWUP]: 'Seguimiento',
    [APPOINTMENT_TYPE.EMERGENCY]: 'Emergencia',
  };
  return labels[type] ?? type;
};

/**
 * Formatea una fecha de cita en formato largo en español
 */
export const formatAppointmentDate = (date: Date): string => {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

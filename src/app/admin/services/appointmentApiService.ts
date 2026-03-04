/**
 * Servicio de integración con API real para Citas (Appointments)
 * Reemplaza el uso de IndexedDB por llamadas al backend
 *
 * IMPORTANTE: Este servicio NO debe ser reutilizado en otros módulos.
 * Es específico para el módulo de Citas.
 */

import { appointmentsApi, type AppointmentData } from '@/services/api/appointmentsApi';
import { patientsApi } from '@/services/api/patientsApi';
import { dentistsApi } from '@/services/api/dentistsApi';
import { httpClient } from '@/services/api/httpClient';
import type { Appointment, Patient, User } from '@/types';

/**
 * Mapea los datos del backend al formato del frontend
 * Retorna Appointment con campos adicionales del backend
 */
const mapBackendAppointmentToFrontend = (backendAppointment: any): Appointment & { branch_name?: string; room?: string } => {
  // El backend usa start_time, no appointment_time
  const startTime = backendAppointment.start_time || backendAppointment.appointment_time || '';

  // El backend envía appointment_date como ISO string "2025-11-26T05:00:00.000Z"
  // IMPORTANTE: Usar constructor con parámetros numéricos para evitar problemas de timezone
  // new Date(string) puede interpretar incorrectamente la zona horaria
  let appointmentDateTime: Date;

  if (backendAppointment.appointment_date) {
    // Extraer solo la fecha (YYYY-MM-DD) del ISO string
    const dateOnly = backendAppointment.appointment_date.split('T')[0];
    const [year, month, day] = dateOnly.split('-').map(Number);

    // Parsear la hora (HH:MM o HH:MM:SS)
    const timeParts = (startTime || '00:00').split(':').map(Number);
    const hours = timeParts[0] || 0;
    const minutes = timeParts[1] || 0;

    // Crear fecha en zona horaria LOCAL (mes es 0-indexed)
    appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
  } else {
    appointmentDateTime = new Date();
  }

  const mapped = {
    id: backendAppointment.appointment_id?.toString() || '',
    patientId: backendAppointment.patient_id?.toString() || '',
    doctorId: backendAppointment.dentist_id?.toString() || '',
    date: appointmentDateTime,
    startTime: startTime, // ✅ CORREGIDO: Usar startTime (nombre correcto según tipo Appointment)
    time: startTime, // Mantener por compatibilidad con código legacy
    endTime: backendAppointment.end_time || '',
    duration: backendAppointment.duration || backendAppointment.duration_minutes || 30,
    type: backendAppointment.appointment_type || 'consulta',
    // ✅ NUEVO: Usar status_code del backend directamente (fuente única de verdad)
    status: backendAppointment.status_code || mapStatusIdToStatus(backendAppointment.appointment_status_id) || 'pending',
    notes: backendAppointment.notes || '',
    reason: backendAppointment.reason || '',
    // Campos adicionales del backend
    sedeId: backendAppointment.branch_id?.toString(),
    branch_name: backendAppointment.branch_name || '',
    room: backendAppointment.room || '',
    consultorioId: backendAppointment.consultorio_id?.toString(),
    confirmationDate: backendAppointment.confirmation_date ? new Date(backendAppointment.confirmation_date) : undefined,
    // ✅ Campos de cancelación
    cancellationReason: backendAppointment.cancellation_reason,
    cancelled_at: backendAppointment.cancelled_at,
    // ✅ Campos de rechazo
    rejection_reason: backendAppointment.rejection_reason,
    rejected_at: backendAppointment.rejected_at,
    createdAt: backendAppointment.created_at ? new Date(backendAppointment.created_at) : new Date(),
    updatedAt: backendAppointment.updated_at ? new Date(backendAppointment.updated_at) : new Date(),
    // Campos de pago y voucher
    voucher: backendAppointment.voucher || backendAppointment.payment_voucher || '',
    price: backendAppointment.price || backendAppointment.amount || 0,
    payment_method: backendAppointment.payment_method || '',
    specialty: backendAppointment.specialty_name || backendAppointment.specialty || '',
    appointment_id: backendAppointment.appointment_id,
    rescheduleCount: parseInt(backendAppointment.reschedule_count) || 0
  };

  return mapped;
};

/**
 * Mapea el ID de estado del backend al estado del frontend
 * NOTA: Esta función se mantiene como FALLBACK. El backend ahora envía status_code directamente.
 * IDs según tabla appointment_statuses:
 * 0: Pendiente de Aprobación, 1: Programada, 2: Confirmada, 3: En Proceso,
 * 4: Completada, 5: Cancelada, 6: No Asistió, 7: Reprogramada, 8: Rechazada
 */
const mapStatusIdToStatus = (statusId: number): string => {
  const statusMap: Record<number, string> = {
    0: 'pending_approval', // Pendiente de Aprobación (creada por paciente, requiere verificación)
    1: 'scheduled',        // Programada (aprobada por staff)
    2: 'confirmed',        // ✅ NUEVO: Confirmada (voucher verificado)
    3: 'in_progress',      // ✅ NUEVO: En Proceso (atención en curso)
    4: 'completed',        // Completada (atención integral completada)
    5: 'cancelled',        // Cancelada (por usuario o admin)
    6: 'no_show',          // No Asistió (paciente no se presentó)
    7: 'rescheduled',      // Reprogramada (pendiente de aprobación de reprogramación)
    8: 'rejected'          // Rechazada (voucher inválido)
  };
  return statusMap[statusId] || 'pending_approval';
};

/**
 * Mapea el estado del frontend al ID del backend
 */
const mapStatusToStatusId = (status: string): number => {
  const statusMap: Record<string, number> = {
    'pending_approval': 0,  // Pendiente de Aprobación
    'scheduled': 1,         // Programada (aprobada y lista)
    'confirmed': 2,         // ✅ NUEVO: Confirmada
    'in_progress': 3,       // ✅ NUEVO: En Proceso
    'completed': 4,         // Completada
    'cancelled': 5,         // Cancelada (por usuario o admin)
    'no_show': 6,           // No Asistió
    'rescheduled': 7,       // Reprogramada
    'rejected': 8           // Rechazada (voucher inválido)
  };
  return statusMap[status] || 0;
};

/**
 * Helper para validar y formatear una fecha de forma segura
 * Retorna la fecha en formato YYYY-MM-DD o null si es inválida
 */
const safeFormatDate = (date: Date | string | undefined | null): { dateStr: string | null; timeStr: string | null } => {
  if (!date) {
    return { dateStr: null, timeStr: null };
  }

  let d: Date;

  if (typeof date === 'string') {
    // Si ya es string en formato YYYY-MM-DD, validar y retornar
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Validar que sea una fecha real
      const [year, month, day] = date.split('-').map(Number);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return { dateStr: date, timeStr: null };
      }
    }
    // Intentar parsear como Date
    d = new Date(date);
  } else if (date instanceof Date) {
    d = date;
  } else {
    return { dateStr: null, timeStr: null };
  }

  // Validar que el Date sea válido
  if (isNaN(d.getTime())) {
    console.error('❌ [mapFrontendAppointmentToBackend] Fecha inválida detectada:', date);
    return { dateStr: null, timeStr: null };
  }

  // Extraer fecha y hora local
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  return { dateStr, timeStr };
};

/**
 * Mapea los datos del frontend al formato del backend
 */
const mapFrontendAppointmentToBackend = (frontendAppointment: Partial<Appointment>, branchId: number = 1): any => {
  const backendData: any = {};

  if (frontendAppointment.patientId) {
    backendData.patient_id = parseInt(frontendAppointment.patientId);
  }
  if (frontendAppointment.doctorId) backendData.dentist_id = parseInt(frontendAppointment.doctorId);

  // Specialty ID - puede venir como specialtyId o specialty_id
  const specialtyId = (frontendAppointment as any).specialtyId || (frontendAppointment as any).specialty_id;
  if (specialtyId) backendData.specialty_id = parseInt(specialtyId);

  // Separar fecha y hora de forma segura
  // IMPORTANTE: No usar toISOString() porque convierte a UTC y puede desplazar la fecha un día
  let extractedTimeFromDate: string | null = null;

  if (frontendAppointment.date) {
    const { dateStr, timeStr } = safeFormatDate(frontendAppointment.date);

    if (dateStr) {
      backendData.appointment_date = dateStr;
      extractedTimeFromDate = timeStr;
    } else {
      // NO usar fallback - lanzar error para evitar guardar con fecha incorrecta
      const errorMsg = `La fecha de la cita es inválida: ${String(frontendAppointment.date)}. Por favor, seleccione una fecha válida.`;
      throw new Error(errorMsg);
    }
  }

  // Calcular start_time y end_time
  // Usar time si existe, o la hora extraída del Date object
  const timeToUse = (frontendAppointment as any).time || extractedTimeFromDate;

  if (timeToUse) {
    backendData.start_time = timeToUse; // HH:MM o HH:MM:SS

    // Calcular end_time sumando la duración
    const duration = frontendAppointment.duration || 30; // Default 30 minutos
    const [hours, minutes] = timeToUse.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    backendData.end_time = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`;
  }

  if (frontendAppointment.duration) backendData.duration = frontendAppointment.duration;
  if (frontendAppointment.type) backendData.appointment_type = frontendAppointment.type;
  if (frontendAppointment.status) backendData.appointment_status_id = mapStatusToStatusId(frontendAppointment.status);
  if (frontendAppointment.notes !== undefined) backendData.notes = frontendAppointment.notes;
  if (frontendAppointment.reason !== undefined) backendData.reason = frontendAppointment.reason;
  if (frontendAppointment.sedeId) backendData.branch_id = parseInt(frontendAppointment.sedeId);
  if (frontendAppointment.consultorioId) backendData.consultorio_id = parseInt(frontendAppointment.consultorioId);

  // Campos adicionales del formulario de edición
  if ((frontendAppointment as any).room) backendData.room = (frontendAppointment as any).room;
  if ((frontendAppointment as any).price !== undefined) backendData.price = (frontendAppointment as any).price;

  // Valores por defecto requeridos por el backend
  if (!backendData.branch_id) backendData.branch_id = branchId;
  if (!backendData.appointment_status_id) backendData.appointment_status_id = 1; // Programada por defecto

  return backendData;
};

/**
 * Mapea paciente del backend al formato frontend
 */
const mapBackendPatientToFrontend = (backendPatient: any): Patient => {
  return {
    id: backendPatient.patient_id?.toString() || '',
    firstName: backendPatient.first_name || '',
    lastName: backendPatient.last_name || '',
    dni: backendPatient.identification_number || '',
    phone: backendPatient.mobile || '',
    email: backendPatient.email || '',
    birthDate: backendPatient.birth_date ? new Date(backendPatient.birth_date) : new Date(),
    gender: backendPatient.gender_id === 1 ? 'male' : 'female',
    address: backendPatient.address || '',
    district: backendPatient.district || '',
    province: backendPatient.province || '',
    department: backendPatient.department || '',
    occupation: backendPatient.occupation || '',
    emergencyContact: backendPatient.emergency_contact_name ? {
      name: backendPatient.emergency_contact_name,
      phone: backendPatient.emergency_contact_phone || '',
      relationship: backendPatient.emergency_contact_relationship || ''
    } : undefined,
    allergies: backendPatient.allergies || '',
    chronicDiseases: backendPatient.chronic_diseases || '',
    currentMedications: backendPatient.current_medications || '',
    insuranceCompany: backendPatient.insurance_company || '',
    insurancePolicyNumber: backendPatient.insurance_policy_number || '',
    companyId: backendPatient.company_id?.toString(),
    companyName: backendPatient.company_name || '',
    ruc: backendPatient.ruc || '',
    businessName: backendPatient.business_name || '',
    referralSource: backendPatient.referral_source || '',
    notes: backendPatient.notes || '',
    photoUrl: backendPatient.profile_photo_url || '',
    esClienteNuevo: backendPatient.is_new_client ?? true,
    createdAt: new Date(backendPatient.created_at || new Date()),
    updatedAt: new Date(backendPatient.updated_at || new Date())
  };
};

/**
 * Mapea usuario/doctor del backend al formato frontend
 */
const mapBackendDoctorToFrontend = (backendDoctor: any): User => {
  // Las sedes del doctor vienen de schedule_branches (sedes donde tiene horarios configurados)
  // Fallback a branches_access o branch_id si schedule_branches no está disponible
  const scheduleBranches: number[] = backendDoctor.schedule_branches || [];
  const branchesAccess: number[] = backendDoctor.branches_access || [];

  // Usar schedule_branches como fuente principal de sedes
  const doctorBranches = scheduleBranches.length > 0 ? scheduleBranches : branchesAccess;

  const sedeId = backendDoctor.branch_id?.toString() ||
                 (doctorBranches.length > 0 ? doctorBranches[0].toString() : '');

  // Mapear especialidades del doctor (viene como array de objetos con specialty_id y specialty_name)
  const specialtiesArray = backendDoctor.specialties || [];
  const specialtiesNames = specialtiesArray.map((s: any) =>
    typeof s === 'object' ? s.specialty_name : s
  ).filter(Boolean);

  return {
    id: backendDoctor.dentist_id?.toString() || '',
    email: backendDoctor.email || '',
    firstName: backendDoctor.first_name || '',
    lastName: backendDoctor.last_name || '',
    role: 'doctor',
    sedeId: sedeId,
    // Guardar sedes donde el doctor tiene horarios configurados (schedule_branches)
    branchesAccess: doctorBranches,
    // Guardar especialidades completas (con id y nombre)
    specialtiesData: specialtiesArray,
    profile: {
      firstName: backendDoctor.first_name || '',
      lastName: backendDoctor.last_name || '',
      phone: backendDoctor.phone || '',
      licenseNumber: backendDoctor.professional_license || '',
      specialties: specialtiesNames.length > 0 ? specialtiesNames : (backendDoctor.specialty_name ? [backendDoctor.specialty_name] : []),
      department: 'Odontología',
      dni: '',
      avatar: ''
    },
    isActive: backendDoctor.is_active !== false,
    password: '',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

export const AppointmentApiService = {
  /**
   * Carga todas las citas desde el backend
   */
  async loadAppointments(filters?: {
    branchId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Appointment[]> {
    try {
      const response = await appointmentsApi.getAppointments({
        branch_id: filters?.branchId ? parseInt(filters.branchId) : undefined,
        date_from: filters?.dateFrom,
        date_to: filters?.dateTo,
        limit: 1000 // Traer todas las citas del rango
      });

      const mappedAppointments = response.data.map(mapBackendAppointmentToFrontend);

      return mappedAppointments;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Carga todos los pacientes
   */
  async loadPatients(): Promise<Patient[]> {
    try {
      const response = await patientsApi.getPatients({ limit: 1000 });
      return response.data.map(mapBackendPatientToFrontend);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Carga todos los doctores, opcionalmente filtrados por sede
   * @param branchId - ID de la sede para filtrar doctores por sus horarios en dentist_schedules
   */
  async loadDoctors(branchId?: number): Promise<User[]> {
    try {
      const filters: { limit: number; branch_id?: number } = { limit: 1000 };
      if (branchId) {
        filters.branch_id = branchId;
      }
      const response = await dentistsApi.getDentists(filters);
      return response.data.map(mapBackendDoctorToFrontend);
    } catch (error) {
      console.error('Error cargando doctores:', error);
      throw error;
    }
  },

  /**
   * Crea una nueva cita
   */
  async createAppointment(appointment: Appointment, branchId: number = 1): Promise<Appointment> {
    try {
      const backendData = mapFrontendAppointmentToBackend(appointment, branchId);

      // Validar campos requeridos
      if (!backendData.patient_id || !backendData.dentist_id || !backendData.appointment_date || !backendData.start_time || !backendData.end_time) {
        throw new Error('Faltan campos requeridos para crear la cita');
      }

      const response = await appointmentsApi.createAppointment(backendData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendAppointmentToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualiza una cita existente
   */
  async updateAppointment(appointmentId: string, appointmentData: Partial<Appointment>): Promise<Appointment> {
    try {
      const appointmentIdNum = parseInt(appointmentId);
      const backendData = mapFrontendAppointmentToBackend(appointmentData);
      const response = await appointmentsApi.updateAppointment(appointmentIdNum, backendData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendAppointmentToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Confirma una cita
   */
  async confirmAppointment(appointmentId: string): Promise<void> {
    try {
      const appointmentIdNum = parseInt(appointmentId);
      await appointmentsApi.confirmAppointment(appointmentIdNum);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cancela una cita
   */
  async cancelAppointment(appointmentId: string, reason: string): Promise<void> {
    try {
      const appointmentIdNum = parseInt(appointmentId);
      await appointmentsApi.cancelAppointment(appointmentIdNum, reason);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Marca cita como "Paciente llegó"
   */
  async markAsArrived(appointmentId: string): Promise<void> {
    try {
      const appointmentIdNum = parseInt(appointmentId);
      await appointmentsApi.markAppointmentAsArrived(appointmentIdNum);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Marca cita como completada
   */
  async markAsCompleted(appointmentId: string): Promise<void> {
    try {
      const appointmentIdNum = parseInt(appointmentId);
      await appointmentsApi.markAppointmentAsCompleted(appointmentIdNum);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Elimina una cita
   */
  async deleteAppointment(appointmentId: string): Promise<void> {
    try {
      const appointmentIdNum = parseInt(appointmentId);
      await appointmentsApi.deleteAppointment(appointmentIdNum);
    } catch (error) {
      throw error;
    }
  }
};

/**
 * Servicio de integración con API real para Pagos
 * Reemplaza el uso de Mock Data por llamadas al backend
 *
 * IMPORTANTE: Este servicio NO debe ser reutilizado en otros módulos.
 * Es específico para el módulo de Pagos de clínica.
 */

import { paymentsApi, type PaymentData, type PaymentItemData } from '@/services/api/paymentsApi';
import { patientsApi } from '@/services/api/patientsApi';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import { formatDateToYMD } from '@/utils/dateUtils';
import type { Patient, Appointment } from '@/types';

export interface ServiceItem {
  id?: number;
  name: string;
  price: number;
  quantity: number;
  type: 'sub_procedure' | 'dental_procedure' | 'additional_service' | 'manual';
  source?: string;
  sourceId?: number;
}

/**
 * Interface de Payment del frontend (Payments.tsx)
 */
interface Payment {
  id: string;
  patientId: string;
  appointmentId?: string;
  amount: number;
  description: string;
  method: 'cash' | 'card' | 'bank_transfer' | 'digital_wallet';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  date: Date;
  dueDate?: Date;
  createdBy: string;
  notes?: string;
  receiptNumber: string;
  services: ServiceItem[];
}

/**
 * Mapea el ID de método de pago del backend al formato del frontend
 */
const mapPaymentMethodIdToMethod = (methodId: number): Payment['method'] => {
  const methodMap: Record<number, Payment['method']> = {
    1: 'cash',              // Efectivo
    2: 'card',              // Tarjeta
    3: 'bank_transfer',     // Transferencia
    4: 'digital_wallet'     // Billetera digital
  };
  return methodMap[methodId] || 'cash';
};

/**
 * Mapea el método de pago del frontend al ID del backend
 */
const mapMethodToPaymentMethodId = (method: Payment['method']): number => {
  const methodMap: Record<Payment['method'], number> = {
    'cash': 1,
    'card': 2,
    'bank_transfer': 3,
    'digital_wallet': 4
  };
  return methodMap[method] || 1;
};

/**
 * Mapea los datos del backend al formato del frontend
 */
const mapBackendPaymentToFrontend = (backendPayment: PaymentData): Payment => {
  const status: Payment['status'] = 'completed';

  // Mapear items del backend a ServiceItem[]
  const services: ServiceItem[] = (backendPayment.items || []).map((item: PaymentItemData) => ({
    id: (item as any).payment_item_id,
    name: item.item_name,
    price: item.unit_price,
    quantity: item.quantity,
    type: item.item_type as ServiceItem['type'],
    sourceId: item.source_id || undefined
  }));

  return {
    id: backendPayment.payment_id?.toString() || '',
    patientId: backendPayment.patient_id?.toString() || '',
    appointmentId: undefined,
    amount: backendPayment.amount || 0,
    description: backendPayment.notes || 'Pago de tratamiento',
    method: mapPaymentMethodIdToMethod(backendPayment.payment_method_id),
    status,
    date: backendPayment.payment_date ? new Date(backendPayment.payment_date) : new Date(),
    dueDate: undefined,
    createdBy: backendPayment.user_id_registration?.toString() || '',
    notes: backendPayment.notes,
    receiptNumber: backendPayment.receipt_number || '',
    services
  };
};

/**
 * Mapea los datos del frontend al formato del backend
 */
const mapFrontendPaymentToBackend = (frontendPayment: Partial<Payment>, branchId: number = 1): Partial<PaymentData> => {
  const backendData: Partial<PaymentData> = {};

  if (frontendPayment.patientId) backendData.patient_id = parseInt(frontendPayment.patientId);
  if (frontendPayment.amount !== undefined) backendData.amount = frontendPayment.amount;
  if (frontendPayment.method) backendData.payment_method_id = mapMethodToPaymentMethodId(frontendPayment.method);
  if (frontendPayment.date) {
    const date = new Date(frontendPayment.date);
    backendData.payment_date = formatDateToYMD(date);
  }
  if (frontendPayment.notes !== undefined) backendData.notes = frontendPayment.notes;

  // Mapear ServiceItem[] a PaymentItemData[]
  if (frontendPayment.services && frontendPayment.services.length > 0) {
    backendData.items = frontendPayment.services.map(s => ({
      item_name: s.name,
      item_type: s.type,
      source_id: s.sourceId || null,
      unit_price: s.price,
      quantity: s.quantity,
      subtotal: s.price * s.quantity
    }));
  }

  backendData.branch_id = branchId;

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
 * Mapea cita del backend al formato frontend
 */
const mapBackendAppointmentToFrontend = (backendAppointment: any): Appointment => {
  // IMPORTANTE: Usar constructor con parámetros numéricos para evitar problemas de timezone
  const dateOnly = (backendAppointment.appointment_date || '').split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  const timeParts = (backendAppointment.appointment_time || '00:00').split(':').map(Number);
  const hours = timeParts[0] || 0;
  const minutes = timeParts[1] || 0;
  // Crear fecha en zona horaria LOCAL (mes es 0-indexed)
  const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);

  return {
    id: backendAppointment.appointment_id?.toString() || '',
    patientId: backendAppointment.patient_id?.toString() || '',
    doctorId: backendAppointment.dentist_id?.toString() || '',
    date: appointmentDateTime,
    time: backendAppointment.appointment_time || '',
    duration: backendAppointment.duration_minutes || 30,
    type: backendAppointment.appointment_type || 'consulta',
    status: 'confirmed', // Simplificado
    notes: backendAppointment.notes || '',
    reason: backendAppointment.reason || '',
    sedeId: backendAppointment.branch_id?.toString(),
    createdAt: new Date(backendAppointment.created_at || new Date()),
    updatedAt: new Date(backendAppointment.updated_at || new Date())
  };
};

export const PaymentApiService = {
  /**
   * Carga todos los pagos desde el backend
   */
  async loadPayments(filters?: { branchId?: number; dateFrom?: string; dateTo?: string }): Promise<Payment[]> {
    try {
      const response = await paymentsApi.getPayments({
        branch_id: filters?.branchId,
        date_from: filters?.dateFrom,
        date_to: filters?.dateTo,
        limit: 1000
      });

      return response.data.map(mapBackendPaymentToFrontend);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Carga todos los pacientes del sistema para registro de pagos
   * Un pago puede registrarse para cualquier paciente, sin importar la sede
   */
  async loadPatients(): Promise<Patient[]> {
    try {
      const response = await patientsApi.getPatients({
        limit: 1000
      });
      return response.data.map(mapBackendPatientToFrontend);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Carga todas las citas
   */
  async loadAppointments(branchId?: number): Promise<Appointment[]> {
    try {
      const response = await appointmentsApi.getAppointments({
        limit: 1000,
        branch_id: branchId
      });
      return response.data.map(mapBackendAppointmentToFrontend);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crea un nuevo pago
   */
  async createPayment(payment: Payment, branchId: number = 1): Promise<Payment> {
    try {
      const backendData = mapFrontendPaymentToBackend(payment, branchId) as PaymentData;

      // Validar campos requeridos
      if (!backendData.patient_id || !backendData.amount || !backendData.payment_method_id || !backendData.payment_date) {
        throw new Error('Faltan campos requeridos para crear el pago');
      }

      const response = await paymentsApi.createPayment(backendData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendPaymentToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualiza un pago existente
   */
  async updatePayment(paymentId: string, paymentData: Partial<Payment>): Promise<Payment> {
    try {
      const paymentIdNum = parseInt(paymentId);
      const backendData = mapFrontendPaymentToBackend(paymentData);

      const response = await paymentsApi.updatePayment(paymentIdNum, backendData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendPaymentToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Elimina un pago
   */
  async deletePayment(paymentId: string): Promise<void> {
    try {
      const paymentIdNum = parseInt(paymentId);
      await paymentsApi.deletePayment(paymentIdNum);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene pagos de un paciente
   */
  async getPaymentsByPatient(patientId: string): Promise<Payment[]> {
    try {
      const patientIdNum = parseInt(patientId);
      const response = await paymentsApi.getPayments({
        patient_id: patientIdNum,
        limit: 1000
      });

      return response.data.map(mapBackendPaymentToFrontend);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene el total de pagos en un rango de fechas
   */
  async getTotalPaymentsByDateRange(dateFrom: string, dateTo: string, branchId?: number): Promise<number> {
    try {
      const total = await paymentsApi.getTotalPaymentsByDateRange(dateFrom, dateTo, branchId);
      return total;
    } catch (error) {
      throw error;
    }
  }
};

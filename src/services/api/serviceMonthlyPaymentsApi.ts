/**
 * API Service: serviceMonthlyPaymentsApi.ts
 * Servicio para pagos mensuales recurrentes de servicios adicionales
 * (ortodoncia e implantes)
 */

import httpClient, { ApiResponse } from './httpClient';

// ============================================================================
// TIPOS
// ============================================================================

export interface ServiceMonthlyPaymentData {
  payment_id: number;
  consultation_additional_service_id: number;
  consultation_id: number;
  patient_id: number;
  branch_id: number;
  payment_number: number;
  payment_amount: string | number;
  payment_date: string;
  payment_type: 'initial' | 'monthly';
  registered_by_dentist_id: number;
  income_id: number | null;
  clinical_notes: string | null;
  status: string;
  date_time_registration: string;
  // Joined fields
  dentist_name?: string;
  dentist_cop?: string;
  service_name?: string;
  service_type?: string;
  patient_name?: string;
  patient_dni?: string;
  branch_name?: string;
}

export interface CreatePaymentData {
  consultation_additional_service_id: number;
  consultation_id: number;
  patient_id: number;
  branch_id: number;
  payment_amount: number;
  payment_type?: 'initial' | 'monthly';
  registered_by_dentist_id: number;
  clinical_notes?: string;
  service_name?: string;
}

export interface ServicePaymentStatus {
  service: {
    consultation_additional_service_id: number;
    consultation_treatment_plan_id: number;
    service_type: string;
    service_name: string;
    modality: string | null;
    original_monto_total: string | number;
    original_inicial: string | number;
    original_mensual: string | number;
    edited_monto_total: string | number;
    edited_inicial: string | number;
    edited_mensual: string | number;
    initial_payment_completed: boolean;
    initial_payment_date: string | null;
    monthly_payments_count: number;
    service_status: 'pending' | 'in_progress' | 'completed';
    service_completed_date: string | null;
    service_completed_by_dentist_id: number | null;
    consultation_id: number;
    patient_id: number;
    branch_id: number;
    patient_name: string;
    branch_name: string;
  };
  payments: {
    initial: ServiceMonthlyPaymentData[];
    monthly: ServiceMonthlyPaymentData[];
    all: ServiceMonthlyPaymentData[];
  };
  summary: {
    initial_paid: boolean;
    monthly_count: number;
    total_paid: number;
    service_status: 'pending' | 'in_progress' | 'completed';
    is_completed: boolean;
  };
}

export interface PaymentCount {
  initial_count: number;
  monthly_count: number;
  total_paid: string | number;
}

export interface DentistPaymentsSummary {
  total_payments: string;
  total_amount: string;
  payment_type: string;
  service_type: string;
  unique_patients: string;
}

export interface DentistPaymentsResponse {
  payments: ServiceMonthlyPaymentData[];
  summary: DentistPaymentsSummary[];
  period: {
    start_date: string;
    end_date: string;
  };
}

export interface FinalizeServiceData {
  dentist_id: number;
  notes?: string;
}

export interface PaymentsFilters {
  patient_id?: number;
  dentist_id?: number;
  branch_id?: number;
  service_type?: 'orthodontic' | 'implant';
  payment_type?: 'initial' | 'monthly';
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// API CALLS
// ============================================================================

/**
 * Obtener todos los pagos con filtros opcionales
 */
export const getAllPayments = async (
  filters?: PaymentsFilters
): Promise<ApiResponse<ServiceMonthlyPaymentData[]>> => {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }

  const queryString = params.toString();
  const endpoint = queryString
    ? `/service-monthly-payments?${queryString}`
    : '/service-monthly-payments';

  return httpClient.get<ServiceMonthlyPaymentData[]>(endpoint);
};

/**
 * Registrar un nuevo pago (inicial o mensual)
 */
export const registerPayment = async (
  data: CreatePaymentData
): Promise<ApiResponse<{ payment: ServiceMonthlyPaymentData; income: any }>> => {
  return httpClient.post('/service-monthly-payments', data);
};

/**
 * Obtener pagos de un servicio especifico
 */
export const getPaymentsByService = async (
  serviceId: number
): Promise<ApiResponse<ServiceMonthlyPaymentData[]>> => {
  return httpClient.get<ServiceMonthlyPaymentData[]>(
    `/service-monthly-payments/service/${serviceId}`
  );
};

/**
 * Obtener estado completo de un servicio con sus pagos
 */
export const getServicePaymentStatus = async (
  serviceId: number
): Promise<ApiResponse<ServicePaymentStatus>> => {
  return httpClient.get<ServicePaymentStatus>(
    `/service-monthly-payments/status/${serviceId}`
  );
};

/**
 * Obtener conteo de pagos de un servicio
 */
export const getPaymentCount = async (
  serviceId: number
): Promise<ApiResponse<PaymentCount>> => {
  return httpClient.get<PaymentCount>(
    `/service-monthly-payments/count/${serviceId}`
  );
};

/**
 * Obtener pagos de un paciente
 */
export const getPaymentsByPatient = async (
  patientId: number
): Promise<ApiResponse<ServiceMonthlyPaymentData[]>> => {
  return httpClient.get<ServiceMonthlyPaymentData[]>(
    `/service-monthly-payments/patient/${patientId}`
  );
};

/**
 * Obtener pagos de un dentista (para comisiones)
 */
export const getPaymentsByDentist = async (
  dentistId: number,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<DentistPaymentsResponse>> => {
  const params = new URLSearchParams();

  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const queryString = params.toString();
  const endpoint = queryString
    ? `/service-monthly-payments/dentist/${dentistId}?${queryString}`
    : `/service-monthly-payments/dentist/${dentistId}`;

  return httpClient.get<DentistPaymentsResponse>(endpoint);
};

/**
 * Finalizar un servicio (marcar como completado)
 */
export const finalizeService = async (
  serviceId: number,
  data: FinalizeServiceData
): Promise<ApiResponse<any>> => {
  return httpClient.post(`/service-monthly-payments/finalize/${serviceId}`, data);
};

/**
 * Eliminar un pago
 */
export const deletePayment = async (
  paymentId: number
): Promise<ApiResponse<ServiceMonthlyPaymentData>> => {
  return httpClient.delete<ServiceMonthlyPaymentData>(
    `/service-monthly-payments/${paymentId}`
  );
};

// ============================================================================
// OBJETO EXPORTADO
// ============================================================================

export const serviceMonthlyPaymentsApi = {
  getAllPayments,
  registerPayment,
  getPaymentsByService,
  getServicePaymentStatus,
  getPaymentCount,
  getPaymentsByPatient,
  getPaymentsByDentist,
  finalizeService,
  deletePayment,
};

export default serviceMonthlyPaymentsApi;

/**
 * API Service para Comisiones de Dentistas
 */

import httpClient from './httpClient';

// Tipos
export interface PendingIncome {
  income_id: number;
  consultation_id: number;
  patient_id: number;
  branch_id: number;
  income_type: string;
  item_name: string;
  item_description?: string;
  amount: number;
  discount_amount: number;
  final_amount: number;
  performed_date: string;
  performed_time?: string;
  clinical_notes?: string;
  income_status: string;
  patient_name: string;
  branch_name: string;
}

export interface PendingIncomesResponse {
  incomes: PendingIncome[];
  totals: {
    grossIncome: number;
    incomeCount: number;
  };
}

export interface Commission {
  commission_id: number;
  dentist_id: number;
  branch_id: number;
  period_start: string;
  period_end: string;
  gross_income: number;
  igv_amount: number;
  prosthesis_lab_cost: number;
  materials_cost: number;
  other_deductions: number;
  net_base: number;
  commission_percentage: number;
  commission_amount: number;
  income_count: number;
  commission_status: 'pending' | 'approved' | 'paid' | 'cancelled';
  calculated_by?: number;
  calculated_at?: string;
  approved_by?: number;
  approved_at?: string;
  rejected_by?: number;
  rejected_at?: string;
  rejection_reason?: string;
  paid_by?: number;
  paid_at?: string;
  payment_method?: string;
  payment_reference?: string;
  payment_notes?: string;
  notes?: string;
  // Campos JOIN
  calculated_by_name?: string;
  approved_by_name?: string;
  paid_by_name?: string;
  dentist_name?: string;
  dentist_email?: string;
  professional_license?: string;
  branch_name?: string;
}

export interface CalculateCommissionRequest {
  dentistId: number;
  branchId: number;
  periodStart: string;
  periodEnd: string;
  igvAmount?: number;
  prosthesisLabCost?: number;
  materialsCost?: number;
  otherDeductions?: number;
  commissionPercentage: number;
  notes?: string;
}

export interface CommissionSummary {
  pending: { count: number; amount: number };
  approved: { count: number; amount: number };
  paid: { count: number; amount: number };
  cancelled: { count: number; amount: number };
  pendingIncomes: { count: number; amount: number };
}

// API Functions

/**
 * Obtener ingresos pendientes de comisión para un dentista
 */
export const getPendingIncomes = async (
  dentistId: number,
  params?: {
    branchId?: number;
    startDate?: string;
    endDate?: string;
  }
): Promise<PendingIncomesResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.branchId) queryParams.append('branchId', params.branchId.toString());
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const url = `/commissions/pending/${dentistId}${queryString ? `?${queryString}` : ''}`;

  const response = await httpClient.get(url);
  return response.data.data;
};

/**
 * Calcular y crear una comisión
 */
export const calculateCommission = async (data: CalculateCommissionRequest): Promise<Commission> => {
  const response = await httpClient.post('/commissions/calculate', data);
  return response.data.data;
};

/**
 * Obtener todas las comisiones (admin)
 */
export const getAllCommissions = async (params?: {
  status?: string;
  branchId?: number;
  dentistId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<Commission[]> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.branchId) queryParams.append('branchId', params.branchId.toString());
  if (params?.dentistId) queryParams.append('dentistId', params.dentistId.toString());
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString();
  const url = `/commissions${queryString ? `?${queryString}` : ''}`;

  const response = await httpClient.get(url);
  return response.data.data;
};

/**
 * Obtener comisiones de un dentista específico
 */
export const getCommissionsByDentist = async (
  dentistId: number,
  params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ commissions: Commission[]; pagination: { total: number; limit: number; offset: number } }> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString();
  const url = `/commissions/dentist/${dentistId}${queryString ? `?${queryString}` : ''}`;

  const response = await httpClient.get(url);
  return response.data.data;
};

/**
 * Obtener detalle de una comisión (con sus ingresos)
 */
export const getCommissionDetail = async (
  commissionId: number
): Promise<{ commission: Commission; incomes: PendingIncome[] }> => {
  const response = await httpClient.get(`/commissions/${commissionId}`);
  return response.data.data;
};

/**
 * Aprobar una comisión
 */
export const approveCommission = async (commissionId: number): Promise<Commission> => {
  const response = await httpClient.put(`/commissions/${commissionId}/approve`);
  return response.data.data;
};

/**
 * Rechazar una comisión
 */
export const rejectCommission = async (commissionId: number, reason: string): Promise<Commission> => {
  const response = await httpClient.put(`/commissions/${commissionId}/reject`, { reason });
  return response.data.data;
};

/**
 * Marcar comisión como pagada
 */
export const payCommission = async (
  commissionId: number,
  data?: {
    paymentMethod?: string;
    paymentReference?: string;
    paymentNotes?: string;
  }
): Promise<Commission> => {
  const response = await httpClient.put(`/commissions/${commissionId}/pay`, data || {});
  return response.data.data;
};

/**
 * Obtener resumen de comisiones de un dentista
 */
export const getCommissionSummary = async (dentistId: number): Promise<CommissionSummary> => {
  const response = await httpClient.get(`/commissions/summary/${dentistId}`);
  return response.data.data;
};

export default {
  getPendingIncomes,
  calculateCommission,
  getAllCommissions,
  getCommissionsByDentist,
  getCommissionDetail,
  approveCommission,
  rejectCommission,
  payCommission,
  getCommissionSummary
};

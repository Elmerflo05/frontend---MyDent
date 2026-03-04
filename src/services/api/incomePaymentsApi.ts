/**
 * API Service para Income Payments (Aplicación de pagos a deudas)
 * Maneja las operaciones de cuentas por cobrar y aplicación de pagos
 */

import httpClient from './httpClient';

// ============================================================
// INTERFACES
// ============================================================

export interface PendingDebt {
  income_id: number;
  patient_id: number;
  branch_id: number;
  consultation_id: number;
  item_name: string;
  item_description: string | null;
  final_amount: number;
  amount_paid: number;
  balance: number;
  payment_status: 'pending' | 'partial' | 'paid' | 'courtesy' | 'pending_verification' | 'rejected' | string;
  due_date: string | null;
  performed_date: string;
  dentist_name: string;
  branch_name: string;
  tooth_number: string | null;
  tooth_name: string | null;
  is_overdue: boolean;
  // Campos de voucher
  voucher_url?: string | null;
  voucher_submitted_at?: string | null;
  voucher_payment_method_id?: number | null;
  rejection_reason?: string | null;
  // Campo de agrupacion
  batch_id?: string | null;
}

export interface PendingVerificationItem {
  income_id: number;
  patient_id: number;
  patient_name: string;
  patient_identification: string;
  branch_id: number;
  branch_name: string;
  item_name: string;
  final_amount: number;
  voucher_url: string;
  voucher_submitted_at: string;
  payment_method_id: number;
  payment_method_name: string;
  performed_date: string;
  dentist_name: string;
  batch_id?: string | null;
}

export interface VerifiedPaymentItem {
  income_id: number;
  patient_id: number;
  patient_name: string;
  branch_id: number;
  branch_name: string;
  item_name: string;
  final_amount: number;
  payment_status: string;
  voucher_url: string | null;
  verified_by_name: string;
  verified_at: string;
  rejection_reason: string | null;
}

export interface PaymentHistoryItem {
  income_id: number;
  patient_id: number;
  patient_name: string;
  patient_dni: string;
  branch_id: number;
  branch_name: string;
  item_name: string;
  item_description: string | null;
  final_amount: number;
  amount_paid: number;
  balance: number;
  payment_status: string;
  performed_date: string;
  date_time_registration: string | null;
  due_date: string | null;
  tooth_number: string | null;
  dentist_name: string;
  voucher_url: string | null;
  voucher_submitted_at: string | null;
  payment_method_name: string | null;
  // Campo de agrupacion
  batch_id?: string | null;
  // Tipo de registro: 'service' (procedimiento) o 'direct_payment' (pago directo)
  record_type?: 'service' | 'direct_payment';
}

export interface PatientBalance {
  total_items: number;
  total_charged: number;
  total_paid: number;
  total_balance: number;
  pending_count: number;
  partial_count: number;
  paid_count: number;
  overdue_count: number;
  overdue_amount: number;
  oldest_debt_date: string | null;
}

export interface PatientWithDebt {
  patient_id: number;
  patient_name: string;
  identification_number: string;
  mobile: string;
  email: string;
  pending_items: number;
  total_balance: number;
  oldest_debt_date: string;
  latest_service_date: string;
  overdue_items: number;
}

export interface AccountsReceivableSummary {
  branch_id: number;
  branch_name: string;
  patients_with_debt: number;
  pending_incomes: number;
  total_balance: number;
  oldest_debt_date: string;
  overdue_count: number;
  overdue_amount: number;
}

export interface PaymentApplication {
  procedure_income_id: number;
  amount_applied: number;
  notes?: string;
}

export interface IncomePaymentRecord {
  income_payment_id: number;
  procedure_income_id: number;
  payment_id: number;
  amount_applied: number;
  applied_at: string;
  applied_by_user_id: number;
  notes: string | null;
  item_name: string;
  final_amount: number;
  current_balance: number;
  payment_status: string;
  performed_date: string;
  applied_by_name: string;
}

// ============================================================
// API SERVICE
// ============================================================

class IncomePaymentsApiService {
  /**
   * Obtiene el resumen de cuentas por cobrar por sede
   */
  async getAccountsReceivableSummary(branchId?: number): Promise<AccountsReceivableSummary[]> {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId.toString());

    const response = await httpClient.get<{ success: boolean; data: AccountsReceivableSummary[] }>(
      `/income-payments/accounts-receivable/summary${params.toString() ? `?${params.toString()}` : ''}`
    );

    return response.data || [];
  }

  /**
   * Obtiene la lista de pacientes con deudas pendientes
   */
  async getPatientsWithDebts(filters?: {
    branch_id?: number;
    min_balance?: number;
    only_overdue?: boolean;
    limit?: number;
  }): Promise<PatientWithDebt[]> {
    const params = new URLSearchParams();
    if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
    if (filters?.min_balance) params.append('min_balance', filters.min_balance.toString());
    if (filters?.only_overdue) params.append('only_overdue', 'true');
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await httpClient.get<{ success: boolean; data: PatientWithDebt[] }>(
      `/income-payments/patients-with-debts${params.toString() ? `?${params.toString()}` : ''}`
    );

    return response.data || [];
  }

  /**
   * Obtiene las deudas pendientes de un paciente
   */
  async getPatientPendingDebts(
    patientId: number,
    filters?: { branch_id?: number; only_overdue?: boolean; include_all?: boolean }
  ): Promise<{ debts: PendingDebt[]; total_balance: number; total_items: number }> {
    const params = new URLSearchParams();
    if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
    if (filters?.only_overdue) params.append('only_overdue', 'true');
    if (filters?.include_all) params.append('include_all', 'true');

    const response = await httpClient.get<{
      success: boolean;
      data: { debts: PendingDebt[]; total_balance: number; total_items: number };
    }>(`/income-payments/patient/${patientId}/pending${params.toString() ? `?${params.toString()}` : ''}`);

    return response.data || { debts: [], total_balance: 0, total_items: 0 };
  }

  /**
   * Obtiene el balance de un paciente
   */
  async getPatientBalance(patientId: number, branchId?: number): Promise<PatientBalance> {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId.toString());

    const response = await httpClient.get<{ success: boolean; data: PatientBalance }>(
      `/income-payments/patient/${patientId}/balance${params.toString() ? `?${params.toString()}` : ''}`
    );

    return (
      response.data || {
        total_items: 0,
        total_charged: 0,
        total_paid: 0,
        total_balance: 0,
        pending_count: 0,
        partial_count: 0,
        paid_count: 0,
        overdue_count: 0,
        overdue_amount: 0,
        oldest_debt_date: null
      }
    );
  }

  /**
   * Aplica un pago a una o más deudas
   */
  async applyPayment(
    paymentId: number,
    applications: PaymentApplication[]
  ): Promise<{
    success: boolean;
    applied_count: number;
    applications: Array<{
      income_payment: IncomePaymentRecord;
      procedure_income_id: number;
      new_balance: number;
      new_status: string;
    }>;
  }> {
    const response = await httpClient.post<{
      success: boolean;
      data: {
        success: boolean;
        applied_count: number;
        applications: Array<{
          income_payment: IncomePaymentRecord;
          procedure_income_id: number;
          new_balance: number;
          new_status: string;
        }>;
      };
    }>('/income-payments/apply', {
      payment_id: paymentId,
      applications
    });

    return response.data || { success: false, applied_count: 0, applications: [] };
  }

  /**
   * Obtiene las aplicaciones de un pago específico
   */
  async getPaymentApplications(paymentId: number): Promise<IncomePaymentRecord[]> {
    const response = await httpClient.get<{ success: boolean; data: IncomePaymentRecord[] }>(
      `/income-payments/payment/${paymentId}`
    );

    return response.data || [];
  }

  /**
   * Obtiene el historial de pagos de una deuda
   */
  async getIncomePaymentHistory(incomeId: number): Promise<IncomePaymentRecord[]> {
    const response = await httpClient.get<{ success: boolean; data: IncomePaymentRecord[] }>(
      `/income-payments/income/${incomeId}`
    );

    return response.data || [];
  }

  /**
   * Revierte una aplicación de pago
   */
  async revertPaymentApplication(
    incomePaymentId: number
  ): Promise<{
    procedure_income_id: number;
    amount_reverted: number;
    new_balance: number;
    new_status: string;
  }> {
    const response = await httpClient.delete<{
      success: boolean;
      data: {
        procedure_income_id: number;
        amount_reverted: number;
        new_balance: number;
        new_status: string;
      };
    }>(`/income-payments/${incomePaymentId}`);

    return response.data || { procedure_income_id: 0, amount_reverted: 0, new_balance: 0, new_status: '' };
  }

  /**
   * Marca una deuda como cortesía
   */
  async markAsCourtesy(incomeId: number, notes?: string): Promise<PendingDebt> {
    const response = await httpClient.patch<{ success: boolean; data: PendingDebt }>(
      `/income-payments/courtesy/${incomeId}`,
      { notes }
    );

    return response.data;
  }

  /**
   * Marca al paciente como notificado de sus deudas
   */
  async markPatientAsNotified(patientId: number): Promise<{ updated_count: number }> {
    const response = await httpClient.post<{ success: boolean; data: { updated_count: number } }>(
      `/income-payments/patient/${patientId}/notify`
    );

    return response.data || { updated_count: 0 };
  }

  // ============================================================
  // MÉTODOS DE VOUCHER Y VERIFICACIÓN
  // ============================================================

  /**
   * Subir archivo de voucher (imagen o PDF) usando Multer
   * Retorna la ruta del archivo guardado
   */
  async uploadVoucherFile(file: File): Promise<{ filePath: string; filename: string }> {
    const formData = new FormData();
    formData.append('voucher', file);

    const response = await httpClient.post<{
      success: boolean;
      data: {
        filename: string;
        originalName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
      };
    }>('/uploads/voucher', formData);

    if (!response.data) {
      throw new Error('Error al subir el archivo');
    }

    return {
      filePath: response.data.filePath,
      filename: response.data.filename
    };
  }

  /**
   * Enviar voucher de pago (usado por pacientes)
   * Primero sube el archivo, luego registra el pago
   */
  async submitVoucher(
    incomeIds: number[],
    voucherFile: File,
    paymentMethodId: number
  ): Promise<{ updated_count: number }> {
    // 1. Subir el archivo primero
    const uploadResult = await this.uploadVoucherFile(voucherFile);

    // 2. Registrar el voucher con la ruta del archivo
    const response = await httpClient.post<{ success: boolean; data: { updated_count: number } }>(
      '/income-payments/submit-voucher',
      {
        income_ids: incomeIds,
        voucher_url: uploadResult.filePath,
        payment_method_id: paymentMethodId
      }
    );

    return response.data || { updated_count: 0 };
  }

  /**
   * Obtener pagos pendientes de verificación (para admin/recepción)
   */
  async getPendingVerification(filters?: {
    branch_id?: number;
    patient_id?: number;
  }): Promise<PendingVerificationItem[]> {
    const params = new URLSearchParams();
    if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
    if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());

    const response = await httpClient.get<{ success: boolean; data: PendingVerificationItem[] }>(
      `/income-payments/pending-verification${params.toString() ? `?${params.toString()}` : ''}`
    );

    return response.data || [];
  }

  /**
   * Aprobar un voucher de pago
   */
  async approveVoucher(incomeId: number): Promise<{ income_id: number; new_status: string }> {
    const response = await httpClient.patch<{
      success: boolean;
      data: { income_id: number; new_status: string };
    }>(`/income-payments/approve/${incomeId}`);

    return response.data || { income_id: incomeId, new_status: 'paid' };
  }

  /**
   * Rechazar un voucher de pago
   */
  async rejectVoucher(
    incomeId: number,
    reason: string
  ): Promise<{ income_id: number; new_status: string }> {
    const response = await httpClient.patch<{
      success: boolean;
      data: { income_id: number; new_status: string };
    }>(`/income-payments/reject/${incomeId}`, { reason });

    return response.data || { income_id: incomeId, new_status: 'rejected' };
  }

  /**
   * Registrar pago en efectivo directo (sin voucher)
   */
  async registerCashPayment(
    incomeIds: number[],
    notes?: string
  ): Promise<{ updated_count: number }> {
    const response = await httpClient.post<{ success: boolean; data: { updated_count: number } }>(
      '/income-payments/register-cash',
      {
        income_ids: incomeIds,
        notes
      }
    );

    return response.data || { updated_count: 0 };
  }

  /**
   * Obtener historial de pagos verificados/rechazados
   */
  async getVerifiedPayments(filters?: {
    branch_id?: number;
    payment_status?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }): Promise<VerifiedPaymentItem[]> {
    const params = new URLSearchParams();
    if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
    if (filters?.payment_status) params.append('payment_status', filters.payment_status);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await httpClient.get<{ success: boolean; data: VerifiedPaymentItem[] }>(
      `/income-payments/verified${params.toString() ? `?${params.toString()}` : ''}`
    );

    return response.data || [];
  }

  /**
   * Obtener historial completo de todos los servicios/pagos
   */
  async getAllPaymentHistory(filters?: {
    branch_id?: number;
    payment_status?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaymentHistoryItem[]> {
    const params = new URLSearchParams();
    if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
    if (filters?.payment_status) params.append('payment_status', filters.payment_status);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await httpClient.get<{ success: boolean; data: PaymentHistoryItem[] }>(
      `/income-payments/history${params.toString() ? `?${params.toString()}` : ''}`
    );

    return response.data || [];
  }

  // ============================================================
  // MÉTODOS DE GENERACIÓN AUTOMÁTICA DE CUOTAS
  // ============================================================

  /**
   * Genera cuotas automáticamente para un servicio adicional
   */
  async generateServiceQuotas(
    serviceId: number,
    options?: { startDate?: string; paymentDay?: number }
  ): Promise<{
    success: boolean;
    message: string;
    service_id: number;
    service_name: string;
    total_amount: number;
    initial_amount: number;
    monthly_amount: number;
    quotas_count: number;
    quotas: any[];
  }> {
    const response = await httpClient.post<{
      success: boolean;
      message: string;
      service_id: number;
      service_name: string;
      total_amount: number;
      initial_amount: number;
      monthly_amount: number;
      quotas_count: number;
      quotas: any[];
    }>(`/income-payments/generate-quotas/${serviceId}`, {
      startDate: options?.startDate,
      paymentDay: options?.paymentDay
    });

    return response;
  }

  /**
   * Obtiene las cuotas de un servicio adicional
   */
  async getServiceQuotas(serviceId: number): Promise<{
    quotas: any[];
    summary: {
      total_quotas: number;
      paid_quotas: number;
      pending_quotas: number;
      total_amount: number;
      paid_amount: number;
      pending_amount: number;
    };
  }> {
    const response = await httpClient.get<{
      success: boolean;
      data: {
        quotas: any[];
        summary: {
          total_quotas: number;
          paid_quotas: number;
          pending_quotas: number;
          total_amount: number;
          paid_amount: number;
          pending_amount: number;
        };
      };
    }>(`/income-payments/service-quotas/${serviceId}`);

    return response.data || {
      quotas: [],
      summary: {
        total_quotas: 0,
        paid_quotas: 0,
        pending_quotas: 0,
        total_amount: 0,
        paid_amount: 0,
        pending_amount: 0
      }
    };
  }

  /**
   * Obtiene servicios adicionales pendientes de generar cuotas
   */
  async getServicesWithoutQuotas(filters?: {
    branch_id?: number;
    patient_id?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
    if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());

    const response = await httpClient.get<{ success: boolean; data: any[] }>(
      `/income-payments/services-without-quotas${params.toString() ? `?${params.toString()}` : ''}`
    );

    return response.data || [];
  }
}

// Exportar instancia singleton
export const incomePaymentsApi = new IncomePaymentsApiService();
export default incomePaymentsApi;

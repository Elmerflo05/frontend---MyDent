/**
 * API Service para Pagos
 * Maneja todas las operaciones CRUD de pagos y comprobantes con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface PaymentFilters {
  patient_id?: number;
  branch_id?: number;
  payment_method_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface PaymentVoucherData {
  voucher_id?: number;
  payment_id: number;
  voucher_type: string;
  voucher_number: string;
  voucher_date: string;
  voucher_amount: number;
  voucher_file_url?: string;
  notes?: string;
  created_at?: string;
}

export interface PaymentItemData {
  item_name: string;
  item_type: 'sub_procedure' | 'dental_procedure' | 'additional_service' | 'manual';
  source_id?: number | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface PaymentData {
  payment_id?: number;
  patient_id: number;
  branch_id: number;
  treatment_id?: number;
  budget_id?: number;
  payment_method_id: number;
  payment_date: string;
  amount: number;
  currency?: string;
  exchange_rate?: number;
  reference_number?: string;
  notes?: string;
  receipt_number?: string;
  is_advance_payment?: boolean;
  user_id_registration?: number;
  created_at?: string;
  updated_at?: string;
  items?: PaymentItemData[];

  // Datos relacionados (joins)
  patient_first_name?: string;
  patient_last_name?: string;
  payment_method_name?: string;
  branch_name?: string;
  vouchers?: PaymentVoucherData[];
}

export interface PaymentsListResponse {
  success: boolean;
  data: PaymentData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaymentResponse {
  success: boolean;
  data: PaymentData;
  message?: string;
}

export interface VoucherResponse {
  success: boolean;
  data: PaymentVoucherData;
  message?: string;
}

class PaymentsApiService {
  /**
   * Obtiene todos los pagos con filtros y paginación
   */
  async getPayments(filters?: PaymentFilters): Promise<PaymentsListResponse> {
    try {
      // Construir query params
      const params = new URLSearchParams();

      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.payment_method_id) params.append('payment_method_id', filters.payment_method_id.toString());
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/payments${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<PaymentsListResponse>(endpoint);

      return {
        success: response.success || true,
        data: response.data || [],
        pagination: response.pagination || {
          total: 0,
          page: filters?.page || 1,
          limit: filters?.limit || 20,
          totalPages: 0
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un pago por su ID
   */
  async getPaymentById(paymentId: number): Promise<PaymentResponse> {
    try {
      const response = await httpClient.get<PaymentResponse>(`/payments/${paymentId}`);

      if (!response.success || !response.data) {
        throw new Error('Pago no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo pago
   */
  async createPayment(paymentData: PaymentData): Promise<PaymentResponse> {
    try {
      const response = await httpClient.post<PaymentResponse>('/payments', paymentData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear pago');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un pago existente
   */
  async updatePayment(paymentId: number, paymentData: Partial<PaymentData>): Promise<PaymentResponse> {
    try {
      const response = await httpClient.put<PaymentResponse>(`/payments/${paymentId}`, paymentData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar pago');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un pago
   */
  async deletePayment(paymentId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/payments/${paymentId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar pago');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Agrega un comprobante a un pago
   */
  async addVoucher(paymentId: number, voucherData: PaymentVoucherData): Promise<VoucherResponse> {
    try {
      const response = await httpClient.post<VoucherResponse>(`/payments/${paymentId}/vouchers`, voucherData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al agregar comprobante');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un comprobante
   */
  async deleteVoucher(voucherId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/payments/vouchers/${voucherId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar comprobante');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene pagos de un paciente específico
   */
  async getPatientPayments(patientId: number, branchId?: number): Promise<PaymentData[]> {
    try {
      const filters: PaymentFilters = {
        patient_id: patientId,
        limit: 100
      };

      if (branchId) filters.branch_id = branchId;

      const response = await this.getPayments(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene pagos por rango de fechas
   */
  async getPaymentsByDateRange(dateFrom: string, dateTo: string, branchId?: number): Promise<PaymentData[]> {
    try {
      const filters: PaymentFilters = {
        date_from: dateFrom,
        date_to: dateTo,
        limit: 1000
      };

      if (branchId) filters.branch_id = branchId;

      const response = await this.getPayments(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene el total de pagos en un rango de fechas
   */
  async getTotalPaymentsByDateRange(dateFrom: string, dateTo: string, branchId?: number): Promise<number> {
    try {
      const payments = await this.getPaymentsByDateRange(dateFrom, dateTo, branchId);
      return payments.reduce((total, payment) => total + payment.amount, 0);
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const paymentsApi = new PaymentsApiService();
export default paymentsApi;

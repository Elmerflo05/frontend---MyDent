/**
 * API Service para Métodos de Pago por Sede
 * Gestiona los métodos de pago (Yape, Plin, transferencia, etc.) configurados por cada sede
 */

import httpClient, { ApiResponse } from './httpClient';

export interface BranchPaymentMethod {
  payment_method_id: number;
  branch_id: number;
  method_type: 'bank_transfer' | 'yape' | 'plin' | 'cash' | 'credit_card' | 'debit_card' | 'other';
  method_name: string;
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
  phone_number?: string;
  additional_info?: string;
  qr_image_url?: string;
  is_active: boolean;
  branch_name?: string;
}

export interface PaymentMethodsListResponse {
  success: boolean;
  data: BranchPaymentMethod[];
}

export interface PaymentMethodResponse {
  success: boolean;
  data: BranchPaymentMethod;
  message?: string;
}

export interface CreatePaymentMethodData {
  branch_id: number;
  method_type: 'bank_transfer' | 'yape' | 'plin' | 'cash' | 'credit_card' | 'debit_card' | 'other';
  method_name: string;
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
  phone_number?: string;
  additional_info?: string;
  is_active?: boolean;
}

class BranchPaymentMethodsApiService {
  /**
   * Obtiene todos los métodos de pago de una sede
   */
  async getPaymentMethodsByBranch(branchId: number): Promise<BranchPaymentMethod[]> {
    try {
      const response = await httpClient.get<PaymentMethodsListResponse>(
        `/branch-payment-methods?branch_id=${branchId}`
      );
      return response.data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene métodos de pago activos (para mostrar a pacientes)
   */
  async getActivePaymentMethods(branchId?: number): Promise<BranchPaymentMethod[]> {
    try {
      const endpoint = branchId
        ? `/branch-payment-methods/active?branch_id=${branchId}`
        : '/branch-payment-methods/active';

      const response = await httpClient.get<PaymentMethodsListResponse>(endpoint);
      return response.data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un método de pago por ID
   */
  async getPaymentMethodById(paymentMethodId: number): Promise<BranchPaymentMethod> {
    try {
      const response = await httpClient.get<PaymentMethodResponse>(
        `/branch-payment-methods/${paymentMethodId}`
      );

      if (!response.success || !response.data) {
        throw new Error('Método de pago no encontrado');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo método de pago
   */
  async createPaymentMethod(data: CreatePaymentMethodData): Promise<BranchPaymentMethod> {
    try {
      const response = await httpClient.post<PaymentMethodResponse>(
        '/branch-payment-methods',
        data
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear método de pago');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un método de pago
   */
  async updatePaymentMethod(
    paymentMethodId: number,
    data: Partial<CreatePaymentMethodData>
  ): Promise<BranchPaymentMethod> {
    try {
      const response = await httpClient.put<PaymentMethodResponse>(
        `/branch-payment-methods/${paymentMethodId}`,
        data
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar método de pago');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un método de pago
   */
  async deletePaymentMethod(paymentMethodId: number): Promise<void> {
    try {
      const response = await httpClient.delete<ApiResponse>(
        `/branch-payment-methods/${paymentMethodId}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar método de pago');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Activa/desactiva un método de pago
   */
  async togglePaymentMethodStatus(paymentMethodId: number, isActive: boolean): Promise<BranchPaymentMethod> {
    return this.updatePaymentMethod(paymentMethodId, { is_active: isActive });
  }

  /**
   * Sube imagen QR para un método de pago (Yape/Plin)
   */
  async uploadQrImage(paymentMethodId: number, file: File): Promise<BranchPaymentMethod> {
    const formData = new FormData();
    formData.append('qr_image', file);

    const response = await httpClient.post<PaymentMethodResponse>(
      `/branch-payment-methods/${paymentMethodId}/qr-image`,
      formData
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al subir imagen QR');
    }

    return response.data;
  }

  /**
   * Elimina imagen QR de un método de pago
   */
  async deleteQrImage(paymentMethodId: number): Promise<BranchPaymentMethod> {
    const response = await httpClient.delete<PaymentMethodResponse>(
      `/branch-payment-methods/${paymentMethodId}/qr-image`
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al eliminar imagen QR');
    }

    return response.data;
  }
}

// Exportar instancia singleton
export const branchPaymentMethodsApi = new BranchPaymentMethodsApiService();
export default branchPaymentMethodsApi;

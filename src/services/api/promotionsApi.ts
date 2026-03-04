/**
 * API Service para Promociones
 * Maneja promociones y ofertas especiales con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface PromotionData {
  promotion_id?: number;
  branch_id: number;
  promotion_name: string;
  promotion_code?: string;
  promotion_type?: string; // 'clinic' | 'imaging'
  description?: string;
  discount_type?: string;
  discount_value?: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  is_stackable?: boolean; // Puede combinarse con otras promociones
  max_uses_per_patient?: number; // Límite de usos por paciente
  applicable_procedures?: string | ApplicableProceduresConfig; // JSON con procedimientos aplicables
  terms_and_conditions?: string;
  max_uses?: number;
  current_uses?: number;
  user_id_registration?: number;
  created_at?: string;
  updated_at?: string;

  // Datos relacionados (joins)
  branch_name?: string;
}

// Estructura para applicable_procedures (JSONB)
export interface ApplicableProceduresConfig {
  scope: 'all' | 'specific' | 'category';
  items?: Array<{
    type: 'condition' | 'sub_procedure' | 'treatment' | 'category';
    id?: number;
    code?: string;
    value?: string; // Para categorías
  }>;
  exclusions?: Array<{
    type: 'condition' | 'sub_procedure' | 'treatment';
    id?: number;
    code?: string;
  }>;
}

export interface PromotionsListResponse {
  success: boolean;
  data: PromotionData[];
}

export interface PromotionResponse {
  success: boolean;
  data: PromotionData;
  message?: string;
}

export interface PromotionFilters {
  branch_id?: number;
  promotion_type?: string;  // 'clinic' | 'imaging'
  discount_type?: string;   // 'percentage' | 'fixed'
  is_active?: boolean;
  active_only?: boolean;    // Solo promociones dentro de rango de fechas
  search?: string;
  page?: number;
  limit?: number;
}

// Interfaces para validación y aplicación de promociones
export interface ProcedureForValidation {
  type: 'condition' | 'sub_procedure' | 'treatment';
  id: number;
  code?: string;
  price: number;
}

export interface ValidatePromotionRequest {
  promotion_id?: number;
  promotion_code?: string;
  patient_id?: number;
  branch_id?: number;
  procedures?: ProcedureForValidation[];
  subtotal?: number;
}

export interface ValidatePromotionResponse {
  success: boolean;
  applicable: boolean;
  message?: string;
  data?: {
    promotion_id: number;
    promotion_name: string;
    discount_type: string;
    discount_value: number;
    discount_amount: number;
    original_amount: number;
    final_amount: number;
    is_stackable: boolean;
  };
}

export interface ApplyPromotionRequest {
  promotion_id: number;
  patient_id?: number;
  budget_id?: number;
  consultation_budget_id?: number;
  procedures?: ProcedureForValidation[];
  subtotal?: number;
  notes?: string;
}

export interface ApplyPromotionResponse {
  success: boolean;
  message?: string;
  data?: {
    usage_id: number;
    applied_discount: number;
    final_amount: number;
  };
}

export interface AvailablePromotionItem {
  promotion_id: number;
  promotion_name: string;
  promotion_code?: string;
  discount_type: string;
  discount_value: number;
  end_date: string;
  is_stackable: boolean;
}

class PromotionsApiService {
  /**
   * Obtiene todas las promociones con filtros opcionales
   */
  async getPromotions(filters?: PromotionFilters): Promise<PromotionsListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.promotion_type) params.append('promotion_type', filters.promotion_type);
      if (filters?.discount_type) params.append('discount_type', filters.discount_type);
      if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
      if (filters?.active_only) params.append('active_only', 'true');
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/promotions${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<PromotionsListResponse>(endpoint);

      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene una promoción por su ID
   */
  async getPromotionById(promotionId: number): Promise<PromotionResponse> {
    try {
      const response = await httpClient.get<PromotionResponse>(`/promotions/${promotionId}`);

      if (!response.success || !response.data) {
        throw new Error('Promoción no encontrada');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea una nueva promoción
   */
  async createPromotion(promotionData: PromotionData): Promise<PromotionResponse> {
    try {
      const response = await httpClient.post<PromotionResponse>('/promotions', promotionData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear promoción');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza una promoción existente
   */
  async updatePromotion(promotionId: number, promotionData: Partial<PromotionData>): Promise<PromotionResponse> {
    try {
      const response = await httpClient.put<PromotionResponse>(`/promotions/${promotionId}`, promotionData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar promoción');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina una promoción
   */
  async deletePromotion(promotionId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/promotions/${promotionId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar promoción');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene promociones activas
   */
  async getActivePromotions(branchId?: number): Promise<PromotionData[]> {
    try {
      const response = await this.getPromotions({
        branch_id: branchId,
        is_active: true,
        active_only: true,
        limit: 1000
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene SOLO promociones activas de la clínica odontológica (no del centro de imágenes)
   * Para uso en vista de paciente
   */
  async getActiveClinicPromotions(): Promise<PromotionData[]> {
    try {
      const response = await this.getPromotions({
        promotion_type: 'clinic',
        is_active: true,
        active_only: true,  // Solo las que están dentro del rango de fechas
        limit: 1000
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene SOLO promociones activas del centro de imágenes
   */
  async getActiveImagingPromotions(): Promise<PromotionData[]> {
    try {
      const response = await this.getPromotions({
        promotion_type: 'imaging',
        is_active: true,
        active_only: true,
        limit: 1000
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Valida si una promoción puede ser aplicada
   * Verifica: vigencia, límite de usos, límite por paciente, monto mínimo, procedimientos aplicables
   */
  async validatePromotion(request: ValidatePromotionRequest): Promise<ValidatePromotionResponse> {
    try {
      const response = await httpClient.post<ValidatePromotionResponse>('/promotions/validate', request);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Aplica una promoción y registra su uso
   * Debe llamarse después de validar exitosamente
   */
  async applyPromotion(request: ApplyPromotionRequest): Promise<ApplyPromotionResponse> {
    try {
      const response = await httpClient.post<ApplyPromotionResponse>('/promotions/apply', request);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene promociones disponibles para un procedimiento específico
   */
  async getAvailablePromotionsForProcedure(params: {
    procedure_type: 'condition' | 'sub_procedure' | 'treatment';
    procedure_id: number;
    procedure_code?: string;
    branch_id?: number;
    patient_id?: number;
  }): Promise<AvailablePromotionItem[]> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('procedure_type', params.procedure_type);
      searchParams.append('procedure_id', params.procedure_id.toString());
      if (params.procedure_code) searchParams.append('procedure_code', params.procedure_code);
      if (params.branch_id) searchParams.append('branch_id', params.branch_id.toString());
      if (params.patient_id) searchParams.append('patient_id', params.patient_id.toString());

      const response = await httpClient.get<{ success: boolean; data: AvailablePromotionItem[] }>(
        `/promotions/available-for-procedure?${searchParams.toString()}`
      );

      return response.data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verifica si dos promociones pueden combinarse (stackable)
   */
  async canStackPromotions(promotionId1: number, promotionId2: number): Promise<boolean> {
    try {
      const response = await httpClient.get<{ success: boolean; can_stack: boolean }>(
        `/promotions/can-stack?promotion_id_1=${promotionId1}&promotion_id_2=${promotionId2}`
      );
      return response.can_stack || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Valida un código de promoción directamente (para uso en citas)
   * Reemplaza el sistema de cupones comprados por validación directa
   * @param code Código de promoción (ej: "VERANO2026")
   * @param patientId ID del paciente (opcional)
   * @param branchId ID de la sede (opcional)
   */
  async validatePromotionCode(
    code: string,
    patientId?: number,
    branchId?: number
  ): Promise<{
    success: boolean;
    applicable: boolean;
    data?: {
      promotion_id: number;
      promotion_name: string;
      discount_type: string;
      discount_value: number;
      discount_amount: number;
      original_amount: number;
      final_amount: number;
    };
    message?: string;
  }> {
    try {
      const response = await httpClient.post<ValidatePromotionResponse>('/promotions/validate', {
        promotion_code: code,
        patient_id: patientId,
        branch_id: branchId
      });

      return {
        success: response.success,
        applicable: response.applicable,
        data: response.data ? {
          promotion_id: response.data.promotion_id,
          promotion_name: response.data.promotion_name,
          discount_type: response.data.discount_type,
          discount_value: response.data.discount_value,
          discount_amount: response.data.discount_amount,
          original_amount: response.data.original_amount,
          final_amount: response.data.final_amount
        } : undefined,
        message: response.message
      };
    } catch (error: any) {
      return {
        success: false,
        applicable: false,
        message: error.response?.data?.message || error.message || 'Código de promoción no válido'
      };
    }
  }
}

// Exportar instancia singleton
export const promotionsApi = new PromotionsApiService();
export default promotionsApi;

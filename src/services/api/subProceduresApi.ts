/**
 * API Service para Sub-Procedures (Sub-Procedimientos)
 * Sub-procedimientos con precios diferenciados por plan de salud
 */

import httpClient, { ApiResponse } from './httpClient';

// ============================================================================
// TIPOS
// ============================================================================

export interface SubProcedureData {
  sub_procedure_id: number;
  sub_procedure_code: string | null;
  sub_procedure_name: string;
  specialty: string | null;
  description: string | null;
  odontogram_condition_code: string | null;
  price_without_plan: number;
  price_plan_personal: number | null;
  price_plan_familiar: number | null;
  price_plan_platinium: number | null;
  price_plan_oro: number | null;
  estimated_duration: number;
  requires_anesthesia: boolean;
  is_active: boolean;
  status: string;
}

export interface SubProcedureWithPrice extends SubProcedureData {
  price_with_plan: number;
  discount_amount: number;
  discount_percentage: number;
  plan_applied: string | null;
  plan_name: string | null;
  coverage_type: string | null;
  is_included_in_plan: boolean;
  has_discount: boolean;
}

export interface SubProceduresListResponse {
  success: boolean;
  data: SubProcedureData[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SubProcedureResponse {
  success: boolean;
  data: SubProcedureData;
  message?: string;
}

export interface SubProcedurePriceResponse {
  success: boolean;
  data: SubProcedureWithPrice;
}

export interface SubProcedureFilters {
  specialty?: string;
  is_active?: boolean;
  search?: string;
  odontogram_condition_code?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// SERVICIO API
// ============================================================================

class SubProceduresApiService {
  /**
   * Obtener todos los sub-procedimientos
   */
  async getSubProcedures(filters?: SubProcedureFilters): Promise<SubProceduresListResponse> {
    const params = new URLSearchParams();

    if (filters?.specialty) params.append('specialty', filters.specialty);
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.odontogram_condition_code) params.append('odontogram_condition_code', filters.odontogram_condition_code);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = `/sub-procedures${queryString ? `?${queryString}` : ''}`;

    const response = await httpClient.get<SubProceduresListResponse>(endpoint);
    return response as SubProceduresListResponse;
  }

  /**
   * Obtener sub-procedimiento por ID
   */
  async getSubProcedureById(id: number): Promise<SubProcedureResponse> {
    const response = await httpClient.get<SubProcedureResponse>(`/sub-procedures/${id}`);
    return response as SubProcedureResponse;
  }

  /**
   * Obtener sub-procedimiento por codigo
   */
  async getSubProcedureByCode(code: string): Promise<SubProcedureResponse> {
    const response = await httpClient.get<SubProcedureResponse>(`/sub-procedures/code/${code}`);
    return response as SubProcedureResponse;
  }

  /**
   * Obtener especialidades disponibles
   */
  async getSpecialties(): Promise<{ success: boolean; data: string[] }> {
    const response = await httpClient.get<{ success: boolean; data: string[] }>('/sub-procedures/specialties');
    return response as { success: boolean; data: string[] };
  }

  /**
   * Obtener sub-procedimientos por especialidad con precios de un plan
   */
  async getSubProceduresBySpecialtyWithPrices(specialty: string, planCode?: string): Promise<SubProceduresListResponse> {
    const params = new URLSearchParams();
    if (planCode) params.append('plan_code', planCode);

    const queryString = params.toString();
    const endpoint = `/sub-procedures/specialty/${encodeURIComponent(specialty)}/with-prices${queryString ? `?${queryString}` : ''}`;

    const response = await httpClient.get<SubProceduresListResponse>(endpoint);
    return response as SubProceduresListResponse;
  }

  /**
   * Obtener precio de sub-procedimiento para un paciente
   */
  async getPriceForPatient(subProcedureId: number, patientId: number): Promise<SubProcedurePriceResponse> {
    const response = await httpClient.get<SubProcedurePriceResponse>(
      `/sub-procedures/${subProcedureId}/price-for-patient/${patientId}`
    );
    return response as SubProcedurePriceResponse;
  }

  /**
   * Obtener precio por codigo para un paciente
   */
  async getPriceByCodeForPatient(code: string, patientId: number): Promise<SubProcedurePriceResponse> {
    const response = await httpClient.get<SubProcedurePriceResponse>(
      `/sub-procedures/code/${code}/price-for-patient/${patientId}`
    );
    return response as SubProcedurePriceResponse;
  }

  // ============================================================================
  // CRUD (Solo Admin)
  // ============================================================================

  /**
   * Crear sub-procedimiento
   */
  async createSubProcedure(data: Partial<SubProcedureData>): Promise<SubProcedureResponse> {
    const response = await httpClient.post<SubProcedureResponse>('/sub-procedures', data);
    return response as SubProcedureResponse;
  }

  /**
   * Actualizar sub-procedimiento
   */
  async updateSubProcedure(id: number, data: Partial<SubProcedureData>): Promise<SubProcedureResponse> {
    const response = await httpClient.put<SubProcedureResponse>(`/sub-procedures/${id}`, data);
    return response as SubProcedureResponse;
  }

  /**
   * Eliminar sub-procedimiento
   */
  async deleteSubProcedure(id: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/sub-procedures/${id}`);
    return response;
  }
}

// Exportar instancia singleton
export const subProceduresApi = new SubProceduresApiService();
export default subProceduresApi;

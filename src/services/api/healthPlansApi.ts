/**
 * API Service para Health Plans (Planes de Salud)
 * Maneja planes de afiliaci�n dental con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface HealthPlanData {
  health_plan_id?: number;
  plan_name: string;
  plan_code?: string;
  plan_type: string; // 'personal' | 'familiar' | 'planitium' | 'gold'
  description?: string;
  monthly_fee?: number;
  enrollment_fee?: number;
  coverage_details?: any; // JSONB con detalles de cobertura
  max_subscribers?: number;
  is_active?: boolean;
  status?: string;
  user_id_registration?: number;
  date_time_registration?: string;
  user_id_modification?: number;
  date_time_modification?: string;
}

export interface HealthPlansListResponse {
  success: boolean;
  data: HealthPlanData[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface HealthPlanResponse {
  success: boolean;
  data: HealthPlanData;
  message?: string;
}

export interface HealthPlanFilters {
  plan_type?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

class HealthPlansApiService {
  /**
   * Obtiene todos los planes de salud con filtros opcionales
   */
  async getHealthPlans(filters?: HealthPlanFilters): Promise<HealthPlansListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.plan_type) params.append('plan_type', filters.plan_type);
      if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/health-plans${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<HealthPlansListResponse>(endpoint);

      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un plan de salud por su ID
   */
  async getHealthPlanById(planId: number): Promise<HealthPlanResponse> {
    try {
      const response = await httpClient.get<HealthPlanResponse>(`/health-plans/${planId}`);

      if (!response.success || !response.data) {
        throw new Error('Plan de salud no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene SOLO planes de salud activos (para vista de paciente)
   */
  async getActivePlans(): Promise<HealthPlanData[]> {
    try {
      const response = await this.getHealthPlans({
        is_active: true,
        limit: 100
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un plan de salud existente
   */
  async updateHealthPlan(planId: number, planData: Partial<HealthPlanData>): Promise<HealthPlanResponse> {
    try {
      const response = await httpClient.put<HealthPlanResponse>(`/health-plans/${planId}`, planData);

      if (!response.success) {
        throw new Error(response.message || 'Error al actualizar plan de salud');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Activa un plan de salud
   */
  async activateHealthPlan(planId: number): Promise<HealthPlanResponse> {
    return this.updateHealthPlan(planId, { is_active: true, status: 'active' });
  }

  /**
   * Desactiva un plan de salud
   */
  async deactivateHealthPlan(planId: number): Promise<HealthPlanResponse> {
    return this.updateHealthPlan(planId, { is_active: false, status: 'inactive' });
  }
}

// Exportar instancia singleton
export const healthPlansApi = new HealthPlansApiService();
export default healthPlansApi;

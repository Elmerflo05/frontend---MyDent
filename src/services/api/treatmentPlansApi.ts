/**
 * API Service para Planes de Tratamiento
 * Maneja todas las operaciones CRUD de planes de tratamiento con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface TreatmentPlanFilters {
  patient_id?: number;
  dentist_id?: number;
  status_id?: number;
  branch_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface TreatmentPlanProcedureData {
  procedure_id?: number;
  treatment_plan_id?: number;
  dental_procedure_id: number;
  tooth_number?: string;
  tooth_surface?: string;
  estimated_cost?: number;
  actual_cost?: number;
  procedure_order?: number;
  notes?: string;
  status?: string;
  scheduled_date?: string;
  completed_date?: string;
  dentist_id?: number;
  created_at?: string;
  updated_at?: string;

  // Datos relacionados (joins)
  procedure_name?: string;
  dentist_name?: string;
}

export interface TreatmentPlanData {
  treatment_plan_id?: number;
  patient_id: number;
  dentist_id: number;
  branch_id: number;
  plan_name: string;
  description?: string;
  diagnosis?: string;
  total_estimated_cost?: number;
  total_actual_cost?: number;
  status_id?: number;
  priority?: string;
  start_date?: string;
  estimated_end_date?: string;
  actual_end_date?: string;
  notes?: string;
  approved_by?: number;
  approved_at?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;

  // Datos relacionados (joins)
  patient_first_name?: string;
  patient_last_name?: string;
  dentist_first_name?: string;
  dentist_last_name?: string;
  status_name?: string;
  branch_name?: string;
  procedures?: TreatmentPlanProcedureData[];
}

export interface TreatmentPlansListResponse {
  success: boolean;
  data: TreatmentPlanData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TreatmentPlanResponse {
  success: boolean;
  data: TreatmentPlanData;
  message?: string;
}

export interface ProcedureResponse {
  success: boolean;
  data: TreatmentPlanProcedureData;
  message?: string;
}

class TreatmentPlansApiService {
  /**
   * Obtiene todos los planes de tratamiento con filtros y paginación
   */
  async getTreatmentPlans(filters?: TreatmentPlanFilters): Promise<TreatmentPlansListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.dentist_id) params.append('dentist_id', filters.dentist_id.toString());
      if (filters?.status_id) params.append('status_id', filters.status_id.toString());
      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/treatment-plans${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<TreatmentPlansListResponse>(endpoint);

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
   * Obtiene un plan de tratamiento por su ID
   */
  async getTreatmentPlanById(planId: number): Promise<TreatmentPlanResponse> {
    try {
      const response = await httpClient.get<TreatmentPlanResponse>(`/treatment-plans/${planId}`);

      if (!response.success || !response.data) {
        throw new Error('Plan de tratamiento no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo plan de tratamiento
   */
  async createTreatmentPlan(planData: TreatmentPlanData): Promise<TreatmentPlanResponse> {
    try {
      const response = await httpClient.post<TreatmentPlanResponse>('/treatment-plans', planData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear plan de tratamiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un plan de tratamiento existente
   */
  async updateTreatmentPlan(planId: number, planData: Partial<TreatmentPlanData>): Promise<TreatmentPlanResponse> {
    try {
      const response = await httpClient.put<TreatmentPlanResponse>(`/treatment-plans/${planId}`, planData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar plan de tratamiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Aprueba un plan de tratamiento
   */
  async approveTreatmentPlan(planId: number): Promise<TreatmentPlanResponse> {
    try {
      const response = await httpClient.put<TreatmentPlanResponse>(`/treatment-plans/${planId}/approve`, {});

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al aprobar plan de tratamiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un plan de tratamiento
   */
  async deleteTreatmentPlan(planId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/treatment-plans/${planId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar plan de tratamiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Agrega un procedimiento a un plan de tratamiento
   */
  async addProcedure(planId: number, procedureData: TreatmentPlanProcedureData): Promise<ProcedureResponse> {
    try {
      const response = await httpClient.post<ProcedureResponse>(`/treatment-plans/${planId}/procedures`, procedureData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al agregar procedimiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un procedimiento del plan
   */
  async updateProcedure(procedureId: number, procedureData: Partial<TreatmentPlanProcedureData>): Promise<ProcedureResponse> {
    try {
      const response = await httpClient.put<ProcedureResponse>(`/treatment-plans/procedures/${procedureId}`, procedureData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar procedimiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un procedimiento del plan
   */
  async deleteProcedure(procedureId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/treatment-plans/procedures/${procedureId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar procedimiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene planes de tratamiento de un paciente específico
   */
  async getPatientTreatmentPlans(patientId: number, branchId?: number): Promise<TreatmentPlanData[]> {
    try {
      const filters: TreatmentPlanFilters = {
        patient_id: patientId,
        limit: 100
      };

      if (branchId) filters.branch_id = branchId;

      const response = await this.getTreatmentPlans(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene planes por dentista
   */
  async getDentistTreatmentPlans(dentistId: number, branchId?: number): Promise<TreatmentPlanData[]> {
    try {
      const filters: TreatmentPlanFilters = {
        dentist_id: dentistId,
        limit: 1000
      };

      if (branchId) filters.branch_id = branchId;

      const response = await this.getTreatmentPlans(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const treatmentPlansApi = new TreatmentPlansApiService();
export default treatmentPlansApi;

/**
 * API Service para Tratamientos
 * Maneja todas las operaciones CRUD de tratamientos con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface TreatmentFilters {
  patient_id?: number;
  dentist_id?: number;
  branch_id?: number;
  treatment_status_id?: number;
  page?: number;
  limit?: number;
}

export interface TreatmentData {
  treatment_id?: number;
  patient_id: number;
  dentist_id: number;
  branch_id: number;
  dental_procedure_id: number;
  treatment_status_id: number;
  treatment_date: string;
  cost: number;
  discount?: number;
  discount_type?: string;
  final_cost: number;
  payment_status?: string;
  notes?: string;
  session_number?: number;
  total_sessions?: number;
  tooth_number?: string;
  tooth_surface?: string;
  completed_date?: string;
  next_session_date?: string;
  user_id_registration?: number;
  created_at?: string;
  updated_at?: string;

  // Datos relacionados (joins)
  patient_first_name?: string;
  patient_last_name?: string;
  dentist_first_name?: string;
  dentist_last_name?: string;
  procedure_name?: string;
  procedure_code?: string;
  status_name?: string;
  status_color?: string;
  branch_name?: string;
}

export interface TreatmentsListResponse {
  success: boolean;
  data: TreatmentData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TreatmentResponse {
  success: boolean;
  data: TreatmentData;
  message?: string;
}

class TreatmentsApiService {
  /**
   * Obtiene todos los tratamientos con filtros y paginación
   */
  async getTreatments(filters?: TreatmentFilters): Promise<TreatmentsListResponse> {
    try {
      // Construir query params
      const params = new URLSearchParams();

      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.dentist_id) params.append('dentist_id', filters.dentist_id.toString());
      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.treatment_status_id) params.append('treatment_status_id', filters.treatment_status_id.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/treatments${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<TreatmentsListResponse>(endpoint);

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
   * Obtiene un tratamiento por su ID
   */
  async getTreatmentById(treatmentId: number): Promise<TreatmentResponse> {
    try {
      const response = await httpClient.get<TreatmentResponse>(`/treatments/${treatmentId}`);

      if (!response.success || !response.data) {
        throw new Error('Tratamiento no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo tratamiento
   */
  async createTreatment(treatmentData: TreatmentData): Promise<TreatmentResponse> {
    try {
      const response = await httpClient.post<TreatmentResponse>('/treatments', treatmentData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear tratamiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un tratamiento existente
   */
  async updateTreatment(treatmentId: number, treatmentData: Partial<TreatmentData>): Promise<TreatmentResponse> {
    try {
      const response = await httpClient.put<TreatmentResponse>(`/treatments/${treatmentId}`, treatmentData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar tratamiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un tratamiento
   */
  async deleteTreatment(treatmentId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/treatments/${treatmentId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar tratamiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene tratamientos de un paciente específico
   */
  async getPatientTreatments(patientId: number, branchId?: number): Promise<TreatmentData[]> {
    try {
      const filters: TreatmentFilters = {
        patient_id: patientId,
        limit: 100
      };

      if (branchId) filters.branch_id = branchId;

      const response = await this.getTreatments(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene tratamientos de un dentista específico
   */
  async getDentistTreatments(dentistId: number, branchId?: number): Promise<TreatmentData[]> {
    try {
      const filters: TreatmentFilters = {
        dentist_id: dentistId,
        limit: 100
      };

      if (branchId) filters.branch_id = branchId;

      const response = await this.getTreatments(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene tratamientos por estado
   */
  async getTreatmentsByStatus(statusId: number, branchId?: number): Promise<TreatmentData[]> {
    try {
      const filters: TreatmentFilters = {
        treatment_status_id: statusId,
        limit: 100
      };

      if (branchId) filters.branch_id = branchId;

      const response = await this.getTreatments(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const treatmentsApi = new TreatmentsApiService();
export default treatmentsApi;

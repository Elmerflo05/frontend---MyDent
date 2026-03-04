/**
 * API Service para Historial de Procedimientos (Paso 10)
 * Maneja todas las operaciones CRUD del historial clinico de procedimientos
 */

import httpClient, { ApiResponse } from './httpClient';

// Interfaces
export interface ProcedureHistoryFilters {
  patient_id?: number;
  consultation_id?: number;
  dentist_id?: number;
  procedure_type?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface ProcedureHistoryData {
  procedure_history_id?: number;
  consultation_id: number;
  patient_id: number;
  tooth_position_id?: number | null;
  tooth_surface_id?: number | null;
  procedure_name: string;
  procedure_code?: string | null;
  procedure_type?: string; // 'odontogram', 'treatment', 'additional_service'
  procedure_status?: string; // 'completed', 'partial', 'cancelled'
  procedure_result?: string; // 'successful', 'needs_followup', 'referred'
  performed_by_dentist_id: number;
  performed_date?: string;
  performed_time?: string;
  clinical_notes?: string | null;
  complications?: string | null;
  next_steps?: string | null;
  treatment_plan_item_id?: number | null;
  additional_service_id?: number | null;
  odontogram_condition_id?: number | null;
  status?: string;
  date_time_registration?: string;

  // Datos relacionados (joins)
  patient_name?: string;
  patient_dni?: string;
  dentist_name?: string;
  dentist_cop?: string;
  tooth_number?: string;
  tooth_name?: string;
  surface_code?: string;
  surface_name?: string;
  consultation_date?: string;
}

export interface ProcedureHistoryListResponse {
  success: boolean;
  data: ProcedureHistoryData[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProcedureHistoryResponse {
  success: boolean;
  data: ProcedureHistoryData;
  message?: string;
}

class ProcedureHistoryApiService {
  /**
   * Obtiene historial de procedimientos con filtros
   */
  async getProcedureHistory(filters?: ProcedureHistoryFilters): Promise<ProcedureHistoryListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.consultation_id) params.append('consultation_id', filters.consultation_id.toString());
      if (filters?.dentist_id) params.append('dentist_id', filters.dentist_id.toString());
      if (filters?.procedure_type) params.append('procedure_type', filters.procedure_type);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/procedure-history${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<ProcedureHistoryListResponse>(endpoint);

      return {
        success: response.success ?? true,
        data: response.data || [],
        pagination: response.pagination
      };
    } catch (error) {
      console.error('Error al obtener historial de procedimientos:', error);
      throw error;
    }
  }

  /**
   * Obtiene un procedimiento por su ID
   */
  async getProcedureHistoryById(procedureHistoryId: number): Promise<ProcedureHistoryResponse> {
    try {
      const response = await httpClient.get<ProcedureHistoryResponse>(`/procedure-history/${procedureHistoryId}`);

      if (!response.success || !response.data) {
        throw new Error('Procedimiento no encontrado');
      }

      return response;
    } catch (error) {
      console.error('Error al obtener procedimiento:', error);
      throw error;
    }
  }

  /**
   * Obtiene historial de procedimientos por paciente
   */
  async getPatientProcedureHistory(patientId: number): Promise<ProcedureHistoryData[]> {
    try {
      const response = await httpClient.get<ProcedureHistoryListResponse>(`/procedure-history/patient/${patientId}`);

      return response.data || [];
    } catch (error) {
      console.error('Error al obtener historial del paciente:', error);
      throw error;
    }
  }

  /**
   * Obtiene historial de procedimientos por consulta
   */
  async getConsultationProcedureHistory(consultationId: number): Promise<ProcedureHistoryData[]> {
    try {
      const response = await httpClient.get<ProcedureHistoryListResponse>(`/procedure-history/consultation/${consultationId}`);

      return response.data || [];
    } catch (error) {
      console.error('Error al obtener historial de consulta:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo registro de procedimiento
   */
  async createProcedureHistory(data: Omit<ProcedureHistoryData, 'procedure_history_id'>): Promise<ProcedureHistoryResponse> {
    try {
      const response = await httpClient.post<ProcedureHistoryResponse>('/procedure-history', data);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear procedimiento');
      }

      return response;
    } catch (error) {
      console.error('Error al crear procedimiento:', error);
      throw error;
    }
  }

  /**
   * Actualiza un registro de procedimiento
   */
  async updateProcedureHistory(procedureHistoryId: number, data: Partial<ProcedureHistoryData>): Promise<ProcedureHistoryResponse> {
    try {
      const response = await httpClient.put<ProcedureHistoryResponse>(`/procedure-history/${procedureHistoryId}`, data);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar procedimiento');
      }

      return response;
    } catch (error) {
      console.error('Error al actualizar procedimiento:', error);
      throw error;
    }
  }

  /**
   * Elimina un registro de procedimiento (soft delete)
   */
  async deleteProcedureHistory(procedureHistoryId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/procedure-history/${procedureHistoryId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar procedimiento');
      }

      return response;
    } catch (error) {
      console.error('Error al eliminar procedimiento:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const procedureHistoryApi = new ProcedureHistoryApiService();
export default procedureHistoryApi;

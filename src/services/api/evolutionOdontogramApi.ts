/**
 * API Service para Odontograma de Evolucion
 * Maneja el estado visual del progreso de tratamientos en el odontograma
 */

import httpClient, { ApiResponse } from './httpClient';

// Interfaces
export interface EvolutionOdontogramFilters {
  patient_id?: number;
  consultation_id?: number;
  condition_status?: string;
  tooth_position_id?: number;
  page?: number;
  limit?: number;
}

export interface EvolutionOdontogramData {
  evolution_id?: number;
  patient_id: number;
  consultation_id: number;
  procedure_history_id?: number | null;
  income_id?: number | null;
  tooth_position_id: number;
  tooth_surface_id?: number | null;
  condition_status: string; // 'pending' (rojo), 'in_progress' (amarillo), 'completed' (azul)
  original_condition_id?: number | null;
  original_condition_name?: string | null;
  definitive_condition_id?: number | null;
  registered_by_dentist_id: number;
  registered_date?: string;
  clinical_observation?: string | null;
  status?: string;
  date_time_registration?: string;

  // Datos relacionados (joins)
  patient_name?: string;
  patient_dni?: string;
  dentist_name?: string;
  dentist_cop?: string;
  tooth_number?: string;
  tooth_name?: string;
  quadrant?: number;
  is_adult?: boolean;
  surface_code?: string;
  surface_name?: string;
  definitive_condition_label?: string;
  dental_condition_id?: number;
}

export interface EvolutionGroupedByTooth {
  tooth_number: string;
  tooth_name: string;
  quadrant: number;
  is_adult: boolean;
  surfaces: {
    evolution_id: number;
    condition_status: string;
    surface_code: string | null;
    surface_name: string | null;
    original_condition_name: string | null;
    registered_date: string;
    dentist_name: string;
    clinical_observation: string | null;
  }[];
}

export interface EvolutionOdontogramListResponse {
  success: boolean;
  data: EvolutionOdontogramData[] | {
    raw: EvolutionOdontogramData[];
    grouped: EvolutionGroupedByTooth[];
  };
}

export interface EvolutionOdontogramResponse {
  success: boolean;
  data: EvolutionOdontogramData;
  message?: string;
}

export interface EvolutionSummary {
  pending: { count: number; teeth: number };
  in_progress: { count: number; teeth: number };
  completed: { count: number; teeth: number };
}

export interface EvolutionSummaryResponse {
  success: boolean;
  data: EvolutionSummary;
}

class EvolutionOdontogramApiService {
  /**
   * Obtiene evolucion de odontograma con filtros
   */
  async getEvolutionOdontogram(filters?: EvolutionOdontogramFilters): Promise<EvolutionOdontogramListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.consultation_id) params.append('consultation_id', filters.consultation_id.toString());
      if (filters?.condition_status) params.append('condition_status', filters.condition_status);
      if (filters?.tooth_position_id) params.append('tooth_position_id', filters.tooth_position_id.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/evolution-odontogram${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<EvolutionOdontogramListResponse>(endpoint);

      return {
        success: response.success ?? true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error al obtener evolucion de odontograma:', error);
      throw error;
    }
  }

  /**
   * Obtiene evolucion por ID
   */
  async getEvolutionOdontogramById(evolutionId: number): Promise<EvolutionOdontogramResponse> {
    try {
      const response = await httpClient.get<EvolutionOdontogramResponse>(`/evolution-odontogram/${evolutionId}`);

      if (!response.success || !response.data) {
        throw new Error('Evolucion no encontrada');
      }

      return response;
    } catch (error) {
      console.error('Error al obtener evolucion:', error);
      throw error;
    }
  }

  /**
   * Obtiene evolucion del odontograma por paciente (agrupado por diente)
   */
  async getPatientEvolution(patientId: number): Promise<{ raw: EvolutionOdontogramData[]; grouped: EvolutionGroupedByTooth[] }> {
    try {
      const response = await httpClient.get<EvolutionOdontogramListResponse>(`/evolution-odontogram/patient/${patientId}`);

      if (response.data && typeof response.data === 'object' && 'raw' in response.data) {
        return response.data;
      }

      // Si viene como array simple, devolver con grouped vacio
      return {
        raw: Array.isArray(response.data) ? response.data : [],
        grouped: []
      };
    } catch (error) {
      console.error('Error al obtener evolucion del paciente:', error);
      throw error;
    }
  }

  /**
   * Obtiene resumen de evolucion por paciente
   */
  async getPatientEvolutionSummary(patientId: number): Promise<EvolutionSummary> {
    try {
      const response = await httpClient.get<EvolutionSummaryResponse>(`/evolution-odontogram/patient/${patientId}/summary`);

      return response.data || {
        pending: { count: 0, teeth: 0 },
        in_progress: { count: 0, teeth: 0 },
        completed: { count: 0, teeth: 0 }
      };
    } catch (error) {
      console.error('Error al obtener resumen de evolucion:', error);
      throw error;
    }
  }

  /**
   * Obtiene estado de evolucion de un diente especifico
   */
  async getToothEvolution(patientId: number, toothPositionId: number, toothSurfaceId?: number): Promise<EvolutionOdontogramData | null> {
    try {
      const params = new URLSearchParams();
      if (toothSurfaceId) params.append('tooth_surface_id', toothSurfaceId.toString());

      const queryString = params.toString();
      const endpoint = `/evolution-odontogram/tooth/${patientId}/${toothPositionId}${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<EvolutionOdontogramResponse>(endpoint);

      return response.data || null;
    } catch (error) {
      console.error('Error al obtener evolucion del diente:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo registro de evolucion
   */
  async createEvolutionOdontogram(data: Omit<EvolutionOdontogramData, 'evolution_id'>): Promise<EvolutionOdontogramResponse> {
    try {
      const response = await httpClient.post<EvolutionOdontogramResponse>('/evolution-odontogram', data);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear evolucion');
      }

      return response;
    } catch (error) {
      console.error('Error al crear evolucion:', error);
      throw error;
    }
  }

  /**
   * Crea o actualiza evolucion (upsert)
   * Si ya existe para el diente/superficie, actualiza; si no, crea nuevo
   */
  async upsertEvolutionOdontogram(data: Omit<EvolutionOdontogramData, 'evolution_id'>): Promise<EvolutionOdontogramResponse> {
    try {
      const response = await httpClient.post<EvolutionOdontogramResponse>('/evolution-odontogram/upsert', data);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al guardar evolucion');
      }

      return response;
    } catch (error) {
      console.error('Error al guardar evolucion:', error);
      throw error;
    }
  }

  /**
   * Actualiza estado de evolucion
   */
  async updateEvolutionOdontogram(evolutionId: number, data: Partial<EvolutionOdontogramData>): Promise<EvolutionOdontogramResponse> {
    try {
      const response = await httpClient.put<EvolutionOdontogramResponse>(`/evolution-odontogram/${evolutionId}`, data);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar evolucion');
      }

      return response;
    } catch (error) {
      console.error('Error al actualizar evolucion:', error);
      throw error;
    }
  }

  /**
   * Elimina un registro de evolucion (soft delete)
   */
  async deleteEvolutionOdontogram(evolutionId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/evolution-odontogram/${evolutionId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar evolucion');
      }

      return response;
    } catch (error) {
      console.error('Error al eliminar evolucion:', error);
      throw error;
    }
  }

  /**
   * Marca un diente como completado en el odontograma de evolucion
   * Crea registros en procedure_history, procedure_income y evolution_odontogram
   */
  async markToothAsCompleted(params: {
    patient_id: number;
    consultation_id: number;
    branch_id: number;
    tooth_position_id: number;
    tooth_surface_id?: number;
    procedure_name: string;
    original_condition_id?: number;
    original_condition_name?: string;
    amount: number;
    performed_by_dentist_id: number;
    clinical_notes?: string;
  }): Promise<{
    procedure_history: any;
    procedure_income: any;
    evolution: EvolutionOdontogramData;
  }> {
    // Esta funcion se implementara en el frontend para coordinar
    // las 3 llamadas API necesarias
    throw new Error('Este metodo debe implementarse en el componente del frontend');
  }
}

// Exportar instancia singleton
export const evolutionOdontogramApi = new EvolutionOdontogramApiService();
export default evolutionOdontogramApi;

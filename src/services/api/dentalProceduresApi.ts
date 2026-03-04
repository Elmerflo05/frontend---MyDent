/**
 * API Service para Procedimientos Dentales
 * Maneja todas las operaciones CRUD de procedimientos dentales con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface DentalProcedureFilters {
  procedure_category?: string;
  search?: string;
}

export interface DentalProcedureData {
  dental_procedure_id?: number;
  procedure_code?: string;
  procedure_name: string;
  procedure_category?: string;
  description?: string;
  estimated_duration?: number;
  default_price?: number;
  requires_anesthesia?: boolean;
  status?: string;
  user_id_registration?: number;
  date_time_registration?: string;
  user_id_modification?: number;
  date_time_modification?: string;
}

export interface DentalProceduresListResponse {
  success: boolean;
  data: DentalProcedureData[];
}

export interface DentalProcedureResponse {
  success: boolean;
  data: DentalProcedureData;
  message?: string;
}

class DentalProceduresApiService {
  /**
   * Obtiene todos los procedimientos dentales con filtros
   */
  async getDentalProcedures(filters?: DentalProcedureFilters): Promise<DentalProceduresListResponse> {
    try {
      // Construir query params
      const params = new URLSearchParams();

      if (filters?.procedure_category) params.append('procedure_category', filters.procedure_category);
      if (filters?.search) params.append('search', filters.search);

      const queryString = params.toString();
      const endpoint = `/dental-procedures${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<DentalProceduresListResponse>(endpoint);

      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un procedimiento dental por su ID
   */
  async getDentalProcedureById(procedureId: number): Promise<DentalProcedureResponse> {
    try {
      const response = await httpClient.get<DentalProcedureResponse>(`/dental-procedures/${procedureId}`);

      if (!response.success || !response.data) {
        throw new Error('Procedimiento dental no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo procedimiento dental
   */
  async createDentalProcedure(procedureData: DentalProcedureData): Promise<DentalProcedureResponse> {
    try {
      const response = await httpClient.post<DentalProcedureResponse>('/dental-procedures', procedureData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear procedimiento dental');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un procedimiento dental existente
   */
  async updateDentalProcedure(procedureId: number, procedureData: Partial<DentalProcedureData>): Promise<DentalProcedureResponse> {
    try {
      const response = await httpClient.put<DentalProcedureResponse>(`/dental-procedures/${procedureId}`, procedureData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar procedimiento dental');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un procedimiento dental
   */
  async deleteDentalProcedure(procedureId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/dental-procedures/${procedureId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar procedimiento dental');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene procedimientos activos
   */
  async getActiveProcedures(): Promise<DentalProcedureData[]> {
    try {
      const response = await this.getDentalProcedures();
      return response.data.filter(p => p.status === 'active');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca procedimientos por nombre o código
   */
  async searchProcedures(searchTerm: string): Promise<DentalProcedureData[]> {
    try {
      const response = await this.getDentalProcedures({ search: searchTerm });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene procedimientos por categoría
   */
  async getProceduresByCategory(category: string): Promise<DentalProcedureData[]> {
    try {
      const response = await this.getDentalProcedures({ procedure_category: category });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const dentalProceduresApi = new DentalProceduresApiService();
export default dentalProceduresApi;

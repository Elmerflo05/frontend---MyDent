/**
 * API Service para Medicamentos
 * Maneja todas las operaciones CRUD de medicamentos con el backend
 */

import httpClient, { ApiResponse } from './httpClient';
import type {
  MedicationApiResponse,
  MedicationFrontend,
  CreateMedicationDto,
  UpdateMedicationDto
} from '@/types/api/medication';
import {
  transformMedicationFromApi,
  transformMedicationsFromApi,
  transformMedicationToApiCreate,
  transformMedicationToApiUpdate
} from '@/types/api/medication';

export interface MedicationsListResponse {
  success: boolean;
  data: MedicationApiResponse[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MedicationResponse {
  success: boolean;
  data: MedicationApiResponse;
  message?: string;
}

class MedicationsApiService {
  private readonly basePath = '/prescriptions/medications';

  /**
   * Obtiene todos los medicamentos con filtros opcionales
   */
  async getMedications(params?: {
    medication_type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<MedicationFrontend[]> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.medication_type) {
        queryParams.append('medication_type', params.medication_type);
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }

      const url = `${this.basePath}/all${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await httpClient.get<MedicationsListResponse>(url);

      if (!response.success || !response.data) {
        throw new Error('Error al obtener medicamentos');
      }

      return transformMedicationsFromApi(response.data);
    } catch (error) {
      console.error('Error in getMedications:', error);
      throw error;
    }
  }

  /**
   * Obtiene un medicamento por su ID
   */
  async getMedicationById(id: number): Promise<MedicationFrontend> {
    try {
      const response = await httpClient.get<MedicationResponse>(`${this.basePath}/${id}`);

      if (!response.success || !response.data) {
        throw new Error('Medicamento no encontrado');
      }

      return transformMedicationFromApi(response.data);
    } catch (error) {
      console.error('Error in getMedicationById:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo medicamento
   */
  async createMedication(medicationData: CreateMedicationDto): Promise<MedicationFrontend> {
    try {
      const payload = transformMedicationToApiCreate(medicationData);
      const response = await httpClient.post<MedicationResponse>(this.basePath, payload);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear medicamento');
      }

      return transformMedicationFromApi(response.data);
    } catch (error) {
      console.error('Error in createMedication:', error);
      throw error;
    }
  }

  /**
   * Actualiza un medicamento existente
   */
  async updateMedication(
    id: number,
    updates: UpdateMedicationDto
  ): Promise<MedicationFrontend> {
    try {
      const payload = transformMedicationToApiUpdate(updates);
      const response = await httpClient.put<MedicationResponse>(`${this.basePath}/${id}`, payload);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar medicamento');
      }

      return transformMedicationFromApi(response.data);
    } catch (error) {
      console.error('Error in updateMedication:', error);
      throw error;
    }
  }

  /**
   * Elimina un medicamento (soft delete)
   */
  async deleteMedication(id: number): Promise<void> {
    try {
      const response = await httpClient.delete<ApiResponse>(`${this.basePath}/${id}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar medicamento');
      }
    } catch (error) {
      console.error('Error in deleteMedication:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const medicationsApi = new MedicationsApiService();
export default medicationsApi;

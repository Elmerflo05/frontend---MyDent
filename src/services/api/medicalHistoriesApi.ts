/**
 * API Service para Historias Médicas
 * Maneja todas las operaciones CRUD de historias médicas de pacientes
 */

import httpClient, { ApiResponse } from './httpClient';

export interface MedicalHistoryFilters {
  patient_id?: number;
  has_allergies?: boolean;
  has_chronic_diseases?: boolean;
  has_diabetes?: boolean;
  has_hypertension?: boolean;
  page?: number;
  limit?: number;
}

export interface MedicalHistoryData {
  medical_history_id?: number;
  patient_id: number;
  has_allergies?: boolean;
  allergies_description?: string;
  has_chronic_diseases?: boolean;
  chronic_diseases_description?: string;
  has_medications?: boolean;
  current_medications?: string;
  has_surgeries?: boolean;
  surgeries_description?: string;
  has_bleeding_disorders?: boolean;
  bleeding_disorders_description?: string;
  has_diabetes?: boolean;
  has_hypertension?: boolean;
  has_heart_disease?: boolean;
  heart_disease_description?: string;
  is_pregnant?: boolean;
  pregnancy_months?: number;
  is_breastfeeding?: boolean;
  smokes?: boolean;
  smoking_frequency?: string;
  drinks_alcohol?: boolean;
  alcohol_frequency?: string;
  last_dental_visit?: string;
  dental_visit_reason?: string;
  additional_notes?: string;
  status?: string;
  user_id_registration?: number;
  date_time_registration?: string;
  user_id_modification?: number;
  date_time_modification?: string;

  // Campo de antecedentes patologicos (array de strings almacenado como JSONB)
  pathological_background?: string[];

  // Datos relacionados (joins)
  patient_first_name?: string;
  patient_last_name?: string;
  patient_full_name?: string;
}

export interface MedicalHistoriesListResponse {
  success: boolean;
  data: MedicalHistoryData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MedicalHistoryResponse {
  success: boolean;
  data: MedicalHistoryData;
  message?: string;
  wasUpdated?: boolean;
}

class MedicalHistoriesApiService {
  /**
   * Obtiene todas las historias médicas con filtros y paginación
   */
  async getMedicalHistories(filters?: MedicalHistoryFilters): Promise<MedicalHistoriesListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.has_allergies !== undefined) params.append('has_allergies', filters.has_allergies.toString());
      if (filters?.has_chronic_diseases !== undefined) params.append('has_chronic_diseases', filters.has_chronic_diseases.toString());
      if (filters?.has_diabetes !== undefined) params.append('has_diabetes', filters.has_diabetes.toString());
      if (filters?.has_hypertension !== undefined) params.append('has_hypertension', filters.has_hypertension.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/medical-histories${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<MedicalHistoriesListResponse>(endpoint);

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
   * Obtiene una historia médica por su ID
   */
  async getMedicalHistoryById(historyId: number): Promise<MedicalHistoryResponse> {
    try {
      const response = await httpClient.get<MedicalHistoryResponse>(`/medical-histories/${historyId}`);

      if (!response.success || !response.data) {
        throw new Error('Historia médica no encontrada');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene la historia médica de un paciente específico
   * Devuelve null si el paciente no tiene historia médica (esto es normal para pacientes nuevos)
   */
  async getPatientMedicalHistory(patientId: number): Promise<MedicalHistoryResponse | null> {
    try {
      const response = await httpClient.get<MedicalHistoryResponse>(`/medical-histories/patient/${patientId}`);

      if (!response.success || !response.data) {
        return null; // No hay historia médica, pero no es un error
      }

      return response;
    } catch (error: any) {
      // 404 significa que el paciente no tiene historia médica - esto es normal para pacientes nuevos
      const errorStatus = error?.status;
      const errorMessage = error?.message || '';
      const errorData = error?.data?.error || '';

      // Verificar si es un error 404 o si el mensaje indica que no se encontró
      const isNotFound =
        errorStatus === 404 ||
        errorMessage.includes('404') ||
        errorMessage.includes('no encontrada') ||
        errorMessage.includes('Error al obtener historia médica') ||
        errorData.includes('no encontrada');

      if (isNotFound) {
        return null; // No es un error, simplemente no hay historia médica
      }

      // Solo re-lanzar si es un error real del servidor (500, etc.)
      throw error;
    }
  }

  /**
   * Crea una nueva historia médica
   */
  async createMedicalHistory(historyData: MedicalHistoryData): Promise<MedicalHistoryResponse> {
    try {
      const response = await httpClient.post<MedicalHistoryResponse>('/medical-histories', historyData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear historia médica');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza una historia médica existente
   */
  async updateMedicalHistory(historyId: number, historyData: Partial<MedicalHistoryData>): Promise<MedicalHistoryResponse> {
    try {
      const response = await httpClient.put<MedicalHistoryResponse>(`/medical-histories/${historyId}`, historyData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar historia médica');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina una historia médica
   */
  async deleteMedicalHistory(historyId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/medical-histories/${historyId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar historia médica');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upsert: Crea o actualiza historia médica según patient_id
   * Si ya existe una historia médica para el paciente, la actualiza.
   * Si no existe, crea una nueva.
   */
  async upsertMedicalHistory(historyData: MedicalHistoryData): Promise<MedicalHistoryResponse> {
    try {
      const response = await httpClient.post<MedicalHistoryResponse>('/medical-histories/upsert', historyData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al procesar historia médica');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verifica si un paciente tiene alguna condición médica importante
   */
  async hasImportantConditions(patientId: number): Promise<boolean> {
    try {
      const response = await this.getPatientMedicalHistory(patientId);
      const history = response.data;

      return !!(
        history.has_allergies ||
        history.has_chronic_diseases ||
        history.has_diabetes ||
        history.has_hypertension ||
        history.has_heart_disease ||
        history.has_bleeding_disorders ||
        history.is_pregnant
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene historias médicas con alergias
   */
  async getHistoriesWithAllergies(): Promise<MedicalHistoryData[]> {
    try {
      const response = await this.getMedicalHistories({ has_allergies: true, limit: 100 });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene historias médicas con enfermedades crónicas
   */
  async getHistoriesWithChronicDiseases(): Promise<MedicalHistoryData[]> {
    try {
      const response = await this.getMedicalHistories({ has_chronic_diseases: true, limit: 100 });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene historias médicas de pacientes diabéticos
   */
  async getDiabeticPatients(): Promise<MedicalHistoryData[]> {
    try {
      const response = await this.getMedicalHistories({ has_diabetes: true, limit: 100 });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene historias médicas de pacientes hipertensos
   */
  async getHypertensivePatients(): Promise<MedicalHistoryData[]> {
    try {
      const response = await this.getMedicalHistories({ has_hypertension: true, limit: 100 });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const medicalHistoriesApi = new MedicalHistoriesApiService();
export default medicalHistoriesApi;

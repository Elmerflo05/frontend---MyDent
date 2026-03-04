/**
 * API Service para Odontogramas
 * Maneja todas las operaciones CRUD de odontogramas, condiciones y tratamientos con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface OdontogramFilters {
  patient_id?: number;
  dentist_id?: number;
  branch_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface OdontogramConditionData {
  condition_id?: number;
  odontogram_id?: number;
  tooth_number: string;
  tooth_position_id?: number;
  tooth_surface?: string;
  tooth_surface_id?: number;
  surface_code?: string;
  surface_name?: string;
  surface_section?: string; // corona, cervical, raiz, furcation, apex
  // Relacion con catalogo de condiciones dentales
  dental_condition_id?: number;
  dental_condition_code?: string; // Viene del JOIN con odontogram_dental_conditions
  condition_name?: string; // Viene del JOIN con odontogram_dental_conditions
  condition_category?: string; // Viene del JOIN con odontogram_dental_conditions
  abbreviation?: string; // Abreviatura de la condicion dental (del JOIN con odontogram_dental_conditions)
  // Precio y datos especificos
  price?: number;
  config_price_base?: number;
  severity?: string;
  description?: string;
  detected_date?: string;
  notes?: string;
  // Datos visuales (vienen del JOIN con odontogram_dental_conditions)
  // NOTA: color_type ahora puede ser modificado por evolution_odontogram:
  // - 'blue' si el tratamiento esta completado
  // - 'yellow' si esta en progreso
  // - color original (generalmente 'red') si esta pendiente
  symbol_type?: string;
  color_type?: string;
  fill_surfaces?: boolean;
  created_at?: string;
  // Diente conectado (para prótesis, aparatos ortodónticos, transposición)
  connected_tooth_number?: string;
  // Campos de evolucion (vienen del LEFT JOIN con evolution_odontogram)
  evolution_id?: number;
  evolution_status?: 'pending' | 'in_progress' | 'completed';
  evolution_observation?: string;
  evolution_date?: string;
  procedure_history_id?: number;
  income_id?: number;
}

// Interfaces para catálogos
export interface ToothPosition {
  tooth_position_id: number;
  tooth_number: string;
  tooth_name: string;
  quadrant: number;
  tooth_type: string;
  is_adult: boolean;
}

export interface ToothSurface {
  tooth_surface_id: number;
  surface_code: string;
  surface_name: string;
  description?: string;
}

// Interface para upsert de odontograma
export interface UpsertOdontogramData {
  patient_id?: number;
  dentist_id: number;
  branch_id: number;
  appointment_id?: number;
  consultation_id?: number;
  odontogram_type?: string;
  general_observations?: string;
  conditions?: OdontogramConditionData[];
}

// Interface para guardar condiciones en batch
export interface SaveConditionsBatchData {
  conditions: OdontogramConditionData[];
}

export interface SaveConditionsBatchResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    conditions: OdontogramConditionData[];
  };
}

export interface OdontogramTreatmentData {
  treatment_id?: number;
  odontogram_id?: number;
  tooth_number: string;
  tooth_surface?: string;
  treatment_type: string;
  treatment_code?: string;
  description?: string;
  status?: string;
  planned_date?: string;
  completed_date?: string;
  dentist_id?: number;
  cost?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;

  // Datos relacionados (joins)
  dentist_name?: string;
}

export interface OdontogramData {
  odontogram_id?: number;
  patient_id: number;
  dentist_id: number;
  branch_id: number;
  odontogram_date: string;
  odontogram_type?: string;
  version?: number;
  is_current_version?: boolean;
  diagnosis?: string;
  general_observations?: string;
  treatment_plan_summary?: string;
  total_estimated_cost?: number;
  status?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  date_time_registration?: string;

  // Datos relacionados (joins)
  patient_name?: string;
  patient_first_name?: string;
  patient_last_name?: string;
  identification_number?: string;
  birth_date?: string;
  dentist_name?: string;
  dentist_first_name?: string;
  dentist_last_name?: string;
  dentist_cop?: string;
  branch_name?: string;
  consultation_date?: string;
  conditions?: OdontogramConditionData[];
  treatments?: OdontogramTreatmentData[];
}

// Interface para historial de evolucion
export interface OdontogramHistoryItem {
  odontogram_id: number;
  odontogram_date: string;
  version: number;
  is_current_version: boolean;
  general_observations?: string;
  date_time_registration?: string;
  dentist_name: string;
  dentist_cop?: string;
  branch_name: string;
  consultation_id?: number;
  consultation_date?: string;
  conditions_count: number;
}

// Interface para respuesta del endpoint with-history
export interface PatientOdontogramsWithHistory {
  initialOdontogram: OdontogramData | null;
  currentEvolution: OdontogramData | null;
  evolutionHistory: OdontogramHistoryItem[];
}

export interface OdontogramsListResponse {
  success: boolean;
  data: OdontogramData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface OdontogramResponse {
  success: boolean;
  data: OdontogramData;
  message?: string;
}

export interface ConditionResponse {
  success: boolean;
  data: OdontogramConditionData;
  message?: string;
}

export interface TreatmentResponse {
  success: boolean;
  data: OdontogramTreatmentData;
  message?: string;
}

class OdontogramsApiService {
  /**
   * Obtiene todos los odontogramas con filtros y paginación
   */
  async getOdontograms(filters?: OdontogramFilters): Promise<OdontogramsListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.dentist_id) params.append('dentist_id', filters.dentist_id.toString());
      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/odontograms${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<OdontogramsListResponse>(endpoint);

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
   * Obtiene un odontograma por su ID
   */
  async getOdontogramById(odontogramId: number): Promise<OdontogramResponse> {
    try {
      const response = await httpClient.get<OdontogramResponse>(`/odontograms/${odontogramId}`);

      if (!response.success || !response.data) {
        throw new Error('Odontograma no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo odontograma
   */
  async createOdontogram(odontogramData: OdontogramData): Promise<OdontogramResponse> {
    try {
      const response = await httpClient.post<OdontogramResponse>('/odontograms', odontogramData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear odontograma');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un odontograma existente
   */
  async updateOdontogram(odontogramId: number, odontogramData: Partial<OdontogramData>): Promise<OdontogramResponse> {
    try {
      const response = await httpClient.put<OdontogramResponse>(`/odontograms/${odontogramId}`, odontogramData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar odontograma');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un odontograma
   */
  async deleteOdontogram(odontogramId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/odontograms/${odontogramId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar odontograma');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Agrega una condición a un odontograma
   */
  async addCondition(odontogramId: number, conditionData: OdontogramConditionData): Promise<ConditionResponse> {
    try {
      const response = await httpClient.post<ConditionResponse>(`/odontograms/${odontogramId}/conditions`, conditionData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al agregar condición');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina una condición del odontograma
   */
  async deleteCondition(conditionId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/odontograms/conditions/${conditionId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar condición');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Agrega un tratamiento a un odontograma
   */
  async addTreatment(odontogramId: number, treatmentData: OdontogramTreatmentData): Promise<TreatmentResponse> {
    try {
      const response = await httpClient.post<TreatmentResponse>(`/odontograms/${odontogramId}/treatments`, treatmentData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al agregar tratamiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un tratamiento del odontograma
   */
  async deleteTreatment(treatmentId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/odontograms/treatments/${treatmentId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar tratamiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene odontogramas de un paciente específico
   */
  async getPatientOdontograms(patientId: number, branchId?: number): Promise<OdontogramData[]> {
    try {
      const filters: OdontogramFilters = {
        patient_id: patientId,
        limit: 100
      };

      if (branchId) filters.branch_id = branchId;

      const response = await this.getOdontograms(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene el último odontograma de un paciente
   */
  async getLatestPatientOdontogram(patientId: number, branchId?: number): Promise<OdontogramData | null> {
    try {
      const odontograms = await this.getPatientOdontograms(patientId, branchId);

      if (odontograms.length === 0) return null;

      // Ordenar por fecha descendente y retornar el más reciente
      odontograms.sort((a, b) => {
        const dateA = new Date(a.odontogram_date || 0).getTime();
        const dateB = new Date(b.odontogram_date || 0).getTime();
        return dateB - dateA;
      });

      return odontograms[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene odontogramas por dentista
   */
  async getDentistOdontograms(dentistId: number, branchId?: number): Promise<OdontogramData[]> {
    try {
      const filters: OdontogramFilters = {
        dentist_id: dentistId,
        limit: 1000
      };

      if (branchId) filters.branch_id = branchId;

      const response = await this.getOdontograms(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ============================================================
  // NUEVOS MÉTODOS PARA INTEGRACIÓN RELACIONAL DEL ODONTOGRAMA
  // ============================================================

  /**
   * Obtiene el odontograma actual de un paciente con todas sus condiciones relacionales
   * Este método reemplaza la lectura desde localStorage
   */
  async getCurrentPatientOdontogram(patientId: number): Promise<OdontogramData | null> {
    try {
      const response = await httpClient.get<OdontogramResponse>(`/odontograms/patient/${patientId}/current`);

      if (!response.success) {
        throw new Error(response.message || 'Error al obtener odontograma actual');
      }

      return response.data || null;
    } catch (error) {
      console.error('Error al obtener odontograma actual del paciente:', error);
      throw error;
    }
  }

  /**
   * Guarda múltiples condiciones en batch (reemplaza las existentes)
   */
  async saveConditionsBatch(odontogramId: number, conditions: OdontogramConditionData[]): Promise<SaveConditionsBatchResponse> {
    try {
      const response = await httpClient.post<SaveConditionsBatchResponse>(
        `/odontograms/${odontogramId}/conditions/batch`,
        { conditions }
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al guardar condiciones');
      }

      return response;
    } catch (error) {
      console.error('Error al guardar condiciones en batch:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las condiciones de un odontograma
   */
  async getOdontogramConditions(odontogramId: number): Promise<OdontogramConditionData[]> {
    try {
      const response = await httpClient.get<{ success: boolean; data: OdontogramConditionData[] }>(
        `/odontograms/${odontogramId}/conditions`
      );

      if (!response.success) {
        throw new Error('Error al obtener condiciones');
      }

      return response.data || [];
    } catch (error) {
      console.error('Error al obtener condiciones del odontograma:', error);
      throw error;
    }
  }

  /**
   * Crear o actualizar el odontograma de un paciente con sus condiciones
   * Si el paciente ya tiene un odontograma actual, lo actualiza
   * Si no tiene, crea uno nuevo
   */
  async upsertPatientOdontogram(patientId: number, data: UpsertOdontogramData): Promise<OdontogramData> {
    try {
      const response = await httpClient.post<OdontogramResponse>(
        `/odontograms/patient/${patientId}/upsert`,
        data
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al guardar odontograma');
      }

      return response.data;
    } catch (error) {
      console.error('Error al guardar odontograma del paciente:', error);
      throw error;
    }
  }

  /**
   * Obtiene el catálogo de posiciones de dientes
   */
  async getToothPositionsCatalog(): Promise<ToothPosition[]> {
    try {
      const response = await httpClient.get<{ success: boolean; data: ToothPosition[] }>(
        '/odontograms/catalogs/tooth-positions'
      );

      if (!response.success) {
        throw new Error('Error al obtener catálogo de posiciones');
      }

      return response.data || [];
    } catch (error) {
      console.error('Error al obtener catálogo de posiciones:', error);
      throw error;
    }
  }

  /**
   * Obtiene el catálogo de superficies de dientes
   */
  async getToothSurfacesCatalog(): Promise<ToothSurface[]> {
    try {
      const response = await httpClient.get<{ success: boolean; data: ToothSurface[] }>(
        '/odontograms/catalogs/tooth-surfaces'
      );

      if (!response.success) {
        throw new Error('Error al obtener catálogo de superficies');
      }

      return response.data || [];
    } catch (error) {
      console.error('Error al obtener catálogo de superficies:', error);
      throw error;
    }
  }

  // ============================================================
  // METODOS PARA VISTA DE PACIENTE CON TABS
  // ============================================================

  /**
   * Obtiene los odontogramas del paciente para la vista con tabs:
   * - Odontograma Inicial (primer odontograma registrado)
   * - Odontograma de Evolucion (actual) + historial
   */
  async getPatientOdontogramsWithHistory(patientId: number): Promise<PatientOdontogramsWithHistory> {
    try {
      const response = await httpClient.get<{ success: boolean; data: PatientOdontogramsWithHistory }>(
        `/odontograms/patient/${patientId}/with-history`
      );

      if (!response.success) {
        throw new Error('Error al obtener odontogramas del paciente');
      }

      return response.data || {
        initialOdontogram: null,
        currentEvolution: null,
        evolutionHistory: []
      };
    } catch (error) {
      console.error('Error al obtener odontogramas del paciente:', error);
      throw error;
    }
  }

  /**
   * Obtiene un odontograma especifico con todas sus condiciones
   * para visualizar en el historial de evolucion
   */
  async getOdontogramFull(odontogramId: number): Promise<OdontogramData | null> {
    try {
      const response = await httpClient.get<OdontogramResponse>(
        `/odontograms/${odontogramId}/full`
      );

      if (!response.success) {
        throw new Error('Error al obtener odontograma');
      }

      return response.data || null;
    } catch (error) {
      console.error('Error al obtener odontograma:', error);
      throw error;
    }
  }

  /**
   * Actualiza el precio personalizado de un diente (todas sus condiciones)
   * Se usa cuando hay múltiples condiciones en el mismo diente y se define un precio combinado
   */
  async updateToothCustomPrice(
    odontogramId: number,
    toothNumber: string,
    customPrice: number
  ): Promise<{ success: boolean; message: string; data?: { updatedCount: number } }> {
    try {
      const response = await httpClient.put<{ success: boolean; message: string; data?: { updatedCount: number } }>(
        `/odontograms/${odontogramId}/tooth-price`,
        { toothNumber, customPrice }
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al actualizar precio del diente');
      }

      return response;
    } catch (error) {
      console.error('Error al actualizar precio del diente:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const odontogramsApi = new OdontogramsApiService();
export default odontogramsApi;

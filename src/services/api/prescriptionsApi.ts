/**
 * API Service para Prescripciones y Medicamentos
 * Maneja todas las operaciones CRUD de prescripciones médicas y catálogo de medicamentos
 */

import httpClient, { ApiResponse } from './httpClient';
import { apiCache } from './apiCache';

export interface PrescriptionFilters {
  patient_id?: number;
  dentist_id?: number;
  branch_id?: number;
  appointment_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface MedicationFilters {
  medication_type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PrescriptionData {
  prescription_id?: number;
  patient_id: number;
  dentist_id: number;
  branch_id: number;
  appointment_id?: number;
  prescription_date: string;
  notes?: string;
  status?: string;
  user_id_registration?: number;
  date_time_registration?: string;
  user_id_modification?: number;
  date_time_modification?: string;

  // Datos relacionados (joins)
  patient_first_name?: string;
  patient_last_name?: string;
  patient_full_name?: string;
  dentist_first_name?: string;
  dentist_last_name?: string;
  dentist_full_name?: string;
  branch_name?: string;
}

export interface MedicationData {
  medication_id?: number;
  medication_name: string;
  generic_name?: string;
  medication_type?: string;
  concentration?: string;
  description?: string;
  status?: string;
  user_id_registration?: number;
  date_time_registration?: string;
  user_id_modification?: number;
  date_time_modification?: string;
}

/**
 * Item de prescripcion (medicamento en la receta)
 */
export interface PrescriptionItemData {
  prescription_item_id?: number;
  prescription_id?: number;
  medication_id?: number | null;
  medication_name: string;
  concentration?: string;
  quantity: string;
  instructions: string;
  status?: string;
}

/**
 * Datos para crear una prescripcion completa con items
 */
export interface CreatePrescriptionWithItemsData {
  patient_id: number;
  dentist_id: number;
  branch_id: number;
  appointment_id?: number;
  consultation_id?: number;
  prescription_date: string;
  signature?: string | null;
  notes?: string;
  items: PrescriptionItemData[];
}

/**
 * Prescripcion completa con items
 */
export interface PrescriptionWithItemsData extends PrescriptionData {
  signature?: string | null;
  consultation_id?: number;
  items?: PrescriptionItemData[];
  dentist_license?: string;
}

export interface PrescriptionsListResponse {
  success: boolean;
  data: PrescriptionData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PrescriptionResponse {
  success: boolean;
  data: PrescriptionData;
  message?: string;
}

export interface MedicationsListResponse {
  success: boolean;
  data: MedicationData[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MedicationResponse {
  success: boolean;
  data: MedicationData;
  message?: string;
}

class PrescriptionsApiService {
  // ==================== PRESCRIPCIONES ====================

  /**
   * Obtiene todas las prescripciones con filtros y paginación
   */
  async getPrescriptions(filters?: PrescriptionFilters): Promise<PrescriptionsListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.dentist_id) params.append('dentist_id', filters.dentist_id.toString());
      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.appointment_id) params.append('appointment_id', filters.appointment_id.toString());
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/prescriptions${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<PrescriptionsListResponse>(endpoint);

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
   * Obtiene una prescripción por su ID
   */
  async getPrescriptionById(prescriptionId: number): Promise<PrescriptionResponse> {
    try {
      const response = await httpClient.get<PrescriptionResponse>(`/prescriptions/${prescriptionId}`);

      if (!response.success || !response.data) {
        throw new Error('Prescripción no encontrada');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea una nueva prescripcion (sin items)
   * @deprecated Usar createPrescriptionWithItems para nuevas implementaciones
   */
  async createPrescription(prescriptionData: PrescriptionData): Promise<PrescriptionResponse> {
    try {
      const response = await httpClient.post<PrescriptionResponse>('/prescriptions', prescriptionData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear prescripcion');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea una prescripcion completa con items (medicamentos)
   */
  async createPrescriptionWithItems(data: CreatePrescriptionWithItemsData): Promise<{ success: boolean; data: PrescriptionWithItemsData; message?: string }> {
    try {
      const response = await httpClient.post<{ success: boolean; data: PrescriptionWithItemsData; message?: string }>('/prescriptions', data);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear prescripcion');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene una prescripcion por consultation_id
   */
  async getPrescriptionByConsultationId(consultationId: number): Promise<{ success: boolean; data: PrescriptionWithItemsData | null }> {
    try {
      const response = await httpClient.get<{ success: boolean; data: PrescriptionWithItemsData }>(`/prescriptions/by-consultation/${consultationId}`);
      return response;
    } catch (error: any) {
      // Si es 404, no hay prescripcion para esta consulta (es valido)
      if (error?.response?.status === 404) {
        return { success: true, data: null };
      }
      throw error;
    }
  }

  /**
   * Obtiene una prescripcion completa con items por ID
   */
  async getPrescriptionComplete(prescriptionId: number): Promise<{ success: boolean; data: PrescriptionWithItemsData }> {
    try {
      const response = await httpClient.get<{ success: boolean; data: PrescriptionWithItemsData }>(`/prescriptions/complete/${prescriptionId}`);

      if (!response.success || !response.data) {
        throw new Error('Prescripcion no encontrada');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene el catalogo de medicamentos para el selector
   */
  async getMedicationCatalog(): Promise<MedicationData[]> {
    const cacheKey = 'catalog:medications';

    const fetchFn = async () => {
      const response = await this.getMedications({ limit: 500 });
      return response.data;
    };

    // Catálogo de medicamentos con caché de 10 minutos (cambia poco)
    return apiCache.withCache(cacheKey, fetchFn, 600000);
  }

  /**
   * Actualiza una prescripción existente
   */
  async updatePrescription(prescriptionId: number, prescriptionData: Partial<PrescriptionData>): Promise<PrescriptionResponse> {
    try {
      const response = await httpClient.put<PrescriptionResponse>(`/prescriptions/${prescriptionId}`, prescriptionData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar prescripción');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina una prescripción
   */
  async deletePrescription(prescriptionId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/prescriptions/${prescriptionId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar prescripción');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene prescripciones de un paciente específico
   */
  async getPatientPrescriptions(patientId: number): Promise<PrescriptionData[]> {
    try {
      const response = await this.getPrescriptions({ patient_id: patientId, limit: 100 });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene prescripciones de un dentista específico
   */
  async getDentistPrescriptions(dentistId: number): Promise<PrescriptionData[]> {
    try {
      const response = await this.getPrescriptions({ dentist_id: dentistId, limit: 100 });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene prescripciones por rango de fechas
   */
  async getPrescriptionsByDateRange(dateFrom: string, dateTo: string): Promise<PrescriptionData[]> {
    try {
      const response = await this.getPrescriptions({ date_from: dateFrom, date_to: dateTo, limit: 100 });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ==================== MEDICAMENTOS ====================

  /**
   * Obtiene todos los medicamentos del catálogo
   */
  async getMedications(filters?: MedicationFilters): Promise<MedicationsListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.medication_type) params.append('medication_type', filters.medication_type);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/prescriptions/medications/all${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<MedicationsListResponse>(endpoint);

      return {
        success: response.success || true,
        data: response.data || [],
        pagination: response.pagination
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un medicamento por su ID
   */
  async getMedicationById(medicationId: number): Promise<MedicationResponse> {
    try {
      const response = await httpClient.get<MedicationResponse>(`/prescriptions/medications/${medicationId}`);

      if (!response.success || !response.data) {
        throw new Error('Medicamento no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo medicamento en el catálogo
   */
  async createMedication(medicationData: MedicationData): Promise<MedicationResponse> {
    try {
      const response = await httpClient.post<MedicationResponse>('/prescriptions/medications', medicationData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear medicamento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un medicamento existente
   */
  async updateMedication(medicationId: number, medicationData: Partial<MedicationData>): Promise<MedicationResponse> {
    try {
      const response = await httpClient.put<MedicationResponse>(`/prescriptions/medications/${medicationId}`, medicationData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar medicamento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un medicamento del catálogo
   */
  async deleteMedication(medicationId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/prescriptions/medications/${medicationId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar medicamento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca medicamentos por nombre
   */
  async searchMedications(searchTerm: string): Promise<MedicationData[]> {
    try {
      const response = await this.getMedications({ search: searchTerm });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene medicamentos por tipo
   */
  async getMedicationsByType(medicationType: string): Promise<MedicationData[]> {
    try {
      const response = await this.getMedications({ medication_type: medicationType });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene medicamentos activos
   */
  async getActiveMedications(): Promise<MedicationData[]> {
    try {
      const response = await this.getMedications();
      return response.data.filter(m => m.status === 'active' || !m.status);
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const prescriptionsApi = new PrescriptionsApiService();
export default prescriptionsApi;

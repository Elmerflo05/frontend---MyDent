/**
 * API Service para Consultas y Consultorios
 * Maneja todas las operaciones CRUD de consultas, diagnósticos y salas
 */

import httpClient, { ApiResponse } from './httpClient';
import { apiCache } from './apiCache';

export interface ConsultationFilters {
  patient_id?: number;
  dentist_id?: number;
  branch_id?: number;
  date_from?: string;
  date_to?: string;
  consultation_date?: string;
  appointment_id?: number;
  page?: number;
  limit?: number;
}

export interface DiagnosticConditionData {
  condition_id?: number;
  consultation_id: number;
  diagnosis_option_id: number;
  tooth_number?: string;
  description?: string;
  severity?: string;
  created_at?: string;

  // Datos relacionados
  diagnosis_name?: string;
  diagnosis_code?: string;
}

export interface ConsultationRoomData {
  consultation_room_id?: number;  // ID real de la BD
  room_id?: number;               // Alias para compatibilidad
  branch_id: number;
  room_name: string;
  room_code?: string;             // Código de la sala (ej: "SALA-01")
  room_number?: string;           // Alias para compatibilidad
  floor?: string;
  equipment?: string;             // Alias para compatibilidad frontend
  equipment_description?: string; // Campo real en BD
  capacity?: number;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;

  // Datos relacionados
  branch_name?: string;
}

export interface VitalSignsData {
  blood_pressure?: string;
  heart_rate?: string;
  respiratory_rate?: string;
  weight?: string;
  height?: string;
  temperature?: string;
}

export interface ConsultationData {
  consultation_id?: number;
  patient_id: number;
  dentist_id: number;
  appointment_id?: number;
  branch_id: number;
  room_id?: number;
  consultation_date: string;
  consultation_time?: string;
  // Campos correctos del backend
  chief_complaint?: string;       // Motivo de consulta
  present_illness?: string;       // Síntomas/enfermedad actual
  vital_signs?: VitalSignsData;   // Signos vitales (JSONB)
  physical_examination?: string;  // @deprecated - Usar campos separados
  // Nuevos campos separados para examen clinico
  general_condition?: string;          // Estado general del paciente
  extraoral_exam?: string;             // Examen clinico extraoral
  extraoral_exam_images?: string[];    // Array de rutas de imagenes extraorales
  intraoral_exam?: string;             // Examen clinico intraoral
  intraoral_exam_images?: string[];    // Array de rutas de imagenes intraorales
  diagnosis?: string;
  treatment_plan?: string;
  prescriptions_given?: string;
  recommendations?: string;
  notes?: string;
  next_visit_date?: string;
  user_id_registration?: number;
  created_at?: string;
  updated_at?: string;

  // Datos relacionados (joins)
  patient_first_name?: string;
  patient_last_name?: string;
  dentist_first_name?: string;
  dentist_last_name?: string;
  room_name?: string;
  branch_name?: string;
  diagnostics?: DiagnosticConditionData[];
}

export interface ConsultationsListResponse {
  success: boolean;
  data: ConsultationData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ConsultationResponse {
  success: boolean;
  data: ConsultationData;
  message?: string;
}

export interface RoomsListResponse {
  success: boolean;
  data: ConsultationRoomData[];
}

export interface RoomResponse {
  success: boolean;
  data: ConsultationRoomData;
  message?: string;
}

export interface DiagnosticResponse {
  success: boolean;
  data: DiagnosticConditionData;
  message?: string;
}

// ==================== DIAGNÓSTICO DEFINITIVO ====================

// Interfaz para procedimientos sugeridos
export interface ConditionProcedureData {
  procedure_id: number;
  procedure_name: string;
  procedure_code?: string;
  // Precios por plan de salud
  price_without_plan?: number;
  price_plan_personal?: number | null;
  price_plan_familiar?: number | null;
  price_plan_platinium?: number | null;
  price_plan_oro?: number | null;
  applies_to_state?: string | null;
  display_order?: number;
}

export interface DefinitiveDiagnosisConditionData {
  definitive_condition_id?: number;
  consultation_id?: number;
  presumptive_condition_id?: number | null;
  odontogram_condition_id?: number | null;
  tooth_position_id: number;
  tooth_number: string;
  tooth_surface_id?: number | null;
  dental_condition_id: number;
  condition_label: string;
  cie10_code?: string | null;
  surfaces?: string[];
  surfaces_array?: string[];
  price: number;
  notes?: string | null;
  is_modified_from_presumptive?: boolean;
  modification_reason?: string | null;
  status?: string;
  // Campos para procedimiento seleccionado
  selected_procedure_id?: number | null;
  procedure_price?: number | null;
  // Datos del procedimiento seleccionado (desde JOIN)
  selected_procedure_name?: string;
  selected_procedure_code?: string;
  selected_procedure_price_base?: number;
  selected_procedure_price_personal?: number;
  selected_procedure_price_familiar?: number;
  selected_procedure_price_platinium?: number;
  selected_procedure_price_oro?: number;
  // Datos relacionados de JOINs
  tooth_name?: string;
  quadrant?: number;
  tooth_type?: string;
  is_adult?: boolean;
  condition_code?: string;
  condition_name?: string;
  condition_category?: string;
  symbol_type?: string;
  color_type?: string;
  condition_price_base?: number;
  condition_cie10_code?: string;
  surface_code?: string;
  surface_name?: string;
  // Datos de la condicion presuntiva
  presumptive_dental_condition_id?: number;
  presumptive_tooth_surface_id?: number;
  presumptive_price?: number;
  presumptive_description?: string;
  // Procedimientos sugeridos (desde odontogram_condition_procedures)
  procedures?: ConditionProcedureData[];
}

// ==================== CONDICIONES PRESUNTIVAS DEL ODONTOGRAMA ====================

export interface PresumptiveConditionData {
  odontogram_condition_id: number;
  odontogram_id: number;
  tooth_position_id: number;
  tooth_surface_id?: number | null;
  dental_condition_id?: number | null;
  description?: string | null;
  severity?: string | null;
  notes?: string | null;
  price?: number;
  surface_section?: string | null;
  // Datos del diente
  tooth_number: string;
  tooth_name?: string;
  quadrant?: number;
  tooth_type?: string;
  is_adult?: boolean;
  // Datos de la condicion dental
  condition_code?: string;
  condition_name?: string;
  condition_category?: string;
  cie10_code?: string;
  abbreviation?: string;
  symbol_type?: string;
  color_type?: string;
  price_base?: number;
  fill_surfaces?: boolean;
  // Datos de la superficie
  surface_code?: string;
  surface_name?: string;
  // Procedimientos sugeridos para esta condicion
  procedures?: ConditionProcedureData[];
}

export interface PresumptiveConditionsResponse {
  success: boolean;
  data: {
    conditions: PresumptiveConditionData[];
    summary: {
      total_conditions: number;
      total_price: number;
    };
  };
  message?: string;
}

export interface DefinitiveDiagnosisSummary {
  total_conditions: number;
  total_price: number;
  modified_count: number;
}

export interface DefinitiveDiagnosisResponse {
  success: boolean;
  data: {
    conditions: DefinitiveDiagnosisConditionData[];
    summary: DefinitiveDiagnosisSummary;
  };
  message?: string;
}

export interface DefinitiveDiagnosisConditionResponse {
  success: boolean;
  data: DefinitiveDiagnosisConditionData;
  message?: string;
}

export interface DefinitiveDiagnosisBulkResponse {
  success: boolean;
  data: {
    conditions: DefinitiveDiagnosisConditionData[];
    summary: DefinitiveDiagnosisSummary;
  };
  message?: string;
}

class ConsultationsApiService {
  /**
   * Obtiene todas las consultas con filtros y paginación
   */
  async getConsultations(filters?: ConsultationFilters): Promise<ConsultationsListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.dentist_id) params.append('dentist_id', filters.dentist_id.toString());
      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.consultation_date) params.append('consultation_date', filters.consultation_date);
      if (filters?.appointment_id) params.append('appointment_id', filters.appointment_id.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/consultations${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<ConsultationsListResponse>(endpoint);

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
   * Obtiene una consulta por su ID
   */
  async getConsultationById(consultationId: number): Promise<ConsultationResponse> {
    try {
      const response = await httpClient.get<ConsultationResponse>(`/consultations/${consultationId}`);

      if (!response.success || !response.data) {
        throw new Error('Consulta no encontrada');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea una nueva consulta
   */
  async createConsultation(consultationData: ConsultationData): Promise<ConsultationResponse> {
    try {
      const response = await httpClient.post<ConsultationResponse>('/consultations', consultationData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear consulta');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza una consulta existente
   */
  async updateConsultation(consultationId: number, consultationData: Partial<ConsultationData>): Promise<ConsultationResponse> {
    try {
      const response = await httpClient.put<ConsultationResponse>(`/consultations/${consultationId}`, consultationData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar consulta');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upsert de consulta: Crea o actualiza según appointment_id
   * Si ya existe una consulta con el mismo appointment_id, la actualiza.
   * Si no existe, crea una nueva.
   */
  async upsertConsultation(consultationData: ConsultationData): Promise<ConsultationResponse & { wasUpdated?: boolean }> {
    try {
      const response = await httpClient.post<ConsultationResponse & { wasUpdated?: boolean }>('/consultations/upsert', consultationData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al guardar consulta');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina una consulta
   */
  async deleteConsultation(consultationId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/consultations/${consultationId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar consulta');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Agrega un diagnóstico a una consulta
   */
  async addDiagnostic(consultationId: number, diagnosticData: DiagnosticConditionData): Promise<DiagnosticResponse> {
    try {
      const response = await httpClient.post<DiagnosticResponse>(`/consultations/${consultationId}/diagnostics`, diagnosticData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al agregar diagnóstico');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un diagnóstico
   */
  async removeDiagnostic(conditionId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/consultations/diagnostics/${conditionId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar diagnóstico');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  // ==================== CONSULTORIOS/SALAS ====================

  /**
   * Obtiene todas las salas de consulta
   */
  async getRooms(): Promise<RoomsListResponse> {
    try {
      const response = await httpClient.get<RoomsListResponse>('/consultations/rooms/all');

      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene una sala por su ID
   */
  async getRoomById(roomId: number): Promise<RoomResponse> {
    try {
      const response = await httpClient.get<RoomResponse>(`/consultations/rooms/${roomId}`);

      if (!response.success || !response.data) {
        throw new Error('Sala no encontrada');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea una nueva sala de consulta
   */
  async createRoom(roomData: ConsultationRoomData): Promise<RoomResponse> {
    try {
      const response = await httpClient.post<RoomResponse>('/consultations/rooms', roomData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear sala');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza una sala existente
   */
  async updateRoom(roomId: number, roomData: Partial<ConsultationRoomData>): Promise<RoomResponse> {
    try {
      const response = await httpClient.put<RoomResponse>(`/consultations/rooms/${roomId}`, roomData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar sala');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina una sala
   */
  async deleteRoom(roomId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/consultations/rooms/${roomId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar sala');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene consultas de un paciente
   */
  async getPatientConsultations(patientId: number): Promise<ConsultationData[]> {
    try {
      const response = await this.getConsultations({ patient_id: patientId, limit: 100 });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene salas activas de una sede
   */
  async getActiveRoomsByBranch(branchId: number): Promise<ConsultationRoomData[]> {
    try {
      const response = await this.getRooms();
      return response.data.filter(room => room.branch_id === branchId && room.is_active);
    } catch (error) {
      throw error;
    }
  }

  // ==================== IMAGENES DEL EXAMEN CLINICO ====================

  /**
   * Obtiene las imagenes del examen clinico de una consulta
   */
  async getClinicalExamImages(consultationId: number): Promise<{
    success: boolean;
    data: {
      consultation_id: number;
      extraoral_exam_images: string[];
      intraoral_exam_images: string[];
    };
  }> {
    try {
      const response = await httpClient.get(`/consultations/${consultationId}/clinical-exam/images`);
      return response as any;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sube imagenes del examen extraoral
   * @param consultationId ID de la consulta
   * @param files Array de archivos a subir
   */
  async uploadExtraoralImages(consultationId: number, files: File[]): Promise<{
    success: boolean;
    message: string;
    data: {
      consultation_id: number;
      extraoral_exam_images: string[];
      uploaded_files: string[];
    };
  }> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      // NO pasar Content-Type manualmente - el browser lo hace automáticamente con el boundary
      const response = await httpClient.post(
        `/consultations/${consultationId}/clinical-exam/extraoral/images`,
        formData
      );
      return response as any;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sube imagenes del examen intraoral
   * @param consultationId ID de la consulta
   * @param files Array de archivos a subir
   */
  async uploadIntraoralImages(consultationId: number, files: File[]): Promise<{
    success: boolean;
    message: string;
    data: {
      consultation_id: number;
      intraoral_exam_images: string[];
      uploaded_files: string[];
    };
  }> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      // NO pasar Content-Type manualmente - el browser lo hace automáticamente con el boundary
      const response = await httpClient.post(
        `/consultations/${consultationId}/clinical-exam/intraoral/images`,
        formData
      );
      return response as any;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina una imagen del examen extraoral
   * @param consultationId ID de la consulta
   * @param imagePath Ruta de la imagen a eliminar
   */
  async deleteExtraoralImage(consultationId: number, imagePath: string): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(
        `/consultations/${consultationId}/clinical-exam/extraoral/images`,
        { body: { imagePath } }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina una imagen del examen intraoral
   * @param consultationId ID de la consulta
   * @param imagePath Ruta de la imagen a eliminar
   */
  async deleteIntraoralImage(consultationId: number, imagePath: string): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(
        `/consultations/${consultationId}/clinical-exam/intraoral/images`,
        { body: { imagePath } }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ==================== DIAGNÓSTICO DEFINITIVO ====================

  /**
   * Obtiene las condiciones del diagnóstico definitivo de una consulta
   * @param consultationId ID de la consulta
   * @param bypassCache Si es true, ignora el caché y hace una nueva solicitud
   */
  async getDefinitiveDiagnosis(consultationId: number, bypassCache: boolean = false): Promise<DefinitiveDiagnosisResponse> {
    const cacheKey = `consultation:${consultationId}:definitive-diagnosis`;

    const fetchFn = async () => {
      const response = await httpClient.get<DefinitiveDiagnosisResponse>(
        `/consultations/${consultationId}/definitive-diagnosis`
      );

      return {
        success: response.success || true,
        data: response.data || { conditions: [], summary: { total_conditions: 0, total_price: 0, modified_count: 0 } }
      };
    };

    if (bypassCache) {
      apiCache.invalidate(cacheKey);
    }

    return apiCache.withCache(cacheKey, fetchFn, 120000); // 2 minutos de caché
  }

  /**
   * Agrega una condición al diagnóstico definitivo
   * @param consultationId ID de la consulta
   * @param conditionData Datos de la condición
   */
  async addDefinitiveDiagnosisCondition(
    consultationId: number,
    conditionData: Omit<DefinitiveDiagnosisConditionData, 'definitive_condition_id' | 'consultation_id'>
  ): Promise<DefinitiveDiagnosisConditionResponse> {
    try {
      const response = await httpClient.post<DefinitiveDiagnosisConditionResponse>(
        `/consultations/${consultationId}/definitive-diagnosis`,
        conditionData
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al agregar condición');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza una condición del diagnóstico definitivo
   * @param conditionId ID de la condición
   * @param conditionData Datos a actualizar
   */
  async updateDefinitiveDiagnosisCondition(
    conditionId: number,
    conditionData: Partial<DefinitiveDiagnosisConditionData>
  ): Promise<DefinitiveDiagnosisConditionResponse> {
    try {
      const response = await httpClient.put<DefinitiveDiagnosisConditionResponse>(
        `/consultations/definitive-diagnosis/${conditionId}`,
        conditionData
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar condición');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina una condición del diagnóstico definitivo
   * @param conditionId ID de la condición
   */
  async deleteDefinitiveDiagnosisCondition(conditionId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(
        `/consultations/definitive-diagnosis/${conditionId}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar condición');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Guarda todas las condiciones del diagnostico definitivo (bulk save)
   * Reemplaza todas las condiciones existentes por las nuevas
   * @param consultationId ID de la consulta
   * @param conditions Array de condiciones a guardar
   */
  async saveDefinitiveDiagnosisBulk(
    consultationId: number,
    conditions: Omit<DefinitiveDiagnosisConditionData, 'definitive_condition_id' | 'consultation_id'>[]
  ): Promise<DefinitiveDiagnosisBulkResponse> {
    try {
      const response = await httpClient.post<DefinitiveDiagnosisBulkResponse>(
        `/consultations/${consultationId}/definitive-diagnosis/bulk`,
        { conditions }
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al guardar condiciones');
      }

      // Invalidar caché después de guardar
      apiCache.invalidate(`consultation:${consultationId}:definitive-diagnosis`);

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza el procedimiento seleccionado de una condicion del diagnostico definitivo
   * @param conditionId ID de la condicion definitiva
   * @param procedureId ID del procedimiento a asignar
   * @param procedurePrice Precio del procedimiento (segun plan de salud)
   */
  async updateSelectedProcedure(
    conditionId: number,
    procedureId: number,
    procedurePrice: number
  ): Promise<DefinitiveDiagnosisConditionResponse> {
    try {
      const response = await httpClient.put<DefinitiveDiagnosisConditionResponse>(
        `/consultations/definitive-diagnosis/${conditionId}/procedure`,
        { procedure_id: procedureId, procedure_price: procedurePrice }
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar procedimiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  // ==================== CONDICIONES PRESUNTIVAS DEL ODONTOGRAMA ====================

  /**
   * Obtiene las condiciones presuntivas del odontograma por consultation_id
   * Estas vienen de odontogram_conditions con los datos del diente y la condicion dental
   * @param consultationId ID de la consulta
   * @param bypassCache Si es true, ignora el caché
   */
  async getPresumptiveConditions(consultationId: number, bypassCache: boolean = false): Promise<PresumptiveConditionsResponse> {
    const cacheKey = `consultation:${consultationId}:presumptive-conditions`;

    const fetchFn = async () => {
      const response = await httpClient.get<PresumptiveConditionsResponse>(
        `/consultations/${consultationId}/presumptive-conditions`
      );

      return {
        success: response.success || true,
        data: response.data || { conditions: [], summary: { total_conditions: 0, total_price: 0 } }
      };
    };

    if (bypassCache) {
      apiCache.invalidate(cacheKey);
    }

    return apiCache.withCache(cacheKey, fetchFn, 120000); // 2 minutos
  }

  /**
   * Obtiene las condiciones presuntivas del odontograma por patient_id
   * @param patientId ID del paciente
   */
  async getPresumptiveConditionsByPatient(patientId: number): Promise<PresumptiveConditionsResponse> {
    try {
      const response = await httpClient.get<PresumptiveConditionsResponse>(
        `/consultations/patients/${patientId}/presumptive-conditions`
      );

      return {
        success: response.success || true,
        data: response.data || { conditions: [], summary: { total_conditions: 0, total_price: 0 } }
      };
    } catch (error) {
      throw error;
    }
  }

  // ==================== PLAN DE TRATAMIENTO DE CONSULTA (Paso 8) ====================

  /**
   * Obtiene el plan de tratamiento completo de una consulta
   * @param consultationId ID de la consulta
   * @param bypassCache Si es true, ignora el caché
   */
  async getConsultationTreatmentPlan(consultationId: number, bypassCache: boolean = false): Promise<ConsultationTreatmentPlanResponse> {
    const cacheKey = `consultation:${consultationId}:treatment-plan`;

    const fetchFn = async () => {
      const response = await httpClient.get<ConsultationTreatmentPlanResponse>(
        `/consultations/${consultationId}/treatment-plan`
      );
      return response;
    };

    if (bypassCache) {
      apiCache.invalidate(cacheKey);
    }

    return apiCache.withCache(cacheKey, fetchFn, 120000); // 2 minutos
  }

  /**
   * Obtiene el resumen del plan de tratamiento de una consulta
   * @param consultationId ID de la consulta
   */
  async getConsultationTreatmentPlanSummary(consultationId: number): Promise<ConsultationTreatmentPlanSummaryResponse> {
    try {
      const response = await httpClient.get<ConsultationTreatmentPlanSummaryResponse>(
        `/consultations/${consultationId}/treatment-plan/summary`
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verifica si existe un plan de tratamiento para la consulta
   * @param consultationId ID de la consulta
   */
  async checkTreatmentPlanExists(consultationId: number): Promise<{ success: boolean; exists: boolean }> {
    try {
      const response = await httpClient.get<{ success: boolean; exists: boolean }>(
        `/consultations/${consultationId}/treatment-plan/exists`
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea o actualiza el plan de tratamiento de una consulta
   * @param consultationId ID de la consulta
   * @param data Datos del plan de tratamiento
   */
  async upsertConsultationTreatmentPlan(
    consultationId: number,
    data: ConsultationTreatmentPlanData
  ): Promise<ConsultationTreatmentPlanResponse & { wasUpdated?: boolean }> {
    try {
      const response = await httpClient.post<ConsultationTreatmentPlanResponse & { wasUpdated?: boolean }>(
        `/consultations/${consultationId}/treatment-plan`,
        data
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al guardar plan de tratamiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina el plan de tratamiento de una consulta
   * @param consultationId ID de la consulta
   */
  async deleteConsultationTreatmentPlan(consultationId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(
        `/consultations/${consultationId}/treatment-plan`
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar plan de tratamiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }
}

// ==================== TIPOS PARA PLAN DE TRATAMIENTO DE CONSULTA ====================

export interface ConsultationTreatmentItemCondition {
  condition_id?: number;
  label: string;
  price: number;
  quantity: number;
  subtotal?: number;
  display_order?: number;
  definitive_condition_id?: number | null;  // FK al diagnostico definitivo
  // Campos para catalogo de sub-procedimientos
  sub_procedure_id?: number | null;
  sub_procedure_code?: string | null;
  catalog_name?: string | null;
  specialty?: string | null;
  // Datos enriquecidos desde el JOIN
  tooth_number?: string;
  selected_procedure_id?: number;
  procedure_price?: number;
  selected_procedure_name?: string;
}

export interface ConsultationTreatmentItem {
  consultation_treatment_item_id?: number;
  treatment_id?: number;
  treatment_name: string;
  total_amount: number;
  display_order?: number;
  conditions: ConsultationTreatmentItemCondition[];
}

export interface ConsultationAdditionalServiceEditableFields {
  montoTotal: number;
  inicial: number;
  mensual: number;
}

export interface ConsultationAdditionalService {
  consultation_additional_service_id?: number;
  id: string;  // "ortho-1", "implant-2", "prosthesis-3"
  type: 'orthodontic' | 'implant' | 'prosthesis';
  service_name?: string;
  name: string;
  modality?: string;
  description?: string;
  originalFields: ConsultationAdditionalServiceEditableFields;
  editedFields: ConsultationAdditionalServiceEditableFields;
  // Campos de BD
  orthodontic_plan_id?: number;
  implant_plan_id?: number;
  prosthesis_item_id?: number;
  original_monto_total?: number;
  original_inicial?: number;
  original_mensual?: number;
  edited_monto_total?: number;
  edited_inicial?: number;
  edited_mensual?: number;
  display_order?: number;
}

export interface ConsultationTreatmentPlanData {
  planName?: string;
  definitiveConditionsTotal?: number;
  treatmentsTotal?: number;
  additionalServicesTotal?: number;
  grandTotal?: number;
  hasInitialPayment?: boolean;
  initialPayment?: number;
  monthlyPayment?: number;
  observations?: string;
  appliedTreatments?: Array<{
    treatmentId?: string;
    treatmentName: string;
    totalAmount: number;
    conditions: Array<{
      id?: string;
      label: string;
      price: number;
      quantity: number;
      definitiveConditionId?: number | null;  // FK al diagnostico definitivo
      // Campos para catalogo de sub-procedimientos
      subProcedureId?: number | null;
      subProcedureCode?: string | null;
      specialty?: string | null;
    }>;
  }>;
  selectedAdditionalServices?: ConsultationAdditionalService[];
}

export interface ConsultationTreatmentPlanFullData {
  consultation_treatment_plan_id: number;
  consultation_id: number;
  treatment_plan_id?: number;
  plan_name?: string;
  definitive_diagnosis_total: number;
  treatments_total: number;
  additional_services_total: number;
  grand_total: number;
  has_initial_payment: boolean;
  initial_payment: number;
  monthly_payment: number;
  observations?: string;
  status: string;
  date_time_registration: string;
  date_time_modification?: string;
  treatments: ConsultationTreatmentItem[];
  additionalServices: ConsultationAdditionalService[];
}

export interface ConsultationTreatmentPlanResponse {
  success: boolean;
  data: ConsultationTreatmentPlanFullData;
  message?: string;
}

export interface ConsultationTreatmentPlanSummaryResponse {
  success: boolean;
  data: {
    consultation_treatment_plan_id: number;
    consultation_id: number;
    plan_name?: string;
    definitive_diagnosis_total: number;
    treatments_total: number;
    additional_services_total: number;
    grand_total: number;
    has_initial_payment: boolean;
    initial_payment: number;
    monthly_payment: number;
    observations?: string;
    date_time_registration: string;
    date_time_modification?: string;
    treatments_count: number;
    additional_services_count: number;
  };
  message?: string;
}

// ==================== TIPOS PARA PRESUPUESTO DE CONSULTA (Paso 9) ====================

export interface ConsultationBudgetPatient {
  patient_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  document_type?: string;
  document_number?: string;
  phone?: string;
}

export interface ConsultationBudgetDentist {
  dentist_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  specialty?: string;
}

export interface ConsultationBudgetData {
  consultation_budget_id: number;
  consultation_id: number;
  definitive_diagnosis_total: number;
  treatments_total: number;
  additional_services_total: number;
  exams_total: number;
  subtotal: number;
  promotion_id?: number | null;
  discount_type?: string | null;
  discount_value: number;
  discount_amount: number;
  grand_total: number;
  advance_payment: number;
  balance: number;
  observations?: string;
  status: 'draft' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  date_time_registration: string;
  date_time_modification?: string;
  patient?: ConsultationBudgetPatient;
  dentist?: ConsultationBudgetDentist;
  consultation_date?: string;
}

export interface ConsultationBudgetSummary {
  consultation_budget_id: number;
  consultation_id: number;
  definitive_diagnosis_total: number;
  treatments_total: number;
  additional_services_total: number;
  exams_total: number;
  subtotal: number;
  promotion_id?: number | null;
  discount_type?: string | null;
  discount_value: number;
  discount_amount: number;
  grand_total: number;
  advance_payment: number;
  balance: number;
  status: string;
}

export interface ConsultationBudgetResponse {
  success: boolean;
  data: ConsultationBudgetData | null;
  message?: string;
}

export interface ConsultationBudgetSummaryResponse {
  success: boolean;
  data: ConsultationBudgetSummary;
  message?: string;
}

export interface ConsultationBudgetUpsertData {
  advancePayment?: number;
  observations?: string;
  status?: 'draft' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  definitiveDiagnosisTotal?: number;
  treatmentsTotal?: number;
  additionalServicesTotal?: number;
  examsTotal?: number;
  subtotal?: number;
  promotionId?: number | null;
  discountType?: string | null;
  discountValue?: number;
  discountAmount?: number;
  grandTotal?: number;
}

// ==================== API SERVICE EXTENSION FOR BUDGET ====================

class ConsultationBudgetsApiService {
  /**
   * Obtiene el presupuesto completo de una consulta
   * @param consultationId ID de la consulta
   * @param bypassCache Si es true, ignora el caché
   */
  async getBudget(consultationId: number, bypassCache: boolean = false): Promise<ConsultationBudgetResponse> {
    const cacheKey = `consultation:${consultationId}:budget`;

    const fetchFn = async () => {
      const response = await httpClient.get<ConsultationBudgetResponse>(
        `/consultations/${consultationId}/budget`
      );
      return response;
    };

    if (bypassCache) {
      apiCache.invalidate(cacheKey);
    }

    return apiCache.withCache(cacheKey, fetchFn, 120000); // 2 minutos
  }

  /**
   * Obtiene el resumen del presupuesto (solo totales)
   * @param consultationId ID de la consulta
   */
  async getBudgetSummary(consultationId: number): Promise<ConsultationBudgetSummaryResponse> {
    try {
      const response = await httpClient.get<ConsultationBudgetSummaryResponse>(
        `/consultations/${consultationId}/budget/summary`
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verifica si existe un presupuesto para la consulta
   * @param consultationId ID de la consulta
   */
  async checkBudgetExists(consultationId: number): Promise<{ success: boolean; exists: boolean }> {
    try {
      const response = await httpClient.get<{ success: boolean; exists: boolean }>(
        `/consultations/${consultationId}/budget/exists`
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea o actualiza el presupuesto de una consulta
   * @param consultationId ID de la consulta
   * @param data Datos del presupuesto
   */
  async upsertBudget(
    consultationId: number,
    data: ConsultationBudgetUpsertData
  ): Promise<ConsultationBudgetResponse & { wasUpdated?: boolean }> {
    try {
      const response = await httpClient.post<ConsultationBudgetResponse & { wasUpdated?: boolean }>(
        `/consultations/${consultationId}/budget`,
        data
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al guardar presupuesto');
      }

      // Invalidar caché después de guardar
      apiCache.invalidate(`consultation:${consultationId}:budget`);

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza solo el adelanto del presupuesto
   * @param consultationId ID de la consulta
   * @param advancePayment Monto del adelanto
   */
  async updateAdvancePayment(
    consultationId: number,
    advancePayment: number
  ): Promise<ConsultationBudgetResponse> {
    try {
      const response = await httpClient.put<ConsultationBudgetResponse>(
        `/consultations/${consultationId}/budget/advance`,
        { advancePayment }
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al actualizar adelanto');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza el estado del presupuesto
   * @param consultationId ID de la consulta
   * @param status Nuevo estado
   */
  async updateBudgetStatus(
    consultationId: number,
    status: 'draft' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  ): Promise<ConsultationBudgetResponse> {
    try {
      const response = await httpClient.put<ConsultationBudgetResponse>(
        `/consultations/${consultationId}/budget/status`,
        { status }
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al actualizar estado del presupuesto');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sincroniza los totales del presupuesto desde las tablas relacionadas
   * @param consultationId ID de la consulta
   */
  async syncBudgetTotals(consultationId: number): Promise<ConsultationBudgetResponse> {
    try {
      const response = await httpClient.post<ConsultationBudgetResponse>(
        `/consultations/${consultationId}/budget/sync`,
        {}
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al sincronizar totales');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina (cancela) el presupuesto de una consulta
   * @param consultationId ID de la consulta
   */
  async deleteBudget(consultationId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(
        `/consultations/${consultationId}/budget`
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar presupuesto');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancias singleton
export const consultationsApi = new ConsultationsApiService();
export const consultationBudgetsApi = new ConsultationBudgetsApiService();
export default consultationsApi;

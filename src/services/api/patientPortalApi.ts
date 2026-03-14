/**
 * API Service para el Portal del Paciente
 * Maneja las operaciones del paciente logueado para ver su historial medico
 */

import httpClient from './httpClient';

// ========================= INTERFACES =========================

export interface PatientBasicInfo {
  patient_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
}

export interface MedicalSummary {
  total_consultations: number;
  last_consultation_date: string | null;
  completed_procedures: number;
  total_prescriptions: number;
}

export interface OdontogramCondition {
  condition_id: number;
  tooth_position_id: number;
  tooth_surface_id: number | null;
  dental_condition_id: number | null;
  description: string | null;
  severity: string | null;
  notes: string | null;
  price: number;
  surface_section: string | null;
  tooth_number: string;
  tooth_name: string;
  condition_name: string | null;
  condition_code: string | null;
  cie10_code: string | null;
  symbol_type: string | null;
  color_type: string | null;
  surface_code: string | null;
  surface_name: string | null;
}

export interface OdontogramData {
  odontogram_id: number;
  odontogram_date: string;
  odontogram_type: string;
  general_observations: string | null;
  odontogram_conditions_json: any;
  conditions: OdontogramCondition[];
}

export interface DefinitiveDiagnosisItem {
  definitive_condition_id: number;
  tooth_position_id: number;
  tooth_number: string;
  dental_condition_id: number;
  condition_label: string;
  cie10_code: string | null;
  surfaces: string[];
  price: number;
  notes: string | null;
  tooth_name: string;
  condition_name: string;
  condition_code: string;
}

export interface TreatmentItemCondition {
  condition_id: number;
  label: string;
  price: number;
  quantity: number;
  subtotal: number;
  display_order: number;
}

export interface TreatmentPlanItem {
  consultation_treatment_item_id: number;
  treatment_name: string;
  total_amount: number;
  conditions: TreatmentItemCondition[];
  display_order: number;
}

export interface AdditionalServiceItem {
  consultation_additional_service_id: number;
  service_type: 'orthodontic' | 'implant' | 'prosthesis';
  service_name: string;
  modality: string | null;
  description: string | null;
  monto_total: number;
  inicial: number;
  mensual: number;
  display_order: number;
  // Campos de estado de pago
  initial_payment_completed: boolean;
  initial_payment_date: string | null;
  monthly_payments_count: number;
  service_status: 'pending' | 'in_progress' | 'completed';
  service_completed_date: string | null;
  // Campos calculados desde procedure_income
  cuotas_pagadas_reales: number;
  inicial_pagado_real: boolean;
}

export interface TreatmentPlanData {
  consultation_treatment_plan_id: number;
  plan_name: string | null;
  definitive_diagnosis_total: number;
  treatments_total: number;
  additional_services_total: number;
  grand_total: number;
  has_initial_payment: boolean;
  initial_payment: number;
  monthly_payment: number;
  observations: string | null;
  items: TreatmentPlanItem[];
  additional_services: AdditionalServiceItem[];
}

// Resultado de radiografia subido por tecnico de imagenes
export interface RadiographyResult {
  result_id: number;
  result_type: 'image' | 'document' | 'external_link';
  file_name: string | null;
  original_name: string | null;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  external_url: string | null;
  uploaded_at: string;
  uploader_name: string | null;
}

export interface RadiographyRequest {
  radiography_request_id: number;
  request_date: string;
  radiography_type: string;
  area_of_interest: string | null;
  clinical_indication: string | null;
  urgency: string;
  request_status: string;
  request_data: any;
  results?: RadiographyResult[]; // Resultados subidos por tecnico de imagenes
}

export interface ExamResult {
  auxiliary_exam_result_id: number;
  consultation_id: number;
  patient_id: number;
  dentist_id: number;
  doctor_observations: string | null;
  external_files: any;
  exam_date: string;
}

export interface ProcedureHistoryItem {
  procedure_history_id: number;
  procedure_date: string | null;
  performed_time: string | null;
  procedure_name: string;
  procedure_code: string | null;
  procedure_type: string | null;
  procedure_status: string;
  procedure_result: string | null;
  procedure_notes: string | null;
  complications: string | null;
  next_steps: string | null;
  tooth_number: string | null;
  tooth_name: string | null;
}

// Item completado del checklist (procedure_income)
export interface CompletedItem {
  income_id: number;
  income_type: 'odontogram_procedure' | 'treatment' | 'additional_service' | 'exam' | 'prescription';
  item_name: string;
  item_amount: number;
  tooth_position_id: number | null;
  additional_service_id: number | null;
  tooth_number: string | null;
  tooth_name: string | null;
}

// Item del odontograma de evolución (Paso 10)
export interface EvolutionOdontogramItem {
  evolution_id: number;
  consultation_id: number;
  tooth_position_id: number;
  tooth_surface_id: number | null;
  dental_condition_id: number;
  condition_status: 'pending' | 'in_progress' | 'good' | 'completed';
  registered_date: string;
  notes: string | null;
  tooth_number: string;
  tooth_name: string;
  surface_code: string | null;
  surface_name: string | null;
  condition_name: string;
  condition_code: string | null;
  color_code: string | null;
}

export interface PrescriptionItem {
  prescription_item_id: number;
  medication_name: string;
  concentration: string | null;
  quantity: string;
  instructions: string | null;
}

export interface Prescription {
  prescription_id: number;
  prescription_date: string;
  prescription_notes: string | null;
  items: PrescriptionItem[];
}

export interface ConsultationBudget {
  consultation_budget_id: number;
  definitive_diagnosis_total: number;
  treatments_total: number;
  additional_services_total: number;
  exams_total: number;
  grand_total: number;
  advance_payment: number;
  balance: number;
  budget_observations: string | null;
  budget_status: string;
}

export interface IntegralConsultation {
  consultation_id: number;
  patient_id: number;
  dentist_id: number;
  branch_id: number;
  appointment_id: number | null;
  consultation_date: string;
  consultation_time: string;
  chief_complaint: string | null;
  present_illness: string | null;
  vital_signs: any;
  general_condition: string | null;
  extraoral_exam: string | null;
  extraoral_exam_images: string[];
  intraoral_exam: string | null;
  intraoral_exam_images: string[];
  diagnosis: string | null;
  treatment_plan_text: string | null; // Campo texto de la tabla consultations
  prescriptions_given: string | null;
  recommendations: string | null;
  next_visit_date: string | null;
  notes: string | null;
  status: string;
  date_time_registration: string;
  date_time_modification: string | null;
  dentist_first_name: string;
  dentist_last_name: string;
  specialty_name: string | null;
  branch_name: string;
  dentist_name: string;
  // Datos relacionados
  odontogram: OdontogramData | null;
  evolution_odontogram: EvolutionOdontogramItem[]; // Odontograma de evolución (Paso 10)
  definitive_diagnosis: DefinitiveDiagnosisItem[];
  treatment_plan: TreatmentPlanData | null; // Objeto con items del plan de tratamiento
  radiography_requests: RadiographyRequest[];
  exam_results: ExamResult[];
  procedure_history: ProcedureHistoryItem[];
  completed_items: CompletedItem[]; // Items completados del checklist
  prescriptions: Prescription[];
  budget: ConsultationBudget | null;
}

// Antecedentes medicos del paciente
export interface MedicalBackground {
  medical_history_id: number;
  has_allergies: boolean;
  allergies_description: string | null;
  has_chronic_diseases: boolean;
  chronic_diseases_description: string | null;
  has_medications: boolean;
  current_medications: string | null;
  has_surgeries: boolean;
  surgeries_description: string | null;
  has_bleeding_disorders: boolean;
  bleeding_disorders_description: string | null;
  has_diabetes: boolean;
  has_hypertension: boolean;
  has_heart_disease: boolean;
  heart_disease_description: string | null;
  is_pregnant: boolean | null;
  pregnancy_months: number | null;
  is_breastfeeding: boolean | null;
  smokes: boolean;
  smoking_frequency: string | null;
  drinks_alcohol: boolean;
  alcohol_frequency: string | null;
  last_dental_visit: string | null;
  dental_visit_reason: string | null;
  additional_notes: string | null;
  pathological_background: any[];
  date_time_registration: string | null;
  date_time_modification: string | null;
}

// Radiografias solicitadas desde el laboratorio (sin consulta asociada)
export interface LaboratoryRadiographyRequest {
  radiography_request_id: number;
  request_date: string;
  radiography_type: string;
  area_of_interest: string | null;
  clinical_indication: string | null;
  urgency: string;
  request_status: string;
  request_data: any;
  pricing_data: any;
  performed_date: string | null;
  findings: string | null;
  notes: string | null;
  results?: RadiographyResult[];
}

export interface MedicalHistoryResponse {
  success: boolean;
  data: {
    patient: PatientBasicInfo;
    summary: MedicalSummary;
    medical_background: MedicalBackground | null;
    consultations: IntegralConsultation[];
    laboratory_radiography_requests?: LaboratoryRadiographyRequest[];
  };
}

export interface ConsultationDetailResponse {
  success: boolean;
  data: IntegralConsultation;
}

export interface MedicalSummaryResponse {
  success: boolean;
  data: MedicalSummary;
}

// ========================= PERFIL DEL PACIENTE =========================

export interface PatientProfile {
  patient_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  mobile: string;
  birth_date: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  photo_url: string | null;
  occupation: string | null;
  identification_number: string;
  gender_id: number | null;
  gender_name: string | null;
  gender_code: string | null;
  blood_type_id: number | null;
  blood_type_name: string | null;
  marital_status_id: number | null;
  marital_status_name: string | null;
  identification_type_id: number | null;
  identification_type_name: string | null;
  branch_id: number | null;
  branch_name: string | null;
}

export interface PatientProfileResponse {
  success: boolean;
  data: {
    profile: PatientProfile;
    medical_background: MedicalBackground | null;
  };
}

export interface UpdatePatientProfilePayload {
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  occupation?: string;
}

export interface UpdatePatientProfileResponse {
  success: boolean;
  message: string;
  data: {
    profile: PatientProfile;
    medical_background: MedicalBackground | null;
  };
}

// ========================= EXAMENES EXTERNOS DEL PACIENTE =========================

export interface PatientExternalExam {
  external_exam_id: number;
  patient_id: number;
  exam_type: 'file' | 'link';
  file_name: string | null;
  original_name: string | null;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  external_url: string | null;
  date_time_registration: string;
}

export interface PatientExternalExamsResponse {
  success: boolean;
  data: PatientExternalExam[];
}

export interface CreatePatientExternalExamResponse {
  success: boolean;
  message: string;
  data: PatientExternalExam;
}

export interface DeletePatientExternalExamResponse {
  success: boolean;
  message: string;
}

// ========================= API SERVICE =========================

class PatientPortalApiService {
  /**
   * Obtiene el historial medico completo del paciente logueado
   * Incluye todas las atenciones integrales con sus datos relacionados
   */
  async getMyMedicalHistory(): Promise<MedicalHistoryResponse> {
    try {
      console.log('[PatientPortalApi] Llamando a /patient-portal/medical-history');
      const response = await httpClient.get<MedicalHistoryResponse>('/patient-portal/medical-history');
      console.log('[PatientPortalApi] Respuesta recibida:', response);

      // Validar que la respuesta tenga la estructura esperada
      if (!response || response.success === false) {
        const errorMsg = (response as any)?.error || 'Error al obtener historial medico';
        throw new Error(errorMsg);
      }

      return response;
    } catch (error: any) {
      console.error('[PatientPortalApi] Error en getMyMedicalHistory:', error);
      console.error('[PatientPortalApi] Error details:', {
        message: error?.message,
        status: error?.status,
        data: error?.data
      });
      throw error;
    }
  }

  /**
   * Obtiene el detalle de una atencion integral especifica
   * @param consultationId - ID de la consulta
   */
  async getConsultationDetail(consultationId: number): Promise<ConsultationDetailResponse> {
    try {
      const response = await httpClient.get<ConsultationDetailResponse>(
        `/patient-portal/medical-history/${consultationId}`
      );

      if (!response.success) {
        throw new Error('Error al obtener detalle de consulta');
      }

      return response;
    } catch (error) {
      console.error('Error en getConsultationDetail:', error);
      throw error;
    }
  }

  /**
   * Obtiene un resumen general del historial medico
   */
  async getMedicalSummary(): Promise<MedicalSummaryResponse> {
    try {
      const response = await httpClient.get<MedicalSummaryResponse>('/patient-portal/summary');

      if (!response.success) {
        throw new Error('Error al obtener resumen medico');
      }

      return response;
    } catch (error) {
      console.error('Error en getMedicalSummary:', error);
      throw error;
    }
  }

  /**
   * Obtiene el perfil completo del paciente logueado
   */
  async getMyProfile(): Promise<PatientProfileResponse> {
    try {
      console.log('[PatientPortalApi] Llamando a /patient-portal/profile');
      const response = await httpClient.get<PatientProfileResponse>('/patient-portal/profile');
      console.log('[PatientPortalApi] Perfil recibido:', response);

      if (!response || response.success === false) {
        const errorMsg = (response as any)?.error || 'Error al obtener perfil';
        throw new Error(errorMsg);
      }

      return response;
    } catch (error: any) {
      console.error('[PatientPortalApi] Error en getMyProfile:', error);
      throw error;
    }
  }

  /**
   * Actualiza el perfil del paciente logueado
   * @param profileData - Datos del perfil a actualizar
   */
  async updateMyProfile(profileData: UpdatePatientProfilePayload): Promise<UpdatePatientProfileResponse> {
    try {
      console.log('[PatientPortalApi] Actualizando perfil:', profileData);
      const response = await httpClient.put<UpdatePatientProfileResponse>('/patient-portal/profile', profileData);
      console.log('[PatientPortalApi] Respuesta actualización:', response);

      if (!response || response.success === false) {
        const errorMsg = (response as any)?.error || 'Error al actualizar perfil';
        throw new Error(errorMsg);
      }

      return response;
    } catch (error: any) {
      console.error('[PatientPortalApi] Error en updateMyProfile:', error);
      throw error;
    }
  }

  // ============================================================================
  // EXAMENES EXTERNOS DEL PACIENTE
  // ============================================================================

  /**
   * Obtiene todos los exámenes externos del paciente logueado
   */
  async getMyExternalExams(): Promise<PatientExternalExamsResponse> {
    try {
      const response = await httpClient.get<PatientExternalExamsResponse>('/patient-portal/external-exams');

      if (!response || response.success === false) {
        const errorMsg = (response as any)?.error || 'Error al obtener exámenes externos';
        throw new Error(errorMsg);
      }

      return response;
    } catch (error: any) {
      console.error('[PatientPortalApi] Error en getMyExternalExams:', error);
      throw error;
    }
  }

  /**
   * Sube un archivo de examen externo
   * @param file - Archivo a subir
   */
  async uploadExternalExamFile(file: File): Promise<CreatePatientExternalExamResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await httpClient.post<CreatePatientExternalExamResponse>(
        '/patient-portal/external-exams/file',
        formData
      );

      if (!response || response.success === false) {
        const errorMsg = (response as any)?.error || 'Error al subir archivo';
        throw new Error(errorMsg);
      }

      return response;
    } catch (error: any) {
      console.error('[PatientPortalApi] Error en uploadExternalExamFile:', error);
      throw error;
    }
  }

  /**
   * Agrega un link externo de examen
   * @param externalUrl - URL del examen externo
   */
  async addExternalExamLink(externalUrl: string): Promise<CreatePatientExternalExamResponse> {
    try {
      const response = await httpClient.post<CreatePatientExternalExamResponse>(
        '/patient-portal/external-exams/link',
        { external_url: externalUrl }
      );

      if (!response || response.success === false) {
        const errorMsg = (response as any)?.error || 'Error al agregar link';
        throw new Error(errorMsg);
      }

      return response;
    } catch (error: any) {
      console.error('[PatientPortalApi] Error en addExternalExamLink:', error);
      throw error;
    }
  }

  /**
   * Elimina un examen externo
   * @param examId - ID del examen a eliminar
   */
  async deleteExternalExam(examId: number): Promise<DeletePatientExternalExamResponse> {
    try {
      const response = await httpClient.delete<DeletePatientExternalExamResponse>(
        `/patient-portal/external-exams/${examId}`
      );

      if (!response || response.success === false) {
        const errorMsg = (response as any)?.error || 'Error al eliminar examen';
        throw new Error(errorMsg);
      }

      return response;
    } catch (error: any) {
      console.error('[PatientPortalApi] Error en deleteExternalExam:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const patientPortalApi = new PatientPortalApiService();
export default patientPortalApi;

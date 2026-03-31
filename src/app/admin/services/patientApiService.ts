/**
 * Servicio de integración con API real para Pacientes
 * Reemplaza el uso de IndexedDB por llamadas al backend
 *
 * IMPORTANTE: Este servicio NO debe ser reutilizado en otros módulos.
 * Es específico para el módulo de Pacientes.
 */

import { patientsApi, type PatientData } from '@/services/api/patientsApi';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import { medicalHistoriesApi } from '@/services/api/medicalHistoriesApi';
import { httpClient } from '@/services/api/httpClient';
import { companiesApi } from '@/services/api/companiesApi';
import { mapBackendCompanyToFrontend } from '@/utils/companyMappers';
import { formatDateToYMD } from '@/utils/dateUtils';
import type {
  Patient,
  SignedConsent,
  Appointment,
  MedicalRecord,
  TreatmentPlan,
  User as UserType,
  PatientContract,
  Company
} from '@/types';

/**
 * Mapea los datos del backend al formato del frontend
 */
const mapBackendPatientToFrontend = (backendPatient: PatientData): Patient => {
  // Mapeo de gender_id a formato del frontend
  const getGenderCode = (genderId?: number): 'M' | 'F' | 'O' => {
    switch (genderId) {
      case 1: return 'M';  // Masculino
      case 2: return 'F';  // Femenino
      case 3: return 'O';  // Otro
      default: return 'O'; // Por defecto "Otro"
    }
  };

  return {
    id: backendPatient.patient_id?.toString() || '',
    firstName: backendPatient.first_name,
    lastName: backendPatient.last_name,
    dni: backendPatient.identification_number,
    birthDate: backendPatient.birth_date,
    gender: getGenderCode(backendPatient.gender_id),
    phone: backendPatient.mobile,
    email: backendPatient.email || '',
    address: backendPatient.address || '',
    district: backendPatient.district || '',
    province: backendPatient.province || '',
    department: backendPatient.department || '',
    occupation: backendPatient.occupation || '',
    emergencyContact: backendPatient.emergency_contact_name ? {
      name: backendPatient.emergency_contact_name,
      phone: backendPatient.emergency_contact_phone || '',
      relationship: backendPatient.emergency_contact_relationship || ''
    } : undefined,
    allergies: backendPatient.allergies || '',
    chronicDiseases: backendPatient.chronic_diseases || '',
    currentMedications: backendPatient.current_medications || '',
    insuranceCompany: backendPatient.insurance_company || '',
    insurancePolicyNumber: backendPatient.insurance_policy_number || '',
    companyId: backendPatient.company_id?.toString(),
    companyName: backendPatient.company_name || '',
    ruc: backendPatient.ruc || '',
    businessName: backendPatient.business_name || '',
    referralSource: backendPatient.referral_source || '',
    notes: backendPatient.notes || '',
    photoUrl: backendPatient.profile_photo_url || '',
    esClienteNuevo: backendPatient.is_new_client ?? true,
    // Campo para identificar si el registro está completo
    isBasicRegistration: backendPatient.is_basic_registration ?? true, // true = información incompleta
    // Historia médica básica (tipo de sangre viene del JOIN)
    medicalHistory: {
      bloodType: backendPatient.blood_type_name || undefined,
      allergies: [], // Se cargará desde medical_histories cuando se vean detalles
      conditions: [], // Se cargará desde medical_histories cuando se vean detalles
      medications: [], // Se cargará desde medical_histories cuando se vean detalles
      notes: undefined
    },
    // Plan de salud activo (viene del JOIN con health_plan_subscriptions y health_plans)
    healthPlan: backendPatient.active_health_plan_id ? {
      id: backendPatient.active_health_plan_id,
      name: backendPatient.health_plan_name || '',
      code: backendPatient.health_plan_code || '',
      type: backendPatient.health_plan_type || ''
    } : undefined,
    // El backend puede enviar 'created_at' o 'date_time_registration'
    createdAt: new Date(backendPatient.date_time_registration || backendPatient.created_at || new Date()),
    updatedAt: new Date(backendPatient.date_time_modification || backendPatient.updated_at || new Date())
  };
};

/**
 * Mapea los datos del frontend al formato del backend
 * NOTA: branchId es OPCIONAL. Los pacientes NO están asignados a una sede específica.
 * La sede se determina por la cita, tratamiento o pago donde se atiende el paciente.
 */
const mapFrontendPatientToBackend = (frontendPatient: Partial<Patient>, branchId?: number): Partial<PatientData> => {
  const backendData: Partial<PatientData> = {};

  if (frontendPatient.firstName) backendData.first_name = frontendPatient.firstName;
  if (frontendPatient.lastName) backendData.last_name = frontendPatient.lastName;
  if (frontendPatient.dni) backendData.identification_number = frontendPatient.dni;
  if (frontendPatient.birthDate) {
    // Convertir Date a formato ISO string para el backend
    backendData.birth_date = frontendPatient.birthDate instanceof Date
      ? formatDateToYMD(frontendPatient.birthDate)
      : frontendPatient.birthDate;
  }
  if (frontendPatient.gender) {
    // Mapeo de formato del frontend a gender_id
    backendData.gender_id = frontendPatient.gender === 'M' ? 1 : frontendPatient.gender === 'F' ? 2 : 3;
  }
  if (frontendPatient.phone) backendData.mobile = frontendPatient.phone;
  if (frontendPatient.email !== undefined) backendData.email = frontendPatient.email;
  // Incluir contraseña si existe (será usada por el backend para crear el usuario)
  if ((frontendPatient as any).password) backendData.password = (frontendPatient as any).password;
  if (frontendPatient.address !== undefined) backendData.address = frontendPatient.address;
  if (frontendPatient.district !== undefined) backendData.district = frontendPatient.district;
  if (frontendPatient.province !== undefined) backendData.province = frontendPatient.province;
  if (frontendPatient.department !== undefined) backendData.department = frontendPatient.department;
  if (frontendPatient.occupation !== undefined) backendData.occupation = frontendPatient.occupation;
  if (frontendPatient.emergencyContact !== undefined) {
    if (typeof frontendPatient.emergencyContact === 'object' && frontendPatient.emergencyContact !== null) {
      backendData.emergency_contact_name = frontendPatient.emergencyContact.name;
      backendData.emergency_contact_phone = frontendPatient.emergencyContact.phone;
      backendData.emergency_contact_relationship = frontendPatient.emergencyContact.relationship;
    }
  }
  if (frontendPatient.allergies !== undefined) backendData.allergies = frontendPatient.allergies;
  if (frontendPatient.chronicDiseases !== undefined) backendData.chronic_diseases = frontendPatient.chronicDiseases;
  if (frontendPatient.currentMedications !== undefined) backendData.current_medications = frontendPatient.currentMedications;
  if (frontendPatient.insuranceCompany !== undefined) backendData.insurance_company = frontendPatient.insuranceCompany;
  if (frontendPatient.insurancePolicyNumber !== undefined) backendData.insurance_policy_number = frontendPatient.insurancePolicyNumber;
  if (frontendPatient.companyId !== undefined) backendData.company_id = frontendPatient.companyId ? parseInt(frontendPatient.companyId) : undefined;
  if (frontendPatient.ruc !== undefined) backendData.ruc = frontendPatient.ruc;
  if (frontendPatient.businessName !== undefined) backendData.business_name = frontendPatient.businessName;
  if (frontendPatient.referralSource !== undefined) backendData.referral_source = frontendPatient.referralSource;
  if (frontendPatient.notes !== undefined) backendData.notes = frontendPatient.notes;
  if (frontendPatient.photoUrl !== undefined) backendData.profile_photo_url = frontendPatient.photoUrl;

  // Valores por defecto requeridos por el backend
  // NOTA: branch_id es OPCIONAL - Los pacientes NO están asignados a una sede
  if (branchId !== undefined) {
    backendData.branch_id = branchId;
  }
  backendData.identification_type_id = 1; // DNI por defecto

  return backendData;
};

export const PatientApiService = {
  /**
   * Carga todos los pacientes desde el backend
   */
  async loadPatients(): Promise<{ patients: Patient[]; treatmentPlans: TreatmentPlan[] }> {
    try {
      // Obtener pacientes del backend
      const response = await patientsApi.getPatients({
        page: 1,
        limit: 1000 // Traer todos los pacientes
      });

      // Mapear pacientes del backend al formato del frontend
      const patients = response.data.map(mapBackendPatientToFrontend);

      // Obtener planes de tratamiento desde el backend
      const treatmentPlansResponse = await httpClient.get<{ success: boolean; data: any[] }>('/treatment-plans');
      const treatmentPlans = treatmentPlansResponse.data || [];

      return { patients, treatmentPlans };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Carga los consentimientos firmados de un paciente
   */
  async loadPatientConsents(patientId: string): Promise<SignedConsent[]> {
    try {
      // Obtener consentimientos firmados del paciente
      const response = await httpClient.get<{ success: boolean; data: any[] }>(
        `/consents/signed?patient_id=${patientId}`
      );

      const consentsData = response.data || [];

      // Mapear respuesta de API al formato del frontend
      return consentsData.map((consent: any) => ({
        id: consent.signed_consent_id?.toString() || '',
        pacienteId: consent.patient_id?.toString() || '',
        consentimientoId: consent.consent_template_id?.toString() || '',
        consentimientoNombre: consent.template_name || 'Consentimiento',
        consentimientoCategoria: consent.template_category || 'General',
        doctorNombre: consent.witness_name || this.extractDoctorName(consent.signed_by) || 'Doctor',
        doctorCop: this.extractDoctorCop(consent.signed_by) || '-',
        pacienteNombre: consent.patient_name || '',
        pacienteDni: consent.identification_number || '',
        pacienteDomicilio: consent.patient_address || '',
        firmaPaciente: consent.signature_data || undefined,
        firmaDoctor: consent.witness_signature_data || undefined,
        fechaConsentimiento: consent.consent_date, // Mantener como string para evitar desfase de timezone
        observaciones: consent.notes || undefined,
        documentoHTML: consent.consent_content || '',
        estado: consent.status || 'active',
        createdAt: consent.date_time_registration ? new Date(consent.date_time_registration) : undefined
      }));
    } catch (error) {
      console.error('[PatientApiService] Error cargando consentimientos:', error);
      return [];
    }
  },

  /**
   * Extrae el nombre del doctor del campo signed_by
   */
  extractDoctorName(signedBy: string | null): string {
    if (!signedBy) return '';
    const match = signedBy.match(/Doctor:\s*([^|]+?)(?:\s*COP:|$)/i);
    return match?.[1]?.trim() || '';
  },

  /**
   * Extrae el COP del doctor del campo signed_by
   */
  extractDoctorCop(signedBy: string | null): string {
    if (!signedBy) return '';
    const match = signedBy.match(/COP:\s*(\S+)/i);
    return match?.[1]?.trim() || '';
  },

  /**
   * Carga el historial completo del paciente (citas, historias médicas, planes de tratamiento)
   */
  async loadPatientHistory(patientId: string): Promise<{
    appointments: Appointment[];
    medicalRecords: MedicalRecord[];
    treatmentPlans: TreatmentPlan[];
    doctorsMap: Record<string, UserType>;
  }> {
    try {
      const patientIdNum = parseInt(patientId);

      // Cargar citas del paciente
      const appointmentsResponse = await appointmentsApi.getAppointments({
        patient_id: patientIdNum,
        limit: 1000
      });
      const appointments = appointmentsResponse.data || [];

      // Cargar historias médicas del paciente
      const medicalHistoriesResponse = await medicalHistoriesApi.getPatientMedicalHistory(patientIdNum);
      // getPatientMedicalHistory puede retornar null si no hay historial
      const medicalRecords = medicalHistoriesResponse?.data ? [medicalHistoriesResponse.data] : [];

      // Cargar planes de tratamiento del paciente
      const treatmentPlansResponse = await httpClient.get<{ success: boolean; data: any[] }>(
        `/treatment-plans?patient_id=${patientId}`
      );
      const treatmentPlans = treatmentPlansResponse.data || [];

      // Obtener IDs únicos de doctores
      const doctorIds = [...new Set([
        ...appointments.map((a: any) => a.dentist_id),
        ...medicalRecords.map((m: any) => m.dentist_id || m.doctor_id),
        ...treatmentPlans.map((t: any) => t.dentist_id || t.doctor_id)
      ])].filter(Boolean);

      // Cargar información de doctores
      const doctorsMap: Record<string, UserType> = {};

      for (const doctorId of doctorIds) {
        try {
          const doctorResponse = await httpClient.get<{ success: boolean; data: any }>(
            `/users/${doctorId}`
          );
          if (doctorResponse.data) {
            doctorsMap[doctorId.toString()] = {
              id: doctorResponse.data.user_id?.toString() || doctorId.toString(),
              name: `${doctorResponse.data.first_name} ${doctorResponse.data.last_name}`,
              email: doctorResponse.data.email || '',
              role: 'doctor',
              specialty: doctorResponse.data.specialty || '',
              createdAt: new Date(doctorResponse.data.created_at || new Date())
            };
          }
        } catch (error) {
        }
      }

      return {
        appointments: appointments as Appointment[],
        medicalRecords: medicalRecords as MedicalRecord[],
        treatmentPlans: treatmentPlans as TreatmentPlan[],
        doctorsMap
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Carga los contratos del paciente
   */
  async loadPatientContracts(patientId: string): Promise<PatientContract[]> {
    try {
      const response = await httpClient.get<{ success: boolean; data: any[] }>(
        `/patient-contracts?patient_id=${patientId}`
      );

      // Construir la URL base del backend (sin /api)
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4015/api';
      const backendBaseUrl = apiUrl.replace(/\/api$/, '');

      // Mapear los datos del backend al formato del frontend
      const contracts = (response.data || []).map((contract: any) => {
        // Construir URL completa del archivo
        let contractFileUrl = contract.contract_file_url || '';
        if (contractFileUrl && contractFileUrl.startsWith('/uploads/')) {
          contractFileUrl = `${backendBaseUrl}${contractFileUrl}`;
        }

        return {
          id: String(contract.patient_contract_id),
          patientId: String(contract.patient_id),
          uploadedBy: String(contract.user_id_registration || ''),
          contractName: contract.notes || contract.contract_content || `Contrato ${contract.contract_number || contract.patient_contract_id}`,
          contractType: contract.contract_type,
          contractFile: contractFileUrl,
          status: contract.is_signed ? 'signed' : 'pending' as 'pending' | 'signed' | 'rejected',
          digitalSignature: contract.signature_data || undefined,
          signedAt: contract.signed_date ? new Date(contract.signed_date) : undefined,
          signedBy: undefined,
          notes: contract.notes,
          uploadedAt: new Date(contract.date_time_registration || contract.contract_date),
          createdAt: new Date(contract.date_time_registration || contract.contract_date),
          updatedAt: new Date(contract.date_time_modification || contract.date_time_registration || contract.contract_date)
        };
      });

      return contracts;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualiza el estado "Cliente Nuevo" de un paciente
   */
  async toggleClienteNuevo(patientId: string, currentStatus: boolean): Promise<boolean> {
    try {
      const newStatus = !currentStatus;
      const patientIdNum = parseInt(patientId);

      // Actualizar en el backend con el nuevo estado
      await patientsApi.updatePatient(patientIdNum, {
        is_new_client: newStatus
      });

      return newStatus;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crea un nuevo paciente
   *
   * IMPORTANTE: branchId es OPCIONAL. Los pacientes NO están asignados a una sede específica.
   * La sede se determina por la cita, tratamiento o pago donde se atiende el paciente.
   *
   * @param patientData - Datos del paciente
   * @param branchId - (Opcional) ID de sede, solo para casos especiales
   */
  async createPatient(patientData: Patient, branchId?: number): Promise<Patient> {
    try {
      const backendData = mapFrontendPatientToBackend(patientData, branchId) as PatientData;

      // Asegurar que los campos requeridos estén presentes
      if (!backendData.first_name || !backendData.last_name || !backendData.identification_number) {
        throw new Error('Faltan campos requeridos para crear el paciente');
      }

      if (!backendData.birth_date || !backendData.mobile) {
        throw new Error('Fecha de nacimiento y teléfono son requeridos');
      }

      const response = await patientsApi.createPatient(backendData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendPatientToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualiza un paciente existente
   */
  async updatePatient(patientId: string, patientData: Partial<Patient>): Promise<Patient> {
    try {
      const patientIdNum = parseInt(patientId);
      const backendData = mapFrontendPatientToBackend(patientData);

      const response = await patientsApi.updatePatient(patientIdNum, backendData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendPatientToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Elimina un paciente
   */
  async deletePatient(patientId: string): Promise<void> {
    try {
      const patientIdNum = parseInt(patientId);
      await patientsApi.deletePatient(patientIdNum);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Carga todas las empresas/compañías
   */
  async loadCompanies(): Promise<Company[]> {
    try {
      const response = await companiesApi.getCompanies({
        limit: 1000
      });

      return response.data.map(mapBackendCompanyToFrontend);
    } catch (error) {
      console.error('[PatientApiService.loadCompanies] Error:', error);
      throw error;
    }
  },

  /**
   * Obtiene los datos de atención integral del paciente
   * Incluye procedimientos del odontograma, historial, texto manual y servicios adicionales
   */
  async loadPatientIntegralData(patientId: string): Promise<PatientIntegralData> {
    try {
      const response = await httpClient.get<{ success: boolean; data: PatientIntegralData }>(
        `/patients/${patientId}/integral-data`
      );

      return response.data || {
        has_integral_attention: false,
        total_consultations: 0,
        consultations: [],
        odontogram_procedures: [],
        procedure_history: [],
        evolution_records: [],
        sub_procedures: [],
        additional_services: [],
        services_summary: { ortodoncia: 0, implantes: 0, protesis: 0 },
        counts: {
          consultations: 0,
          odontogram_procedures: 0,
          procedure_history: 0,
          evolution_records: 0,
          sub_procedures: 0,
          additional_services: 0
        }
      };
    } catch (error) {
      console.error('[PatientApiService.loadPatientIntegralData] Error:', error);
      throw error;
    }
  },

  /**
   * SA Only: Carga historial integral COMPLETO de un paciente
   * Incluye los 10 pasos de la consulta integral
   */
  async loadPatientFullIntegralHistory(patientId: string): Promise<PatientFullIntegralHistory> {
    const response = await httpClient.get<{ success: boolean; data: PatientFullIntegralHistory }>(
      `/patients/${patientId}/integral-history`
    );
    if (!response.success || !response.data) {
      throw new Error('Error al cargar historial integral');
    }
    return response.data;
  },

  /**
   * SA Only: Carga historial de modificaciones de un paciente desde audit_logs
   */
  async loadPatientModificationHistory(patientId: string): Promise<{
    logs: PatientAuditLog[];
    total: number;
  }> {
    const response = await httpClient.get<{
      success: boolean;
      data: PatientAuditLog[];
      pagination: { total: number };
    }>(`/audit-logs?table_name=patients&record_id=${patientId}&limit=100`);

    return {
      logs: response.data || [],
      total: response.pagination?.total || 0
    };
  }
};

// Tipos para datos de atención integral
export interface ConsultationRecord {
  consultation_id: number;
  consultation_date: string;
  dentist_name: string;
  chief_complaint?: string;
  diagnosis?: string;
  treatment_plan_text?: string;
  treatment_performed?: string;
  notes?: string;
  recommendations?: string;
}

export interface OdontogramProcedure {
  id: number;
  procedure_name: string;
  procedure_code?: string;
  procedure_category?: string;
  tooth_number: string;
  tooth_name?: string;
  surface?: string;
  treatment_status: string;
  findings?: string;
  notes?: string;
  treatment_date?: string;
  consultation_date?: string;
  dentist_name?: string;
}

export interface ProcedureHistoryRecord {
  id: number;
  procedure_name: string;
  procedure_code?: string;
  procedure_type?: string;
  procedure_status: string;
  tooth_number?: string;
  tooth_name?: string;
  surface?: string;
  clinical_notes?: string;
  complications?: string;
  next_steps?: string;
  performed_date: string;
  consultation_date?: string;
  dentist_name?: string;
}

export interface EvolutionRecord {
  id: number;
  condition_status: string;
  condition_name?: string;
  clinical_observation?: string;
  tooth_number: string;
  tooth_name?: string;
  surface?: string;
  registered_date: string;
  dentist_name?: string;
}

export interface SubProcedureRecord {
  id: number;
  sub_procedure_id?: number;
  sub_procedure_name?: string;
  sub_procedure_code?: string;
  specialty?: string;
  tooth_number: string;
  surface?: string;
  condition_label: string;
  cie10_code?: string;
  condition_price?: number;
  procedure_price?: number;
  notes?: string;
  observations?: string;
  consultation_id: number;
  consultation_date: string;
  dentist_name?: string;
}

export interface AdditionalService {
  consultation_additional_service_id: number;
  service_type: string;
  service_name: string;
  modality?: string;
  monto_total?: number;
  cuota_inicial?: number;
  numero_cuotas?: number;
  monto_cuota?: number;
  consultation_id: number;
  consultation_date: string;
  dentist_name: string;
}

export interface PatientIntegralData {
  patient_id?: number;
  has_integral_attention: boolean;
  total_consultations: number;
  consultations: ConsultationRecord[];
  odontogram_procedures: OdontogramProcedure[];
  procedure_history: ProcedureHistoryRecord[];
  evolution_records: EvolutionRecord[];
  sub_procedures: SubProcedureRecord[];
  additional_services: AdditionalService[];
  services_summary: {
    ortodoncia: number;
    implantes: number;
    protesis: number;
  };
  counts: {
    consultations: number;
    odontogram_procedures: number;
    procedure_history: number;
    evolution_records: number;
    sub_procedures: number;
    additional_services: number;
  };
}

/** Historial integral completo - respuesta del endpoint SA */
export interface PatientFullIntegralHistory {
  patient: {
    patient_id: number;
    first_name: string;
    last_name: string;
    identification_number: string;
  };
  consultations: IntegralConsultation[];
  summary: {
    total_consultations: number;
    last_consultation_date: string | null;
    completed_procedures: number;
    total_prescriptions: number;
  } | null;
  medical_background: any;
  laboratory_radiography_requests: any[];
}

/** Consulta integral completa (estructura del portal del paciente) */
export interface IntegralConsultation {
  consultation_id: number;
  patient_id: number;
  dentist_id: number;
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
  treatment_performed: string | null;
  notes: string | null;
  recommendations: string | null;
  dentist_name: string;
  branch_name: string;
  odontogram: any;
  evolution_odontogram: any[];
  definitive_diagnosis: any[];
  treatment_plan: any;
  radiography_requests: any[];
  exam_results: any;
  procedure_history: any[];
  completed_items: any[];
  prescriptions: any[];
  budget: any;
}

/** Log de auditoría de modificaciones */
export interface PatientAuditLog {
  audit_log_id: number;
  table_name: string;
  record_id: number;
  action: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  changed_fields: Record<string, { old: any; new: any }> | null;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  branch_id: number | null;
  ip_address: string | null;
  timestamp: string;
}

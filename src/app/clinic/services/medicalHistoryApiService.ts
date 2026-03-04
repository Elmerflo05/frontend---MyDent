/**
 * Servicio de integración con API real para Historias Médicas
 * Reemplaza el uso de IndexedDB y Mock Data por llamadas al backend
 *
 * IMPORTANTE: Este servicio NO debe ser reutilizado en otros módulos.
 * Es específico para el módulo de Historias Médicas de clínica.
 */

import { medicalHistoriesApi, type MedicalHistoryData } from '@/services/api/medicalHistoriesApi';
import { patientsApi } from '@/services/api/patientsApi';
import { formatDateToYMD } from '@/utils/dateUtils';
import type { Patient } from '@/types';

/**
 * Interface para Medical Record Entry del frontend
 */
export interface MedicalRecordEntry {
  id: string;
  patientId: string;
  date: Date;
  diagnosis: string;
  treatment: string;
  notes: string;
  symptoms: string[];
  medications: string[];
  doctorId: string;
  attachments?: string[];
  vitals?: {
    bloodPressure?: string;
    temperature?: number;
    heartRate?: number;
    weight?: number;
  };
}

/**
 * Mapea una historia médica del backend al formato del frontend
 */
const mapBackendMedicalHistoryToFrontend = (backendHistory: MedicalHistoryData): MedicalRecordEntry => {
  // Parsear síntomas si vienen como JSON string
  let symptoms: string[] = [];
  if (backendHistory.medical_history) {
    try {
      const parsed = typeof backendHistory.medical_history === 'string'
        ? JSON.parse(backendHistory.medical_history)
        : backendHistory.medical_history;
      symptoms = parsed.symptoms || [];
    } catch {
      symptoms = [];
    }
  }

  // Parsear medicamentos si vienen como JSON string
  let medications: string[] = [];
  if (backendHistory.current_medications) {
    try {
      const parsed = typeof backendHistory.current_medications === 'string'
        ? JSON.parse(backendHistory.current_medications)
        : backendHistory.current_medications;
      medications = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      medications = backendHistory.current_medications ? [backendHistory.current_medications] : [];
    }
  }

  return {
    id: backendHistory.history_id?.toString() || '',
    patientId: backendHistory.patient_id?.toString() || '',
    date: new Date(backendHistory.record_date || backendHistory.created_at || new Date()),
    diagnosis: backendHistory.diagnosis || '',
    treatment: backendHistory.treatment_received || '',
    notes: backendHistory.additional_notes || '',
    symptoms: symptoms,
    medications: medications,
    doctorId: backendHistory.dentist_id?.toString() || '',
    attachments: [],
    vitals: {
      bloodPressure: backendHistory.blood_pressure,
      temperature: backendHistory.temperature,
      heartRate: backendHistory.heart_rate,
      weight: backendHistory.weight
    }
  };
};

/**
 * Mapea un registro del frontend al formato del backend
 */
const mapFrontendMedicalHistoryToBackend = (
  frontendRecord: Partial<MedicalRecordEntry>,
  branchId: number = 1
): Partial<MedicalHistoryData> => {
  const data: Partial<MedicalHistoryData> = {};

  if (frontendRecord.patientId) data.patient_id = parseInt(frontendRecord.patientId);
  if (frontendRecord.doctorId) data.dentist_id = parseInt(frontendRecord.doctorId);
  if (frontendRecord.date) data.record_date = formatDateToYMD(frontendRecord.date);
  if (frontendRecord.diagnosis) data.diagnosis = frontendRecord.diagnosis;
  if (frontendRecord.treatment) data.treatment_received = frontendRecord.treatment;
  if (frontendRecord.notes) data.additional_notes = frontendRecord.notes;

  // Convertir symptoms a JSON
  if (frontendRecord.symptoms) {
    data.medical_history = JSON.stringify({ symptoms: frontendRecord.symptoms });
  }

  // Convertir medications a string o JSON
  if (frontendRecord.medications) {
    data.current_medications = JSON.stringify(frontendRecord.medications);
  }

  // Vitales
  if (frontendRecord.vitals) {
    if (frontendRecord.vitals.bloodPressure) data.blood_pressure = frontendRecord.vitals.bloodPressure;
    if (frontendRecord.vitals.temperature) data.temperature = frontendRecord.vitals.temperature;
    if (frontendRecord.vitals.heartRate) data.heart_rate = frontendRecord.vitals.heartRate;
    if (frontendRecord.vitals.weight) data.weight = frontendRecord.vitals.weight;
  }

  data.branch_id = branchId;

  return data;
};

/**
 * Mapea paciente del backend al formato frontend
 */
const mapBackendPatientToFrontend = (backendPatient: any): Patient => {
  return {
    id: backendPatient.patient_id?.toString() || '',
    firstName: backendPatient.first_name || '',
    lastName: backendPatient.last_name || '',
    dni: backendPatient.identification_number || '',
    phone: backendPatient.mobile || '',
    email: backendPatient.email || '',
    birthDate: backendPatient.birth_date ? new Date(backendPatient.birth_date) : new Date(),
    gender: backendPatient.gender_id === 1 ? 'male' : 'female',
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
    ruc: backendPatient.ruc || '',
    businessName: backendPatient.business_name || '',
    referralSource: backendPatient.referral_source || '',
    notes: backendPatient.notes || '',
    photoUrl: backendPatient.profile_photo_url || '',
    esClienteNuevo: backendPatient.is_new_client ?? true,
    createdAt: new Date(backendPatient.created_at || new Date()),
    updatedAt: new Date(backendPatient.updated_at || new Date())
  };
};

export const MedicalHistoryApiService = {
  /**
   * Carga todas las historias médicas desde el backend
   */
  async loadMedicalHistories(filters?: { patientId?: number; branchId?: number }): Promise<MedicalRecordEntry[]> {
    try {
      const response = await medicalHistoriesApi.getMedicalHistories({
        patient_id: filters?.patientId,
        branch_id: filters?.branchId,
        limit: 1000
      });

      return response.data.map(mapBackendMedicalHistoryToFrontend);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Carga todos los pacientes
   */
  async loadPatients(): Promise<Patient[]> {
    try {
      const response = await patientsApi.getPatients({ limit: 1000 });
      return response.data.map(mapBackendPatientToFrontend);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene una historia médica por su ID
   */
  async getMedicalHistoryById(historyId: string): Promise<MedicalRecordEntry> {
    try {
      const response = await medicalHistoriesApi.getMedicalHistoryById(parseInt(historyId));
      return mapBackendMedicalHistoryToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crea una nueva historia médica
   */
  async createMedicalHistory(record: MedicalRecordEntry, branchId: number = 1): Promise<MedicalRecordEntry> {
    try {
      const backendData = mapFrontendMedicalHistoryToBackend(record, branchId) as MedicalHistoryData;

      // Validar campos requeridos
      if (!backendData.patient_id || !backendData.dentist_id) {
        throw new Error('Faltan campos requeridos para crear la historia médica');
      }

      const response = await medicalHistoriesApi.createMedicalHistory(backendData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendMedicalHistoryToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualiza una historia médica existente
   */
  async updateMedicalHistory(historyId: string, recordData: Partial<MedicalRecordEntry>): Promise<MedicalRecordEntry> {
    try {
      const backendData = mapFrontendMedicalHistoryToBackend(recordData);
      const response = await medicalHistoriesApi.updateMedicalHistory(parseInt(historyId), backendData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendMedicalHistoryToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Elimina una historia médica
   */
  async deleteMedicalHistory(historyId: string): Promise<void> {
    try {
      await medicalHistoriesApi.deleteMedicalHistory(parseInt(historyId));
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene historias médicas de un paciente
   */
  async getPatientMedicalHistories(patientId: string): Promise<MedicalRecordEntry[]> {
    try {
      const response = await medicalHistoriesApi.getMedicalHistories({
        patient_id: parseInt(patientId),
        limit: 1000
      });

      return response.data.map(mapBackendMedicalHistoryToFrontend);
    } catch (error) {
      throw error;
    }
  }
};

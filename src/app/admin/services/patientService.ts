// ============================================================================
// PATIENT SERVICE (Admin) - Servicio de Pacientes para módulo Admin
// ============================================================================
// TODO: Implementar API real para todas las operaciones de pacientes

import type { Patient, SignedConsent, Appointment, MedicalRecord, TreatmentPlan, User as UserType, PatientContract } from '@/types';

/**
 * NOTA: Este servicio actualmente retorna datos vacíos como stub.
 * Requiere implementación de API real en el backend.
 */
export const PatientService = {
  /**
   * Load all patients and treatment plans
   */
  async loadPatients(): Promise<{ patients: Patient[]; treatmentPlans: TreatmentPlan[] }> {
    console.warn('⚠️ PatientService.loadPatients: Stub - requiere API real');
    // TODO: Implementar llamada a API
    return { patients: [], treatmentPlans: [] };
  },

  /**
   * Load signed consents for a specific patient
   */
  async loadPatientConsents(patientId: string): Promise<SignedConsent[]> {
    console.warn('⚠️ PatientService.loadPatientConsents: Stub - requiere API real');
    return [];
  },

  /**
   * Load complete patient history (appointments, medical records, treatment plans, doctors)
   */
  async loadPatientHistory(patientId: string): Promise<{
    appointments: Appointment[];
    medicalRecords: MedicalRecord[];
    treatmentPlans: TreatmentPlan[];
    doctorsMap: Record<string, UserType>;
  }> {
    console.warn('⚠️ PatientService.loadPatientHistory: Stub - requiere API real');
    return {
      appointments: [],
      medicalRecords: [],
      treatmentPlans: [],
      doctorsMap: {}
    };
  },

  /**
   * Load patient contracts
   */
  async loadPatientContracts(patientId: string): Promise<PatientContract[]> {
    console.warn('⚠️ PatientService.loadPatientContracts: Stub - requiere API real');
    return [];
  },

  /**
   * Toggle patient's "Cliente Nuevo" status
   */
  async toggleClienteNuevo(patientId: string, currentStatus: boolean): Promise<boolean> {
    console.warn('⚠️ PatientService.toggleClienteNuevo: Stub - requiere API real');
    // Return the toggled status but note it won't persist
    return !currentStatus;
  }
};

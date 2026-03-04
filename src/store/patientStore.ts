import { create } from 'zustand';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  email: string;
  phone: string;
  address: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory?: {
    allergies: string[];
    chronicDiseases: string[];
    currentMedications: string[];
    previousSurgeries: string[];
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    coverageType: string;
  };
  // Campos de plan de salud (vienen de la API)
  health_plan_id?: number;
  health_plan_name?: string;
  health_plan_code?: string;
  health_plan_type?: string;
  // Aliases para compatibilidad
  healthPlan?: string;
  healthPlanCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PatientStore {
  patients: Patient[];
  currentPatient: Patient | null;

  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => string;
  setPatients: (patients: Patient[]) => void;
  clearPatients: () => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  getPatientById: (id: string) => Patient | undefined;
  searchPatients: (query: string) => Patient[];
  setCurrentPatient: (patient: Patient | null) => void;

  getTotalPatients: () => number;
  getRecentPatients: (limit?: number) => Patient[];
}

export const usePatientStore = create<PatientStore>()((set, get) => ({
  patients: [],
  currentPatient: null,

  addPatient: (patient) => {
    // Si ya viene con un ID (ej: desde la API), usarlo; sino generar uno nuevo
    const patientId = (patient as any).id || `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newPatient: Patient = {
      ...patient,
      id: patientId,
      createdAt: (patient as any).createdAt || new Date(),
      updatedAt: (patient as any).updatedAt || new Date()
    };

    set((state) => ({
      patients: [...state.patients, newPatient]
    }));

    return newPatient.id;
  },

  setPatients: (patients) => {
    set({ patients });
  },

  clearPatients: () => {
    set({ patients: [], currentPatient: null });
  },

  updatePatient: (id, updates) => {
    set((state) => ({
      patients: state.patients.map(patient =>
        patient.id === id
          ? { ...patient, ...updates, updatedAt: new Date() }
          : patient
      )
    }));
  },

  deletePatient: (id) => {
    set((state) => ({
      patients: state.patients.filter(patient => patient.id !== id)
    }));
  },

  getPatientById: (id) => {
    return get().patients.find(patient => patient.id === id);
  },

  searchPatients: (query) => {
    const lowercaseQuery = query.toLowerCase();
    return get().patients.filter(patient =>
      patient.firstName.toLowerCase().includes(lowercaseQuery) ||
      patient.lastName.toLowerCase().includes(lowercaseQuery) ||
      patient.documentNumber.includes(lowercaseQuery) ||
      patient.email.toLowerCase().includes(lowercaseQuery)
    );
  },

  setCurrentPatient: (patient) => {
    set({ currentPatient: patient });
  },

  getTotalPatients: () => {
    return get().patients.length;
  },

  getRecentPatients: (limit = 5) => {
    return get().patients
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}));
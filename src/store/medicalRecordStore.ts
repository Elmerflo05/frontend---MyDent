import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  date: Date;
  consultationReason: string;
  currentSymptoms: string;
  medicalHistory?: string;
  currentMedications?: string;
  allergies?: string;
  habits?: string;
  physicalExamination?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    weight?: string;
    height?: string;
    oralExam?: string;
  };
  diagnosis?: string;
  treatmentPlan?: string;
  prescriptions?: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  followUpDate?: Date;
  notes?: string;
  attachments?: {
    type: 'image' | 'document' | 'xray';
    url: string;
    name: string;
    uploadDate: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

interface MedicalRecordStore {
  records: MedicalRecord[];
  currentRecord: MedicalRecord | null;

  createRecord: (record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateRecord: (id: string, updates: Partial<MedicalRecord>) => void;
  deleteRecord: (id: string) => void;
  getRecordById: (id: string) => MedicalRecord | undefined;
  getRecordsByPatient: (patientId: string) => MedicalRecord[];
  getRecordsByDoctor: (doctorId: string) => MedicalRecord[];
  setCurrentRecord: (record: MedicalRecord | null) => void;

  addPrescription: (recordId: string, prescription: MedicalRecord['prescriptions'][0]) => void;
  removePrescription: (recordId: string, index: number) => void;

  addAttachment: (recordId: string, attachment: MedicalRecord['attachments'][0]) => void;
  removeAttachment: (recordId: string, attachmentUrl: string) => void;

  getLatestRecordByPatient: (patientId: string) => MedicalRecord | undefined;
  searchRecords: (query: string) => MedicalRecord[];
}

export const useMedicalRecordStore = create<MedicalRecordStore>()(
  persist(
    (set, get) => ({
      records: [],
      currentRecord: null,

      createRecord: (record) => {
        const newRecord: MedicalRecord = {
          ...record,
          id: `record-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        set((state) => ({
          records: [...state.records, newRecord]
        }));

        return newRecord.id;
      },

      updateRecord: (id, updates) => {
        set((state) => ({
          records: state.records.map(record =>
            record.id === id
              ? { ...record, ...updates, updatedAt: new Date() }
              : record
          )
        }));
      },

      deleteRecord: (id) => {
        set((state) => ({
          records: state.records.filter(record => record.id !== id)
        }));
      },

      getRecordById: (id) => {
        return get().records.find(record => record.id === id);
      },

      getRecordsByPatient: (patientId) => {
        return get().records
          .filter(record => record.patientId === patientId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },

      getRecordsByDoctor: (doctorId) => {
        return get().records
          .filter(record => record.doctorId === doctorId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },

      setCurrentRecord: (record) => {
        set({ currentRecord: record });
      },

      addPrescription: (recordId, prescription) => {
        set((state) => ({
          records: state.records.map(record =>
            record.id === recordId
              ? {
                  ...record,
                  prescriptions: [...(record.prescriptions || []), prescription],
                  updatedAt: new Date()
                }
              : record
          )
        }));
      },

      removePrescription: (recordId, index) => {
        set((state) => ({
          records: state.records.map(record =>
            record.id === recordId
              ? {
                  ...record,
                  prescriptions: record.prescriptions?.filter((_, i) => i !== index),
                  updatedAt: new Date()
                }
              : record
          )
        }));
      },

      addAttachment: (recordId, attachment) => {
        set((state) => ({
          records: state.records.map(record =>
            record.id === recordId
              ? {
                  ...record,
                  attachments: [...(record.attachments || []), attachment],
                  updatedAt: new Date()
                }
              : record
          )
        }));
      },

      removeAttachment: (recordId, attachmentUrl) => {
        set((state) => ({
          records: state.records.map(record =>
            record.id === recordId
              ? {
                  ...record,
                  attachments: record.attachments?.filter(att => att.url !== attachmentUrl),
                  updatedAt: new Date()
                }
              : record
          )
        }));
      },

      getLatestRecordByPatient: (patientId) => {
        const patientRecords = get().getRecordsByPatient(patientId);
        return patientRecords[0];
      },

      searchRecords: (query) => {
        const lowercaseQuery = query.toLowerCase();
        return get().records.filter(record =>
          record.consultationReason.toLowerCase().includes(lowercaseQuery) ||
          record.currentSymptoms.toLowerCase().includes(lowercaseQuery) ||
          record.diagnosis?.toLowerCase().includes(lowercaseQuery) ||
          record.notes?.toLowerCase().includes(lowercaseQuery)
        );
      }
    }),
    {
      name: 'medical-record-store'
    }
  )
);
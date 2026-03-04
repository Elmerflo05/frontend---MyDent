import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TreatmentProcedure {
  id: string;
  toothNumber?: string;
  procedureName: string;
  surfaces?: string[];
  price: number;
  status: 'pending' | 'in_progress' | 'completed';
  completedDate?: Date;
}

export interface Treatment {
  id: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  procedures: TreatmentProcedure[];
  estimatedDuration?: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  notes?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  totalCost: number;
  paidAmount: number;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TreatmentStore {
  treatments: Treatment[];
  currentTreatment: Treatment | null;

  createTreatment: (treatment: Omit<Treatment, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateTreatment: (id: string, updates: Partial<Treatment>) => void;
  deleteTreatment: (id: string) => void;
  getTreatmentById: (id: string) => Treatment | undefined;
  getTreatmentsByPatient: (patientId: string) => Treatment[];
  getTreatmentsByDoctor: (doctorId: string) => Treatment[];
  setCurrentTreatment: (treatment: Treatment | null) => void;

  addProcedure: (treatmentId: string, procedure: Omit<TreatmentProcedure, 'id'>) => void;
  updateProcedure: (treatmentId: string, procedureId: string, updates: Partial<TreatmentProcedure>) => void;
  deleteProcedure: (treatmentId: string, procedureId: string) => void;

  calculateTotalCost: (treatmentId: string) => number;
  getActiveTreatments: () => Treatment[];
  getCompletedTreatments: () => Treatment[];
}

export const useTreatmentStore = create<TreatmentStore>()(
  persist(
    (set, get) => ({
      treatments: [],
      currentTreatment: null,

      createTreatment: (treatment) => {
        const newTreatment: Treatment = {
          ...treatment,
          id: `treatment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        set((state) => ({
          treatments: [...state.treatments, newTreatment]
        }));

        return newTreatment.id;
      },

      updateTreatment: (id, updates) => {
        set((state) => ({
          treatments: state.treatments.map(treatment =>
            treatment.id === id
              ? { ...treatment, ...updates, updatedAt: new Date() }
              : treatment
          )
        }));
      },

      deleteTreatment: (id) => {
        set((state) => ({
          treatments: state.treatments.filter(treatment => treatment.id !== id)
        }));
      },

      getTreatmentById: (id) => {
        return get().treatments.find(treatment => treatment.id === id);
      },

      getTreatmentsByPatient: (patientId) => {
        return get().treatments.filter(treatment => treatment.patientId === patientId);
      },

      getTreatmentsByDoctor: (doctorId) => {
        return get().treatments.filter(treatment => treatment.doctorId === doctorId);
      },

      setCurrentTreatment: (treatment) => {
        set({ currentTreatment: treatment });
      },

      addProcedure: (treatmentId, procedure) => {
        const newProcedure: TreatmentProcedure = {
          ...procedure,
          id: `procedure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        set((state) => ({
          treatments: state.treatments.map(treatment =>
            treatment.id === treatmentId
              ? {
                  ...treatment,
                  procedures: [...treatment.procedures, newProcedure],
                  totalCost: treatment.totalCost + newProcedure.price,
                  updatedAt: new Date()
                }
              : treatment
          )
        }));
      },

      updateProcedure: (treatmentId, procedureId, updates) => {
        set((state) => ({
          treatments: state.treatments.map(treatment =>
            treatment.id === treatmentId
              ? {
                  ...treatment,
                  procedures: treatment.procedures.map(proc =>
                    proc.id === procedureId
                      ? { ...proc, ...updates }
                      : proc
                  ),
                  totalCost: treatment.procedures.reduce((sum, proc) => {
                    if (proc.id === procedureId && updates.price !== undefined) {
                      return sum + updates.price;
                    }
                    return sum + proc.price;
                  }, 0),
                  updatedAt: new Date()
                }
              : treatment
          )
        }));
      },

      deleteProcedure: (treatmentId, procedureId) => {
        set((state) => ({
          treatments: state.treatments.map(treatment =>
            treatment.id === treatmentId
              ? {
                  ...treatment,
                  procedures: treatment.procedures.filter(proc => proc.id !== procedureId),
                  totalCost: treatment.procedures
                    .filter(proc => proc.id !== procedureId)
                    .reduce((sum, proc) => sum + proc.price, 0),
                  updatedAt: new Date()
                }
              : treatment
          )
        }));
      },

      calculateTotalCost: (treatmentId) => {
        const treatment = get().getTreatmentById(treatmentId);
        if (!treatment) return 0;
        return treatment.procedures.reduce((sum, proc) => sum + proc.price, 0);
      },

      getActiveTreatments: () => {
        return get().treatments.filter(treatment =>
          treatment.status === 'in_progress' || treatment.status === 'planned'
        );
      },

      getCompletedTreatments: () => {
        return get().treatments.filter(treatment => treatment.status === 'completed');
      }
    }),
    {
      name: 'treatment-store'
    }
  )
);
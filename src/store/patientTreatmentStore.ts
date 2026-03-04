import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ClinicService, Patient } from '@/types';

export interface TreatmentService {
  id: string;
  service: ClinicService;
  patientId: string;
  quantity: number;
  notes?: string;
  toothNumbers?: string[];
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  addedDate: Date;
  scheduledDate?: Date;
  completedDate?: Date;
  doctorId?: string;
  doctorName?: string;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  services: TreatmentService[];
  totalCost: number;
  status: 'draft' | 'approved' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

interface PatientTreatmentStore {
  // Estado
  treatmentPlans: Map<string, TreatmentPlan>; // patientId -> TreatmentPlan
  currentTreatmentPlan: TreatmentPlan | null;

  // Acciones para servicios
  addServicesToPatient: (patientId: string, selectedServices: Array<{
    service: ClinicService;
    quantity: number;
    notes?: string;
    toothNumbers?: string[];
  }>) => void;

  removeServiceFromPatient: (patientId: string, serviceId: string) => void;
  updateServiceStatus: (patientId: string, serviceId: string, status: TreatmentService['status']) => void;
  updateServiceNotes: (patientId: string, serviceId: string, notes: string) => void;

  // Acciones para plan de tratamiento
  createTreatmentPlan: (patientId: string) => TreatmentPlan;
  getTreatmentPlan: (patientId: string) => TreatmentPlan | null;
  updateTreatmentPlanStatus: (patientId: string, status: TreatmentPlan['status']) => void;
  approveTreatmentPlan: (patientId: string, approvedBy: string) => void;

  // Utilidades
  calculateTotalCost: (patientId: string) => number;
  getServicesForPatient: (patientId: string) => TreatmentService[];
  exportTreatmentPlan: (patientId: string) => string;
  setCurrentTreatmentPlan: (plan: TreatmentPlan | null) => void;
}

const usePatientTreatmentStore = create<PatientTreatmentStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      treatmentPlans: new Map(),
      currentTreatmentPlan: null,

      // Implementación de acciones
      addServicesToPatient: (patientId, selectedServices) => {
        set((state) => {
          const newPlans = new Map(state.treatmentPlans);
          let plan = newPlans.get(patientId);

          // Crear plan si no existe
          if (!plan) {
            plan = {
              id: `plan-${patientId}-${Date.now()}`,
              patientId,
              services: [],
              totalCost: 0,
              status: 'draft',
              createdAt: new Date(),
              updatedAt: new Date()
            };
          }

          // Agregar nuevos servicios
          const newServices: TreatmentService[] = selectedServices.map(selectedService => ({
            id: `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            service: selectedService.service,
            patientId,
            quantity: selectedService.quantity,
            notes: selectedService.notes,
            toothNumbers: selectedService.toothNumbers || [],
            status: 'planned',
            addedDate: new Date(),
            doctorName: 'Dr. Usuario' // En implementación real vendría del contexto de usuario
          }));

          plan.services = [...plan.services, ...newServices];
          plan.totalCost = plan.services.reduce((total, service) =>
            total + (service.service.price * service.quantity), 0
          );
          plan.updatedAt = new Date();

          newPlans.set(patientId, plan);

          return {
            treatmentPlans: newPlans,
            currentTreatmentPlan: state.currentTreatmentPlan?.patientId === patientId ? plan : state.currentTreatmentPlan
          };
        });
      },

      removeServiceFromPatient: (patientId, serviceId) => {
        set((state) => {
          const newPlans = new Map(state.treatmentPlans);
          const plan = newPlans.get(patientId);

          if (plan) {
            plan.services = plan.services.filter(service => service.id !== serviceId);
            plan.totalCost = plan.services.reduce((total, service) =>
              total + (service.service.price * service.quantity), 0
            );
            plan.updatedAt = new Date();

            newPlans.set(patientId, plan);

            return {
              treatmentPlans: newPlans,
              currentTreatmentPlan: state.currentTreatmentPlan?.patientId === patientId ? plan : state.currentTreatmentPlan
            };
          }

          return state;
        });
      },

      updateServiceStatus: (patientId, serviceId, status) => {
        set((state) => {
          const newPlans = new Map(state.treatmentPlans);
          const plan = newPlans.get(patientId);

          if (plan) {
            plan.services = plan.services.map(service =>
              service.id === serviceId
                ? {
                    ...service,
                    status,
                    completedDate: status === 'completed' ? new Date() : service.completedDate
                  }
                : service
            );
            plan.updatedAt = new Date();

            // Actualizar estado del plan si todos los servicios están completados
            const allCompleted = plan.services.every(service => service.status === 'completed');
            if (allCompleted && plan.status !== 'completed') {
              plan.status = 'completed';
            }

            newPlans.set(patientId, plan);

            return {
              treatmentPlans: newPlans,
              currentTreatmentPlan: state.currentTreatmentPlan?.patientId === patientId ? plan : state.currentTreatmentPlan
            };
          }

          return state;
        });
      },

      updateServiceNotes: (patientId, serviceId, notes) => {
        set((state) => {
          const newPlans = new Map(state.treatmentPlans);
          const plan = newPlans.get(patientId);

          if (plan) {
            plan.services = plan.services.map(service =>
              service.id === serviceId ? { ...service, notes } : service
            );
            plan.updatedAt = new Date();

            newPlans.set(patientId, plan);

            return {
              treatmentPlans: newPlans,
              currentTreatmentPlan: state.currentTreatmentPlan?.patientId === patientId ? plan : state.currentTreatmentPlan
            };
          }

          return state;
        });
      },

      createTreatmentPlan: (patientId) => {
        const plan: TreatmentPlan = {
          id: `plan-${patientId}-${Date.now()}`,
          patientId,
          services: [],
          totalCost: 0,
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        set((state) => {
          const newPlans = new Map(state.treatmentPlans);
          newPlans.set(patientId, plan);
          return { treatmentPlans: newPlans };
        });

        return plan;
      },

      getTreatmentPlan: (patientId) => {
        const state = get();
        return state.treatmentPlans.get(patientId) || null;
      },

      updateTreatmentPlanStatus: (patientId, status) => {
        set((state) => {
          const newPlans = new Map(state.treatmentPlans);
          const plan = newPlans.get(patientId);

          if (plan) {
            plan.status = status;
            plan.updatedAt = new Date();
            newPlans.set(patientId, plan);

            return {
              treatmentPlans: newPlans,
              currentTreatmentPlan: state.currentTreatmentPlan?.patientId === patientId ? plan : state.currentTreatmentPlan
            };
          }

          return state;
        });
      },

      approveTreatmentPlan: (patientId, approvedBy) => {
        set((state) => {
          const newPlans = new Map(state.treatmentPlans);
          const plan = newPlans.get(patientId);

          if (plan) {
            plan.status = 'approved';
            plan.approvedBy = approvedBy;
            plan.approvedAt = new Date();
            plan.updatedAt = new Date();
            newPlans.set(patientId, plan);

            return {
              treatmentPlans: newPlans,
              currentTreatmentPlan: state.currentTreatmentPlan?.patientId === patientId ? plan : state.currentTreatmentPlan
            };
          }

          return state;
        });
      },

      calculateTotalCost: (patientId) => {
        const state = get();
        const plan = state.treatmentPlans.get(patientId);
        return plan ? plan.totalCost : 0;
      },

      getServicesForPatient: (patientId) => {
        const state = get();
        const plan = state.treatmentPlans.get(patientId);
        return plan ? plan.services : [];
      },

      exportTreatmentPlan: (patientId) => {
        const state = get();
        const plan = state.treatmentPlans.get(patientId);

        if (plan) {
          return JSON.stringify({
            patientId,
            exportDate: new Date().toISOString(),
            treatmentPlan: plan,
            version: '1.0'
          });
        }

        return '';
      },

      setCurrentTreatmentPlan: (plan) => {
        set({ currentTreatmentPlan: plan });
      }
    }),
    {
      name: 'patient-treatment-storage',
      partialize: (state) => ({
        treatmentPlans: Array.from(state.treatmentPlans.entries())
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.treatmentPlans) {
          // Convertir array de vuelta a Map
          const entries = state.treatmentPlans as any;
          if (Array.isArray(entries)) {
            state.treatmentPlans = new Map(entries);
          }
        }
      }
    }
  )
);

export default usePatientTreatmentStore;
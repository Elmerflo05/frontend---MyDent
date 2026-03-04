/**
 * Health Plan Subscriptions Store - Zustand
 * Store para suscripciones extendidas con voucher y aprobacion
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  healthPlanSubscriptionsApi,
  SubscriptionData,
  SubscriptionStats,
  CreateSubscriptionData
} from '@/services/api/healthPlanSubscriptionsApi';
import {
  healthPlanDependentsApi,
  DependentData,
  PatientCoverage,
  CoveredPatient,
  CreateDependentData
} from '@/services/api/healthPlanDependentsApi';

interface HealthPlanSubscriptionsState {
  // Estado
  pendingSubscriptions: SubscriptionData[];
  patientSubscription: SubscriptionData | null;
  patientHistory: SubscriptionData[];
  dependents: DependentData[];
  coveredPatients: CoveredPatient[];
  stats: SubscriptionStats | null;
  loading: boolean;
  error: string | null;

  // Acciones - Estadisticas (Admin)
  loadStats: () => Promise<void>;

  // Acciones - Pendientes (Admin)
  loadPendingSubscriptions: (filters?: { health_plan_id?: number; page?: number; limit?: number }) => Promise<void>;
  approveSubscription: (subscriptionId: number) => Promise<void>;
  rejectSubscription: (subscriptionId: number, reason: string) => Promise<void>;

  // Acciones - Paciente
  loadPatientActiveSubscription: (patientId: number) => Promise<void>;
  loadPatientHistory: (patientId: number) => Promise<void>;
  createSubscription: (data: CreateSubscriptionData) => Promise<SubscriptionData>;
  hasActivePlan: (patientId: number) => Promise<boolean>;

  // Acciones - Primera Consulta Gratis
  checkFirstFreeConsultation: (subscriptionId: number) => Promise<boolean>;
  useFirstFreeConsultation: (subscriptionId: number) => Promise<void>;

  // Acciones - Dependientes
  loadDependents: (subscriptionId: number) => Promise<void>;
  loadCoveredPatients: (subscriptionId: number) => Promise<void>;
  addDependent: (subscriptionId: number, data: CreateDependentData) => Promise<void>;
  removeDependent: (dependentId: number) => Promise<void>;
  checkPatientCoverage: (patientId: number) => Promise<PatientCoverage | null>;

  // Utilidades
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  pendingSubscriptions: [],
  patientSubscription: null,
  patientHistory: [],
  dependents: [],
  coveredPatients: [],
  stats: null,
  loading: false,
  error: null
};

export const useHealthPlanSubscriptionsStore = create<HealthPlanSubscriptionsState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ========================================================================
      // ESTADISTICAS (Admin)
      // ========================================================================

      loadStats: async () => {
        set({ loading: true, error: null });
        try {
          const response = await healthPlanSubscriptionsApi.getStats();
          set({ stats: response.data, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando estadisticas',
            loading: false
          });
        }
      },

      // ========================================================================
      // PENDIENTES (Admin)
      // ========================================================================

      loadPendingSubscriptions: async (filters) => {
        set({ loading: true, error: null });
        try {
          const response = await healthPlanSubscriptionsApi.getPendingSubscriptions(filters);
          set({ pendingSubscriptions: response.data || [], loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando pendientes',
            loading: false
          });
        }
      },

      approveSubscription: async (subscriptionId) => {
        set({ loading: true, error: null });
        try {
          await healthPlanSubscriptionsApi.approveSubscription(subscriptionId);
          // Remover de pendientes
          set(state => ({
            pendingSubscriptions: state.pendingSubscriptions.filter(
              s => s.subscription_id !== subscriptionId
            ),
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al aprobar',
            loading: false
          });
          throw error;
        }
      },

      rejectSubscription: async (subscriptionId, reason) => {
        set({ loading: true, error: null });
        try {
          await healthPlanSubscriptionsApi.rejectSubscription(subscriptionId, reason);
          // Remover de pendientes
          set(state => ({
            pendingSubscriptions: state.pendingSubscriptions.filter(
              s => s.subscription_id !== subscriptionId
            ),
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al rechazar',
            loading: false
          });
          throw error;
        }
      },

      // ========================================================================
      // PACIENTE
      // ========================================================================

      loadPatientActiveSubscription: async (patientId) => {
        set({ loading: true, error: null });
        try {
          const response = await healthPlanSubscriptionsApi.getActiveSubscriptionByPatient(patientId);
          set({ patientSubscription: response.data, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando suscripcion',
            loading: false
          });
        }
      },

      loadPatientHistory: async (patientId) => {
        set({ loading: true, error: null });
        try {
          const response = await healthPlanSubscriptionsApi.getPatientHistory(patientId);
          set({ patientHistory: response.data || [], loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando historial',
            loading: false
          });
        }
      },

      createSubscription: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await healthPlanSubscriptionsApi.createSubscription(data);
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Error al crear suscripcion');
          }
          set({ loading: false });
          return response.data;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al crear suscripcion',
            loading: false
          });
          throw error;
        }
      },

      hasActivePlan: async (patientId) => {
        try {
          const response = await healthPlanSubscriptionsApi.hasActivePlan(patientId);
          return response.has_active_plan;
        } catch (error) {
          return false;
        }
      },

      // ========================================================================
      // PRIMERA CONSULTA GRATIS
      // ========================================================================

      checkFirstFreeConsultation: async (subscriptionId) => {
        try {
          const response = await healthPlanSubscriptionsApi.checkFirstFreeConsultation(subscriptionId);
          return response.first_free_consultation_available;
        } catch (error) {
          return false;
        }
      },

      useFirstFreeConsultation: async (subscriptionId) => {
        set({ loading: true, error: null });
        try {
          await healthPlanSubscriptionsApi.useFirstFreeConsultation(subscriptionId);
          // Actualizar suscripcion si es la actual
          const currentSub = get().patientSubscription;
          if (currentSub && currentSub.subscription_id === subscriptionId) {
            set({
              patientSubscription: {
                ...currentSub,
                first_free_consultation_used: true,
                first_free_consultation_available: false
              },
              loading: false
            });
          } else {
            set({ loading: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error',
            loading: false
          });
          throw error;
        }
      },

      // ========================================================================
      // DEPENDIENTES
      // ========================================================================

      loadDependents: async (subscriptionId) => {
        set({ loading: true, error: null });
        try {
          const response = await healthPlanDependentsApi.getDependentsBySubscription(subscriptionId);
          set({ dependents: response.data || [], loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando dependientes',
            loading: false
          });
        }
      },

      loadCoveredPatients: async (subscriptionId) => {
        set({ loading: true, error: null });
        try {
          const response = await healthPlanDependentsApi.getCoveredPatients(subscriptionId);
          set({ coveredPatients: response.data || [], loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando pacientes cubiertos',
            loading: false
          });
        }
      },

      addDependent: async (subscriptionId, data) => {
        set({ loading: true, error: null });
        try {
          const response = await healthPlanDependentsApi.addDependent(subscriptionId, data);
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Error al agregar dependiente');
          }
          set(state => ({
            dependents: [...state.dependents, response.data],
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al agregar',
            loading: false
          });
          throw error;
        }
      },

      removeDependent: async (dependentId) => {
        set({ loading: true, error: null });
        try {
          await healthPlanDependentsApi.removeDependent(dependentId);
          set(state => ({
            dependents: state.dependents.filter(d => d.dependent_id !== dependentId),
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al eliminar',
            loading: false
          });
          throw error;
        }
      },

      checkPatientCoverage: async (patientId) => {
        try {
          const response = await healthPlanDependentsApi.checkPatientCoverage(patientId);
          return response.has_coverage ? response.data : null;
        } catch (error) {
          return null;
        }
      },

      // ========================================================================
      // UTILIDADES
      // ========================================================================

      clearError: () => set({ error: null }),

      reset: () => set(initialState)
    }),
    { name: 'HealthPlanSubscriptionsStore' }
  )
);

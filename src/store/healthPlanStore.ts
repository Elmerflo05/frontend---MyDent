// ============================================================================
// HEALTH PLAN STORE - Zustand Store para Planes de Salud
// ============================================================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  BaseHealthPlan,
  HealthPlanSubscription,
  HealthPlanTerms,
  CreateHealthPlanDTO,
  UpdateHealthPlanDTO,
  HealthPlanStats,
  PatientSubscriptionSummary,
  PaymentVoucher,
  HealthPlanSettings
} from '@/types/healthPlans';
import {
  healthPlanService,
  subscriptionService,
  termsService
} from '@/services/healthPlan';
import { voucherService } from '@/services/healthPlan/VoucherService';
import { healthPlanSettingsService } from '@/services/healthPlan/HealthPlanSettingsService';
import { paymentScheduleService } from '@/services/healthPlan/PaymentScheduleService';
import { notificationService } from '@/services/healthPlan/NotificationService';

interface HealthPlanState {
  // Estado
  plans: BaseHealthPlan[];
  subscriptions: HealthPlanSubscription[];
  currentPlan: BaseHealthPlan | null;
  currentSubscription: HealthPlanSubscription | null;
  vouchers: PaymentVoucher[];
  pendingVouchers: PaymentVoucher[];
  settings: HealthPlanSettings | null;
  loading: boolean;
  error: string | null;

  // Acciones - Planes
  loadPlans: () => Promise<void>;
  loadAvailablePlans: () => Promise<void>;
  loadPlansBySede: (sedeId: string) => Promise<void>;
  createPlan: (dto: CreateHealthPlanDTO, createdBy: string) => Promise<BaseHealthPlan>;
  updatePlan: (id: string, updates: UpdateHealthPlanDTO) => Promise<BaseHealthPlan>;
  deletePlan: (id: string) => Promise<void>;
  activatePlan: (id: string) => Promise<void>;
  deactivatePlan: (id: string) => Promise<void>;
  selectPlan: (id: string) => Promise<void>;
  clearSelectedPlan: () => void;

  // Acciones - Suscripciones
  loadPatientSubscription: (patientId: string) => Promise<void>;
  loadSubscriptionsByPlan: (planId: string) => Promise<void>;
  subscribeToPlan: (
    patientId: string,
    planId: string,
    termsId: string,
    createdBy: string,
    paymentMethod?: string
  ) => Promise<HealthPlanSubscription>;
  cancelSubscription: (subscriptionId: string, reason?: string) => Promise<void>;
  renewSubscription: (subscriptionId: string) => Promise<void>;
  recordBenefitUsage: (
    subscriptionId: string,
    benefitId: string,
    serviceId?: string,
    amount?: number
  ) => Promise<void>;
  recordPayment: (
    subscriptionId: string,
    amount: number,
    paymentDate: Date
  ) => Promise<void>;

  // Acciones - Términos
  loadPlanTerms: (termsId: string) => Promise<HealthPlanTerms | null>;
  createNewTermsVersion: (
    planId: string,
    content: string,
    version: string,
    createdBy: string
  ) => Promise<HealthPlanTerms>;

  // Acciones - Vouchers
  uploadVoucher: (
    subscriptionId: string,
    patientId: string,
    planId: string,
    voucherImage: string,
    amount: number,
    paymentDate: Date,
    paymentPeriod: string
  ) => Promise<PaymentVoucher>;
  loadPendingVouchers: () => Promise<void>;
  loadSubscriptionVouchers: (subscriptionId: string) => Promise<void>;
  approveVoucher: (voucherId: string, superAdminId: string, patientEmail: string) => Promise<void>;
  rejectVoucher: (voucherId: string, superAdminId: string, reason: string, patientEmail: string) => Promise<void>;
  getVoucherStats: () => Promise<{ total: number; pending: number; approved: number; rejected: number }>;

  // Acciones - Settings
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<HealthPlanSettings>, updatedBy: string) => Promise<void>;
  setGraceDays: (days: number, updatedBy: string) => Promise<void>;

  // Acciones - Payment Status
  getPaymentStatus: (subscriptionId: string) => Promise<any>;
  processPaymentCutoffs: () => Promise<{ processed: number; suspended: number; reminded: number }>;

  // Utilidades
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  plans: [],
  subscriptions: [],
  currentPlan: null,
  currentSubscription: null,
  vouchers: [],
  pendingVouchers: [],
  settings: null,
  loading: false,
  error: null
};

export const useHealthPlanStore = create<HealthPlanState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ========================================================================
      // ACCIONES - PLANES
      // ========================================================================

      loadPlans: async () => {
        set({ loading: true, error: null });
        try {
          const plans = await healthPlanService.getAllPlans();
          set({ plans, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando planes',
            loading: false
          });
        }
      },

      loadAvailablePlans: async () => {
        set({ loading: true, error: null });
        try {
          const plans = await healthPlanService.getAvailablePlans();
          set({ plans, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando planes disponibles',
            loading: false
          });
        }
      },

      loadPlansBySede: async (sedeId: string) => {
        set({ loading: true, error: null });
        try {
          const plans = await healthPlanService.getPlansBySede(sedeId);
          set({ plans, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando planes de la sede',
            loading: false
          });
        }
      },

      createPlan: async (dto: CreateHealthPlanDTO, createdBy: string) => {
        set({ loading: true, error: null });
        try {
          const plan = await healthPlanService.createPlan(dto, createdBy);
          set(state => ({
            plans: [...state.plans, plan],
            loading: false
          }));
          return plan;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error creando plan',
            loading: false
          });
          throw error;
        }
      },

      updatePlan: async (id: string, updates: UpdateHealthPlanDTO) => {
        set({ loading: true, error: null });
        try {
          const updatedPlan = await healthPlanService.updatePlan(id, updates);
          set(state => ({
            plans: state.plans.map(p => p.id === id ? updatedPlan : p),
            currentPlan: state.currentPlan?.id === id ? updatedPlan : state.currentPlan,
            loading: false
          }));
          return updatedPlan;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error actualizando plan',
            loading: false
          });
          throw error;
        }
      },

      deletePlan: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await healthPlanService.deletePlan(id);
          set(state => ({
            plans: state.plans.filter(p => p.id !== id),
            currentPlan: state.currentPlan?.id === id ? null : state.currentPlan,
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error eliminando plan',
            loading: false
          });
          throw error;
        }
      },

      activatePlan: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await healthPlanService.activatePlan(id);
          // Recargar el plan actualizado
          const updatedPlan = await healthPlanService.getPlanById(id);
          if (updatedPlan) {
            set(state => ({
              plans: state.plans.map(p => p.id === id ? updatedPlan : p),
              currentPlan: state.currentPlan?.id === id ? updatedPlan : state.currentPlan,
              loading: false
            }));
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error activando plan',
            loading: false
          });
          throw error;
        }
      },

      deactivatePlan: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await healthPlanService.deactivatePlan(id);
          // Recargar el plan actualizado
          const updatedPlan = await healthPlanService.getPlanById(id);
          if (updatedPlan) {
            set(state => ({
              plans: state.plans.map(p => p.id === id ? updatedPlan : p),
              currentPlan: state.currentPlan?.id === id ? updatedPlan : state.currentPlan,
              loading: false
            }));
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error desactivando plan',
            loading: false
          });
          throw error;
        }
      },

      selectPlan: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const plan = await healthPlanService.getPlanById(id);
          set({ currentPlan: plan, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando plan',
            loading: false
          });
        }
      },

      clearSelectedPlan: () => {
        set({ currentPlan: null });
      },

      // ========================================================================
      // ACCIONES - SUSCRIPCIONES
      // ========================================================================

      loadPatientSubscription: async (patientId: string) => {
        set({ loading: true, error: null });
        try {
          const subscription = await subscriptionService.getPatientSubscription(patientId);
          set({ currentSubscription: subscription, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando suscripción',
            loading: false
          });
        }
      },

      loadSubscriptionsByPlan: async (planId: string) => {
        set({ loading: true, error: null });
        try {
          const subscriptions = await subscriptionService.getSubscriptionsByPlan(planId);
          set({ subscriptions, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando suscripciones',
            loading: false
          });
        }
      },

      subscribeToPlan: async (
        patientId: string,
        planId: string,
        termsId: string,
        createdBy: string,
        paymentMethod?: string
      ) => {
        set({ loading: true, error: null });
        try {
          const subscription = await subscriptionService.subscribe(
            patientId,
            planId,
            termsId,
            createdBy,
            paymentMethod
          );
          set(state => ({
            subscriptions: [...state.subscriptions, subscription],
            currentSubscription: subscription,
            loading: false
          }));
          return subscription;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al suscribirse',
            loading: false
          });
          throw error;
        }
      },

      cancelSubscription: async (subscriptionId: string, reason?: string) => {
        set({ loading: true, error: null });
        try {
          await subscriptionService.cancelSubscription(subscriptionId, reason);
          // Recargar suscripción actualizada
          const updated = await subscriptionService.getPatientSubscription(
            get().currentSubscription?.patientId || ''
          );
          set({
            currentSubscription: updated,
            loading: false
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cancelando suscripción',
            loading: false
          });
          throw error;
        }
      },

      renewSubscription: async (subscriptionId: string) => {
        set({ loading: true, error: null });
        try {
          await subscriptionService.renewSubscription(subscriptionId);
          // Recargar suscripción actualizada
          const updated = await subscriptionService.getPatientSubscription(
            get().currentSubscription?.patientId || ''
          );
          set({
            currentSubscription: updated,
            loading: false
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error renovando suscripción',
            loading: false
          });
          throw error;
        }
      },

      recordBenefitUsage: async (
        subscriptionId: string,
        benefitId: string,
        serviceId?: string,
        amount?: number
      ) => {
        set({ loading: true, error: null });
        try {
          await subscriptionService.recordBenefitUsage(
            subscriptionId,
            benefitId,
            serviceId,
            amount
          );
          // Recargar suscripción actualizada
          const updated = await subscriptionService.getPatientSubscription(
            get().currentSubscription?.patientId || ''
          );
          set({
            currentSubscription: updated,
            loading: false
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error registrando uso de beneficio',
            loading: false
          });
          throw error;
        }
      },

      recordPayment: async (
        subscriptionId: string,
        amount: number,
        paymentDate: Date
      ) => {
        set({ loading: true, error: null });
        try {
          await subscriptionService.recordPayment(subscriptionId, amount, paymentDate);
          // Recargar suscripción actualizada
          const updated = await subscriptionService.getPatientSubscription(
            get().currentSubscription?.patientId || ''
          );
          set({
            currentSubscription: updated,
            loading: false
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error registrando pago',
            loading: false
          });
          throw error;
        }
      },

      // ========================================================================
      // ACCIONES - TÉRMINOS
      // ========================================================================

      loadPlanTerms: async (termsId: string) => {
        set({ loading: true, error: null });
        try {
          const terms = await termsService.getTermsById(termsId);
          set({ loading: false });
          return terms;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando términos',
            loading: false
          });
          return null;
        }
      },

      createNewTermsVersion: async (
        planId: string,
        content: string,
        version: string,
        createdBy: string
      ) => {
        set({ loading: true, error: null });
        try {
          const result = await termsService.createNewVersionAndUpdatePlan(
            planId,
            content,
            version,
            createdBy
          );

          // Recargar el plan actualizado
          const updatedPlan = await healthPlanService.getPlanById(planId);
          if (updatedPlan) {
            set(state => ({
              plans: state.plans.map(p => p.id === planId ? updatedPlan : p),
              currentPlan: state.currentPlan?.id === planId ? updatedPlan : state.currentPlan,
              loading: false
            }));
          }

          return result.terms;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error creando nueva versión de términos',
            loading: false
          });
          throw error;
        }
      },

      // ========================================================================
      // ACCIONES - VOUCHERS
      // ========================================================================

      uploadVoucher: async (
        subscriptionId: string,
        patientId: string,
        planId: string,
        voucherImage: string,
        amount: number,
        paymentDate: Date,
        paymentPeriod: string
      ) => {
        set({ loading: true, error: null });
        try {
          const voucher = await voucherService.uploadVoucher(
            subscriptionId,
            patientId,
            planId,
            voucherImage,
            amount,
            paymentDate,
            paymentPeriod
          );
          set(state => ({
            vouchers: [...state.vouchers, voucher],
            loading: false
          }));
          return voucher;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error subiendo voucher',
            loading: false
          });
          throw error;
        }
      },

      loadPendingVouchers: async () => {
        set({ loading: true, error: null });
        try {
          const pendingVouchers = await voucherService.getPendingVouchers();
          set({ pendingVouchers, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando vouchers pendientes',
            loading: false
          });
        }
      },

      loadSubscriptionVouchers: async (subscriptionId: string) => {
        set({ loading: true, error: null });
        try {
          const vouchers = await voucherService.getSubscriptionVouchers(subscriptionId);
          set({ vouchers, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando vouchers',
            loading: false
          });
        }
      },

      approveVoucher: async (voucherId: string, superAdminId: string, patientEmail: string) => {
        set({ loading: true, error: null });
        try {
          // Obtener el voucher antes de aprobarlo
          const voucher = await voucherService.getVoucherById(voucherId);
          if (!voucher) {
            throw new Error('Voucher no encontrado');
          }

          // Aprobar el voucher
          await voucherService.approveVoucher(voucherId, superAdminId);

          // Procesar la aprobación en la suscripción
          await subscriptionService.processVoucherApproval(
            voucher.subscriptionId,
            voucher.amount,
            voucher.paymentDate
          );

          // Obtener datos del paciente y plan para notificación
          const subscription = await subscriptionService.getPatientSubscription(voucher.patientId);
          const plan = await healthPlanService.getPlanById(voucher.planId);

          if (subscription && plan) {
            // Enviar notificación de aprobación
            await notificationService.notifyVoucherApproved(
              voucher.patientId,
              patientEmail,
              plan.name,
              voucher.amount,
              subscription.nextPaymentDate || new Date()
            );
          }

          // Recargar vouchers pendientes
          await get().loadPendingVouchers();

          set({ loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error aprobando voucher',
            loading: false
          });
          throw error;
        }
      },

      rejectVoucher: async (
        voucherId: string,
        superAdminId: string,
        reason: string,
        patientEmail: string
      ) => {
        set({ loading: true, error: null });
        try {
          // Obtener el voucher antes de rechazarlo
          const voucher = await voucherService.getVoucherById(voucherId);
          if (!voucher) {
            throw new Error('Voucher no encontrado');
          }

          // Rechazar el voucher
          await voucherService.rejectVoucher(voucherId, superAdminId, reason);

          // Obtener datos del plan para notificación
          const plan = await healthPlanService.getPlanById(voucher.planId);

          if (plan) {
            // Enviar notificación de rechazo
            await notificationService.notifyVoucherRejected(
              voucher.patientId,
              patientEmail,
              plan.name,
              reason
            );
          }

          // Recargar vouchers pendientes
          await get().loadPendingVouchers();

          set({ loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error rechazando voucher',
            loading: false
          });
          throw error;
        }
      },

      getVoucherStats: async () => {
        try {
          return await voucherService.getVoucherStats();
        } catch (error) {
          throw error;
        }
      },

      // ========================================================================
      // ACCIONES - SETTINGS
      // ========================================================================

      loadSettings: async () => {
        set({ loading: true, error: null });
        try {
          const settings = await healthPlanSettingsService.getSettings();
          set({ settings, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando configuración',
            loading: false
          });
        }
      },

      updateSettings: async (updates: Partial<HealthPlanSettings>, updatedBy: string) => {
        set({ loading: true, error: null });
        try {
          const settings = await healthPlanSettingsService.updateSettings(updates, updatedBy);
          set({ settings, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error actualizando configuración',
            loading: false
          });
          throw error;
        }
      },

      setGraceDays: async (days: number, updatedBy: string) => {
        set({ loading: true, error: null });
        try {
          await healthPlanSettingsService.setGraceDays(days, updatedBy);
          const settings = await healthPlanSettingsService.getSettings();
          set({ settings, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error configurando días de gracia',
            loading: false
          });
          throw error;
        }
      },

      // ========================================================================
      // ACCIONES - PAYMENT STATUS
      // ========================================================================

      getPaymentStatus: async (subscriptionId: string) => {
        try {
          const subscription = await subscriptionService.getPatientSubscription(''); // Necesita patientId
          if (!subscription) return null;
          return await paymentScheduleService.getPaymentStatus(subscription);
        } catch (error) {
          throw error;
        }
      },

      processPaymentCutoffs: async () => {
        set({ loading: true, error: null });
        try {
          const result = await paymentScheduleService.processPaymentCutoffs();
          set({ loading: false });
          return result;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error procesando cortes de pago',
            loading: false
          });
          throw error;
        }
      },

      // ========================================================================
      // UTILIDADES
      // ========================================================================

      clearError: () => set({ error: null }),

      reset: () => set(initialState)
    }),
    { name: 'HealthPlanStore' }
  )
);

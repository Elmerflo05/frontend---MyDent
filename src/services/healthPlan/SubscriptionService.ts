// ============================================================================
// SUBSCRIPTION SERVICE - Single Responsibility: Gestión de Suscripciones
// ============================================================================
// TODO: Implementar API real para suscripciones de planes de salud

import { paymentScheduleService } from './PaymentScheduleService';
import {
  SubscriptionStatus,
  BillingCycle
} from '@/types/healthPlans';
import type {
  HealthPlanSubscription,
  ISubscriptionManager
} from '@/types/healthPlans';

// Almacenamiento temporal en memoria (stub)
let subscriptionsStore: HealthPlanSubscription[] = [];

/**
 * Servicio para gestión de Suscripciones de Pacientes
 * SRP: Solo maneja operaciones de suscripciones
 *
 * NOTA: Este servicio actualmente usa almacenamiento en memoria como stub.
 * Requiere implementación de API real en el backend.
 */
export class SubscriptionService implements ISubscriptionManager {

  /**
   * Suscribir un paciente a un plan
   */
  async subscribe(
    patientId: string,
    planId: string,
    termsId: string,
    createdBy: string,
    paymentMethod?: string
  ): Promise<HealthPlanSubscription> {
    console.warn('⚠️ SubscriptionService.subscribe: Usando almacenamiento en memoria (stub)');

    // Verificar que el paciente no tenga ya una suscripción activa
    const existingSubscription = await this.getPatientSubscription(patientId);
    if (existingSubscription && existingSubscription.status === 'active') {
      throw new Error('El paciente ya tiene una suscripción activa');
    }

    // Calcular fechas
    const startDate = new Date();
    const paymentDay = startDate.getDate();
    const nextPaymentDate = paymentScheduleService.calculateNextPaymentDate(paymentDay, startDate);
    const renewalDate = this.calculateRenewalDate(startDate, BillingCycle.MONTHLY);

    // Crear suscripción
    const subscription: HealthPlanSubscription = {
      id: `SUB-${Date.now()}`,
      planId,
      patientId,
      status: SubscriptionStatus.PENDING_PAYMENT,
      statusReason: 'Esperando voucher de pago inicial',
      startDate,
      renewalDate,
      paymentDay,
      nextPaymentDate,
      acceptedTermsId: termsId,
      acceptedTermsVersion: '1.0.0',
      acceptedAt: new Date(),
      paymentMethod,
      totalPaid: 0,
      benefitsUsed: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy
    };

    subscriptionsStore.push(subscription);
    return subscription;
  }

  /**
   * Cancelar una suscripción
   */
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
    const index = subscriptionsStore.findIndex(s => s.id === subscriptionId);
    if (index === -1) {
      throw new Error(`Suscripción con ID ${subscriptionId} no encontrada`);
    }

    subscriptionsStore[index] = {
      ...subscriptionsStore[index],
      status: SubscriptionStatus.CANCELLED,
      statusReason: reason || 'Cancelado por el usuario',
      cancelledAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Renovar una suscripción
   */
  async renewSubscription(subscriptionId: string): Promise<void> {
    const index = subscriptionsStore.findIndex(s => s.id === subscriptionId);
    if (index === -1) {
      throw new Error(`Suscripción con ID ${subscriptionId} no encontrada`);
    }

    const newRenewalDate = this.calculateRenewalDate(new Date(), BillingCycle.MONTHLY);

    subscriptionsStore[index] = {
      ...subscriptionsStore[index],
      status: SubscriptionStatus.ACTIVE,
      statusReason: 'Renovado exitosamente',
      renewalDate: newRenewalDate,
      updatedAt: new Date()
    };
  }

  /**
   * Suspender una suscripción
   */
  async suspendSubscription(subscriptionId: string, reason: string): Promise<void> {
    const index = subscriptionsStore.findIndex(s => s.id === subscriptionId);
    if (index === -1) {
      throw new Error(`Suscripción con ID ${subscriptionId} no encontrada`);
    }

    subscriptionsStore[index] = {
      ...subscriptionsStore[index],
      status: SubscriptionStatus.SUSPENDED,
      statusReason: reason,
      updatedAt: new Date()
    };
  }

  /**
   * Activar una suscripción (después de pago exitoso)
   */
  async activateSubscription(subscriptionId: string): Promise<void> {
    const index = subscriptionsStore.findIndex(s => s.id === subscriptionId);
    if (index === -1) {
      throw new Error(`Suscripción con ID ${subscriptionId} no encontrada`);
    }

    subscriptionsStore[index] = {
      ...subscriptionsStore[index],
      status: SubscriptionStatus.ACTIVE,
      statusReason: 'Activo',
      updatedAt: new Date()
    };
  }

  /**
   * Obtener suscripción activa de un paciente
   */
  async getPatientSubscription(patientId: string): Promise<HealthPlanSubscription | null> {
    const patientSubscriptions = subscriptionsStore
      .filter(s => s.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return patientSubscriptions[0] || null;
  }

  /**
   * Obtener todas las suscripciones de un paciente (historial)
   */
  async getPatientSubscriptionHistory(patientId: string): Promise<HealthPlanSubscription[]> {
    return subscriptionsStore.filter(s => s.patientId === patientId);
  }

  /**
   * Obtener suscripciones de un plan específico
   */
  async getSubscriptionsByPlan(planId: string): Promise<HealthPlanSubscription[]> {
    return subscriptionsStore.filter(s => s.planId === planId);
  }

  /**
   * Obtener suscripciones activas de un plan
   */
  async getActiveSubscriptionsByPlan(planId: string): Promise<HealthPlanSubscription[]> {
    return subscriptionsStore.filter(
      s => s.planId === planId && s.status === SubscriptionStatus.ACTIVE
    );
  }

  /**
   * Registrar uso de un beneficio
   */
  async recordBenefitUsage(
    subscriptionId: string,
    benefitId: string,
    serviceId?: string,
    amount?: number
  ): Promise<void> {
    const index = subscriptionsStore.findIndex(s => s.id === subscriptionId);
    if (index === -1) {
      throw new Error(`Suscripción con ID ${subscriptionId} no encontrada`);
    }

    const subscription = subscriptionsStore[index];
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new Error('Solo se pueden usar beneficios en suscripciones activas');
    }

    subscriptionsStore[index] = {
      ...subscription,
      benefitsUsed: [
        ...subscription.benefitsUsed,
        { benefitId, usedAt: new Date(), serviceId, amount }
      ],
      updatedAt: new Date()
    };
  }

  /**
   * Procesar aprobación de voucher (activar suscripción y actualizar fechas)
   */
  async processVoucherApproval(
    subscriptionId: string,
    amount: number,
    paymentDate: Date
  ): Promise<void> {
    const index = subscriptionsStore.findIndex(s => s.id === subscriptionId);
    if (index === -1) {
      throw new Error(`Suscripción con ID ${subscriptionId} no encontrada`);
    }

    const subscription = subscriptionsStore[index];
    const totalPaid = subscription.totalPaid + amount;
    const nextPaymentDate = paymentScheduleService.calculateNextPaymentDate(
      subscription.paymentDay,
      paymentDate
    );

    subscriptionsStore[index] = {
      ...subscription,
      status: SubscriptionStatus.ACTIVE,
      statusReason: 'Activo - Pago verificado',
      totalPaid,
      lastPaymentDate: paymentDate,
      nextPaymentDate,
      updatedAt: new Date()
    };
  }

  /**
   * Registrar un pago
   */
  async recordPayment(
    subscriptionId: string,
    amount: number,
    paymentDate: Date
  ): Promise<void> {
    const index = subscriptionsStore.findIndex(s => s.id === subscriptionId);
    if (index === -1) {
      throw new Error(`Suscripción con ID ${subscriptionId} no encontrada`);
    }

    const subscription = subscriptionsStore[index];
    const totalPaid = subscription.totalPaid + amount;
    const nextPaymentDate = paymentScheduleService.calculateNextPaymentDate(
      subscription.paymentDay,
      paymentDate
    );

    subscriptionsStore[index] = {
      ...subscription,
      totalPaid,
      lastPaymentDate: paymentDate,
      nextPaymentDate,
      updatedAt: new Date()
    };

    // Si estaba pendiente o suspendido, activar
    if (subscription.status === SubscriptionStatus.PENDING_PAYMENT ||
        subscription.status === SubscriptionStatus.SUSPENDED) {
      await this.activateSubscription(subscriptionId);
    }
  }

  /**
   * Verificar suscripciones vencidas y actualizarlas
   */
  async checkAndUpdateExpiredSubscriptions(): Promise<void> {
    const now = new Date();

    subscriptionsStore = subscriptionsStore.map(subscription => {
      if (subscription.status === SubscriptionStatus.ACTIVE &&
          subscription.renewalDate && subscription.renewalDate < now) {
        return {
          ...subscription,
          status: SubscriptionStatus.EXPIRED,
          statusReason: 'Suscripción vencida',
          endDate: subscription.renewalDate,
          updatedAt: new Date()
        };
      }
      return subscription;
    });
  }

  /**
   * Obtener estadísticas de uso de beneficios
   */
  async getBenefitUsageStats(subscriptionId: string): Promise<{
    benefitId: string;
    timesUsed: number;
    totalAmount: number;
  }[]> {
    const subscription = subscriptionsStore.find(s => s.id === subscriptionId);
    if (!subscription) {
      throw new Error(`Suscripción con ID ${subscriptionId} no encontrada`);
    }

    const stats = new Map<string, { timesUsed: number; totalAmount: number }>();

    for (const usage of subscription.benefitsUsed) {
      const current = stats.get(usage.benefitId) || { timesUsed: 0, totalAmount: 0 };
      stats.set(usage.benefitId, {
        timesUsed: current.timesUsed + 1,
        totalAmount: current.totalAmount + (usage.amount || 0)
      });
    }

    return Array.from(stats.entries()).map(([benefitId, data]) => ({
      benefitId,
      ...data
    }));
  }

  /**
   * Calcular fecha de renovación según ciclo de facturación
   */
  private calculateRenewalDate(startDate: Date, cycle: BillingCycle): Date {
    const date = new Date(startDate);

    switch (cycle) {
      case BillingCycle.MONTHLY:
        date.setMonth(date.getMonth() + 1);
        break;
      case BillingCycle.QUARTERLY:
        date.setMonth(date.getMonth() + 3);
        break;
      case BillingCycle.BIANNUAL:
        date.setMonth(date.getMonth() + 6);
        break;
      case BillingCycle.ANNUAL:
        date.setFullYear(date.getFullYear() + 1);
        break;
    }

    return date;
  }
}

// Exportar instancia singleton
export const subscriptionService = new SubscriptionService();

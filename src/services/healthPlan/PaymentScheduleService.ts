// ============================================================================
// PAYMENT SCHEDULE SERVICE - Gestión de Calendario y Fechas de Pago
// ============================================================================
// TODO: Implementar integración con API real para suscripciones

import { healthPlanSettingsService } from './HealthPlanSettingsService';
import { voucherService } from './VoucherService';
import {
  SubscriptionStatus
} from '@/types/healthPlans';
import type { HealthPlanSubscription } from '@/types/healthPlans';

/**
 * Servicio para gestión de fechas y calendario de pagos
 * SRP: Solo maneja lógica de fechas, cortes y verificaciones de pago
 */
export class PaymentScheduleService {

  /**
   * Calcular la próxima fecha de pago basada en el día de pago del paciente
   */
  calculateNextPaymentDate(paymentDay: number, fromDate: Date = new Date()): Date {
    const next = new Date(fromDate);

    // Ajustar al día de pago del mes actual
    next.setDate(paymentDay);

    // Si ya pasó en este mes, ir al siguiente mes
    if (next <= fromDate) {
      next.setMonth(next.getMonth() + 1);
    }

    // Manejar meses que no tienen ese día (ej: 31 en febrero)
    // Si el mes no tiene ese día, usar el último día del mes
    const lastDayOfMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    if (paymentDay > lastDayOfMonth) {
      next.setDate(lastDayOfMonth);
    }

    return next;
  }

  /**
   * Verificar si hoy es día de corte para una suscripción
   */
  isPaymentDue(subscription: HealthPlanSubscription): boolean {
    if (!subscription.nextPaymentDate) return false;

    const today = new Date();
    const paymentDate = new Date(subscription.nextPaymentDate);

    // Normalizar fechas a medianoche para comparar solo día
    today.setHours(0, 0, 0, 0);
    paymentDate.setHours(0, 0, 0, 0);

    return today >= paymentDate;
  }

  /**
   * Verificar si una suscripción está dentro del período de gracia
   */
  async isInGracePeriod(subscription: HealthPlanSubscription): Promise<boolean> {
    if (!subscription.nextPaymentDate) return false;

    const settings = await healthPlanSettingsService.getSettings();
    const today = new Date();
    const paymentDate = new Date(subscription.nextPaymentDate);

    // Calcular fecha límite (día de pago + días de gracia)
    const graceEndDate = new Date(paymentDate);
    graceEndDate.setDate(graceEndDate.getDate() + settings.graceDays);

    // Está en período de gracia si:
    // - Ya pasó el día de pago
    // - Pero aún no pasó el último día de gracia
    return today >= paymentDate && today <= graceEndDate;
  }

  /**
   * Verificar si se debe suspender una suscripción por falta de pago
   */
  async shouldSuspend(subscription: HealthPlanSubscription): Promise<boolean> {
    if (!subscription.nextPaymentDate) return false;

    // Si ya está suspendida o cancelada, no hacer nada
    if ([SubscriptionStatus.SUSPENDED, SubscriptionStatus.CANCELLED].includes(subscription.status)) {
      return false;
    }

    const settings = await healthPlanSettingsService.getSettings();
    const today = new Date();
    const paymentDate = new Date(subscription.nextPaymentDate);

    // Calcular fecha límite (día de pago + días de gracia)
    const graceEndDate = new Date(paymentDate);
    graceEndDate.setDate(graceEndDate.getDate() + settings.graceDays);

    // Verificar si hay voucher pendiente
    const hasPendingVoucher = await voucherService.hasPendingVoucher(subscription.id);

    // NO suspender si hay voucher pendiente (dar tiempo al admin para aprobar)
    if (hasPendingVoucher) {
      return false;
    }

    // Suspender si ya pasó el período de gracia y no hay voucher pendiente
    const shouldSuspend = today > graceEndDate;

    if (shouldSuspend) {
    }

    return shouldSuspend;
  }

  /**
   * Calcular días restantes hasta el próximo pago
   */
  daysUntilNextPayment(subscription: HealthPlanSubscription): number {
    if (!subscription.nextPaymentDate) return -1;

    const today = new Date();
    const paymentDate = new Date(subscription.nextPaymentDate);

    today.setHours(0, 0, 0, 0);
    paymentDate.setHours(0, 0, 0, 0);

    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Verificar si se debe enviar recordatorio de pago
   */
  async shouldSendReminder(subscription: HealthPlanSubscription): Promise<{
    shouldSend: boolean;
    daysUntilPayment: number;
  }> {
    const daysUntil = this.daysUntilNextPayment(subscription);

    if (daysUntil < 0) {
      return { shouldSend: false, daysUntilPayment: daysUntil };
    }

    const settings = await healthPlanSettingsService.getSettings();

    // Enviar recordatorio si estamos en uno de los días configurados
    const shouldSend = settings.reminderDaysBefore.includes(daysUntil);

    return { shouldSend, daysUntilPayment: daysUntil };
  }

  /**
   * Obtener el estado actual de pago de una suscripción
   */
  async getPaymentStatus(subscription: HealthPlanSubscription): Promise<{
    status: 'current' | 'due' | 'grace_period' | 'overdue';
    daysUntilPayment: number;
    daysOverdue?: number;
    hasPendingVoucher: boolean;
  }> {
    const daysUntil = this.daysUntilNextPayment(subscription);
    const hasPendingVoucher = await voucherService.hasPendingVoucher(subscription.id);

    // Pago al día (futuro)
    if (daysUntil > 0) {
      return {
        status: 'current',
        daysUntilPayment: daysUntil,
        hasPendingVoucher
      };
    }

    // Día de pago (hoy)
    if (daysUntil === 0) {
      return {
        status: 'due',
        daysUntilPayment: 0,
        hasPendingVoucher
      };
    }

    // Pasó el día de pago
    const isInGrace = await this.isInGracePeriod(subscription);
    const daysOverdue = Math.abs(daysUntil);

    if (isInGrace) {
      return {
        status: 'grace_period',
        daysUntilPayment: daysUntil,
        daysOverdue,
        hasPendingVoucher
      };
    }

    return {
      status: 'overdue',
      daysUntilPayment: daysUntil,
      daysOverdue,
      hasPendingVoucher
    };
  }

  /**
   * Procesar cortes automáticos de suscripciones
   * (Esta función debe ejecutarse diariamente)
   *
   * TODO: Implementar integración con API real para suscripciones
   */
  async processPaymentCutoffs(): Promise<{
    processed: number;
    suspended: number;
    reminded: number;
  }> {
    // Stub: Sin acceso a base de datos, retornamos valores vacíos
    // TODO: Implementar integración con API real
    return { processed: 0, suspended: 0, reminded: 0 };
  }

  /**
   * Formatear período de pago para mostrar
   */
  formatPaymentPeriod(date: Date): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${month} ${year}`;
  }
}

// Exportar instancia singleton
export const paymentScheduleService = new PaymentScheduleService();

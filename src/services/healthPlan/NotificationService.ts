// ============================================================================
// NOTIFICATION SERVICE - Gestión de Notificaciones para Planes de Salud
// ============================================================================
// TODO: Implementar API real para notificaciones

import type { Notification } from '@/types';

// Almacenamiento temporal en memoria (stub)
let notificationsStore: Notification[] = [];

/**
 * Servicio para envío de notificaciones (in-app y email)
 * SRP: Solo maneja el envío de notificaciones relacionadas con planes de salud
 *
 * NOTA: Este servicio actualmente usa almacenamiento en memoria como stub.
 * Requiere implementación de API real en el backend.
 */
export class NotificationService {

  /**
   * Enviar notificación in-app a un usuario
   */
  async sendInAppNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'warning' | 'success' | 'error' = 'info',
    priority: 'low' | 'medium' | 'high' = 'medium',
    relatedId?: string
  ): Promise<void> {
    const notification: Notification = {
      id: `NOTIF-${Date.now()}`,
      userId,
      title,
      message,
      type,
      status: 'unread',
      priority,
      relatedId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    notificationsStore.push(notification);
  }

  /**
   * Enviar email (simulado por ahora - solo logs)
   */
  async sendEmail(
    to: string,
    subject: string,
    body: string
  ): Promise<void> {
  }

  /**
   * Notificar voucher aprobado
   */
  async notifyVoucherApproved(
    patientId: string,
    patientEmail: string,
    planName: string,
    amount: number,
    nextPaymentDate: Date
  ): Promise<void> {
    const title = 'Pago Aprobado';
    const message = `Tu pago de S/ ${amount.toFixed(2)} para el plan "${planName}" ha sido aprobado. Tu plan está activo. Próximo pago: ${nextPaymentDate.toLocaleDateString()}.`;

    // Notificación in-app
    await this.sendInAppNotification(patientId, title, message, 'success', 'high');

    // Email
    const emailBody = `
Hola,

¡Buenas noticias! Tu pago ha sido aprobado exitosamente.

Detalles:
- Plan: ${planName}
- Monto: S/ ${amount.toFixed(2)}
- Estado: ACTIVO
- Próximo pago: ${nextPaymentDate.toLocaleDateString()}

Ahora puedes disfrutar de todos los beneficios de tu plan.

Gracias por confiar en nosotros.

Equipo de Planes de Salud
    `.trim();

    await this.sendEmail(patientEmail, title, emailBody);
  }

  /**
   * Notificar voucher rechazado
   */
  async notifyVoucherRejected(
    patientId: string,
    patientEmail: string,
    planName: string,
    reason: string
  ): Promise<void> {
    const title = 'Pago Rechazado';
    const message = `Tu voucher de pago para el plan "${planName}" ha sido rechazado. Motivo: ${reason}. Por favor sube un nuevo voucher.`;

    // Notificación in-app
    await this.sendInAppNotification(patientId, title, message, 'error', 'high');

    // Email
    const emailBody = `
Hola,

Lamentamos informarte que tu voucher de pago no ha sido aprobado.

Detalles:
- Plan: ${planName}
- Motivo del rechazo: ${reason}

Por favor, verifica tu comprobante y sube un nuevo voucher con la información correcta.

Si tienes dudas, contáctanos.

Equipo de Planes de Salud
    `.trim();

    await this.sendEmail(patientEmail, title, emailBody);
  }

  /**
   * Notificar recordatorio de pago
   */
  async notifyPaymentReminder(
    patientId: string,
    patientEmail: string,
    planName: string,
    amount: number,
    daysUntilPayment: number,
    paymentDate: Date
  ): Promise<void> {
    const title = `Recordatorio de Pago - ${daysUntilPayment} días`;
    const message = `Tu próximo pago de S/ ${amount.toFixed(2)} para el plan "${planName}" vence en ${daysUntilPayment} días (${paymentDate.toLocaleDateString()}). Recuerda subir tu voucher.`;

    // Notificación in-app
    await this.sendInAppNotification(patientId, title, message, 'warning', 'medium');

    // Email
    const emailBody = `
Hola,

Este es un recordatorio amistoso sobre tu próximo pago.

Detalles:
- Plan: ${planName}
- Monto: S/ ${amount.toFixed(2)}
- Fecha de vencimiento: ${paymentDate.toLocaleDateString()}
- Días restantes: ${daysUntilPayment}

Por favor, realiza tu pago y sube el voucher antes de la fecha de vencimiento para evitar la suspensión del servicio.

Gracias.

Equipo de Planes de Salud
    `.trim();

    await this.sendEmail(patientEmail, title, emailBody);
  }

  /**
   * Notificar suspensión de plan
   */
  async notifySuspension(
    patientId: string,
    patientEmail: string,
    planName: string
  ): Promise<void> {
    const title = 'Plan Suspendido';
    const message = `Tu plan "${planName}" ha sido suspendido por falta de pago. Sube tu voucher para reactivarlo.`;

    // Notificación in-app
    await this.sendInAppNotification(patientId, title, message, 'error', 'high');

    // Email
    const emailBody = `
Hola,

Lamentamos informarte que tu plan ha sido suspendido.

Detalles:
- Plan: ${planName}
- Motivo: Falta de pago

Para reactivar tu plan, realiza el pago correspondiente y sube tu voucher.

Si ya realizaste el pago, por favor contacta con nosotros.

Equipo de Planes de Salud
    `.trim();

    await this.sendEmail(patientEmail, title, emailBody);
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId: string): Promise<void> {
    const index = notificationsStore.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      notificationsStore[index] = {
        ...notificationsStore[index],
        status: 'read',
        updatedAt: new Date()
      };
    }
  }

  /**
   * Obtener notificaciones de un usuario
   */
  async getUserNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    return notificationsStore
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Obtener contador de notificaciones no leídas
   */
  async getUnreadCount(userId: string): Promise<number> {
    return notificationsStore.filter(
      n => n.userId === userId && n.status === 'unread'
    ).length;
  }
}

// Exportar instancia singleton
export const notificationService = new NotificationService();

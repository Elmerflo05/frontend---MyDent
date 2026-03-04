// ============================================================================
// PAYMENT CRON JOB - Job Automático de Procesamiento de Cortes de Pago
// ============================================================================

import { paymentScheduleService } from './PaymentScheduleService';

/**
 * Servicio para ejecutar tareas automáticas de procesamiento de pagos
 */
export class PaymentCronJob {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  /**
   * Iniciar el job automático (ejecutar cada día a medianoche)
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    // Ejecutar inmediatamente al iniciar
    this.runJob();

    // Calcular tiempo hasta la próxima medianoche
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - now.getTime();

    // Programar primera ejecución a medianoche
    setTimeout(() => {
      this.runJob();

      // Luego ejecutar cada 24 horas
      this.intervalId = setInterval(() => {
        this.runJob();
      }, 24 * 60 * 60 * 1000); // 24 horas

    }, timeUntilMidnight);

    this.isRunning = true;
  }

  /**
   * Detener el job automático
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * Ejecutar el procesamiento de cortes manualmente
   */
  async runJob(): Promise<{
    processed: number;
    suspended: number;
    reminded: number;
  }> {
    try {
      const result = await paymentScheduleService.processPaymentCutoffs();
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verificar si el job está en ejecución
   */
  isJobRunning(): boolean {
    return this.isRunning;
  }
}

// Exportar instancia singleton
export const paymentCronJob = new PaymentCronJob();

// Auto-iniciar el job cuando se importa (opcional)
// Descomentar la siguiente línea para que se ejecute automáticamente al cargar la app
// paymentCronJob.start();

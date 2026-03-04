/**
 * PAYMENT SERVICE
 *
 * Servicio para gestión de pagos a cuenta (prótesis e implantes)
 * SRP: Maneja toda la lógica de negocio relacionada con pagos
 *
 * IMPORTANTE: Este servicio NO importa stores de Zustand ni componentes React.
 * Solo contiene lógica pura que puede ser testeada independientemente.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface AccountPayment {
  fecha: string;
  monto: number;
  metodoPago: string;
  nota?: string;
}

export interface PaymentSummary {
  totalPagado: number;
  porcentajePagado: number;
  saldoRestante: number;
}

// ============================================================================
// PAYMENT SERVICE
// ============================================================================

export class PaymentService {
  /**
   * Calcula el total pagado
   *
   * @param payments - Array de pagos
   * @returns Total pagado
   */
  static calculateTotalPaid(payments: AccountPayment[]): number {
    return payments.reduce((sum, payment) => sum + payment.monto, 0);
  }

  /**
   * Calcula el porcentaje pagado
   *
   * @param totalPaid - Total pagado
   * @param totalAmount - Monto total
   * @returns Porcentaje pagado (0-100)
   */
  static calculatePaidPercentage(totalPaid: number, totalAmount: number): number {
    if (totalAmount <= 0) return 0;
    return (totalPaid / totalAmount) * 100;
  }

  /**
   * Calcula el saldo restante
   *
   * @param totalAmount - Monto total
   * @param totalPaid - Total pagado
   * @returns Saldo restante
   */
  static calculateRemainingBalance(totalAmount: number, totalPaid: number): number {
    return Math.max(0, totalAmount - totalPaid);
  }

  /**
   * Calcula un resumen completo de pagos
   *
   * @param payments - Array de pagos
   * @param totalAmount - Monto total
   * @returns Resumen de pagos
   */
  static getPaymentSummary(
    payments: AccountPayment[],
    totalAmount: number
  ): PaymentSummary {
    const totalPagado = this.calculateTotalPaid(payments);
    const porcentajePagado = this.calculatePaidPercentage(totalPagado, totalAmount);
    const saldoRestante = this.calculateRemainingBalance(totalAmount, totalPagado);

    return {
      totalPagado,
      porcentajePagado,
      saldoRestante
    };
  }

  /**
   * Valida un pago antes de agregarlo
   *
   * @param monto - Monto del pago
   * @returns true si es válido, false si no
   */
  static validatePayment(monto: number): boolean {
    return monto > 0;
  }

  /**
   * Agrega un pago a la lista
   *
   * @param payments - Array de pagos actual
   * @param newPayment - Nuevo pago a agregar
   * @returns Array actualizado
   */
  static addPayment(
    payments: AccountPayment[],
    newPayment: AccountPayment
  ): AccountPayment[] {
    return [...payments, newPayment];
  }

  /**
   * Elimina un pago de la lista
   *
   * @param payments - Array de pagos
   * @param index - Índice del pago a eliminar
   * @returns Array actualizado
   */
  static removePayment(
    payments: AccountPayment[],
    index: number
  ): AccountPayment[] {
    return payments.filter((_, i) => i !== index);
  }
}

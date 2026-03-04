/**
 * useAccountPayments Hook
 *
 * Maneja el estado y lógica de pagos a cuenta (prótesis o implantes)
 */

import { useState } from 'react';
import { PaymentService } from '@/services/treatment';
import type { AccountPayment, PaymentSummary } from '@/services/treatment';

interface UseAccountPaymentsProps {
  type: 'prosthesis' | 'implants';
  currentRecord: any;
  setCurrentRecord: (record: any) => void;
  setUnsavedChanges: (val: boolean) => void;
}

interface UseAccountPaymentsReturn {
  // Estado
  payments: AccountPayment[];
  totalAmount: number;
  summary: PaymentSummary;

  // Actions
  setTotalAmount: (amount: number) => void;
  addPayment: (payment: AccountPayment) => void;
  removePayment: (index: number) => void;
}

/**
 * Hook para manejar pagos a cuenta
 */
export const useAccountPayments = ({
  type,
  currentRecord,
  setCurrentRecord,
  setUnsavedChanges
}: UseAccountPaymentsProps): UseAccountPaymentsReturn => {
  // Determinar las keys según el tipo
  const paymentsKey = type === 'prosthesis' ? 'prosthesisPayments' : 'implantsPayments';
  const totalAmountKey = type === 'prosthesis' ? 'prosthesisTotalAmount' : 'implantsTotalAmount';

  const [payments, setPayments] = useState<AccountPayment[]>(currentRecord[paymentsKey] || []);
  const [totalAmount, setTotalAmountState] = useState<number>(currentRecord[totalAmountKey] || 0);

  /**
   * Actualiza el monto total
   */
  const setTotalAmount = (amount: number) => {
    setTotalAmountState(amount);
    setCurrentRecord({
      ...currentRecord,
      [totalAmountKey]: amount
    });
    setUnsavedChanges(true);
  };

  /**
   * Agrega un pago
   */
  const addPayment = (payment: AccountPayment) => {
    const newPayments = PaymentService.addPayment(payments, payment);
    setPayments(newPayments);
    setCurrentRecord({
      ...currentRecord,
      [paymentsKey]: newPayments
    });
    setUnsavedChanges(true);
  };

  /**
   * Elimina un pago
   */
  const removePayment = (index: number) => {
    const newPayments = PaymentService.removePayment(payments, index);
    setPayments(newPayments);
    setCurrentRecord({
      ...currentRecord,
      [paymentsKey]: newPayments
    });
    setUnsavedChanges(true);
  };

  // Calcular resumen usando el servicio
  const summary = PaymentService.getPaymentSummary(payments, totalAmount);

  return {
    payments,
    totalAmount,
    summary,
    setTotalAmount,
    addPayment,
    removePayment
  };
};

/**
 * usePaymentModal Hook
 *
 * Maneja el estado del modal de pagos a cuenta
 */

import { useState } from 'react';
import { PaymentService } from '@/services/treatment';
import { formatDateToYMD } from '@/utils/dateUtils';
import type { AccountPayment } from '@/services/treatment';

interface PaymentFormData {
  monto: string;
  fecha: string;
  metodoPago: string;
  nota: string;
}

interface UsePaymentModalReturn {
  // Estado
  showModal: boolean;
  paymentType: 'prosthesis' | 'implants';
  form: PaymentFormData;

  // Actions
  openModal: (type: 'prosthesis' | 'implants') => void;
  closeModal: () => void;
  updateForm: (field: keyof PaymentFormData, value: string) => void;
  submitPayment: (onSubmit: (payment: AccountPayment) => void) => boolean;
}

/**
 * Hook para manejar el modal de pagos
 */
export const usePaymentModal = (): UsePaymentModalReturn => {
  const [showModal, setShowModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'prosthesis' | 'implants'>('prosthesis');
  const [form, setForm] = useState<PaymentFormData>({
    monto: '',
    fecha: formatDateToYMD(new Date()),
    metodoPago: 'Efectivo',
    nota: ''
  });

  /**
   * Abre el modal
   */
  const openModal = (type: 'prosthesis' | 'implants') => {
    setPaymentType(type);
    setForm({
      monto: '',
      fecha: formatDateToYMD(new Date()),
      metodoPago: 'Efectivo',
      nota: ''
    });
    setShowModal(true);
  };

  /**
   * Cierra el modal
   */
  const closeModal = () => {
    setShowModal(false);
    setForm({
      monto: '',
      fecha: formatDateToYMD(new Date()),
      metodoPago: 'Efectivo',
      nota: ''
    });
  };

  /**
   * Actualiza un campo del formulario
   */
  const updateForm = (field: keyof PaymentFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Valida y envía el pago
   */
  const submitPayment = (onSubmit: (payment: AccountPayment) => void): boolean => {
    const monto = parseFloat(form.monto);

    if (!PaymentService.validatePayment(monto)) {
      return false;
    }

    const payment: AccountPayment = {
      fecha: form.fecha,
      monto: monto,
      metodoPago: form.metodoPago,
      nota: form.nota
    };

    onSubmit(payment);
    closeModal();
    return true;
  };

  return {
    showModal,
    paymentType,
    form,
    openModal,
    closeModal,
    updateForm,
    submitPayment
  };
};

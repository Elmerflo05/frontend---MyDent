import { useState } from 'react';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import { formatDateToYMD } from '@/utils/dateUtils';

/**
 * Hook para manejar los planes de pago (Ortodoncia, Prótesis, Implantes)
 */

interface PaymentRecord {
  fecha: string;
  monto: number;
  metodoPago: string;
  nota?: string;
}

interface PaymentFormState {
  monto: string;
  fecha: string;
  metodoPago: string;
  nota: string;
}

interface UsePaymentPlansProps {
  currentRecord: any;
  setCurrentRecord: (record: any) => void;
  setUnsavedChanges: (val: boolean) => void;
}

export const usePaymentPlans = ({
  currentRecord,
  setCurrentRecord,
  setUnsavedChanges
}: UsePaymentPlansProps) => {
  const { paymentPlansConfig } = useOdontogramConfigStore();

  // ===== ORTODONCIA =====
  const [orthodonticsConfig, setOrthodonticsConfig] = useState({
    pagoInicial: currentRecord.orthodonticsPayment?.pagoInicial || paymentPlansConfig.ortodoncia.pagoInicial.porcentaje,
    maximoMeses: currentRecord.orthodonticsPayment?.maximoMeses || paymentPlansConfig.ortodoncia.pagoMensual.maximoMeses,
    interesMensual: currentRecord.orthodonticsPayment?.interesMensual || paymentPlansConfig.ortodoncia.pagoMensual.interesMensual,
    numeroCuotas: currentRecord.orthodonticsPayment?.numeroCuotas || paymentPlansConfig.ortodoncia.pagoFraccionado.numeroCuotas,
    descuento: currentRecord.orthodonticsPayment?.descuento || paymentPlansConfig.ortodoncia.pagoFraccionado.descuento
  });

  const updateOrthodonticsConfig = (field: string, value: number) => {
    const newConfig = { ...orthodonticsConfig, [field]: value };
    setOrthodonticsConfig(newConfig);
    setCurrentRecord({
      ...currentRecord,
      orthodonticsPayment: newConfig
    });
    setUnsavedChanges(true);
  };

  // ===== PRÓTESIS =====
  const [prosthesisPayments, setProsthesisPayments] = useState<PaymentRecord[]>(
    currentRecord.prosthesisPayments || []
  );
  const [prosthesisTotalAmount, setProsthesisTotalAmount] = useState<number>(
    currentRecord.prosthesisTotalAmount || 0
  );

  const addProsthesisPayment = (payment: PaymentRecord) => {
    const newPayments = [...prosthesisPayments, payment];
    setProsthesisPayments(newPayments);
    setCurrentRecord({
      ...currentRecord,
      prosthesisPayments: newPayments
    });
    setUnsavedChanges(true);
  };

  const updateProsthesisTotalAmount = (amount: number) => {
    setProsthesisTotalAmount(amount);
    setCurrentRecord({
      ...currentRecord,
      prosthesisTotalAmount: amount
    });
    setUnsavedChanges(true);
  };

  const prosthesisPaidAmount = prosthesisPayments.reduce((sum, payment) => sum + payment.monto, 0);
  const prosthesisPaidPercentage = prosthesisTotalAmount > 0 ? (prosthesisPaidAmount / prosthesisTotalAmount) * 100 : 0;

  // ===== IMPLANTES =====
  const [implantsPayments, setImplantsPayments] = useState<PaymentRecord[]>(
    currentRecord.implantsPayments || []
  );
  const [implantsTotalAmount, setImplantsTotalAmount] = useState<number>(
    currentRecord.implantsTotalAmount || 0
  );

  const addImplantsPayment = (payment: PaymentRecord) => {
    const newPayments = [...implantsPayments, payment];
    setImplantsPayments(newPayments);
    setCurrentRecord({
      ...currentRecord,
      implantsPayments: newPayments
    });
    setUnsavedChanges(true);
  };

  const updateImplantsTotalAmount = (amount: number) => {
    setImplantsTotalAmount(amount);
    setCurrentRecord({
      ...currentRecord,
      implantsTotalAmount: amount
    });
    setUnsavedChanges(true);
  };

  const implantsPaidAmount = implantsPayments.reduce((sum, payment) => sum + payment.monto, 0);
  const implantsPaidPercentage = implantsTotalAmount > 0 ? (implantsPaidAmount / implantsTotalAmount) * 100 : 0;

  // ===== MODAL DE PAGO =====
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'prosthesis' | 'implants'>('prosthesis');
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    monto: '',
    fecha: formatDateToYMD(new Date()),
    metodoPago: 'Efectivo',
    nota: ''
  });

  const openPaymentModal = (type: 'prosthesis' | 'implants') => {
    setPaymentType(type);
    setPaymentForm({
      monto: '',
      fecha: formatDateToYMD(new Date()),
      metodoPago: 'Efectivo',
      nota: ''
    });
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentForm({
      monto: '',
      fecha: formatDateToYMD(new Date()),
      metodoPago: 'Efectivo',
      nota: ''
    });
  };

  const handleSubmitPayment = () => {
    const monto = parseFloat(paymentForm.monto);
    if (!monto || monto <= 0) {
      alert('Por favor ingrese un monto válido');
      return;
    }

    const payment: PaymentRecord = {
      fecha: paymentForm.fecha,
      monto: monto,
      metodoPago: paymentForm.metodoPago,
      nota: paymentForm.nota
    };

    if (paymentType === 'prosthesis') {
      addProsthesisPayment(payment);
    } else {
      addImplantsPayment(payment);
    }

    closePaymentModal();
  };

  return {
    // Ortodoncia
    orthodonticsConfig,
    updateOrthodonticsConfig,
    paymentPlansConfig,

    // Prótesis
    prosthesisPayments,
    prosthesisTotalAmount,
    updateProsthesisTotalAmount,
    prosthesisPaidAmount,
    prosthesisPaidPercentage,

    // Implantes
    implantsPayments,
    implantsTotalAmount,
    updateImplantsTotalAmount,
    implantsPaidAmount,
    implantsPaidPercentage,

    // Modal
    showPaymentModal,
    paymentType,
    paymentForm,
    setPaymentForm,
    openPaymentModal,
    closePaymentModal,
    handleSubmitPayment
  };
};

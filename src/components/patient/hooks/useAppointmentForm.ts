import { useState, Dispatch, SetStateAction } from 'react';
import { useAppointmentDuration } from '@/hooks/useAppointmentDuration';
import { parseLocalDate } from '@/utils/dateUtils';

/**
 * Hook para manejar el estado del formulario de solicitud de citas
 */

export interface ValidatedCoupon {
  purchase_id: number;
  purchase_code: string;
  promotion_name: string;
  discount_type: string;
  discount_value: number;
  patient_name: string;
  patient_id: number;
}

export interface AppointmentFormData {
  date: Date;
  time: string;
  duration: number;
  sedeId: string;
  specialtyId: string;
  doctorId: string;
  notes: string;
  urgency: 'low' | 'normal' | 'high';
  preferredContact: 'phone' | 'email';
  paymentMethod: string;
  paymentVoucher: File | null;
  selectedPromotionId: string;
  // Campos para cupón de promoción comprada
  couponCode: string;
  validatedCoupon: ValidatedCoupon | null;
}

interface UseAppointmentFormProps {
  selectedDate?: Date;
  defaultDuration: number;
}

interface UseAppointmentFormReturn {
  formData: AppointmentFormData;
  setFormData: Dispatch<SetStateAction<AppointmentFormData>>;
  errors: Record<string, string>;
  setErrors: Dispatch<SetStateAction<Record<string, string>>>;
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleVoucherUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validateStep1: () => boolean;
  validateStep2: (requierePago: boolean) => boolean;
  handleNextStep: (requierePago: boolean, onSubmit: () => void) => void;
  handlePrevStep: () => void;
  resetForm: () => void;
}

export const useAppointmentForm = ({
  selectedDate,
  defaultDuration
}: UseAppointmentFormProps): UseAppointmentFormReturn => {
  const initialFormData: AppointmentFormData = {
    date: selectedDate || new Date(),
    time: '',
    duration: defaultDuration,
    sedeId: '',
    specialtyId: '',
    doctorId: '',
    notes: '',
    urgency: 'normal',
    preferredContact: 'phone',
    paymentMethod: '',
    paymentVoucher: null,
    selectedPromotionId: '',
    couponCode: '',
    validatedCoupon: null
  };

  const [formData, setFormData] = useState<AppointmentFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  // Manejar cambios en inputs generales
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Manejar cambio de fecha
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Usar parseLocalDate para evitar desfase de zona horaria
    // El input HTML type="date" devuelve formato "YYYY-MM-DD"
    const date = parseLocalDate(e.target.value);
    setFormData(prev => ({
      ...prev,
      date,
      time: '' // Reset time when date changes
    }));
  };

  // Manejar upload de voucher
  const handleVoucherUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, paymentVoucher: 'Solo se permiten archivos JPG, PNG o PDF' }));
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, paymentVoucher: 'El archivo no puede ser mayor a 5MB' }));
        return;
      }

      setFormData(prev => ({ ...prev, paymentVoucher: file }));
      if (errors.paymentVoucher) {
        setErrors(prev => ({ ...prev, paymentVoucher: '' }));
      }
    }
  };

  // Validar paso 1
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'La fecha es requerida';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (formData.date < today) {
        newErrors.date = 'No puedes seleccionar una fecha pasada';
      }
    }

    if (!formData.time) {
      newErrors.time = 'Debes seleccionar una hora';
    }

    if (!formData.sedeId) {
      newErrors.sedeId = 'Debes seleccionar una sede';
    }

    if (!formData.specialtyId) {
      newErrors.specialtyId = 'Debes seleccionar una especialidad';
    }

    if (!formData.doctorId) {
      newErrors.doctorId = 'Debes seleccionar un doctor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validar paso 2
  const validateStep2 = (requierePago: boolean): boolean => {
    const newErrors: Record<string, string> = {};

    // Solo validar pago si es cliente nuevo CON plan de salud
    if (requierePago) {
      if (!formData.paymentMethod) {
        newErrors.paymentMethod = 'Debes seleccionar un método de pago';
      }

      if (!formData.paymentVoucher) {
        newErrors.paymentVoucher = 'Debes subir el voucher de pago';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar siguiente paso
  const handleNextStep = (requierePago: boolean, onSubmit: () => void) => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2(requierePago)) {
      onSubmit();
    }
  };

  // Manejar paso anterior
  const handlePrevStep = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData(initialFormData);
    setErrors({});
    setStep(1);
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    step,
    setStep,
    handleInputChange,
    handleDateChange,
    handleVoucherUpload,
    validateStep1,
    validateStep2,
    handleNextStep,
    handlePrevStep,
    resetForm
  };
};

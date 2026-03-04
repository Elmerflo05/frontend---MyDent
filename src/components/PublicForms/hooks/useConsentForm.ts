/**
 * HOOK: useConsentForm
 * Maneja el estado y validación del formulario de consentimiento
 *
 * IMPORTANTE: La fecha se calcula dinámicamente al inicializar/resetear
 * para evitar problemas de desfase cuando el módulo se carga en un día
 * diferente al que se usa.
 */

import { useState } from 'react';
import { formatDateToYMD } from '@/utils/dateUtils';
import type { ConsentFormData } from '@/components/consent';

/**
 * Genera los datos iniciales del formulario con la fecha actual
 * Se ejecuta cada vez que se necesita para garantizar fecha correcta
 */
const getInitialFormData = (): ConsentFormData => ({
  pacienteId: '',
  pacienteNombre: '',
  pacienteDni: '',
  pacienteDomicilio: '',
  tieneRepresentante: false,
  representanteId: '',
  representanteNombre: '',
  representanteDni: '',
  representanteDomicilio: '',
  doctorId: '',
  doctorNombre: '',
  doctorCop: '',
  fecha: formatDateToYMD(new Date()), // Se calcula al momento de ejecutar
  observaciones: '',
  firmaPaciente: '',
  firmaDoctor: ''
});

export const useConsentForm = () => {
  // Usar función para inicializar estado - garantiza fecha correcta
  const [formData, setFormData] = useState<ConsentFormData>(() => getInitialFormData());

  // Actualizar un campo del formulario
  const updateField = (field: keyof ConsentFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Actualizar múltiples campos a la vez
  const updateFields = (updates: Partial<ConsentFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Resetear el formulario - usa getInitialFormData para fecha actualizada
  const resetForm = () => {
    setFormData(getInitialFormData());
  };

  // Validar si el formulario está completo
  const isValid = () => {
    return !!(
      formData.pacienteId &&
      formData.pacienteNombre &&
      formData.doctorNombre &&
      formData.doctorCop &&
      formData.firmaPaciente &&
      formData.firmaDoctor
    );
  };

  return {
    formData,
    updateField,
    updateFields,
    resetForm,
    isValid,
    setFormData
  };
};

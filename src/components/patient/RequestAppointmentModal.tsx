import React, { useEffect } from 'react';
import { Calendar, Send, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSede } from '@/hooks/useSede';
import { useAppointmentDuration } from '@/hooks/useAppointmentDuration';
import { usePromotionStore } from '@/store/promotionStore';
import { useAppointmentForm } from './hooks/useAppointmentForm';
import { useAppointmentAvailability } from './hooks/useAppointmentAvailability';
import { useAppointmentData } from './hooks/useAppointmentData';
import { calculatePriceWithPromotion, getDoctorName, getSedeName } from './utils/appointmentHelpers';
import { mapFormDataToApiData, validateFormIds } from './utils/appointmentMapper';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import { uploadVoucher, validateVoucherFile } from '@/services/api/uploadService';
import { AppointmentStep1 } from './steps/AppointmentStep1';
import { AppointmentStep2 } from './steps/AppointmentStep2';
import { AppointmentStep3 } from './steps/AppointmentStep3';
import { Modal } from '@/components/common/Modal';

interface RequestAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  onSuccess?: (appointmentId: string) => void;
}

const RequestAppointmentModal = ({ isOpen, onClose, selectedDate, onSuccess }: RequestAppointmentModalProps) => {
  const { user } = useAuth();
  const { sedesDisponibles, cargandoSedes } = useSede();
  const { getActiveClinicPromotions } = usePromotionStore();
  const {
    defaultDuration,
    canCreateLongAppointments
  } = useAppointmentDuration();

  // Custom hooks for state and logic
  const {
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
    handlePrevStep,
    resetForm
  } = useAppointmentForm({ selectedDate, defaultDuration });

  const { doctors, isLoading, esClienteNuevo, tienePlanSalud, primeraConsultaGratis } = useAppointmentData({ isOpen, user });

  const {
    availableSlots,
    loadingSlots,
    selectedSlotDoctors,
    setSelectedSlotDoctors,
    availableSpecialties
  } = useAppointmentAvailability({
    isOpen,
    formData,
    setFormData,
    doctors,
    errors,
    setErrors
  });

  // State for form submission
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Actualizar fecha seleccionada cuando cambia el prop
  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: selectedDate
      }));
    }
  }, [selectedDate]);

  // Primera consulta gratis: si tiene plan con primera consulta disponible, NO paga
  const primeraConsultaDisponible = tienePlanSalud && primeraConsultaGratis?.available === true;
  // Requiere pago adelantado:
  // - Con plan + primera consulta disponible -> NO paga (gratis)
  // - Con plan + primera consulta YA usada -> paga adelantado
  // - Sin plan + cliente nuevo -> SÍ paga adelantado
  // - Continuador (ya tiene citas atendidas) -> no paga adelantado
  const requierePago = esClienteNuevo && !primeraConsultaDisponible;

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep2(requierePago)) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Validar que el usuario tenga un ID (paciente)
      const patientId = user?.id ? parseInt(user.id) : null;
      if (!patientId || isNaN(patientId)) {
        setErrors({ submit: 'Error: No se pudo identificar al paciente. Por favor inicia sesión nuevamente.' });
        return;
      }

      // Validar que los IDs sean números válidos
      if (!validateFormIds(formData)) {
        setErrors({ submit: 'Error: Datos de formulario inválidos. Por favor revisa la información.' });
        return;
      }

      // Paso 1: Subir voucher si existe
      let voucherPath: string | undefined = undefined;
      if (formData.paymentVoucher) {
        try {
          // Validar el archivo antes de subirlo
          validateVoucherFile(formData.paymentVoucher);

          // Subir el archivo
          const uploadResponse = await uploadVoucher(formData.paymentVoucher);
          if (uploadResponse.success && uploadResponse.data) {
            voucherPath = uploadResponse.data.filePath;
          }
        } catch (uploadError: any) {
          setErrors({ paymentVoucher: uploadError.message || 'Error al subir el voucher' });
          return;
        }
      }

      // Paso 2: Mapear datos del formulario al formato de la API
      const appointmentStatusId = 2; // 2 = Pendiente/Pending por defecto
      const apiData = mapFormDataToApiData(formData, patientId, appointmentStatusId, voucherPath);

      // Calcular precio con promoción y agregarlo a los datos
      if (primeraConsultaDisponible) {
        // Primera consulta gratis por plan de salud
        apiData.price = 0;
        apiData.first_free_consultation = true;
      } else {
        const availablePromotions = getAvailablePromotions();
        const priceInfo = calculatePriceWithPromotion(formData.selectedPromotionId, availablePromotions);
        if (priceInfo.finalPrice > 0) {
          apiData.price = priceInfo.finalPrice;
        }
      }

      // Paso 3: Llamar a la API real para crear la cita
      const response = await appointmentsApi.createAppointment(apiData);
      console.log('Respuesta de createAppointment:', JSON.stringify(response, null, 2));

      // Verificar éxito - aceptar si tiene data con appointment_id o success es true
      const appointmentId = response?.data?.appointment_id?.toString() || '';

      if (appointmentId || response?.success) {
        // Callback de éxito
        onSuccess?.(appointmentId);

        // Mostrar paso de confirmación
        setStep(3);
      } else {
        const errorMsg = response?.message || response?.error || 'Error al crear la cita. Por favor intenta nuevamente.';
        console.error('Error en respuesta:', errorMsg);
        setErrors({ submit: errorMsg });
      }
    } catch (error: any) {
      console.error('Error al solicitar cita:', error);
      setErrors({
        submit: error.message || 'Error al solicitar la cita. Por favor intenta nuevamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle next step
  const handleNextStep = () => {
    if (step === 1) {
      const isValid = validateStep1();
      if (isValid) {
        setStep(2);
      }
    } else if (step === 2) {
      const isValid = validateStep2(requierePago);
      if (isValid) {
        handleSubmit();
      }
    }
  };

  // Handle modal close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Obtener promociones activas SOLO DE LA CLÍNICA para la sede seleccionada
  const getAvailablePromotions = () => {
    const allActiveClinicPromotions = getActiveClinicPromotions();
    if (!formData.sedeId) return allActiveClinicPromotions.filter((p: any) => !p.sedeId);

    return allActiveClinicPromotions.filter((p: any) =>
      !p.sedeId || p.sedeId === formData.sedeId
    );
  };

  // Wrapper para calcular precio con promociones disponibles
  const calculatePrice = () => {
    const availablePromotions = getAvailablePromotions();
    return calculatePriceWithPromotion(formData.selectedPromotionId, availablePromotions);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
      showCloseButton={false}
    >
      {/* Header Fijo */}
      <Modal.Header className="bg-gradient-to-r from-teal-600 to-teal-700 border-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Solicitar Cita</h2>
              <p className="text-teal-100 text-sm">
                {step === 1 && 'Sede, especialidad y horario'}
                {step === 2 && 'Información de contacto y pago'}
                {step === 3 && '¡Cita solicitada!'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="mt-4 flex items-center gap-2">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
          <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-white' : 'bg-white/30'}`} />
        </div>
      </Modal.Header>

      {/* Content con scroll */}
      <Modal.Body className="overflow-y-auto">
        {/* Step 1: Sede, especialidad, fecha/hora y doctor */}
        {step === 1 && (
          <AppointmentStep1
            formData={formData}
            errors={errors}
            sedesDisponibles={sedesDisponibles}
            cargandoSedes={cargandoSedes}
            availableSlots={availableSlots}
            loadingSlots={loadingSlots}
            selectedSlotDoctors={selectedSlotDoctors}
            canCreateLongAppointments={canCreateLongAppointments}
            availableSpecialties={availableSpecialties}
            handleInputChange={handleInputChange}
            handleDateChange={handleDateChange}
            setFormData={setFormData}
            setSelectedSlotDoctors={setSelectedSlotDoctors}
            setErrors={setErrors}
          />
        )}

        {/* Step 2: Additional Information */}
        {step === 2 && (
          <AppointmentStep2
            formData={formData}
            errors={errors}
            user={user}
            esClienteNuevo={esClienteNuevo}
            tienePlanSalud={tienePlanSalud}
            primeraConsultaDisponible={primeraConsultaDisponible}
            nombrePlan={primeraConsultaGratis?.plan_name}
            availablePromotions={getAvailablePromotions()}
            priceInfo={calculatePrice()}
            doctors={doctors}
            sedesDisponibles={sedesDisponibles}
            getDoctorName={getDoctorName}
            getSedeName={getSedeName}
            handleInputChange={handleInputChange}
            handleVoucherUpload={handleVoucherUpload}
            setFormData={setFormData}
          />
        )}

        {/* Step 3: Confirmation & Summary */}
        {step === 3 && (
          <AppointmentStep3
            formData={formData}
            user={user}
            doctors={doctors}
            sedesDisponibles={sedesDisponibles}
            getDoctorName={getDoctorName}
            getSedeName={getSedeName}
          />
        )}

        {errors.submit && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {errors.submit}
          </div>
        )}
      </Modal.Body>

      {/* Footer Fijo */}
      <Modal.Footer>
        {step === 3 ? (
          <button
            type="button"
            onClick={handleClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Cerrar
          </button>
        ) : (
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={step === 1 ? handleClose : handlePrevStep}
              className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              disabled={isSubmitting}
            >
              {step === 1 ? 'Cancelar' : 'Anterior'}
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  {step === 1 ? (
                    <>Siguiente</>
                  ) : step === 2 ? (
                    <>
                      <Send className="h-4 w-4" />
                      Solicitar Cita
                    </>
                  ) : (
                    <>Finalizar</>
                  )}
                </>
              )}
            </button>
          </div>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default RequestAppointmentModal;

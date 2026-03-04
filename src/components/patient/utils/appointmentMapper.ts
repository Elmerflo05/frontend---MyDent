/**
 * Mapper para convertir datos del formulario al formato de la API
 */

import type { AppointmentFormData } from '../hooks/useAppointmentForm';
import type { AppointmentData } from '@/services/api/appointmentsApi';

/**
 * Mapeo de IDs de métodos de pago string a IDs numéricos de la base de datos
 * Estos IDs corresponden a la tabla payment_methods
 */
const PAYMENT_METHOD_ID_MAP: Record<string, number> = {
  'efectivo': 1,
  'cash': 1,
  'tarjeta_debito': 2,
  'debit_card': 2,
  'tarjeta_credito': 3,
  'credit_card': 3,
  'transferencia': 4,
  'transfer': 4,
  'yape': 5,
  'plin': 6,
  'deposito': 7,
  'deposit': 7
};

/**
 * Mapea los datos del formulario de solicitud de cita al formato esperado por la API
 *
 * @param formData - Datos del formulario del modal
 * @param patientId - ID del paciente (número)
 * @param appointmentStatusId - ID del estado de la cita (por defecto: 2 = Pendiente)
 * @param voucherPath - Ruta del voucher si se subió (opcional)
 * @returns Datos formateados para enviar a la API
 */
export function mapFormDataToApiData(
  formData: AppointmentFormData,
  patientId: number,
  appointmentStatusId: number = 2, // 2 = Pending/Pendiente por defecto
  voucherPath?: string
): AppointmentData {
  // Convertir la fecha a formato YYYY-MM-DD
  // IMPORTANTE: No usar toISOString() porque convierte a UTC y puede desplazar la fecha un día
  const d = formData.date;
  const appointmentDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Convertir la hora al formato HH:mm:ss
  const appointmentTime = formData.time.includes(':')
    ? `${formData.time}:00`
    : formData.time;

  // Calcular end_time basado en start_time + duration
  const [hours, minutes] = formData.time.split(':').map(Number);
  const startDate = new Date(formData.date);
  startDate.setHours(hours, minutes, 0, 0);

  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + formData.duration);

  // Formatear end_time
  const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}:00`;

  // Construir el objeto de datos para la API
  const apiData: any = {
    // IDs - Convertir de string a number
    patient_id: patientId,
    branch_id: parseInt(formData.sedeId, 10),
    dentist_id: parseInt(formData.doctorId, 10),
    appointment_status_id: appointmentStatusId,

    // Fecha y hora
    appointment_date: appointmentDate,
    start_time: appointmentTime,  // El backend espera start_time, no appointment_time
    end_time: endTime,            // Calcular y enviar end_time
    duration: formData.duration,  // El backend espera duration, no duration_minutes

    // Información adicional
    notes: formData.notes || undefined,

    // Pago - incluir método de pago y su ID numérico para el backend
    ...(formData.paymentMethod && { payment_method: formData.paymentMethod }),
    ...(formData.paymentMethod && PAYMENT_METHOD_ID_MAP[formData.paymentMethod.toLowerCase()] && {
      payment_method_id: PAYMENT_METHOD_ID_MAP[formData.paymentMethod.toLowerCase()]
    }),
    ...(voucherPath && { voucher: voucherPath }),
  };

  // Agregar specialty_id solo si existe
  if (formData.specialtyId) {
    apiData.specialty_id = parseInt(formData.specialtyId, 10);
  }

  // Agregar selected_promotion_id solo si existe
  if (formData.selectedPromotionId) {
    apiData.selected_promotion_id = parseInt(formData.selectedPromotionId, 10);
  }

  // Agregar código de promoción si está validado (flujo simplificado)
  if (formData.validatedCoupon) {
    // Enviar código de promoción para validar y registrar uso en backend
    apiData.promotion_code = formData.validatedCoupon.purchase_code;
    apiData.coupon_discount_type = formData.validatedCoupon.discount_type;
    apiData.coupon_discount_value = formData.validatedCoupon.discount_value;
  }

  return apiData;
}

/**
 * Valida que todos los IDs sean números válidos
 *
 * @param formData - Datos del formulario
 * @returns true si todos los IDs son válidos
 */
export function validateFormIds(formData: AppointmentFormData): boolean {
  const sedeId = parseInt(formData.sedeId, 10);
  const doctorId = parseInt(formData.doctorId, 10);

  if (isNaN(sedeId) || isNaN(doctorId)) {
    return false;
  }

  // Validar specialty si existe
  if (formData.specialtyId) {
    const specialtyId = parseInt(formData.specialtyId, 10);
    if (isNaN(specialtyId)) {
      return false;
    }
  }

  // Validar promotion si existe
  if (formData.selectedPromotionId) {
    const promotionId = parseInt(formData.selectedPromotionId, 10);
    if (isNaN(promotionId)) {
      return false;
    }
  }

  return true;
}

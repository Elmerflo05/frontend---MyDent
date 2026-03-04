import type { User as UserType } from '@/types';
import { CONTACT_INFO } from '@/constants/ui';
import { PRICING } from '@/constants/pricing';

/**
 * Utilidades y helpers para la solicitud de citas
 */

export interface PriceInfo {
  originalPrice: number;
  discount: number;
  finalPrice: number;
  promotionName?: string;
}

/**
 * Obtener el nombre completo del doctor
 */
export const getDoctorName = (doctorId: string, doctors: UserType[]): string => {
  const doctor = doctors.find(d => d.id === doctorId);
  return doctor ? `Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}` : '';
};

/**
 * Obtener el nombre de la sede
 */
export const getSedeName = (sedeId: string, sedesDisponibles: any[]): string => {
  const sede = sedesDisponibles.find(s => s.id === sedeId);
  return sede ? sede.nombre : '';
};

/**
 * Verificar si la especialidad seleccionada es "Odontología General"
 */
export const isOdontologiaGeneral = (specialtyId: string): boolean => {
  return specialtyId === 'Odontología General';
};

/**
 * Generar mensaje para WhatsApp
 */
export const generateWhatsAppMessage = (
  specialtyId: string,
  date: Date,
  sedeName: string
): string => {
  return `Hola, necesito agendar una cita para ${specialtyId}.
Fecha preferida: ${date.toLocaleDateString('es-ES')}
Sede: ${sedeName}`;
};

/**
 * Obtener el enlace de WhatsApp con mensaje preformateado
 */
export const getWhatsAppLink = (message: string): string => {
  return `${CONTACT_INFO.WHATSAPP.URL}?text=${encodeURIComponent(message)}`;
};

/**
 * Formatear fecha para mostrar
 */
export const formatAppointmentDate = (date: Date): string => {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Validar tipo de archivo para voucher
 */
export const isValidVoucherFileType = (fileType: string): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  return validTypes.includes(fileType);
};

/**
 * Validar tamaño de archivo (máximo 5MB)
 */
export const isValidVoucherFileSize = (fileSize: number): boolean => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return fileSize <= maxSize;
};

/**
 * Filtrar promociones disponibles para la sede seleccionada
 */
export const filterPromotionsBySede = (
  allPromotions: any[],
  sedeId: string
): any[] => {
  return allPromotions.filter(p =>
    !p.sedeId || p.sedeId === sedeId
  );
};

/**
 * Calcular precio con descuento de promoción
 *
 * @param selectedPromotionId - ID de la promoción seleccionada
 * @param availablePromotions - Lista de promociones disponibles
 * @returns Información del precio con descuento aplicado
 */
export const calculatePriceWithPromotion = (
  selectedPromotionId: string,
  availablePromotions: any[]
): PriceInfo => {
  // Precio base de consulta desde la configuración centralizada
  const basePrice = PRICING.APPOINTMENT_BASE_PRICE;

  if (!selectedPromotionId) {
    return { originalPrice: basePrice, discount: 0, finalPrice: basePrice };
  }

  const selectedPromo = availablePromotions.find(p => p.id === selectedPromotionId);
  if (!selectedPromo) {
    return { originalPrice: basePrice, discount: 0, finalPrice: basePrice };
  }

  let discount = 0;
  if (selectedPromo.discountType === 'percentage') {
    discount = (basePrice * selectedPromo.discountValue) / 100;
  } else {
    discount = selectedPromo.discountValue;
  }

  const finalPrice = Math.max(0, basePrice - discount);

  return {
    originalPrice: basePrice,
    discount,
    finalPrice,
    promotionName: selectedPromo.title
  };
};

/**
 * Calcula la hora de fin basándose en la hora de inicio y duración
 *
 * @param startTime - Hora de inicio en formato HH:mm
 * @param duration - Duración en minutos
 * @returns Hora de fin en formato HH:mm
 */
export const calculateEndTime = (startTime: string, duration: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);

  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + duration);

  const endHours = endDate.getHours().toString().padStart(2, '0');
  const endMinutes = endDate.getMinutes().toString().padStart(2, '0');

  return `${endHours}:${endMinutes}`;
};

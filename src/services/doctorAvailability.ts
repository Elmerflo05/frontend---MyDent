import { availabilityApi } from './api/availabilityApi';
import type { TimeSlotWithDoctors, DoctorSchedule } from './api/availabilityApi';
import { formatDateToYMD } from '@/utils/dateUtils';

/**
 * Servicio para gestionar la disponibilidad de médicos
 * ✅ MIGRADO: Ahora usa API real en lugar de IndexedDB
 */

// Re-exportar tipo para compatibilidad
export type { TimeSlotWithDoctors };

/**
 * ✅ MIGRADO: Obtiene slots disponibles usando API real
 * @param date - Fecha para buscar disponibilidad
 * @param sedeId - ID de la sede (branch_id)
 * @param specialtyId - ID de la especialidad (NO el nombre)
 * @param duration - Duración en minutos (default: 30)
 */
export async function getAvailableSlotsBySpecialty(
  date: Date,
  sedeId: string,
  specialtyId: string,
  duration: number = 30
): Promise<TimeSlotWithDoctors[]> {
  try {
    // Formatear fecha a YYYY-MM-DD
    const dateStr = formatDateToYMD(date);

    // Llamar a la API real
    const slots = await availabilityApi.getAvailableSlotsBySpecialty(
      dateStr,
      sedeId,
      specialtyId,
      duration
    );

    return slots;
  } catch (error) {
    console.error('❌ [doctorAvailability] Error obteniendo slots:', error);
    return [];
  }
}

/**
 * Obtiene el horario de un doctor para una fecha específica
 * @param doctorId - ID del dentista
 * @param date - Fecha a consultar
 * @param branchId - ID de la sede (opcional, pero recomendado para filtrar por sede específica)
 * @returns Objeto con startTime y endTime si tiene horario, null si no
 */
export async function getDoctorScheduleForDate(
  doctorId: string,
  date: Date,
  branchId?: string
): Promise<{ startTime: string; endTime: string } | null> {
  try {
    const dateStr = formatDateToYMD(date);
    const schedules = await availabilityApi.getDoctorSchedule(doctorId, dateStr, branchId);

    if (schedules && schedules.length > 0) {
      // Si tiene múltiples horarios en el día, encontrar el rango completo
      const startTimes = schedules.map(s => s.start_time);
      const endTimes = schedules.map(s => s.end_time);

      // Tomar el inicio más temprano y el fin más tardío
      const earliestStart = startTimes.sort()[0];
      const latestEnd = endTimes.sort().reverse()[0];

      return {
        startTime: earliestStart.substring(0, 5), // "HH:MM"
        endTime: latestEnd.substring(0, 5)
      };
    }

    return null;
  } catch (error) {
    console.error('Error obteniendo horario del doctor:', error);
    return null;
  }
}

/**
 * Genera slots de tiempo cada X minutos dentro de un rango horario
 */
function generateTimeSlots(startTime: string, endTime: string, interval: number = 30): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  while (currentMinutes < endMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const min = currentMinutes % 60;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    slots.push(timeStr);
    currentMinutes += interval;
  }

  return slots;
}

/**
 * Obtiene los time slots disponibles para un doctor en una fecha específica
 * @param doctorId - ID del dentista
 * @param date - Fecha a consultar
 * @param duration - Duración de la cita en minutos
 * @param branchId - ID de la sede (opcional, pero recomendado para filtrar por sede específica)
 * @returns Array de slots con disponibilidad
 */
export async function getAvailableTimeSlots(
  doctorId: string,
  date: Date,
  duration: number = 30,
  branchId?: string
): Promise<Array<{ time: string; available: boolean; reason?: string }>> {
  try {
    const dateStr = formatDateToYMD(date);

    // Obtener horario del doctor y sus citas en paralelo
    const [schedules, appointments] = await Promise.all([
      availabilityApi.getDoctorSchedule(doctorId, dateStr, branchId),
      availabilityApi.getDoctorAppointments(doctorId, dateStr)
    ]);

    if (!schedules || schedules.length === 0) {
      return [];
    }

    // Generar todos los slots posibles basados en el horario
    const allSlots: Array<{ time: string; available: boolean; reason?: string }> = [];

    for (const schedule of schedules) {
      const startTime = schedule.start_time.substring(0, 5);
      const endTime = schedule.end_time.substring(0, 5);
      const slotDuration = schedule.slot_duration || duration;

      const timeSlots = generateTimeSlots(startTime, endTime, slotDuration);

      for (const time of timeSlots) {
        // Verificar si este slot está ocupado por alguna cita
        const isOccupied = appointments.some(apt => {
          const aptStart = apt.start_time.substring(0, 5);
          const aptDuration = apt.duration || 30;

          // Calcular hora fin de la cita
          const [aptH, aptM] = aptStart.split(':').map(Number);
          const aptEndMinutes = aptH * 60 + aptM + aptDuration;
          const aptEnd = `${String(Math.floor(aptEndMinutes / 60)).padStart(2, '0')}:${String(aptEndMinutes % 60).padStart(2, '0')}`;

          // Calcular hora fin del slot propuesto
          const [slotH, slotM] = time.split(':').map(Number);
          const slotEndMinutes = slotH * 60 + slotM + slotDuration;
          const slotEnd = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, '0')}:${String(slotEndMinutes % 60).padStart(2, '0')}`;

          // Verificar solapamiento
          const overlaps = (
            (time >= aptStart && time < aptEnd) ||
            (slotEnd > aptStart && slotEnd <= aptEnd) ||
            (time <= aptStart && slotEnd >= aptEnd)
          );

          return overlaps;
        });

        // Verificar si no está duplicado
        const exists = allSlots.some(s => s.time === time);
        if (!exists) {
          allSlots.push({
            time,
            available: !isOccupied,
            reason: isOccupied ? 'Horario ocupado' : undefined
          });
        }
      }
    }

    // Ordenar por hora
    return allSlots.sort((a, b) => a.time.localeCompare(b.time));
  } catch (error) {
    console.error('❌ [doctorAvailability] Error obteniendo time slots:', error);
    return [];
  }
}

/**
 * Verifica si un doctor está disponible en un horario específico
 * @param doctorId - ID del dentista
 * @param date - Fecha de la cita
 * @param time - Hora de inicio (HH:MM)
 * @param duration - Duración en minutos
 * @param branchId - ID de la sede (opcional, pero recomendado para filtrar por sede específica)
 * @returns Objeto indicando disponibilidad y razón si no está disponible
 */
export async function isDoctorAvailable(
  doctorId: string,
  date: Date,
  time: string,
  duration: number = 30,
  branchId?: string
): Promise<{ available: boolean; reason?: string }> {
  try {
    const slots = await getAvailableTimeSlots(doctorId, date, duration, branchId);

    if (slots.length === 0) {
      return {
        available: false,
        reason: 'El médico no tiene horario configurado para este día'
      };
    }

    const slot = slots.find(s => s.time === time);

    if (!slot) {
      return {
        available: false,
        reason: 'El horario seleccionado está fuera del horario de atención del médico'
      };
    }

    if (!slot.available) {
      return {
        available: false,
        reason: slot.reason || 'El horario seleccionado no está disponible'
      };
    }

    return { available: true };
  } catch (error) {
    console.error('❌ [doctorAvailability] Error verificando disponibilidad:', error);
    return {
      available: false,
      reason: 'Error al verificar disponibilidad'
    };
  }
}

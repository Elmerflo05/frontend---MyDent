/**
 * API Service para Disponibilidad de Horarios
 * Maneja consultas de slots disponibles, horarios de doctores y citas
 */

import httpClient from './httpClient';

export interface TimeSlotWithDoctors {
  time: string;
  doctors: Array<{
    id: string;
    name: string;
    specialties: string[];
  }>;
}

export interface DoctorSchedule {
  schedule_id: number;
  dentist_id: number;
  branch_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_available: boolean;
  branch_name: string;
}

export interface DoctorAppointment {
  appointment_id: number;
  appointment_date: string;
  start_time: string;
  duration: number;
  status: string;
  patient_first_name: string;
  patient_last_name: string;
}

export interface AvailabilitySlotsParams {
  date: string; // YYYY-MM-DD
  branchId: string | number;
  specialtyId: string | number;
  duration?: number;
}

class AvailabilityApiService {
  /**
   * Obtiene slots disponibles por fecha, sede y especialidad
   */
  async getAvailableSlots(params: AvailabilitySlotsParams): Promise<TimeSlotWithDoctors[]> {
    try {
      const queryParams = new URLSearchParams({
        date: params.date,
        branchId: params.branchId.toString(),
        specialtyId: params.specialtyId.toString(),
        ...(params.duration && { duration: params.duration.toString() })
      });

      const response = await httpClient.get<{ success: boolean; data: TimeSlotWithDoctors[] }>(
        `/public/availability/slots?${queryParams.toString()}`
      );

      return response.data || [];
    } catch (error) {
      console.error('❌ [availabilityApi] Error obteniendo slots:', error);
      throw error;
    }
  }

  /**
   * Obtiene el horario configurado de un doctor para una fecha específica
   * @param doctorId - ID del dentista
   * @param date - Fecha en formato YYYY-MM-DD
   * @param branchId - ID de la sede (opcional, pero recomendado para filtrar por sede)
   */
  async getDoctorSchedule(doctorId: string | number, date: string, branchId?: string | number): Promise<DoctorSchedule[]> {
    try {
      let url = `/public/availability/doctor/${doctorId}/schedule?date=${date}`;
      if (branchId) {
        url += `&branchId=${branchId}`;
      }
      const response = await httpClient.get<{ success: boolean; data: DoctorSchedule[] }>(url);
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo horario:', error);
      throw error;
    }
  }

  /**
   * Obtiene las citas agendadas de un doctor para una fecha específica
   */
  async getDoctorAppointments(doctorId: string | number, date: string): Promise<DoctorAppointment[]> {
    try {
      const response = await httpClient.get<{ success: boolean; data: DoctorAppointment[] }>(
        `/public/availability/doctor/${doctorId}/appointments?date=${date}`
      );

      return response.data || [];
    } catch (error) {
      console.error('❌ [availabilityApi] Error obteniendo citas:', error);
      throw error;
    }
  }

  /**
   * Obtiene slots disponibles por especialidad (wrapper para compatibilidad)
   * @param date - Fecha en formato YYYY-MM-DD
   * @param sedeId - ID de la sede
   * @param specialtyId - ID de la especialidad (string o number)
   * @param duration - Duración en minutos
   */
  async getAvailableSlotsBySpecialty(
    date: string,
    sedeId: string | number,
    specialtyId: string | number,
    duration: number = 30
  ): Promise<TimeSlotWithDoctors[]> {
    return this.getAvailableSlots({
      date,
      branchId: sedeId,
      specialtyId,
      duration
    });
  }
}

// Exportar instancia singleton
export const availabilityApi = new AvailabilityApiService();
export default availabilityApi;

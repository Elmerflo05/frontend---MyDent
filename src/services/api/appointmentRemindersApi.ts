/**
 * API Service para Recordatorios de Citas
 * Maneja recordatorios automáticos de citas con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface AppointmentReminderData {
  reminder_id?: number;
  appointment_id: number;
  reminder_type_id?: number;
  reminder_date_time: string;
  message?: string;
  is_sent?: boolean;
  sent_at?: string;
  delivery_status?: string;
  error_message?: string;
  created_at?: string;
  updated_at?: string;

  // Datos relacionados (joins)
  patient_name?: string;
  appointment_date?: string;
  reminder_type_name?: string;
}

export interface AppointmentRemindersListResponse {
  success: boolean;
  data: AppointmentReminderData[];
}

export interface AppointmentReminderResponse {
  success: boolean;
  data: AppointmentReminderData;
  message?: string;
}

export interface AppointmentReminderFilters {
  appointment_id?: number;
  reminder_type_id?: number;
  is_sent?: boolean;
  delivery_status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

class AppointmentRemindersApiService {
  /**
   * Obtiene todos los recordatorios con filtros opcionales
   */
  async getAppointmentReminders(filters?: AppointmentReminderFilters): Promise<AppointmentRemindersListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.appointment_id) params.append('appointment_id', filters.appointment_id.toString());
      if (filters?.reminder_type_id) params.append('reminder_type_id', filters.reminder_type_id.toString());
      if (filters?.is_sent !== undefined) params.append('is_sent', filters.is_sent.toString());
      if (filters?.delivery_status) params.append('delivery_status', filters.delivery_status);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/appointment-reminders${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<AppointmentRemindersListResponse>(endpoint);

      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un recordatorio por su ID
   */
  async getAppointmentReminderById(reminderId: number): Promise<AppointmentReminderResponse> {
    try {
      const response = await httpClient.get<AppointmentReminderResponse>(`/appointment-reminders/${reminderId}`);

      if (!response.success || !response.data) {
        throw new Error('Recordatorio no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo recordatorio
   */
  async createAppointmentReminder(reminderData: AppointmentReminderData): Promise<AppointmentReminderResponse> {
    try {
      const response = await httpClient.post<AppointmentReminderResponse>('/appointment-reminders', reminderData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear recordatorio');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un recordatorio existente
   */
  async updateAppointmentReminder(reminderId: number, reminderData: Partial<AppointmentReminderData>): Promise<AppointmentReminderResponse> {
    try {
      const response = await httpClient.put<AppointmentReminderResponse>(`/appointment-reminders/${reminderId}`, reminderData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar recordatorio');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un recordatorio
   */
  async deleteAppointmentReminder(reminderId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/appointment-reminders/${reminderId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar recordatorio');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene recordatorios de una cita específica
   */
  async getRemindersByAppointmentId(appointmentId: number): Promise<AppointmentReminderData[]> {
    try {
      const response = await this.getAppointmentReminders({
        appointment_id: appointmentId,
        limit: 100
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene recordatorios pendientes de envío
   */
  async getPendingReminders(limit: number = 100): Promise<AppointmentReminderData[]> {
    try {
      const response = await this.getAppointmentReminders({
        is_sent: false,
        limit: limit
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Marca un recordatorio como enviado
   */
  async markAsSent(reminderId: number, deliveryStatus: string = 'sent'): Promise<AppointmentReminderResponse> {
    try {
      return await this.updateAppointmentReminder(reminderId, {
        is_sent: true,
        sent_at: new Date().toISOString(),
        delivery_status: deliveryStatus
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Marca un recordatorio como fallido
   */
  async markAsFailed(reminderId: number, errorMessage: string): Promise<AppointmentReminderResponse> {
    try {
      return await this.updateAppointmentReminder(reminderId, {
        is_sent: true,
        sent_at: new Date().toISOString(),
        delivery_status: 'failed',
        error_message: errorMessage
      });
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const appointmentRemindersApi = new AppointmentRemindersApiService();
export default appointmentRemindersApi;

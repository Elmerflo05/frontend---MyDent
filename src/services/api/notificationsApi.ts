/**
 * API Service para Notificaciones
 * Maneja notificaciones del sistema con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface NotificationData {
  notification_id?: number;
  user_id?: number;
  patient_id?: number;
  notification_type?: string;
  notification_title?: string;
  notification_message?: string;
  notification_data?: Record<string, any>;
  title?: string;
  message?: string;
  is_read?: boolean;
  read_at?: string;
  related_entity_type?: string;
  related_entity_id?: number;
  action_url?: string;
  priority?: 'low' | 'normal' | 'high';
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationsListResponse {
  success: boolean;
  data: NotificationData[];
}

export interface NotificationResponse {
  success: boolean;
  data: NotificationData;
  message?: string;
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}

export interface NotificationFilters {
  user_id?: number;
  is_read?: boolean;
  notification_type?: string;
  priority?: string;
  limit?: number;
}

class NotificationsApiService {
  /**
   * Obtiene todas las notificaciones con filtros opcionales
   */
  async getNotifications(filters?: NotificationFilters): Promise<NotificationsListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.user_id) params.append('user_id', filters.user_id.toString());
      if (filters?.is_read !== undefined) params.append('is_read', filters.is_read.toString());
      if (filters?.notification_type) params.append('notification_type', filters.notification_type);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<NotificationsListResponse>(endpoint);

      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene el conteo de notificaciones no leídas
   * Nota: El backend usa el user_id del token JWT automáticamente
   */
  async getUnreadCount(userId?: number): Promise<number> {
    try {
      const response = await httpClient.get<any>('/notifications/unread-count');
      // El backend devuelve { success: true, data: { unread_count: number } }
      return response.data?.unread_count || 0;
    } catch (error) {
      console.error('Error al obtener contador de notificaciones:', error);
      return 0;
    }
  }

  /**
   * Obtiene una notificación por su ID
   */
  async getNotificationById(notificationId: number): Promise<NotificationResponse> {
    try {
      const response = await httpClient.get<NotificationResponse>(`/notifications/${notificationId}`);

      if (!response.success || !response.data) {
        throw new Error('Notificación no encontrada');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea una nueva notificación
   */
  async createNotification(notificationData: NotificationData): Promise<NotificationResponse> {
    try {
      const response = await httpClient.post<NotificationResponse>('/notifications', notificationData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear notificación');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza una notificación existente
   */
  async updateNotification(notificationId: number, notificationData: Partial<NotificationData>): Promise<NotificationResponse> {
    try {
      const response = await httpClient.put<NotificationResponse>(`/notifications/${notificationId}`, notificationData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar notificación');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Marca una notificación como leída
   */
  async markAsRead(notificationId: number): Promise<NotificationResponse> {
    try {
      const response = await httpClient.put<NotificationResponse>(`/notifications/${notificationId}/read`, {});

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al marcar como leída');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Marca todas las notificaciones del usuario como leídas
   * Nota: El backend usa el user_id del token JWT automáticamente
   */
  async markAllAsRead(userId?: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.put(`/notifications/mark-all-read/all`, {});

      if (!response.success) {
        throw new Error(response.message || 'Error al marcar todas como leídas');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina una notificación
   */
  async deleteNotification(notificationId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/notifications/${notificationId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar notificación');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene notificaciones no leídas del usuario
   */
  async getUnreadNotifications(userId: number, limit: number = 50): Promise<NotificationData[]> {
    try {
      const response = await this.getNotifications({
        user_id: userId,
        is_read: false,
        limit: limit
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Envía notificación de cita al paciente (reprogramación, cancelación, confirmación)
   */
  async sendAppointmentNotification(params: {
    patientId: number;
    appointmentId: number;
    type: 'rescheduled' | 'cancelled' | 'confirmed' | 'reminder';
    appointmentDate: string;
    appointmentTime: string;
    reason?: string;
    dentistName?: string;
  }): Promise<NotificationResponse> {
    const typeMessages: Record<string, { title: string; message: string }> = {
      rescheduled: {
        title: 'Cita Reprogramada',
        message: `Su cita ha sido reprogramada para el ${params.appointmentDate} a las ${params.appointmentTime}.${params.reason ? ` Motivo: ${params.reason}` : ''}${params.dentistName ? ` Doctor: ${params.dentistName}` : ''}`
      },
      cancelled: {
        title: 'Cita Cancelada',
        message: `Su cita del ${params.appointmentDate} a las ${params.appointmentTime} ha sido cancelada.${params.reason ? ` Motivo: ${params.reason}` : ''}`
      },
      confirmed: {
        title: 'Cita Confirmada',
        message: `Su cita ha sido confirmada para el ${params.appointmentDate} a las ${params.appointmentTime}.${params.dentistName ? ` Doctor: ${params.dentistName}` : ''}`
      },
      reminder: {
        title: 'Recordatorio de Cita',
        message: `Le recordamos que tiene una cita el ${params.appointmentDate} a las ${params.appointmentTime}.${params.dentistName ? ` Doctor: ${params.dentistName}` : ''}`
      }
    };

    const { title, message } = typeMessages[params.type];

    const notificationData: NotificationData = {
      patient_id: params.patientId,
      notification_type: `appointment_${params.type}`,
      notification_title: title,
      notification_message: message,
      notification_data: {
        appointment_id: params.appointmentId,
        appointment_date: params.appointmentDate,
        appointment_time: params.appointmentTime,
        reason: params.reason,
        dentist_name: params.dentistName
      },
      priority: params.type === 'cancelled' ? 'high' : 'normal'
    };

    return this.createNotification(notificationData);
  }



  // =====================================================
  // MÉTODOS PARA PORTAL DEL PACIENTE
  // =====================================================

  /**
   * Obtiene las notificaciones del paciente logueado (Portal del Paciente)
   */
  async getPatientNotifications(filters?: {
    notification_type?: string;
    is_read?: boolean;
    page?: number;
    limit?: number;
  }): Promise<NotificationsListResponse & { pagination?: any }> {
    try {
      const params = new URLSearchParams();

      if (filters?.notification_type) params.append('notification_type', filters.notification_type);
      if (filters?.is_read !== undefined) params.append('is_read', filters.is_read.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/patient-portal/notifications${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<NotificationsListResponse & { pagination?: any }>(endpoint);

      return {
        success: response.success || true,
        data: response.data || [],
        pagination: (response as any).pagination
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene el conteo de notificaciones no leídas del paciente (Portal del Paciente)
   */
  async getPatientUnreadCount(): Promise<number> {
    try {
      const response = await httpClient.get<any>('/patient-portal/notifications/unread-count');
      return response.data?.unread_count || 0;
    } catch (error) {
      console.error('Error getting patient unread count:', error);
      return 0;
    }
  }

  /**
   * Marca una notificación del paciente como leída (Portal del Paciente)
   */
  async markPatientNotificationAsRead(notificationId: number): Promise<any> {
    try {
      const response = await httpClient.put<any>(`/patient-portal/notifications/${notificationId}/read`, {});

      if (!response.success) {
        throw new Error(response.message || 'Error al marcar como leída');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Marca todas las notificaciones del paciente como leídas (Portal del Paciente)
   */
  async markAllPatientNotificationsAsRead(): Promise<any> {
    try {
      const response = await httpClient.put<any>('/patient-portal/notifications/mark-all-read', {});

      if (!response.success) {
        throw new Error(response.message || 'Error al marcar todas como leídas');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  // =====================================================
  // MÉTODOS ADMINISTRATIVOS
  // =====================================================

  /**
   * Genera notificaciones de recordatorio de pago (Solo Admin)
   */
  async generatePaymentReminders(daysBefore: number = 3): Promise<{ success: boolean; generated: number; message: string }> {
    try {
      const response = await httpClient.post<any>(
        '/notifications/generate-payment-reminders',
        { days_before: daysBefore }
      );

      return {
        success: response.success || false,
        generated: response.data?.generated || 0,
        message: response.message || ''
      };
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const notificationsApi = new NotificationsApiService();
export default notificationsApi;

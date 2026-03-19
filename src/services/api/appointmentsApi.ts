/**
 * API Service para Citas
 * Maneja todas las operaciones CRUD de citas con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface AppointmentFilters {
  branch_id?: number;
  dentist_id?: number;
  patient_id?: number;
  appointment_status_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AppointmentData {
  appointment_id?: number;
  branch_id: number;
  patient_id: number;
  dentist_id: number;
  specialty_id?: number;
  consultorio_id?: number;
  appointment_date: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  appointment_type?: string;
  reason?: string;
  notes?: string;
  room?: string;
  price?: number;
  payment_method?: string;
  voucher?: string;
  selected_promotion_id?: number;
  appointment_status_id: number;
  status_code?: string; // ✅ NUEVO - Código de estado del backend (confirmed, pending_approval, etc.)
  confirmed?: boolean;
  confirmed_at?: string;
  confirmed_by?: number;
  cancelled_at?: string;
  cancelled_by?: number;
  cancellation_reason?: string;
  arrived_at?: string;
  completed_at?: string;
  reminder_sent?: boolean;
  reminder_sent_date?: string;
  user_id_registration?: number;
  user_id_modification?: number;
  date_time_registration?: string;
  date_time_modification?: string;
  status?: string; // DEPRECADO - Se reemplazará por status_code

  // Datos relacionados (joins)
  patient_name?: string;
  identification_number?: string;
  patient_phone?: string;
  patient_mobile?: string;
  patient_email?: string;
  dentist_name?: string;
  appointment_status_name?: string;
  status_color?: string;
  specialty_name?: string;
  branch_name?: string;
  promotion_name?: string;
  discount_percentage?: number;
  reschedule_count?: number;

  // Flags de tipo de paciente (para creación)
  first_free_consultation?: boolean;
  is_continuing_patient?: boolean;
}

export interface AppointmentsListResponse {
  success: boolean;
  data: AppointmentData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AppointmentResponse {
  success: boolean;
  data: AppointmentData;
  message?: string;
}

class AppointmentsApiService {
  /**
   * Obtiene todas las citas con filtros y paginación
   */
  async getAppointments(filters?: AppointmentFilters): Promise<AppointmentsListResponse> {
    try {
      // Construir query params
      const params = new URLSearchParams();

      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.dentist_id) params.append('dentist_id', filters.dentist_id.toString());
      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.appointment_status_id) params.append('appointment_status_id', filters.appointment_status_id.toString());
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/appointments${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<AppointmentsListResponse>(endpoint);

      return {
        success: response.success || true,
        data: response.data || [],
        pagination: response.pagination || {
          total: 0,
          page: filters?.page || 1,
          limit: filters?.limit || 20,
          totalPages: 0
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene una cita por su ID
   */
  async getAppointmentById(appointmentId: number): Promise<AppointmentResponse> {
    try {
      const response = await httpClient.get<AppointmentResponse>(`/appointments/${appointmentId}`);

      if (!response.success || !response.data) {
        throw new Error('Cita no encontrada');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea una nueva cita
   */
  async createAppointment(appointmentData: AppointmentData): Promise<AppointmentResponse> {
    try {
      const response = await httpClient.post<AppointmentResponse>('/appointments', appointmentData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear cita');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza una cita existente
   */
  async updateAppointment(appointmentId: number, appointmentData: Partial<AppointmentData>): Promise<AppointmentResponse> {
    try {
      const response = await httpClient.put<AppointmentResponse>(`/appointments/${appointmentId}`, appointmentData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar cita');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancela una cita
   */
  async cancelAppointment(appointmentId: number, cancellationReason: string): Promise<AppointmentResponse> {
    try {
      const response = await httpClient.put<AppointmentResponse>(`/appointments/${appointmentId}/cancel`, {
        cancellation_reason: cancellationReason
      });

      if (!response.success) {
        throw new Error(response.message || 'Error al cancelar cita');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Marca una cita como "Paciente llegó"
   */
  async markAppointmentAsArrived(appointmentId: number): Promise<AppointmentResponse> {
    try {
      const response = await httpClient.put<AppointmentResponse>(`/appointments/${appointmentId}/arrived`);

      if (!response.success) {
        throw new Error(response.message || 'Error al marcar llegada');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Marca una cita como "Completada"
   */
  async markAppointmentAsCompleted(appointmentId: number): Promise<AppointmentResponse> {
    try {
      const response = await httpClient.put<AppointmentResponse>(`/appointments/${appointmentId}/completed`);

      if (!response.success) {
        throw new Error(response.message || 'Error al completar cita');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina una cita
   */
  async deleteAppointment(appointmentId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/appointments/${appointmentId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar cita');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene citas por rango de fechas
   */
  async getAppointmentsByDateRange(dateFrom: string, dateTo: string, branchId?: number, dentistId?: number): Promise<AppointmentData[]> {
    try {
      const filters: AppointmentFilters = {
        date_from: dateFrom,
        date_to: dateTo,
        limit: 1000 // Límite alto para obtener todas las citas del rango
      };

      if (branchId) filters.branch_id = branchId;
      if (dentistId) filters.dentist_id = dentistId;

      const response = await this.getAppointments(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene citas de un paciente específico
   */
  async getPatientAppointments(patientId: number, branchId?: number): Promise<AppointmentData[]> {
    try {
      const filters: AppointmentFilters = {
        patient_id: patientId,
        limit: 100
      };

      if (branchId) filters.branch_id = branchId;

      const response = await this.getAppointments(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene citas de un dentista específico
   */
  async getDentistAppointments(dentistId: number, dateFrom?: string, dateTo?: string): Promise<AppointmentData[]> {
    try {
      const filters: AppointmentFilters = {
        dentist_id: dentistId,
        date_from: dateFrom,
        date_to: dateTo,
        limit: 1000
      };

      const response = await this.getAppointments(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Aprobar una cita pendiente de aprobación
   * Solo: Superadmin, Admin Sede, Recepcionista
   */
  async approveAppointment(appointmentId: number, approvalNotes?: string): Promise<AppointmentResponse> {
    try {
      const response = await httpClient.put<AppointmentResponse>(`/appointments/${appointmentId}/approve`, {
        approval_notes: approvalNotes || null
      });

      if (!response.success) {
        throw new Error(response.message || 'Error al aprobar cita');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Rechazar una cita pendiente de aprobación
   * Solo: Superadmin, Admin Sede, Recepcionista
   */
  async rejectAppointment(appointmentId: number, rejectionReason: string): Promise<AppointmentResponse> {
    try {
      if (!rejectionReason || rejectionReason.trim().length < 10) {
        throw new Error('La razón de rechazo debe tener al menos 10 caracteres');
      }

      const response = await httpClient.put<AppointmentResponse>(`/appointments/${appointmentId}/reject`, {
        rejection_reason: rejectionReason.trim()
      });

      if (!response.success) {
        throw new Error(response.message || 'Error al rechazar cita');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene citas pendientes de aprobación
   * Solo: Superadmin, Admin Sede, Recepcionista
   */
  async getPendingApprovalAppointments(branchId?: number): Promise<AppointmentData[]> {
    try {
      const filters: AppointmentFilters = {
        appointment_status_id: 0, // Pendiente de Aprobación
        limit: 1000
      };

      if (branchId) filters.branch_id = branchId;

      const response = await this.getAppointments(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Marca una cita como "No Asistió"
   * Solo: Staff de la sede (Admin, Recepcionista)
   */
  async markAsNoShow(appointmentId: number, data: { notes?: string }): Promise<AppointmentResponse> {
    try {
      const response = await httpClient.post<AppointmentResponse>(`/appointments/${appointmentId}/mark-no-show`, data);

      if (!response.success) {
        throw new Error(response.message || 'Error al marcar como No Asistió');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Propone una reprogramación de cita
   * Puede ser iniciado por: Staff o Paciente
   */
  async rescheduleAppointment(
    appointmentId: number,
    data: {
      new_date: string;
      new_start_time: string;
      new_end_time: string;
      reason?: string;
    }
  ): Promise<ApiResponse> {
    try {
      const response = await httpClient.post(`/appointments/${appointmentId}/reschedule`, data);

      if (!response.success) {
        throw new Error(response.message || 'Error al proponer reprogramación');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Aprueba una propuesta de reprogramación
   * Requiere: reschedule_id de la propuesta
   */
  async approveReschedule(appointmentId: number, rescheduleId: number): Promise<AppointmentResponse> {
    try {
      const response = await httpClient.post<AppointmentResponse>(`/appointments/${appointmentId}/approve-reschedule`, {
        reschedule_id: rescheduleId
      });

      if (!response.success) {
        throw new Error(response.message || 'Error al aprobar reprogramación');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Rechaza una propuesta de reprogramación
   * Requiere: reschedule_id y razón de rechazo
   */
  async rejectReschedule(
    appointmentId: number,
    rescheduleId: number,
    reason: string
  ): Promise<AppointmentResponse> {
    try {
      const response = await httpClient.post<AppointmentResponse>(`/appointments/${appointmentId}/reject-reschedule`, {
        reschedule_id: rescheduleId,
        reason
      });

      if (!response.success) {
        throw new Error(response.message || 'Error al rechazar reprogramación');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reenvía el voucher de una cita rechazada
   * Solo: El paciente dueño de la cita
   */
  async resubmitVoucher(appointmentId: number, voucher: string): Promise<AppointmentResponse> {
    try {
      const response = await httpClient.post<AppointmentResponse>(`/appointments/${appointmentId}/resubmit-voucher`, {
        voucher
      });

      if (!response.success) {
        throw new Error(response.message || 'Error al reenviar voucher');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const appointmentsApi = new AppointmentsApiService();
export default appointmentsApi;

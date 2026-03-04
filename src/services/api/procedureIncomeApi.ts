/**
 * API Service para Ingresos por Procedimientos (Comisiones)
 * Maneja todas las operaciones CRUD de ingresos financieros por procedimientos
 *
 * Incluye soporte para:
 * - Sistema de cuotas (quota_number, is_final_quota, quota_type)
 * - Validacion de 1 cuota por cita (appointment_id)
 * - Guardado en lote de procedimientos completados
 */

import httpClient, { ApiResponse } from './httpClient';

// Interfaces
export interface ProcedureIncomeFilters {
  patient_id?: number;
  consultation_id?: number;
  dentist_id?: number;
  branch_id?: number;
  income_type?: string;
  income_status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface ProcedureIncomeData {
  income_id?: number;
  procedure_history_id?: number | null;
  consultation_id: number;
  patient_id: number;
  branch_id: number;
  income_type: string; // 'odontogram_procedure', 'treatment', 'additional_service', 'diagnostic_exam', 'monthly_quota'
  treatment_plan_item_id?: number | null;
  additional_service_id?: number | null;
  item_name: string;
  item_description?: string | null;
  tooth_position_id?: number | null;
  amount: number;
  discount_amount?: number;
  final_amount?: number;
  currency?: string;
  performed_by_dentist_id: number;
  performed_date?: string;
  performed_time?: string;
  clinical_notes?: string | null;
  income_status?: string; // 'pending', 'confirmed', 'paid', 'cancelled'
  payment_id?: number | null;
  status?: string;
  date_time_registration?: string;

  // Campos para sistema de cuotas
  quota_number?: number | null;
  is_final_quota?: boolean;
  treatment_plan_total?: number | null;
  appointment_id?: number | null;
  quota_type?: string | null; // 'initial', 'monthly', 'final'
  parent_additional_service_id?: number | null;

  // Campo para matching robusto con Checklist
  definitive_condition_id?: number | null;

  // Campo para agrupacion de tratamientos guardados juntos
  batch_id?: string | null;

  // Datos relacionados (joins)
  patient_name?: string;
  patient_dni?: string;
  dentist_name?: string;
  dentist_cop?: string;
  branch_name?: string;
  tooth_number?: string;
  tooth_name?: string;
  appointment_date?: string;
  appointment_time?: string;
  definitive_condition_label?: string;
  dental_condition_id?: number;
}

export interface ProcedureIncomeListResponse {
  success: boolean;
  data: ProcedureIncomeData[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  period?: {
    date_from: string;
    date_to: string;
  };
}

export interface ProcedureIncomeResponse {
  success: boolean;
  data: ProcedureIncomeData;
  message?: string;
}

export interface DentistIncomeSummary {
  income_type: string;
  total_procedures: number;
  total_income: number;
  total_discounts: number;
  unique_patients: number;
}

export interface DentistIncomeSummaryResponse {
  success: boolean;
  data: {
    details: DentistIncomeSummary[];
    totals: {
      total_income: number;
      total_procedures: number;
      total_discounts: number;
    };
    period: {
      date_from: string;
      date_to: string;
    };
  };
}

// Interfaces para sistema de cuotas
export interface QuotaCheckResponse {
  success: boolean;
  data: {
    exists: boolean;
    message: string;
  };
}

export interface QuotaHistoryResponse {
  success: boolean;
  data: {
    quotas: ProcedureIncomeData[];
    summary: {
      total_paid: number;
      quota_count: number;
      is_completed: boolean;
      next_quota_number: number;
    };
  };
}

export interface BatchIncomeResponse {
  success: boolean;
  message: string;
  data: ProcedureIncomeData[];
  errors?: Array<{ item: string; error: string }>;
}

export interface ConsultationIncomeItemsResponse {
  success: boolean;
  data: {
    items: ProcedureIncomeData[];
    grouped: {
      procedures: ProcedureIncomeData[];
      treatments: ProcedureIncomeData[];
      additional_services: ProcedureIncomeData[];
      quotas: ProcedureIncomeData[];
      exams: ProcedureIncomeData[];
    };
    count: number;
  };
}

class ProcedureIncomeApiService {
  /**
   * Obtiene ingresos con filtros
   */
  async getProcedureIncome(filters?: ProcedureIncomeFilters): Promise<ProcedureIncomeListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.consultation_id) params.append('consultation_id', filters.consultation_id.toString());
      if (filters?.dentist_id) params.append('dentist_id', filters.dentist_id.toString());
      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.income_type) params.append('income_type', filters.income_type);
      if (filters?.income_status) params.append('income_status', filters.income_status);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/procedure-income${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<ProcedureIncomeListResponse>(endpoint);

      return {
        success: response.success ?? true,
        data: response.data || [],
        pagination: response.pagination,
        period: response.period
      };
    } catch (error) {
      console.error('Error al obtener ingresos:', error);
      throw error;
    }
  }

  /**
   * Obtiene un ingreso por su ID
   */
  async getProcedureIncomeById(incomeId: number): Promise<ProcedureIncomeResponse> {
    try {
      const response = await httpClient.get<ProcedureIncomeResponse>(`/procedure-income/${incomeId}`);

      if (!response.success || !response.data) {
        throw new Error('Ingreso no encontrado');
      }

      return response;
    } catch (error) {
      console.error('Error al obtener ingreso:', error);
      throw error;
    }
  }

  /**
   * Obtiene ingresos por paciente
   */
  async getPatientIncome(patientId: number): Promise<ProcedureIncomeData[]> {
    try {
      const response = await httpClient.get<ProcedureIncomeListResponse>(`/procedure-income/patient/${patientId}`);

      return response.data || [];
    } catch (error) {
      console.error('Error al obtener ingresos del paciente:', error);
      throw error;
    }
  }

  /**
   * Obtiene ingresos por dentista (para comisiones)
   */
  async getDentistIncome(dentistId: number, dateFrom?: string, dateTo?: string): Promise<ProcedureIncomeListResponse> {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const queryString = params.toString();
      const endpoint = `/procedure-income/dentist/${dentistId}${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<ProcedureIncomeListResponse>(endpoint);

      return {
        success: response.success ?? true,
        data: response.data || [],
        period: response.period
      };
    } catch (error) {
      console.error('Error al obtener ingresos del dentista:', error);
      throw error;
    }
  }

  /**
   * Obtiene resumen de ingresos por dentista
   */
  async getDentistIncomeSummary(dentistId: number, dateFrom?: string, dateTo?: string): Promise<DentistIncomeSummaryResponse> {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const queryString = params.toString();
      const endpoint = `/procedure-income/dentist/${dentistId}/summary${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<DentistIncomeSummaryResponse>(endpoint);

      return response;
    } catch (error) {
      console.error('Error al obtener resumen del dentista:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo registro de ingreso
   */
  async createProcedureIncome(data: Omit<ProcedureIncomeData, 'income_id'>): Promise<ProcedureIncomeResponse> {
    try {
      const response = await httpClient.post<ProcedureIncomeResponse>('/procedure-income', data);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear ingreso');
      }

      return response;
    } catch (error) {
      console.error('Error al crear ingreso:', error);
      throw error;
    }
  }

  /**
   * Actualiza un registro de ingreso
   */
  async updateProcedureIncome(incomeId: number, data: Partial<ProcedureIncomeData>): Promise<ProcedureIncomeResponse> {
    try {
      const response = await httpClient.put<ProcedureIncomeResponse>(`/procedure-income/${incomeId}`, data);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar ingreso');
      }

      return response;
    } catch (error) {
      console.error('Error al actualizar ingreso:', error);
      throw error;
    }
  }

  /**
   * Elimina un registro de ingreso (soft delete)
   */
  async deleteProcedureIncome(incomeId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/procedure-income/${incomeId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar ingreso');
      }

      return response;
    } catch (error) {
      console.error('Error al eliminar ingreso:', error);
      throw error;
    }
  }

  // ============================================
  // METODOS PARA SISTEMA DE CUOTAS
  // ============================================

  /**
   * Verificar si ya existe una cuota para un servicio en una cita
   */
  async checkQuotaExists(appointmentId: number, serviceId: number): Promise<QuotaCheckResponse> {
    try {
      const response = await httpClient.get<QuotaCheckResponse>(
        `/procedure-income/quota/check/${appointmentId}/${serviceId}`
      );
      return response;
    } catch (error) {
      console.error('Error al verificar cuota:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de cuotas de un servicio
   */
  async getQuotaHistory(serviceId: number): Promise<QuotaHistoryResponse> {
    try {
      const response = await httpClient.get<QuotaHistoryResponse>(
        `/procedure-income/quota/history/${serviceId}`
      );
      return response;
    } catch (error) {
      console.error('Error al obtener historial de cuotas:', error);
      throw error;
    }
  }

  /**
   * Crear cuota mensual para servicios adicionales
   */
  async createQuotaPayment(data: Omit<ProcedureIncomeData, 'income_id'>): Promise<ProcedureIncomeResponse> {
    try {
      const response = await httpClient.post<ProcedureIncomeResponse>('/procedure-income/quota', data);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear cuota');
      }

      return response;
    } catch (error) {
      console.error('Error al crear cuota:', error);
      throw error;
    }
  }

  // ============================================
  // METODOS PARA GUARDADO EN LOTE
  // ============================================

  /**
   * Crear multiples registros de ingresos en lote
   * Usado para guardar todos los tratamientos marcados al hacer clic en "Guardar"
   */
  async createBatchProcedureIncome(items: Array<Omit<ProcedureIncomeData, 'income_id'>>): Promise<BatchIncomeResponse> {
    try {
      const response = await httpClient.post<BatchIncomeResponse>('/procedure-income/batch', { items });

      if (!response.success) {
        throw new Error(response.message || 'Error al crear ingresos en lote');
      }

      return response;
    } catch (error) {
      console.error('Error al crear ingresos en lote:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los ingresos registrados para una consulta
   * Usado para determinar que items ya fueron guardados (para bloquearlos)
   */
  async getConsultationIncomeItems(consultationId: number): Promise<ConsultationIncomeItemsResponse> {
    try {
      const response = await httpClient.get<ConsultationIncomeItemsResponse>(
        `/procedure-income/consultation/${consultationId}/items`
      );
      return response;
    } catch (error) {
      console.error('Error al obtener items de consulta:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const procedureIncomeApi = new ProcedureIncomeApiService();
export default procedureIncomeApi;

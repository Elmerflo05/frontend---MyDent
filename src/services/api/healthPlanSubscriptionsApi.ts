/**
 * API Service para Health Plan Subscriptions (Suscripciones extendidas)
 * Maneja suscripciones con voucher y flujo de aprobacion
 */

import httpClient, { ApiResponse } from './httpClient';

// ============================================================================
// TIPOS
// ============================================================================

export interface SubscriptionData {
  subscription_id: number;
  health_plan_id: number;
  patient_id: number;
  subscription_number: string | null;
  start_date: string;
  end_date: string | null;
  subscription_status: string;
  voucher_url: string | null;
  payment_method: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by: number | null;
  approved_at: string | null;
  rejected_by: number | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  first_free_consultation_used: boolean;
  first_free_consultation_date: string | null;
  notes: string | null;
  status: string;
  // Timestamps del registro
  date_time_registration?: string;
  date_time_modification?: string;
  // Datos joined
  plan_name?: string;
  plan_code?: string;
  plan_type?: string;
  monthly_fee?: number;
  coverage_details?: any;
  patient_name?: string;
  identification_number?: string;
  patient_email?: string;
  patient_phone?: string;
  // Para suscripcion activa
  first_free_consultation_available?: boolean;
  // Fechas formateadas en zona horaria Lima (desde el backend)
  fecha_solicitud_formatted?: string;
  fecha_aprobacion_formatted?: string;
  fecha_rechazo_formatted?: string;
}

export interface SubscriptionStats {
  total_active: number;
  total_pending: number;
  total_rejected: number;
  total_monthly_revenue: number;
  by_plan: Array<{
    plan_name: string;
    plan_code: string;
    total_subscriptions: number;
    active_subscriptions: number;
    pending_subscriptions: number;
    rejected_subscriptions: number;
    monthly_revenue: number;
  }>;
}

export interface PendingSubscriptionsResponse {
  success: boolean;
  data: SubscriptionData[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SubscriptionResponse {
  success: boolean;
  data: SubscriptionData;
  message?: string;
}

export interface ActiveSubscriptionResponse {
  success: boolean;
  has_active_plan: boolean;
  data: SubscriptionData | null;
  message?: string;
}

export interface StatsResponse {
  success: boolean;
  data: SubscriptionStats;
}

export interface CreateSubscriptionData {
  health_plan_id: number;
  patient_id: number;
  voucher_file: File;  // Archivo del voucher (imagen)
  payment_method?: string;
  notes?: string;
}

export interface PendingFilters {
  health_plan_id?: number;
  page?: number;
  limit?: number;
}

// ============================================================================
// SERVICIO API
// ============================================================================

class HealthPlanSubscriptionsApiService {
  // ============================================================================
  // ESTADISTICAS (Admin)
  // ============================================================================

  /**
   * Obtener estadisticas de suscripciones
   */
  async getStats(): Promise<StatsResponse> {
    const response = await httpClient.get<StatsResponse>('/health-plan-subscriptions/stats');
    return response as StatsResponse;
  }

  // ============================================================================
  // GESTION DE APROBACIONES (Admin)
  // ============================================================================

  /**
   * Obtener suscripciones pendientes de aprobacion
   */
  async getPendingSubscriptions(filters?: PendingFilters): Promise<PendingSubscriptionsResponse> {
    const params = new URLSearchParams();

    if (filters?.health_plan_id) params.append('health_plan_id', filters.health_plan_id.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = `/health-plan-subscriptions/pending${queryString ? `?${queryString}` : ''}`;

    const response = await httpClient.get<PendingSubscriptionsResponse>(endpoint);
    return response as PendingSubscriptionsResponse;
  }

  /**
   * Aprobar suscripcion
   */
  async approveSubscription(subscriptionId: number): Promise<SubscriptionResponse> {
    const response = await httpClient.post<SubscriptionResponse>(
      `/health-plan-subscriptions/${subscriptionId}/approve`
    );
    return response as SubscriptionResponse;
  }

  /**
   * Rechazar suscripcion
   */
  async rejectSubscription(subscriptionId: number, rejectionReason: string): Promise<SubscriptionResponse> {
    const response = await httpClient.post<SubscriptionResponse>(
      `/health-plan-subscriptions/${subscriptionId}/reject`,
      { rejection_reason: rejectionReason }
    );
    return response as SubscriptionResponse;
  }

  // ============================================================================
  // PRIMERA CONSULTA GRATIS
  // ============================================================================

  /**
   * Verificar disponibilidad de primera consulta gratis
   */
  async checkFirstFreeConsultation(subscriptionId: number): Promise<{ success: boolean; first_free_consultation_available: boolean }> {
    const response = await httpClient.get<{ success: boolean; first_free_consultation_available: boolean }>(
      `/health-plan-subscriptions/${subscriptionId}/first-free-consultation-available`
    );
    return response as { success: boolean; first_free_consultation_available: boolean };
  }

  /**
   * Marcar primera consulta gratis como usada
   */
  async useFirstFreeConsultation(subscriptionId: number): Promise<SubscriptionResponse> {
    const response = await httpClient.post<SubscriptionResponse>(
      `/health-plan-subscriptions/${subscriptionId}/use-first-free-consultation`
    );
    return response as SubscriptionResponse;
  }

  // ============================================================================
  // CONSULTAS POR PACIENTE
  // ============================================================================

  /**
   * Obtener suscripcion activa de un paciente
   */
  async getActiveSubscriptionByPatient(patientId: number): Promise<ActiveSubscriptionResponse> {
    const response = await httpClient.get<ActiveSubscriptionResponse>(
      `/health-plan-subscriptions/patient/${patientId}/active`
    );
    return response as ActiveSubscriptionResponse;
  }

  /**
   * Verificar si paciente tiene plan activo
   */
  async hasActivePlan(patientId: number): Promise<{ success: boolean; has_active_plan: boolean }> {
    const response = await httpClient.get<{ success: boolean; has_active_plan: boolean }>(
      `/health-plan-subscriptions/patient/${patientId}/has-active`
    );
    return response as { success: boolean; has_active_plan: boolean };
  }

  /**
   * Obtener historial de suscripciones de un paciente
   */
  async getPatientHistory(patientId: number): Promise<{ success: boolean; data: SubscriptionData[] }> {
    const response = await httpClient.get<{ success: boolean; data: SubscriptionData[] }>(
      `/health-plan-subscriptions/patient/${patientId}/history`
    );
    return response as { success: boolean; data: SubscriptionData[] };
  }

  // ============================================================================
  // CREAR SUSCRIPCION (Portal Paciente)
  // ============================================================================

  /**
   * Crear suscripcion con voucher (usando FormData para subir archivo)
   */
  async createSubscription(data: CreateSubscriptionData): Promise<SubscriptionResponse> {
    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('health_plan_id', data.health_plan_id.toString());
    formData.append('patient_id', data.patient_id.toString());
    formData.append('voucher', data.voucher_file);  // El campo debe llamarse 'voucher' para Multer

    if (data.payment_method) {
      formData.append('payment_method', data.payment_method);
    }
    if (data.notes) {
      formData.append('notes', data.notes);
    }

    // No establecer Content-Type manualmente - el navegador lo hace automáticamente con el boundary correcto
    const response = await httpClient.post<SubscriptionResponse>(
      '/health-plan-subscriptions',
      formData
    );
    return response as SubscriptionResponse;
  }
}

// Exportar instancia singleton
export const healthPlanSubscriptionsApi = new HealthPlanSubscriptionsApiService();
export default healthPlanSubscriptionsApi;

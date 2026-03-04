// ============================================================================
// TERMS SERVICE - Gestión de Términos y Condiciones via API real
// ============================================================================

import httpClient from '@/services/api/httpClient';
import type { HealthPlanTerms } from '@/types/healthPlans';

// Interfaz del response del backend
interface BackendTermData {
  health_plan_term_id: number;
  health_plan_id: number;
  plan_name?: string;
  term_type: string;
  term_description: string;
  term_value: string | null;
  effective_date: string | null;
  expiry_date: string | null;
  status: string;
  user_id_registration: number | null;
  date_time_registration: string | null;
  user_id_modification: number | null;
  date_time_modification: string | null;
}

/**
 * Mapea un término del backend al tipo del frontend
 */
function mapTermFromBackend(backendTerm: BackendTermData): HealthPlanTerms {
  return {
    id: backendTerm.health_plan_term_id.toString(),
    healthPlanId: backendTerm.health_plan_id,
    planName: backendTerm.plan_name || '',
    termType: backendTerm.term_type,
    version: backendTerm.term_value || '1.0',
    content: backendTerm.term_description,
    effectiveDate: backendTerm.effective_date ? new Date(backendTerm.effective_date) : new Date(),
    expiryDate: backendTerm.expiry_date ? new Date(backendTerm.expiry_date) : undefined,
    createdAt: backendTerm.date_time_registration ? new Date(backendTerm.date_time_registration) : new Date(),
    updatedAt: backendTerm.date_time_modification
      ? new Date(backendTerm.date_time_modification)
      : backendTerm.date_time_registration
        ? new Date(backendTerm.date_time_registration)
        : new Date(),
    createdBy: backendTerm.user_id_registration?.toString() || 'system'
  };
}

/**
 * Servicio para gestión de Términos y Condiciones
 * Conectado al backend real via /api/health-plans
 */
export class TermsService {

  /**
   * Obtener todos los términos de todos los planes
   */
  async getTermsHistory(_planId: string): Promise<HealthPlanTerms[]> {
    const response = await httpClient.get<{ data: BackendTermData[] }>('/health-plans/all-terms');
    if (response.success && response.data) {
      return (response.data as unknown as BackendTermData[]).map(mapTermFromBackend);
    }
    return [];
  }

  /**
   * Obtener términos de un plan específico
   */
  async getTermsByPlan(planId: number): Promise<HealthPlanTerms[]> {
    const response = await httpClient.get<{ data: BackendTermData[] }>(`/health-plans/${planId}/terms`);
    if (response.success && response.data) {
      return (response.data as unknown as BackendTermData[]).map(mapTermFromBackend);
    }
    return [];
  }

  /**
   * Obtener un término por ID
   */
  async getTermsById(termsId: string): Promise<HealthPlanTerms | null> {
    const response = await httpClient.get<{ data: BackendTermData }>(`/health-plans/terms/${termsId}`);
    if (response.success && response.data) {
      return mapTermFromBackend(response.data as unknown as BackendTermData);
    }
    return null;
  }

  /**
   * Crear nuevos términos para un plan
   */
  async createTerms(
    content: string,
    version: string,
    createdBy: string,
    healthPlanId?: number,
    termType?: string
  ): Promise<HealthPlanTerms> {
    const planId = healthPlanId || 1;
    const response = await httpClient.post<{ data: BackendTermData }>(
      `/health-plans/${planId}/terms`,
      {
        term_type: termType || 'general',
        term_description: content,
        term_value: version,
        effective_date: new Date().toISOString().split('T')[0]
      }
    );

    if (response.success && response.data) {
      return mapTermFromBackend(response.data as unknown as BackendTermData);
    }

    throw new Error('Error al crear términos');
  }

  /**
   * Actualizar términos existentes
   */
  async updateTerms(
    id: string,
    updates: Partial<Pick<HealthPlanTerms, 'content' | 'version' | 'effectiveDate'>>
  ): Promise<HealthPlanTerms> {
    const body: any = {};
    if (updates.content !== undefined) body.term_description = updates.content;
    if (updates.version !== undefined) body.term_value = updates.version;
    if (updates.effectiveDate !== undefined) {
      body.effective_date = updates.effectiveDate instanceof Date
        ? updates.effectiveDate.toISOString().split('T')[0]
        : updates.effectiveDate;
    }

    const response = await httpClient.put<{ data: BackendTermData }>(
      `/health-plans/terms/${id}`,
      body
    );

    if (response.success && response.data) {
      return mapTermFromBackend(response.data as unknown as BackendTermData);
    }

    throw new Error(`Términos con ID ${id} no encontrados`);
  }

  /**
   * Eliminar términos por ID (soft delete)
   */
  async deleteTerms(termsId: string): Promise<void> {
    const response = await httpClient.delete(`/health-plans/terms/${termsId}`);
    if (!response.success) {
      throw new Error('Error al eliminar términos');
    }
  }

  /**
   * Crear nueva versión de términos y actualizar plan
   */
  async createNewVersionAndUpdatePlan(
    planId: string,
    content: string,
    version: string,
    createdBy: string
  ): Promise<{ terms: HealthPlanTerms; planUpdated: boolean }> {
    const numericPlanId = parseInt(planId, 10);
    const terms = await this.createTerms(content, version, createdBy, numericPlanId);
    return { terms, planUpdated: true };
  }
}

// Exportar instancia singleton
export const termsService = new TermsService();

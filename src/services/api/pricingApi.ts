/**
 * API Service para Pricing (Servicio de precios por plan de salud)
 * Single Source of Truth para precios
 */

import httpClient from './httpClient';

// ============================================================================
// TIPOS
// ============================================================================

export interface PatientActivePlan {
  subscription_id: number;
  first_free_consultation_used: boolean;
  first_free_consultation_date: string | null;
  health_plan_id: number;
  plan_name: string;
  plan_code: string;
  plan_type: string;
  monthly_fee: number;
  coverage_details: any;
  coverage_type: 'titular' | 'dependiente';
  relationship?: string;
  titular_name?: string;
  start_date: string;
  end_date: string | null;
}

export interface PriceCalculation {
  sub_procedure_id: number;
  sub_procedure_code: string;
  sub_procedure_name: string;
  specialty: string;
  price_without_plan: number;
  price_with_plan: number;
  discount_amount: number;
  discount_percentage: number;
  plan_applied: string | null;
  plan_name: string | null;
  coverage_type: string | null;
  is_included_in_plan: boolean;
  has_discount: boolean;
}

export interface MultiplePricesResult {
  details: PriceCalculation[];
  totals: {
    total_without_plan: number;
    total_with_plan: number;
    total_discount: number;
  };
  plan: {
    plan_code: string;
    plan_name: string;
    coverage_type: string;
  } | null;
  item_count: number;
}

export interface FirstFreeConsultationStatus {
  available: boolean;
  reason?: string;
  used_date?: string;
  plan_name?: string;
  subscription_id?: number;
}

export interface CoverageSummary {
  has_coverage: boolean;
  plan_code?: string;
  plan_name?: string;
  coverage_type?: 'titular' | 'dependiente';
  coverage_label?: string;
  monthly_fee?: number;
  start_date?: string;
  end_date?: string;
  first_free_consultation?: FirstFreeConsultationStatus;
  message: string;
}

export interface ActivePlanResponse {
  success: boolean;
  has_active_plan: boolean;
  data: PatientActivePlan | null;
}

export interface PriceResponse {
  success: boolean;
  data: PriceCalculation;
}

export interface MultiplePricesResponse {
  success: boolean;
  data: MultiplePricesResult;
}

export interface FirstFreeConsultationResponse {
  success: boolean;
  data: FirstFreeConsultationStatus;
}

export interface CoverageSummaryResponse {
  success: boolean;
  data: CoverageSummary;
}

// ============================================================================
// SERVICIO API
// ============================================================================

class PricingApiService {
  // ============================================================================
  // CONSULTA DE PLAN Y COBERTURA
  // ============================================================================

  /**
   * Obtener plan activo de un paciente
   */
  async getPatientActivePlan(patientId: number): Promise<ActivePlanResponse> {
    const response = await httpClient.get<ActivePlanResponse>(
      `/pricing/patient/${patientId}/active-plan`
    );
    return response as ActivePlanResponse;
  }

  /**
   * Obtener resumen de cobertura de un paciente (para mostrar al dentista)
   */
  async getPatientCoverageSummary(patientId: number): Promise<CoverageSummaryResponse> {
    const response = await httpClient.get<CoverageSummaryResponse>(
      `/pricing/patient/${patientId}/coverage-summary`
    );
    return response as CoverageSummaryResponse;
  }

  // ============================================================================
  // CALCULO DE PRECIOS
  // ============================================================================

  /**
   * Calcular precio de un sub-procedimiento para un paciente
   */
  async calculatePrice(subProcedureId: number, patientId: number): Promise<PriceResponse> {
    const response = await httpClient.get<PriceResponse>(
      `/pricing/calculate/${subProcedureId}/patient/${patientId}`
    );
    return response as PriceResponse;
  }

  /**
   * Calcular precio por codigo de sub-procedimiento
   */
  async calculatePriceByCode(code: string, patientId: number): Promise<PriceResponse> {
    const response = await httpClient.get<PriceResponse>(
      `/pricing/calculate/code/${code}/patient/${patientId}`
    );
    return response as PriceResponse;
  }

  /**
   * Calcular precios de multiples sub-procedimientos
   */
  async calculateMultiplePrices(subProcedureIds: number[], patientId: number): Promise<MultiplePricesResponse> {
    const response = await httpClient.post<MultiplePricesResponse>(
      `/pricing/calculate-multiple/patient/${patientId}`,
      { sub_procedure_ids: subProcedureIds }
    );
    return response as MultiplePricesResponse;
  }

  // ============================================================================
  // PRIMERA CONSULTA GRATIS
  // ============================================================================

  /**
   * Verificar disponibilidad de primera consulta gratis
   */
  async checkFirstFreeConsultation(patientId: number): Promise<FirstFreeConsultationResponse> {
    const response = await httpClient.get<FirstFreeConsultationResponse>(
      `/pricing/patient/${patientId}/first-free-consultation`
    );
    return response as FirstFreeConsultationResponse;
  }

  /**
   * Usar primera consulta gratis (marcar como usada)
   */
  async useFirstFreeConsultation(patientId: number): Promise<{ success: boolean; message: string; data: any }> {
    const response = await httpClient.post<{ success: boolean; message: string; data: any }>(
      `/pricing/patient/${patientId}/use-first-free-consultation`
    );
    return response as { success: boolean; message: string; data: any };
  }
}

// Exportar instancia singleton
export const pricingApi = new PricingApiService();
export default pricingApi;

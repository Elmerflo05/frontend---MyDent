/**
 * API Service para Precios de Procedimientos de Condiciones
 *
 * ARQUITECTURA: Los precios ahora viven en los PROCEDIMIENTOS, no en las CONDICIONES
 *
 * Este servicio obtiene:
 * - Procedimientos de una condicion del odontograma con sus precios por plan
 * - Precio de un procedimiento segun el plan del paciente
 * - Precios multiples para calcular totales
 */

import httpClient from './httpClient';

// ============================================================================
// TIPOS
// ============================================================================

export interface ConditionProcedure {
  condition_procedure_id: number;
  odontogram_condition_id: number;
  procedure_code: string;
  procedure_name: string;
  specialty: string;
  price_without_plan: number;
  price_plan_personal: number | null;
  price_plan_familiar: number | null;
  price_plan_platinium: number | null;
  price_plan_oro: number | null;
  estimated_duration: number | null;
  requires_anesthesia: boolean;
  observations: string | null;
  display_order: number;
  condition_code: string;
  condition_name: string;
  category: string;
}

export interface ProcedurePriceCalculation {
  condition_procedure_id: number;
  procedure_code: string;
  procedure_name: string;
  specialty: string;
  condition_code: string;
  condition_name: string;
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

export interface MultipleProcedurePricesResult {
  details: ProcedurePriceCalculation[];
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

export interface ConditionWithProcedures {
  condition_id: number;
  condition_code: string;
  condition_name: string;
  category: string;
  description: string | null;
  symbol_type: string;
  color_type: string;
  procedures: Array<{
    condition_procedure_id: number;
    procedure_code: string;
    procedure_name: string;
    specialty: string;
    price_without_plan: number;
    price_plan_personal: number | null;
    price_plan_familiar: number | null;
    price_plan_platinium: number | null;
    price_plan_oro: number | null;
    display_order: number;
  }> | null;
}

export interface PricingStats {
  condition_code: string;
  condition_name: string;
  category: string;
  procedure_count: number;
  min_price: number;
  max_price: number;
  avg_price: number;
  total_price: number;
}

// ============================================================================
// RESPUESTAS API
// ============================================================================

interface ProceduresResponse {
  success: boolean;
  data: ConditionProcedure[];
  count: number;
}

interface ProcedureResponse {
  success: boolean;
  data: ConditionProcedure;
}

interface PriceResponse {
  success: boolean;
  data: ProcedurePriceCalculation;
}

interface MultiplePricesResponse {
  success: boolean;
  data: MultipleProcedurePricesResult;
}

interface AllConditionsResponse {
  success: boolean;
  data: ConditionWithProcedures[];
  count: number;
}

interface StatsResponse {
  success: boolean;
  data: PricingStats[];
}

// ============================================================================
// SERVICIO API
// ============================================================================

class ConditionProcedurePricingApiService {
  private baseUrl = '/condition-procedure-pricing';

  // ============================================================================
  // OBTENCION DE PROCEDIMIENTOS
  // ============================================================================

  /**
   * Obtener procedimientos de una condicion por ID
   */
  async getProceduresByConditionId(conditionId: number): Promise<ProceduresResponse> {
    const response = await httpClient.get<ProceduresResponse>(
      `${this.baseUrl}/condition/${conditionId}/procedures`
    );
    return response as ProceduresResponse;
  }

  /**
   * Obtener procedimientos de una condicion por codigo
   */
  async getProceduresByConditionCode(conditionCode: string): Promise<ProceduresResponse> {
    const response = await httpClient.get<ProceduresResponse>(
      `${this.baseUrl}/condition/code/${encodeURIComponent(conditionCode)}/procedures`
    );
    return response as ProceduresResponse;
  }

  /**
   * Obtener un procedimiento especifico
   */
  async getProcedure(procedureId: number): Promise<ProcedureResponse> {
    const response = await httpClient.get<ProcedureResponse>(
      `${this.baseUrl}/procedure/${procedureId}`
    );
    return response as ProcedureResponse;
  }

  /**
   * Obtener todas las condiciones con sus procedimientos y precios
   */
  async getAllConditionsWithProcedures(): Promise<AllConditionsResponse> {
    const response = await httpClient.get<AllConditionsResponse>(
      `${this.baseUrl}/all-with-prices`
    );
    return response as AllConditionsResponse;
  }

  // ============================================================================
  // CALCULO DE PRECIOS
  // ============================================================================

  /**
   * Obtener precio de un procedimiento segun plan
   */
  async getProcedurePrice(procedureId: number, planCode?: string): Promise<PriceResponse> {
    const url = planCode
      ? `${this.baseUrl}/procedure/${procedureId}/price?plan_code=${planCode}`
      : `${this.baseUrl}/procedure/${procedureId}/price`;

    const response = await httpClient.get<PriceResponse>(url);
    return response as PriceResponse;
  }

  /**
   * Obtener precio de un procedimiento para un paciente
   * (Detecta automaticamente el plan activo del paciente)
   */
  async getProcedurePriceForPatient(
    procedureId: number,
    patientId: number
  ): Promise<PriceResponse> {
    const response = await httpClient.get<PriceResponse>(
      `${this.baseUrl}/procedure/${procedureId}/price-for-patient/${patientId}`
    );
    return response as PriceResponse;
  }

  /**
   * Calcular precios de multiples procedimientos para un paciente
   */
  async calculateMultiplePrices(
    procedureIds: number[],
    patientId: number
  ): Promise<MultiplePricesResponse> {
    const response = await httpClient.post<MultiplePricesResponse>(
      `${this.baseUrl}/calculate-multiple/patient/${patientId}`,
      { procedure_ids: procedureIds }
    );
    return response as MultiplePricesResponse;
  }

  // ============================================================================
  // ACTUALIZACION DE PRECIOS
  // ============================================================================

  /**
   * Actualizar precios de un procedimiento
   */
  async updateProcedurePrices(
    procedureId: number,
    prices: {
      price_without_plan?: number;
      price_plan_personal?: number | null;
      price_plan_familiar?: number | null;
      price_plan_platinium?: number | null;
      price_plan_oro?: number | null;
    }
  ): Promise<{ success: boolean; message: string; data: ConditionProcedure }> {
    const response = await httpClient.put<{ success: boolean; message: string; data: ConditionProcedure }>(
      `${this.baseUrl}/procedure/${procedureId}/prices`,
      prices
    );
    return response;
  }

  /**
   * Actualizar precios de todos los procedimientos de una condicion
   */
  async updateConditionProceduresPrices(
    conditionId: number,
    prices: {
      price_without_plan?: number;
      price_plan_personal?: number | null;
      price_plan_familiar?: number | null;
      price_plan_platinium?: number | null;
      price_plan_oro?: number | null;
    }
  ): Promise<{ success: boolean; message: string; data: ConditionProcedure[] }> {
    const response = await httpClient.put<{ success: boolean; message: string; data: ConditionProcedure[] }>(
      `${this.baseUrl}/condition/${conditionId}/prices`,
      prices
    );
    return response;
  }

  // ============================================================================
  // ESTADISTICAS
  // ============================================================================

  /**
   * Obtener estadisticas de precios por condicion
   */
  async getPricingStats(): Promise<StatsResponse> {
    const response = await httpClient.get<StatsResponse>(
      `${this.baseUrl}/stats/by-condition`
    );
    return response as StatsResponse;
  }
}

// Exportar instancia singleton
export const conditionProcedurePricingApi = new ConditionProcedurePricingApiService();
export default conditionProcedurePricingApi;

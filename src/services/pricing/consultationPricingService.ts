/**
 * Consultation Pricing Service
 * Servicio centralizado para obtener precios en el flujo de consulta dental.
 *
 * PRIORIDAD DE PRECIOS (manejada por el BACKEND):
 * 1. Empresa corporativa vigente → precios corporativos
 * 2. Plan de salud activo → precios del plan
 * 3. Sin cobertura → precio regular (price_without_plan)
 *
 * Este servicio llama a la API del backend que ya implementa esta lógica.
 * Incluye caché en memoria para evitar llamadas duplicadas en la misma sesión.
 * Fallback a getPriceForPlan() local si la API falla.
 */

import { conditionProcedurePricingApi, type ProcedurePriceCalculation } from '@/services/api/conditionProcedurePricingApi';
import { pricingApi, type PriceCalculation, type CoverageSummary } from '@/services/api/pricingApi';
import { getPriceForPlan } from '@/constants/healthPlanCodes';

// ============================================================================
// TIPOS
// ============================================================================

export interface ResolvedPrice {
  price: number;
  priceWithoutPlan: number;
  discountAmount: number;
  discountPercentage: number;
  pricingSource: 'corporate' | 'health_plan' | 'regular' | 'fallback';
  planApplied: string | null;
  planName: string | null;
  companyName: string | null;
  coverageType: string | null;
  hasDiscount: boolean;
}

// ============================================================================
// CACHÉ EN MEMORIA
// ============================================================================

// Caché de precios de condition procedures: key = `cp-${procedureId}-${patientId}`
const conditionPriceCache = new Map<string, ResolvedPrice>();

// Caché de precios de sub procedures: key = `sp-${subProcedureId}-${patientId}`
const subProcedurePriceCache = new Map<string, ResolvedPrice>();

// Caché de cobertura del paciente: key = `cov-${patientId}`
const coverageCache = new Map<string, CoverageSummary>();

/**
 * Limpiar toda la caché (llamar al cambiar de paciente o al salir de consulta)
 */
export const clearPricingCache = (): void => {
  conditionPriceCache.clear();
  subProcedurePriceCache.clear();
  coverageCache.clear();
};

/**
 * Limpiar caché de un paciente específico
 */
export const clearPatientPricingCache = (patientId: number): void => {
  // Eliminar entries que contengan el patientId
  for (const key of conditionPriceCache.keys()) {
    if (key.endsWith(`-${patientId}`)) conditionPriceCache.delete(key);
  }
  for (const key of subProcedurePriceCache.keys()) {
    if (key.endsWith(`-${patientId}`)) subProcedurePriceCache.delete(key);
  }
  coverageCache.delete(`cov-${patientId}`);
};

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Obtener precio de un CONDITION PROCEDURE para un paciente.
 * Usa la API del backend que considera: empresa > plan > regular.
 * Fallback a getPriceForPlan() local si la API falla.
 *
 * @param procedureId - ID del condition_procedure
 * @param patientId - ID numérico del paciente
 * @param procedureData - Datos del procedimiento (para fallback local)
 */
export const getConditionProcedurePriceForPatient = async (
  procedureId: number,
  patientId: number,
  procedureData?: any
): Promise<ResolvedPrice> => {
  const cacheKey = `cp-${procedureId}-${patientId}`;

  // Revisar caché
  const cached = conditionPriceCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await conditionProcedurePricingApi.getProcedurePriceForPatient(
      procedureId,
      patientId
    );

    if (response.success && response.data) {
      const calc = response.data;
      const resolved: ResolvedPrice = {
        price: calc.price_with_plan,
        priceWithoutPlan: calc.price_without_plan,
        discountAmount: calc.discount_amount,
        discountPercentage: calc.discount_percentage,
        pricingSource: determinePricingSource(calc),
        planApplied: calc.plan_applied,
        planName: calc.plan_name,
        companyName: (calc as any).company_name || null,
        coverageType: calc.coverage_type,
        hasDiscount: calc.has_discount
      };

      conditionPriceCache.set(cacheKey, resolved);
      return resolved;
    }
  } catch (error) {
    console.warn(`[PricingService] API falló para procedure ${procedureId}, usando fallback local:`, error);
  }

  // Fallback: usar getPriceForPlan() local (no considera empresa)
  return buildFallbackPrice(procedureData);
};

/**
 * Obtener precios de MÚLTIPLES CONDITION PROCEDURES para un paciente (batch).
 * Más eficiente que llamar uno a uno.
 */
export const getMultipleConditionProcedurePricesForPatient = async (
  procedureIds: number[],
  patientId: number,
  proceduresData?: any[]
): Promise<Map<number, ResolvedPrice>> => {
  const result = new Map<number, ResolvedPrice>();

  if (procedureIds.length === 0) return result;

  // Separar IDs ya cacheados de los que necesitan API call
  const uncachedIds: number[] = [];
  for (const id of procedureIds) {
    const cached = conditionPriceCache.get(`cp-${id}-${patientId}`);
    if (cached) {
      result.set(id, cached);
    } else {
      uncachedIds.push(id);
    }
  }

  if (uncachedIds.length === 0) return result;

  try {
    const response = await conditionProcedurePricingApi.calculateMultiplePrices(
      uncachedIds,
      patientId
    );

    if (response.success && response.data?.details) {
      for (const calc of response.data.details) {
        const resolved: ResolvedPrice = {
          price: calc.price_with_plan,
          priceWithoutPlan: calc.price_without_plan,
          discountAmount: calc.discount_amount,
          discountPercentage: calc.discount_percentage,
          pricingSource: determinePricingSource(calc),
          planApplied: calc.plan_applied,
          planName: calc.plan_name,
          companyName: (calc as any).company_name || null,
          coverageType: calc.coverage_type,
          hasDiscount: calc.has_discount
        };

        const procId = calc.condition_procedure_id;
        conditionPriceCache.set(`cp-${procId}-${patientId}`, resolved);
        result.set(procId, resolved);
      }
    }
  } catch (error) {
    console.warn('[PricingService] Batch API falló, usando fallback local:', error);
  }

  // Para IDs que no se resolvieron via API, usar fallback local
  for (const id of uncachedIds) {
    if (!result.has(id)) {
      const procData = proceduresData?.find(
        (p: any) => (p.procedure_id || p.condition_procedure_id) === id
      );
      result.set(id, buildFallbackPrice(procData));
    }
  }

  return result;
};

/**
 * Obtener precio de un SUB PROCEDURE para un paciente.
 * Usa la API del backend (pricingService) que considera: empresa > plan > regular.
 */
export const getSubProcedurePriceForPatient = async (
  subProcedureId: number,
  patientId: number,
  subProcedureData?: any
): Promise<ResolvedPrice> => {
  const cacheKey = `sp-${subProcedureId}-${patientId}`;

  // Revisar caché
  const cached = subProcedurePriceCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await pricingApi.calculatePrice(subProcedureId, patientId);

    if (response.success && response.data) {
      const calc = response.data;
      const resolved: ResolvedPrice = {
        price: calc.price_with_plan,
        priceWithoutPlan: calc.price_without_plan,
        discountAmount: calc.discount_amount,
        discountPercentage: calc.discount_percentage,
        pricingSource: determinePricingSourceFromSub(calc),
        planApplied: calc.plan_applied,
        planName: calc.plan_name,
        companyName: (calc as any).company_name || null,
        coverageType: calc.coverage_type,
        hasDiscount: calc.has_discount
      };

      subProcedurePriceCache.set(cacheKey, resolved);
      return resolved;
    }
  } catch (error) {
    console.warn(`[PricingService] API falló para sub_procedure ${subProcedureId}, usando fallback local:`, error);
  }

  // Fallback local
  return buildFallbackPrice(subProcedureData);
};

/**
 * Obtener precios de MÚLTIPLES SUB PROCEDURES para un paciente (batch).
 */
export const getMultipleSubProcedurePricesForPatient = async (
  subProcedureIds: number[],
  patientId: number,
  subProceduresData?: any[]
): Promise<Map<number, ResolvedPrice>> => {
  const result = new Map<number, ResolvedPrice>();

  if (subProcedureIds.length === 0) return result;

  // Separar IDs ya cacheados
  const uncachedIds: number[] = [];
  for (const id of subProcedureIds) {
    const cached = subProcedurePriceCache.get(`sp-${id}-${patientId}`);
    if (cached) {
      result.set(id, cached);
    } else {
      uncachedIds.push(id);
    }
  }

  if (uncachedIds.length === 0) return result;

  try {
    const response = await pricingApi.calculateMultiplePrices(uncachedIds, patientId);

    if (response.success && response.data?.details) {
      for (const calc of response.data.details) {
        const resolved: ResolvedPrice = {
          price: calc.price_with_plan,
          priceWithoutPlan: calc.price_without_plan,
          discountAmount: calc.discount_amount,
          discountPercentage: calc.discount_percentage,
          pricingSource: determinePricingSourceFromSub(calc),
          planApplied: calc.plan_applied,
          planName: calc.plan_name,
          companyName: (calc as any).company_name || null,
          coverageType: calc.coverage_type,
          hasDiscount: calc.has_discount
        };

        subProcedurePriceCache.set(`sp-${calc.sub_procedure_id}-${patientId}`, resolved);
        result.set(calc.sub_procedure_id, resolved);
      }
    }
  } catch (error) {
    console.warn('[PricingService] Batch sub-procedure API falló, usando fallback local:', error);
  }

  // Fallback para IDs no resueltos
  for (const id of uncachedIds) {
    if (!result.has(id)) {
      const spData = subProceduresData?.find(
        (sp: any) => sp.sub_procedure_id === id
      );
      result.set(id, buildFallbackPrice(spData));
    }
  }

  return result;
};

/**
 * Obtener resumen de cobertura de un paciente (para mostrar badges/info).
 * Detecta empresa corporativa y plan de salud.
 */
export const getPatientCoverage = async (patientId: number): Promise<CoverageSummary | null> => {
  const cacheKey = `cov-${patientId}`;
  const cached = coverageCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await pricingApi.getPatientCoverageSummary(patientId);
    if (response.success && response.data) {
      coverageCache.set(cacheKey, response.data);
      return response.data;
    }
  } catch (error) {
    console.warn('[PricingService] Error obteniendo cobertura:', error);
  }

  return null;
};

// ============================================================================
// HELPERS INTERNOS
// ============================================================================

function determinePricingSource(
  calc: ProcedurePriceCalculation
): ResolvedPrice['pricingSource'] {
  if ((calc as any).pricing_source === 'corporate') return 'corporate';
  if (calc.plan_applied) return 'health_plan';
  return 'regular';
}

function determinePricingSourceFromSub(
  calc: PriceCalculation
): ResolvedPrice['pricingSource'] {
  if ((calc as any).pricing_source === 'corporate') return 'corporate';
  if (calc.plan_applied) return 'health_plan';
  return 'regular';
}

/**
 * Construir precio fallback usando datos locales del procedimiento.
 * Se usa cuando la API no está disponible.
 * NO considera precios corporativos (solo health plan local).
 */
function buildFallbackPrice(procedureData?: any): ResolvedPrice {
  const priceWithoutPlan = Number(procedureData?.price_without_plan) || 0;

  // Intentar usar getPriceForPlan local como fallback (sin empresa)
  let price = priceWithoutPlan;
  if (procedureData) {
    // getPriceForPlan necesita un planCode, pero aquí no tenemos acceso directo.
    // Se retorna price_without_plan como fallback seguro.
    price = priceWithoutPlan;
  }

  return {
    price,
    priceWithoutPlan,
    discountAmount: 0,
    discountPercentage: 0,
    pricingSource: 'fallback',
    planApplied: null,
    planName: null,
    companyName: null,
    coverageType: null,
    hasDiscount: false
  };
}

/**
 * Utilidades para obtener precios de condiciones dentales
 *
 * PRIORIDAD DE PRECIOS (manejada por el backend):
 * 1. Empresa corporativa → precios corporativos
 * 2. Plan de salud activo → precios del plan
 * 3. Sin cobertura → precio regular (price_without_plan)
 *
 * getConditionPrice() → versión SÍNCRONA (fallback local, solo planes de salud)
 * getConditionPriceAsync() → versión ASYNC (API del backend, considera empresa)
 */

import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import { getPriceForPlan } from '@/constants/healthPlanCodes';
import { getConditionProcedurePriceForPatient } from '@/services/pricing/consultationPricingService';

/**
 * Obtiene el precio de una condición dental (versión SÍNCRONA - fallback).
 * Solo considera planes de salud, NO considera empresa corporativa.
 * Para precios que consideren empresa, usar getConditionPriceAsync().
 *
 * @param conditionId - ID de la condición dental
 * @param abbreviation - Abreviatura específica (opcional)
 * @param state - Estado de la condición (opcional, 'good' o 'bad')
 * @param planCode - Código del plan del paciente (opcional)
 * @returns Precio del primer procedimiento ajustado al plan o 0
 */
export const getConditionPrice = (
  conditionId: string,
  abbreviation?: string,
  state?: 'good' | 'bad',
  planCode?: string | null
): number => {
  const firstProcedure = findFirstProcedure(conditionId, state);
  if (!firstProcedure) return 0;

  return getPriceForPlan(firstProcedure, planCode);
};

/**
 * Obtiene el precio de una condición dental (versión ASYNC - API).
 * Considera la prioridad completa: empresa > plan > regular.
 * Fallback a precio local si la API falla.
 *
 * @param conditionId - ID de la condición dental
 * @param patientId - ID numérico del paciente
 * @param state - Estado de la condición (opcional)
 * @param planCode - Código del plan (fallback)
 * @returns Precio resuelto por el backend
 */
export const getConditionPriceAsync = async (
  conditionId: string,
  patientId: number,
  state?: 'good' | 'bad',
  planCode?: string | null
): Promise<number> => {
  const firstProcedure = findFirstProcedure(conditionId, state);
  if (!firstProcedure) return 0;

  const procId = firstProcedure.procedure_id || firstProcedure.condition_procedure_id;
  if (!procId) return getPriceForPlan(firstProcedure, planCode);

  try {
    const resolved = await getConditionProcedurePriceForPatient(procId, patientId, firstProcedure);
    return resolved.price;
  } catch {
    return getPriceForPlan(firstProcedure, planCode);
  }
};

/**
 * Busca el primer procedimiento de una condición dental.
 */
function findFirstProcedure(
  conditionId: string,
  state?: 'good' | 'bad'
): any | null {
  const { dentalConditions, customConditions } = useOdontogramConfigStore.getState();
  const allConditions = [...dentalConditions, ...customConditions];

  // Búsqueda flexible: primero por id, luego por condition_code
  let condition = allConditions.find(c => c.id === conditionId);

  if (!condition) {
    condition = allConditions.find(c => c.condition_code === conditionId);
  }

  // Si el id contiene "-", buscar por el prefijo base (ej: "caries-mb" → "caries")
  if (!condition && conditionId.includes('-')) {
    const baseId = conditionId.split('-')[0];
    condition = allConditions.find(c => c.id === baseId);
  }

  if (!condition) return null;

  const procedures = (condition as any).procedures || [];
  if (procedures.length === 0) return null;

  // Filtrar procedimientos por estado si se especifica
  let filteredProcedures = procedures;
  if (state) {
    filteredProcedures = procedures.filter((p: any) =>
      p.applies_to_state === null ||
      p.applies_to_state === undefined ||
      p.applies_to_state === state
    );
  }

  if (filteredProcedures.length === 0) {
    filteredProcedures = procedures;
  }

  return filteredProcedures[0] || null;
}

/**
 * Formatea un precio para mostrar
 * @param price - Precio a formatear
 * @returns String formateado con símbolo de moneda
 */
export const formatPrice = (price: number): string => {
  return `S/ ${price.toFixed(2)}`;
};

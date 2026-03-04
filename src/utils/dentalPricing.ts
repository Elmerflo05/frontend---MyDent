/**
 * Utilidades para obtener precios de condiciones dentales desde la base de datos
 */

import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import { getPriceForPlan } from '@/constants/healthPlanCodes';

/**
 * Obtiene el precio de una condición dental desde la base de datos
 * El precio se obtiene del PRIMER procedimiento registrado (Single Source of Truth).
 * Si se proporciona planCode, retorna el precio ajustado al plan del paciente.
 * Si no hay procedimientos, retorna 0.
 *
 * @param conditionId - ID de la condición dental
 * @param abbreviation - Abreviatura específica (opcional, para condiciones con variantes)
 * @param state - Estado de la condición (opcional, 'good' o 'bad')
 * @param planCode - Código del plan del paciente (opcional, ej: 'familiar', 'personal')
 * @returns Precio del primer procedimiento (ajustado al plan si se proporciona) o 0
 */
export const getConditionPrice = (
  conditionId: string,
  abbreviation?: string,
  state?: 'good' | 'bad',
  planCode?: string | null
): number => {
  // Obtener condiciones desde el store (BD)
  const { dentalConditions, customConditions } = useOdontogramConfigStore.getState();
  const allConditions = [...dentalConditions, ...customConditions];

  // Búsqueda flexible: primero por id, luego por condition_code
  let condition = allConditions.find(c => c.id === conditionId);

  // Si no encuentra por id, buscar por condition_code
  if (!condition) {
    condition = allConditions.find(c => c.condition_code === conditionId);
  }

  // Si aún no encuentra y el id contiene "-", buscar por el prefijo base
  // Ejemplo: "caries-mb" → buscar "caries"
  if (!condition && conditionId.includes('-')) {
    const baseId = conditionId.split('-')[0];
    condition = allConditions.find(c => c.id === baseId);
  }

  if (!condition) return 0;

  // Obtener procedimientos de la condición
  const procedures = (condition as any).procedures || [];

  // Si no hay procedimientos, retornar 0
  if (procedures.length === 0) return 0;

  // Filtrar procedimientos por estado si se especifica
  let filteredProcedures = procedures;
  if (state) {
    // Filtrar procedimientos que apliquen al estado especificado
    // applies_to_state: null = ambos, 'good' = solo buen estado, 'bad' = solo mal estado
    filteredProcedures = procedures.filter((p: any) =>
      p.applies_to_state === null ||
      p.applies_to_state === undefined ||
      p.applies_to_state === state
    );
  }

  // Si no hay procedimientos después del filtro, usar todos
  if (filteredProcedures.length === 0) {
    filteredProcedures = procedures;
  }

  // Obtener el precio del PRIMER procedimiento registrado
  // Si hay planCode, retorna el precio ajustado al plan; si no, retorna price_without_plan
  const firstProcedure = filteredProcedures[0];
  if (!firstProcedure) return 0;

  return getPriceForPlan(firstProcedure, planCode);
};

/**
 * Formatea un precio para mostrar
 * @param price - Precio a formatear
 * @returns String formateado con símbolo de moneda
 */
export const formatPrice = (price: number): string => {
  return `S/ ${price.toFixed(2)}`;
};

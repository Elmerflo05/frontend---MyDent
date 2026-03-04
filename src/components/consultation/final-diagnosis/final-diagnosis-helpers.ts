import type { DiagnosticCondition, DefinitiveDiagnosticCondition } from '@/types';

/**
 * Calcula el precio total de un array de condiciones
 */
export const calculateTotalPrice = (
  conditions: DiagnosticCondition[] | DefinitiveDiagnosticCondition[]
): number => {
  return conditions.reduce((sum, condition) => {
    if ('price' in condition) {
      const price = Number(condition.price) || 0;
      return sum + price;
    }
    if ('definitive' in condition) {
      // Priorizar el precio del procedimiento seleccionado si existe
      const conditionAny = condition as any;
      const procedurePrice = conditionAny.procedure_price;

      // Si hay un procedimiento seleccionado con precio, usar ese precio
      if (procedurePrice !== undefined && procedurePrice !== null) {
        return sum + (Number(procedurePrice) || 0);
      }

      // Si no hay procedimiento, usar el precio de la condición
      const price = Number(condition.definitive.price) || 0;
      return sum + price;
    }
    return sum;
  }, 0);
};

/**
 * Crea las condiciones definitivas iniciales a partir de las presuntivas
 */
export const createInitialDefinitiveConditions = (
  presumptiveConditions: DiagnosticCondition[]
): DefinitiveDiagnosticCondition[] => {
  return presumptiveConditions.map((cond) => ({
    id: cond.id.replace('presuntive-', 'definitive-'),
    toothNumber: cond.toothNumber,
    presumptive: {
      conditionId: cond.conditionId,
      conditionLabel: cond.conditionLabel,
      cie10: cond.cie10,
      price: cond.price,
      notes: cond.notes || '',
    },
    definitive: {
      conditionId: cond.conditionId,
      conditionLabel: cond.conditionLabel,
      cie10: cond.cie10,
      price: cond.price,
      notes: cond.notes || '',
    },
    modified: false,
  }));
};

/**
 * Genera un ID único para una nueva condición
 */
export const generateConditionId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

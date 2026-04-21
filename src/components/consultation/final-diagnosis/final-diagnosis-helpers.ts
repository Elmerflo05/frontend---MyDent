import type { DiagnosticCondition, DefinitiveDiagnosticCondition } from '@/types';

/**
 * Fuente única de verdad para el precio efectivo de una condición del diagnóstico definitivo.
 * Regla: procedure_price (precio del procedimiento seleccionado) prevalece sobre price (precio base).
 * Admite objetos en cualquier forma conocida del pipeline (plano, anidado en .definitive, o desde API).
 */
export const getEffectiveProcedurePrice = (cond: any): number => {
  if (!cond) return 0;

  const candidates = [
    cond.procedure_price,
    cond.definitive?.procedure_price,
    cond.price,
    cond.definitive?.price,
    cond.condition_price_base
  ];

  for (const value of candidates) {
    if (value === undefined || value === null) continue;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }

  return 0;
};

/**
 * Calcula el precio total de un array de condiciones
 */
export const calculateTotalPrice = (
  conditions: DiagnosticCondition[] | DefinitiveDiagnosticCondition[]
): number => {
  return conditions.reduce((sum, condition) => sum + getEffectiveProcedurePrice(condition), 0);
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

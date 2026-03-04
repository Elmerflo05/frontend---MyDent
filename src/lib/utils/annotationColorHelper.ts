/**
 * Helper para determinar el color de anotación de una condición dental
 * Centraliza la lógica de color condicional para anotaciones
 */

import { DentalCondition } from '@/constants/dentalConditions';

/**
 * Determina el color de anotación según la condición y su estado
 *
 * @param condition - La condición dental
 * @param finalState - Estado final de la condición ('good' para tratado, 'bad' para sin tratar)
 * @param abbreviation - Abreviatura opcional (para casos especiales como CMC)
 * @returns Color de la anotación: 'blue' (tratado) o 'red' (sin tratar)
 */
export function getAnnotationColor(
  condition: DentalCondition,
  finalState?: 'good' | 'bad',
  abbreviation?: string
): 'blue' | 'red' {
  // CASO ESPECIAL: Corona Metal Cerámica (CMC) siempre en ROJO cuando está sin tratar
  if (condition.id === 'corona-definitiva' && abbreviation === 'CMC' && finalState === 'bad') {
    return 'red';
  }

  // Si la condición tiene colorConditional, usar ese criterio
  if (condition.colorConditional && finalState) {
    return finalState === 'good'
      ? condition.colorConditional.goodState
      : condition.colorConditional.badState;
  }

  // Por defecto, usar el color base de la condición
  return condition.color;
}

/**
 * TOOTH CONDITION SERVICE
 *
 * Servicio para gestión y validación de condiciones dentales
 * SRP: Maneja toda la lógica de negocio relacionada con condiciones dentales
 *
 * IMPORTANTE: Este servicio NO importa stores de Zustand ni componentes React.
 * Solo contiene lógica pura que puede ser testeada independientemente.
 */

import { logger } from '@/lib/logger';
import {
  areTeethInSameArcade,
  getTeethInRange,
  isRightSide
} from '@/lib/utils/odontogramUtils';
import type { DentalCondition } from '@/constants/dentalConditions';

// ============================================================================
// TYPES
// ============================================================================

export interface ToothCondition {
  toothNumber: string;
  sectionId?: string;
  conditionId: string;
  abbreviation?: string;
  state?: 'good' | 'bad';
  notes?: string;
  fractureLocation?: 'corona' | 'raiz' | 'ambos';
  clickPosition?: { x: number; y: number };
  supernumeraryPosition?: 'left' | 'right';
  diastemaPosition?: 'left' | 'right';
  giroversionDirection?: 'clockwise' | 'counterclockwise';
  fusionPosition?: 'left' | 'right';
  migracionDirection?: 'mesial' | 'distal';
  connectedToothNumber?: string;
  color?: string;
  // Campos adicionales del diagnostico definitivo
  label?: string;
  price?: number;
  definitive_condition_id?: number;
  dental_condition_id?: number;
  tooth_position_id?: number;
  // Campos visuales desde la BD (para renderizado correcto)
  symbol_type?: string;
  fill_surfaces?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface MultiToothValidationResult extends ValidationResult {
  conditions?: ToothCondition[];
}

export interface RangeCalculationResult extends ValidationResult {
  teeth?: string[];
}

// ============================================================================
// TOOTH CONDITION SERVICE
// ============================================================================

export class ToothConditionService {
  /**
   * Valida si se puede aplicar un aparato ortodóntico fijo entre dos dientes
   *
   * Reglas:
   * - No pueden ser el mismo diente
   * - Deben estar en la misma arcada (superior o inferior)
   *
   * @param firstTooth - Número FDI del primer diente (ej: "1.8")
   * @param secondTooth - Número FDI del segundo diente (ej: "1.7")
   * @returns Resultado de validación con error si aplica
   */
  static validateOrthodonticFixedAppliance(
    firstTooth: string,
    secondTooth: string
  ): ValidationResult {
    logger.db('validateOrthodonticFixedAppliance', 'tooth', { firstTooth, secondTooth });

    // Validar que no sea el mismo diente
    if (firstTooth === secondTooth) {
      return {
        valid: false,
        error: 'Debe seleccionar un diente diferente para el aparato ortodóntico fijo'
      };
    }

    // Validar que estén en la misma arcada
    if (!areTeethInSameArcade(firstTooth, secondTooth)) {
      return {
        valid: false,
        error: 'Ambos dientes deben estar en la misma arcada (superior o inferior)'
      };
    }

    return { valid: true };
  }

  /**
   * Valida si se puede aplicar un aparato ortodóntico removible entre dos dientes
   * Mismas reglas que el fijo
   */
  static validateOrthodonticRemovableAppliance(
    firstTooth: string,
    secondTooth: string
  ): ValidationResult {
    logger.db('validateOrthodonticRemovableAppliance', 'tooth', { firstTooth, secondTooth });

    // Mismas validaciones que aparato fijo
    if (firstTooth === secondTooth) {
      return {
        valid: false,
        error: 'Debe seleccionar un diente diferente para el aparato ortodóntico removible'
      };
    }

    if (!areTeethInSameArcade(firstTooth, secondTooth)) {
      return {
        valid: false,
        error: 'Ambos dientes deben estar en la misma arcada (superior o inferior)'
      };
    }

    return { valid: true };
  }

  /**
   * Valida transposición dental (intercambio de posición entre dientes adyacentes)
   *
   * Reglas:
   * - No pueden ser el mismo diente
   * - Deben estar en la misma arcada
   * - Deben ser dientes adyacentes (consecutivos en el mismo cuadrante)
   *
   * @param firstTooth - Número FDI del primer diente
   * @param secondTooth - Número FDI del segundo diente
   * @returns Resultado de validación
   */
  static validateTransposition(
    firstTooth: string,
    secondTooth: string
  ): ValidationResult {
    logger.db('validateTransposition', 'tooth', { firstTooth, secondTooth });

    // Validar que no sea el mismo diente
    if (firstTooth === secondTooth) {
      return {
        valid: false,
        error: 'Debe seleccionar un diente diferente para la transposición'
      };
    }

    // Validar que estén en la misma arcada
    if (!areTeethInSameArcade(firstTooth, secondTooth)) {
      return {
        valid: false,
        error: 'Ambos dientes deben estar en la misma arcada (superior o inferior)'
      };
    }

    // Validar que sean dientes adyacentes (consecutivos)
    const [q1, p1] = firstTooth.split('.').map(Number);
    const [q2, p2] = secondTooth.split('.').map(Number);

    // Deben estar en el mismo cuadrante y ser consecutivos
    if (q1 !== q2 || Math.abs(p1 - p2) !== 1) {
      return {
        valid: false,
        error: 'Los dientes deben ser adyacentes (consecutivos) en el mismo cuadrante'
      };
    }

    return { valid: true };
  }

  /**
   * Valida prótesis fija (dos dientes pilares)
   *
   * Reglas:
   * - No pueden ser el mismo diente
   * - Deben estar en la misma arcada
   */
  static validateFixedProsthesis(
    firstTooth: string,
    secondTooth: string
  ): ValidationResult {
    logger.db('validateFixedProsthesis', 'tooth', { firstTooth, secondTooth });

    if (firstTooth === secondTooth) {
      return {
        valid: false,
        error: 'Debe seleccionar un diente diferente para la prótesis fija'
      };
    }

    if (!areTeethInSameArcade(firstTooth, secondTooth)) {
      return {
        valid: false,
        error: 'Ambos dientes deben estar en la misma arcada (superior o inferior)'
      };
    }

    return { valid: true };
  }

  /**
   * Valida prótesis total (dos dientes extremos)
   * Mismas reglas que prótesis fija
   */
  static validateTotalProsthesis(
    firstTooth: string,
    secondTooth: string
  ): ValidationResult {
    logger.db('validateTotalProsthesis', 'tooth', { firstTooth, secondTooth });

    if (firstTooth === secondTooth) {
      return {
        valid: false,
        error: 'Debe seleccionar un diente diferente para la prótesis total'
      };
    }

    if (!areTeethInSameArcade(firstTooth, secondTooth)) {
      return {
        valid: false,
        error: 'Ambos dientes deben estar en la misma arcada (superior o inferior)'
      };
    }

    return { valid: true };
  }

  /**
   * Valida y calcula rango para prótesis removible
   *
   * Reglas:
   * - No pueden ser el mismo diente
   * - Deben estar en el mismo cuadrante
   * - Se calcula el rango completo entre los dos dientes
   *
   * @returns Resultado con array de dientes en el rango
   */
  static validateAndCalculateRemovableProsthesis(
    firstTooth: string,
    secondTooth: string
  ): RangeCalculationResult {
    logger.db('validateAndCalculateRemovableProsthesis', 'tooth', { firstTooth, secondTooth });

    // Validar que no sea el mismo diente
    if (firstTooth === secondTooth) {
      return {
        valid: false,
        error: 'Debe seleccionar un diente diferente para el rango de prótesis removible',
        teeth: []
      };
    }

    // Validar que ambos dientes estén en el mismo cuadrante
    const quadrant1 = parseInt(firstTooth.split('.')[0]);
    const quadrant2 = parseInt(secondTooth.split('.')[0]);

    if (quadrant1 !== quadrant2) {
      return {
        valid: false,
        error: 'Ambos dientes deben estar en el mismo cuadrante',
        teeth: []
      };
    }

    // Calcular todos los dientes en el rango
    const teethInRange = getTeethInRange(firstTooth, secondTooth);

    if (teethInRange.length === 0) {
      return {
        valid: false,
        error: 'No se pudo calcular el rango de dientes',
        teeth: []
      };
    }

    logger.db('Rango calculado para prótesis removible', 'tooth', {
      firstTooth,
      secondTooth,
      count: teethInRange.length
    });

    return {
      valid: true,
      teeth: teethInRange
    };
  }

  /**
   * Valida y calcula rango para edéntulo total
   * Mismas reglas que prótesis removible
   */
  static validateAndCalculateEdentuloTotal(
    firstTooth: string,
    secondTooth: string
  ): RangeCalculationResult {
    logger.db('validateAndCalculateEdentuloTotal', 'tooth', { firstTooth, secondTooth });

    // Validar que no sea el mismo diente
    if (firstTooth === secondTooth) {
      return {
        valid: false,
        error: 'Debe seleccionar un diente diferente para el rango de edéntulo total',
        teeth: []
      };
    }

    // Validar que ambos dientes estén en el mismo cuadrante
    const quadrant1 = parseInt(firstTooth.split('.')[0]);
    const quadrant2 = parseInt(secondTooth.split('.')[0]);

    if (quadrant1 !== quadrant2) {
      return {
        valid: false,
        error: 'Ambos dientes deben estar en el mismo cuadrante',
        teeth: []
      };
    }

    // Calcular todos los dientes en el rango
    const teethInRange = getTeethInRange(firstTooth, secondTooth);

    if (teethInRange.length === 0) {
      return {
        valid: false,
        error: 'No se pudo calcular el rango de dientes',
        teeth: []
      };
    }

    logger.db('Rango calculado para edéntulo total', 'tooth', {
      firstTooth,
      secondTooth,
      count: teethInRange.length
    });

    return {
      valid: true,
      teeth: teethInRange
    };
  }

  /**
   * Crea condiciones para dos dientes conectados (transposición).
   * Solo para condiciones que siempre involucran exactamente 2 dientes.
   *
   * NOTA: Para condiciones de rango (prótesis, aparatos), usar createRangeConditions.
   *
   * @param firstTooth - Primer diente
   * @param secondTooth - Segundo diente
   * @param conditionId - ID de la condición
   * @param state - Estado de la condición
   * @param abbreviation - Abreviatura opcional
   * @returns Array de 2 condiciones conectadas
   */
  static createConnectedToothConditions(
    firstTooth: string,
    secondTooth: string,
    conditionId: string,
    state: 'good' | 'bad',
    abbreviation?: string
  ): ToothCondition[] {
    return [
      {
        toothNumber: firstTooth,
        conditionId,
        state,
        abbreviation,
        connectedToothNumber: secondTooth
      },
      {
        toothNumber: secondTooth,
        conditionId,
        state,
        abbreviation,
        connectedToothNumber: firstTooth
      }
    ];
  }

  /**
   * Crea condiciones para un rango de dientes.
   * Crea una condición por CADA diente del rango.
   * Los endpoints (primero y último) llevan connectedToothNumber para renderizado SVG.
   *
   * @param teeth - Array de dientes en el rango
   * @param conditionId - ID de la condición
   * @param state - Estado de la condición
   * @param abbreviation - Abreviatura opcional
   * @returns Array de condiciones (una por cada diente del rango)
   */
  static createRangeConditions(
    teeth: string[],
    conditionId: string,
    state: 'good' | 'bad',
    abbreviation?: string
  ): ToothCondition[] {
    if (teeth.length === 0) {
      return [];
    }

    const firstTooth = teeth[0];
    const lastTooth = teeth[teeth.length - 1];

    // Crear condición por cada diente del rango
    // Endpoints llevan connectedToothNumber para el rendering visual SVG
    return teeth.map(tooth => ({
      toothNumber: tooth,
      conditionId,
      state,
      abbreviation,
      connectedToothNumber:
        tooth === firstTooth ? lastTooth :
        tooth === lastTooth ? firstTooth :
        undefined
    }));
  }

  /**
   * Determina el color final de una anotación según la condición y su estado
   *
   * @param condition - Condición dental
   * @param state - Estado actual ('good' | 'bad')
   * @returns Color de la anotación ('red' | 'blue')
   */
  static getAnnotationColor(
    condition: DentalCondition,
    state: 'good' | 'bad'
  ): 'red' | 'blue' {
    // Caso especial: Corona Metal Cerámica (CMC) en estado 'bad' siempre es ROJA
    if (condition.id === 'corona-definitiva' && state === 'bad') {
      return 'red';
    }

    // Si la condición tiene colorConditional, usar esa lógica
    if (condition.colorConditional) {
      return state === 'good'
        ? condition.colorConditional.goodState
        : condition.colorConditional.badState;
    }

    // Caso por defecto: usar el color base de la condición
    return condition.color;
  }

  /**
   * Marca todas las condiciones de un diente como tratadas (cambiar a 'good')
   *
   * @param toothNumber - Número del diente
   * @param allConditions - Todas las condiciones existentes
   * @returns Condiciones actualizadas
   */
  static markToothAsTreated(
    toothNumber: string,
    allConditions: ToothCondition[]
  ): ToothCondition[] {
    logger.db('markToothAsTreated', 'tooth', { toothNumber });

    // Filtrar condiciones del diente
    const toothConditions = allConditions.filter(c => c.toothNumber === toothNumber);

    // Verificar si hay condiciones rojas (sin tratar)
    const hasRedConditions = toothConditions.some(
      c => c.state === 'bad' || c.color === 'red'
    );

    if (!hasRedConditions) {
      logger.warn('No hay condiciones rojas para tratar', { toothNumber });
      return allConditions;
    }

    // Cambiar TODAS las condiciones del diente a azul (tratadas)
    return allConditions.map(condition => {
      if (condition.toothNumber === toothNumber) {
        return {
          ...condition,
          state: 'good' as const,
          color: 'blue'
        };
      }
      return condition;
    });
  }
}

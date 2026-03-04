/**
 * ANNOTATION SERVICE
 *
 * Servicio para gestión de anotaciones superiores del odontograma
 * SRP: Maneja toda la lógica de cálculo y actualización de anotaciones
 *
 * Las anotaciones son los recuadros superiores que muestran abreviaturas
 * de condiciones dentales (MB, CE, CMC, etc.)
 */

import { logger } from '@/lib/logger';
import type { DentalCondition } from '@/constants/dentalConditions';
import type { ToothCondition } from './ToothConditionService';

// ============================================================================
// TYPES
// ============================================================================

export interface Annotation {
  text: string;
  color: 'red' | 'blue';
}

export type AnnotationsMap = Map<string, Annotation>;

// ============================================================================
// ANNOTATION SERVICE
// ============================================================================

export class AnnotationService {
  /**
   * Determina qué anotación mostrar para un diente específico
   * basándose en todas sus condiciones
   *
   * Reglas de prioridad:
   * 1. Si hay múltiples condiciones, mostrar la primera con abreviatura
   * 2. El color depende del estado de la condición
   *
   * @param toothNumber - Número FDI del diente
   * @param allConditions - Todas las condiciones del odontograma
   * @param dentalConditions - Catálogo de condiciones dentales
   * @returns Anotación a mostrar o null si no hay
   */
  static getAnnotationForTooth(
    toothNumber: string,
    allConditions: ToothCondition[],
    dentalConditions: DentalCondition[]
  ): Annotation | null {
    // Filtrar condiciones del diente que tengan abreviatura
    const toothConditions = allConditions.filter(
      c => c.toothNumber === toothNumber && c.abbreviation
    );

    if (toothConditions.length === 0) {
      return null;
    }

    // Tomar la primera condición con abreviatura
    const condition = toothConditions[0];
    const dentalCondition = dentalConditions.find(dc => dc.id === condition.conditionId);

    // Si no encontramos la condición en el catálogo, crear una anotación básica
    // Esto es importante para condiciones que vienen de la BD y pueden no estar
    // en el catálogo local (ej: condiciones personalizadas o de diagnóstico)
    if (!dentalCondition) {
      logger.warn('Condición dental no encontrada en catálogo, usando datos de BD', {
        toothNumber,
        conditionId: condition.conditionId,
        abbreviation: condition.abbreviation
      });

      // Determinar color basado en el estado de la condición
      // 'good' (tratado) = azul, 'bad' (pendiente) = rojo
      const fallbackColor: 'red' | 'blue' = condition.state === 'good' ? 'blue' : 'red';

      return {
        text: condition.abbreviation!,
        color: fallbackColor
      };
    }

    // Determinar color según estado
    const color = this.calculateAnnotationColor(dentalCondition, condition.state);

    return {
      text: condition.abbreviation!,
      color
    };
  }

  /**
   * Calcula el color de una anotación según la condición y su estado
   *
   * @param condition - Condición dental
   * @param state - Estado de la condición ('good' | 'bad' | undefined)
   * @returns Color de la anotación
   */
  static calculateAnnotationColor(
    condition: DentalCondition,
    state?: 'good' | 'bad'
  ): 'red' | 'blue' {
    // Caso especial: Corona Metal Cerámica (CMC) en estado 'bad' siempre es ROJA
    if (condition.id === 'corona-definitiva' && state === 'bad') {
      return 'red';
    }

    // Si la condición tiene colorConditional y hay estado definido
    if (condition.colorConditional && state) {
      return state === 'good'
        ? condition.colorConditional.goodState
        : condition.colorConditional.badState;
    }

    // Caso por defecto: usar el color base de la condición
    return condition.color;
  }

  /**
   * Crea un Map de anotaciones para todos los dientes con condiciones
   *
   * @param allConditions - Todas las condiciones del odontograma
   * @param dentalConditions - Catálogo de condiciones dentales
   * @returns Map con anotaciones por número de diente
   */
  static createAnnotationsMap(
    allConditions: ToothCondition[],
    dentalConditions: DentalCondition[]
  ): AnnotationsMap {
    const annotationsMap = new Map<string, Annotation>();

    // Obtener dientes únicos que tienen condiciones
    const teethWithConditions = [...new Set(allConditions.map(c => c.toothNumber))];

    // Calcular anotación para cada diente
    teethWithConditions.forEach(toothNumber => {
      const annotation = this.getAnnotationForTooth(
        toothNumber,
        allConditions,
        dentalConditions
      );

      if (annotation) {
        annotationsMap.set(toothNumber, annotation);
      }
    });

    logger.db('Annotations map created', 'tooth', {
      totalTeeth: teethWithConditions.length,
      annotationsCount: annotationsMap.size
    });

    return annotationsMap;
  }

  /**
   * Actualiza una anotación específica en el Map
   *
   * @param currentMap - Map actual de anotaciones
   * @param toothNumber - Número del diente
   * @param annotation - Nueva anotación (o null para eliminar)
   * @returns Nuevo Map actualizado
   */
  static updateAnnotation(
    currentMap: AnnotationsMap,
    toothNumber: string,
    annotation: Annotation | null
  ): AnnotationsMap {
    const newMap = new Map(currentMap);

    if (annotation) {
      newMap.set(toothNumber, annotation);
      logger.db('Annotation updated', 'tooth', { toothNumber, annotation });
    } else {
      newMap.delete(toothNumber);
      logger.db('Annotation removed', 'tooth', { toothNumber });
    }

    return newMap;
  }

  /**
   * Actualiza múltiples anotaciones a la vez
   *
   * @param currentMap - Map actual de anotaciones
   * @param updates - Array de actualizaciones [toothNumber, annotation]
   * @returns Nuevo Map actualizado
   */
  static updateMultipleAnnotations(
    currentMap: AnnotationsMap,
    updates: Array<[string, Annotation | null]>
  ): AnnotationsMap {
    const newMap = new Map(currentMap);

    updates.forEach(([toothNumber, annotation]) => {
      if (annotation) {
        newMap.set(toothNumber, annotation);
      } else {
        newMap.delete(toothNumber);
      }
    });

    logger.db('Multiple annotations updated', 'tooth', {
      updatesCount: updates.length
    });

    return newMap;
  }

  /**
   * Actualiza el color de una anotación existente (útil para "marcar como tratado")
   *
   * @param currentMap - Map actual de anotaciones
   * @param toothNumber - Número del diente
   * @param newColor - Nuevo color
   * @returns Nuevo Map actualizado
   */
  static updateAnnotationColor(
    currentMap: AnnotationsMap,
    toothNumber: string,
    newColor: 'red' | 'blue'
  ): AnnotationsMap {
    const newMap = new Map(currentMap);
    const currentAnnotation = currentMap.get(toothNumber);

    if (currentAnnotation) {
      newMap.set(toothNumber, {
        ...currentAnnotation,
        color: newColor
      });

      logger.db('Annotation color updated', 'tooth', {
        toothNumber,
        oldColor: currentAnnotation.color,
        newColor
      });
    }

    return newMap;
  }

  /**
   * Limpia todas las anotaciones
   *
   * @returns Map vacío
   */
  static clearAllAnnotations(): AnnotationsMap {
    logger.db('All annotations cleared', 'tooth', {});
    return new Map();
  }

  /**
   * Obtiene todas las anotaciones como array (útil para debugging)
   *
   * @param annotationsMap - Map de anotaciones
   * @returns Array de [toothNumber, annotation]
   */
  static toArray(annotationsMap: AnnotationsMap): Array<[string, Annotation]> {
    return Array.from(annotationsMap.entries());
  }

  /**
   * Verifica si un diente tiene anotación
   *
   * @param annotationsMap - Map de anotaciones
   * @param toothNumber - Número del diente
   * @returns true si tiene anotación
   */
  static hasAnnotation(annotationsMap: AnnotationsMap, toothNumber: string): boolean {
    return annotationsMap.has(toothNumber);
  }

  /**
   * Cuenta total de anotaciones
   *
   * @param annotationsMap - Map de anotaciones
   * @returns Número de anotaciones
   */
  static count(annotationsMap: AnnotationsMap): number {
    return annotationsMap.size;
  }
}

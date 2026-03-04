/**
 * Manejador unificado para selecciones multi-diente
 * Consolida la lógica repetida de 7 condiciones que requieren múltiples dientes
 *
 * REGLA DE NEGOCIO (actualizada):
 * Todas las condiciones multi-diente que abarcan un rango (prótesis fija, prótesis total,
 * prótesis removible, aparato fijo, aparato removible) crean una condición por CADA diente
 * del rango. Los endpoints mantienen connectedToothNumber para el renderizado visual SVG.
 * La única excepción es transposición (siempre 2 dientes adyacentes).
 */

import type { DentalCondition } from '@/constants/dentalConditions';
import { areTeethInSameArcade, getTeethInRange, getTeethInArcadeRange } from './odontogramUtils';

export interface MultiToothSelection {
  firstTooth: string;
  waitingForSecond: boolean;
  state?: 'good' | 'bad';
  abbreviation?: string;
}

export interface ToothCondition {
  toothNumber: string;
  sectionId?: string;
  conditionId: string;
  abbreviation?: string;
  state?: 'good' | 'bad';
  notes?: string;
  connectedToothNumber?: string;
  fractureLocation?: 'corona' | 'raiz' | 'ambos';
  clickPosition?: { x: number; y: number };
  supernumeraryPosition?: 'left' | 'right';
  diastemaPosition?: 'left' | 'right';
  giroversionDirection?: 'clockwise' | 'counterclockwise';
  fusionPosition?: 'left' | 'right';
  migracionDirection?: 'mesial' | 'distal';
}

export interface MultiToothSelectionConfig {
  selection: MultiToothSelection | null;
  toothNumber: string;
  conditionId: string;
  toothConditions: ToothCondition[];
  setToothConditions: (conditions: ToothCondition[]) => void;
  resetSelection: () => void;
  allConditions: DentalCondition[];
  rangeSelector?: boolean;
  requireSameQuadrant?: boolean;
  requireAdjacent?: boolean;
  createConditionsForRange?: boolean;
}

/**
 * Maneja la selección del segundo diente en condiciones multi-diente
 * Retorna true si se manejó la selección, false si no aplica
 */
export function handleMultiToothSelection(config: MultiToothSelectionConfig): boolean {
  const {
    selection,
    toothNumber,
    conditionId,
    toothConditions,
    setToothConditions,
    resetSelection,
    allConditions,
    rangeSelector = false,
    requireSameQuadrant = false,
    requireAdjacent = false,
    createConditionsForRange = false
  } = config;

  // Si no hay selección activa para esta condición, no hacer nada
  if (!selection?.waitingForSecond) {
    return false;
  }

  const firstTooth = selection.firstTooth;

  // 1. Validar que no sea el mismo diente
  if (firstTooth === toothNumber) {
    const condition = allConditions.find(c => c.id === conditionId);
    alert(`Debe seleccionar un diente diferente para ${condition?.label || 'esta condición'}`);
    return true;
  }

  // 2. Validar que estén en la misma arcada (superior O inferior)
  if (!areTeethInSameArcade(firstTooth, toothNumber)) {
    alert('Ambos dientes deben estar en la misma arcada (superior o inferior)');
    return true;
  }

  // 3. Validar que estén en el mismo cuadrante (si es requerido)
  if (requireSameQuadrant) {
    const quadrant1 = parseInt(firstTooth.split('.')[0]);
    const quadrant2 = parseInt(toothNumber.split('.')[0]);

    if (quadrant1 !== quadrant2) {
      alert('Ambos dientes deben estar en el mismo cuadrante');
      return true;
    }
  }

  // 4. Validar que sean dientes adyacentes (consecutivos) si es requerido
  if (requireAdjacent) {
    const [q1, p1] = firstTooth.split('.').map(Number);
    const [q2, p2] = toothNumber.split('.').map(Number);

    if (q1 !== q2 || Math.abs(p1 - p2) !== 1) {
      alert('Los dientes deben ser adyacentes (consecutivos) en el mismo cuadrante');
      return true;
    }
  }

  // 5. Obtener la condición
  const condition = allConditions.find(c => c.id === conditionId);
  if (!condition) {
    return true;
  }

  let newConditions: ToothCondition[] = [];

  // 6. Crear condiciones según el tipo de selector
  if (rangeSelector && createConditionsForRange) {
    // Crear condiciones para TODOS los dientes en el rango
    // Usar getTeethInArcadeRange para soportar cross-cuadrante (aparatos)
    const teethInRange = requireSameQuadrant
      ? getTeethInRange(firstTooth, toothNumber)
      : getTeethInArcadeRange(firstTooth, toothNumber);

    if (teethInRange.length === 0) {
      alert('No se pudo calcular el rango de dientes');
      return true;
    }

    const firstToothInRange = teethInRange[0];
    const lastToothInRange = teethInRange[teethInRange.length - 1];

    // Crear una condición por cada diente del rango
    // Los endpoints (primero y último) llevan connectedToothNumber para el rendering SVG
    newConditions = teethInRange.map(tooth => ({
      toothNumber: tooth,
      conditionId: conditionId,
      state: selection.state || 'bad',
      abbreviation: selection.abbreviation,
      // Solo endpoints tienen connectedToothNumber (para dibujar la línea visual)
      connectedToothNumber:
        tooth === firstToothInRange ? lastToothInRange :
        tooth === lastToothInRange ? firstToothInRange :
        undefined
    }));
  } else if (requireAdjacent) {
    // Transposición: siempre exactamente 2 dientes adyacentes con conexión
    newConditions = [
      {
        toothNumber: firstTooth,
        conditionId: conditionId,
        state: selection.state,
        abbreviation: selection.abbreviation,
        connectedToothNumber: toothNumber
      },
      {
        toothNumber: toothNumber,
        conditionId: conditionId,
        state: selection.state,
        abbreviation: selection.abbreviation,
        connectedToothNumber: firstTooth
      }
    ];
  } else {
    // Fallback: crear dos condiciones con conexión (no debería llegar aquí con la config actual)
    newConditions = [
      {
        toothNumber: firstTooth,
        conditionId: conditionId,
        state: selection.state,
        abbreviation: selection.abbreviation,
        connectedToothNumber: toothNumber
      },
      {
        toothNumber: toothNumber,
        conditionId: conditionId,
        state: selection.state,
        abbreviation: selection.abbreviation,
        connectedToothNumber: firstTooth
      }
    ];
  }

  // 7. Actualizar condiciones y resetear selección
  setToothConditions([...toothConditions, ...newConditions]);
  resetSelection();

  return true;
}

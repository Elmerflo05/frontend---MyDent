/**
 * DIAGNOSIS SERVICE
 *
 * Servicio para gestión y transformación de diagnósticos dentales
 * SRP: Maneja toda la lógica de negocio relacionada con diagnósticos
 *
 * IMPORTANTE: Este servicio NO importa stores de Zustand ni componentes React.
 * Solo contiene lógica pura que puede ser testeada independientemente.
 */

import { OFFICIAL_DENTAL_CONDITIONS } from '@/constants/dentalConditions';
import type { DentalCondition } from '@/constants/dentalConditions';

// ============================================================================
// TYPES
// ============================================================================

export interface DiagnosticCondition {
  id: string;
  toothNumber: string;
  conditionId: string;
  conditionLabel: string;
  cie10?: string;
  price: number;
  notes?: string;
}

export interface ConditionData {
  conditionId: string;
  conditionLabel: string;
  cie10?: string;
  price: number;
  notes?: string;
}

export interface DefinitiveDiagnosticCondition {
  id: string;
  toothNumber: string;
  presumptive: ConditionData;
  definitive: ConditionData;
  modified: boolean;
}

// ============================================================================
// DIAGNOSIS SERVICE
// ============================================================================

export class DiagnosisService {
  /**
   * Mapea condiciones del odontograma a condiciones de diagnóstico presuntivo
   *
   * @param odontogramConditions - Array de condiciones del odontograma
   * @returns Array de condiciones mapeadas con información completa
   */
  static mapOdontogramToConditions(
    odontogramConditions: any[]
  ): DiagnosticCondition[] {
    if (!odontogramConditions || odontogramConditions.length === 0) {
      return [];
    }

    return odontogramConditions.map((cond: any) => {
      // NOTE: ToothCondition usa "condition" no "conditionId"
      const conditionId = cond.condition || cond.conditionId;
      const officialCondition = OFFICIAL_DENTAL_CONDITIONS.find(
        c => c.id === conditionId
      );

      return {
        id: `presuntive-${cond.toothNumber}-${conditionId}`,
        toothNumber: cond.toothNumber.toString(),
        conditionId: conditionId || '',
        conditionLabel: officialCondition?.label || 'Condición desconocida',
        cie10: officialCondition?.cie10 || '',
        price: cond.price || officialCondition?.price || 0,
        notes: cond.notes || ''
      };
    });
  }

  /**
   * Calcula el total de un conjunto de condiciones diagnósticas
   *
   * @param conditions - Array de condiciones
   * @returns Total calculado
   */
  static calculateTotal(conditions: DiagnosticCondition[]): number {
    return conditions.reduce((sum, cond) => sum + cond.price, 0);
  }

  /**
   * Calcula el total de condiciones definitivas
   * Prioriza el precio del procedimiento asignado sobre el precio base
   *
   * @param conditions - Array de condiciones definitivas
   * @returns Total calculado
   */
  static calculateDefinitiveTotal(
    conditions: DefinitiveDiagnosticCondition[]
  ): number {
    return conditions.reduce((sum, cond) => {
      // Priorizar procedure_price si existe un procedimiento asignado
      const price = (cond as any).procedure_price ||
                    (cond.definitive as any)?.procedure_price ||
                    cond.definitive.price ||
                    0;
      return sum + Number(price);
    }, 0);
  }

  /**
   * Verifica si una condición definitiva fue modificada respecto al presuntivo
   *
   * @param presumptive - Datos del diagnóstico presuntivo
   * @param definitive - Datos del diagnóstico definitivo
   * @returns true si fue modificada, false si no
   */
  static isConditionModified(
    presumptive: ConditionData,
    definitive: ConditionData
  ): boolean {
    return (
      presumptive.conditionId !== definitive.conditionId ||
      presumptive.price !== definitive.price ||
      presumptive.notes !== definitive.notes
    );
  }

  /**
   * Cuenta cuántas condiciones definitivas fueron modificadas
   *
   * @param conditions - Array de condiciones definitivas
   * @returns Cantidad de condiciones modificadas
   */
  static countModifiedConditions(
    conditions: DefinitiveDiagnosticCondition[]
  ): number {
    return conditions.filter(c => c.modified).length;
  }

  /**
   * Convierte condiciones presuntivas a definitivas (copia inicial)
   *
   * @param presumptiveConditions - Condiciones presuntivas
   * @returns Condiciones definitivas inicializadas como copia exacta
   */
  static convertPresumptiveToDefinitive(
    presumptiveConditions: DiagnosticCondition[]
  ): DefinitiveDiagnosticCondition[] {
    return presumptiveConditions.map(cond => ({
      id: `definitive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      toothNumber: cond.toothNumber,
      presumptive: {
        conditionId: cond.conditionId,
        conditionLabel: cond.conditionLabel,
        cie10: cond.cie10,
        price: cond.price,
        notes: cond.notes
      },
      definitive: {
        conditionId: cond.conditionId,
        conditionLabel: cond.conditionLabel,
        cie10: cond.cie10,
        price: cond.price,
        notes: cond.notes
      },
      modified: false
    }));
  }

  /**
   * Crea una nueva condición definitiva (sin presuntivo previo)
   *
   * @param toothNumber - Número de diente
   * @param conditionId - ID de la condición
   * @param price - Precio
   * @param notes - Notas adicionales
   * @returns Nueva condición definitiva
   */
  static createNewDefinitiveCondition(
    toothNumber: string,
    conditionId: string,
    price: number,
    notes?: string
  ): DefinitiveDiagnosticCondition | null {
    const selectedCondition = OFFICIAL_DENTAL_CONDITIONS.find(
      c => c.id === conditionId
    );

    if (!selectedCondition) {
      return null;
    }

    return {
      id: `definitive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      toothNumber: toothNumber,
      presumptive: {
        conditionId: '',
        conditionLabel: 'Nueva condición',
        cie10: '',
        price: 0,
        notes: ''
      },
      definitive: {
        conditionId: conditionId,
        conditionLabel: selectedCondition.label,
        cie10: selectedCondition.cie10 || '',
        price: price,
        notes: notes || ''
      },
      modified: true // Nueva condición siempre está marcada como modificada
    };
  }

  /**
   * Actualiza una condición definitiva existente
   *
   * @param condition - Condición a actualizar
   * @param updates - Datos actualizados
   * @returns Condición actualizada
   */
  static updateDefinitiveCondition(
    condition: DefinitiveDiagnosticCondition,
    updates: {
      toothNumber?: string;
      conditionId?: string;
      price?: number;
      notes?: string;
    }
  ): DefinitiveDiagnosticCondition | null {
    const conditionId = updates.conditionId || condition.definitive.conditionId;
    const selectedCondition = OFFICIAL_DENTAL_CONDITIONS.find(
      c => c.id === conditionId
    );

    if (!selectedCondition) {
      return null;
    }

    const newDefinitive: ConditionData = {
      conditionId: conditionId,
      conditionLabel: selectedCondition.label,
      cie10: selectedCondition.cie10 || '',
      price: updates.price !== undefined ? updates.price : condition.definitive.price,
      notes: updates.notes !== undefined ? updates.notes : condition.definitive.notes
    };

    // Verificar si fue modificado respecto al presuntivo
    const isModified = this.isConditionModified(
      condition.presumptive,
      newDefinitive
    );

    return {
      ...condition,
      toothNumber: updates.toothNumber || condition.toothNumber,
      definitive: newDefinitive,
      modified: isModified
    };
  }

  /**
   * Valida los campos requeridos para crear/editar una condición
   *
   * @param toothNumber - Número de diente
   * @param conditionId - ID de condición
   * @param price - Precio
   * @returns true si es válido, false si no
   */
  static validateConditionFields(
    toothNumber: string,
    conditionId: string,
    price: string | number
  ): boolean {
    return !!(toothNumber && conditionId && price);
  }

  /**
   * Obtiene el precio por defecto de una condición
   *
   * @param conditionId - ID de la condición
   * @returns Precio por defecto o 0 si no existe
   */
  static getConditionDefaultPrice(conditionId: string): number {
    const condition = OFFICIAL_DENTAL_CONDITIONS.find(c => c.id === conditionId);
    return condition?.price || 0;
  }
}

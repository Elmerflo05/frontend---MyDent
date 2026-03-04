/**
 * TREATMENT SERVICE
 *
 * Servicio para gestión de tratamientos aplicados en planes de tratamiento
 * SRP: Maneja toda la lógica de negocio relacionada con tratamientos
 *
 * IMPORTANTE: Este servicio NO importa stores de Zustand ni componentes React.
 * Solo contiene lógica pura que puede ser testeada independientemente.
 */

import type { Treatment } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface TreatmentCondition {
  id: string;
  label: string;
  price: number;
  quantity: number;
}

export interface AppliedTreatment {
  id: string;
  treatmentId: string;
  treatmentName: string;
  conditions: TreatmentCondition[];
  totalAmount: number;
}

// ============================================================================
// TREATMENT SERVICE
// ============================================================================

export class TreatmentService {
  /**
   * Crea un tratamiento aplicado desde un tratamiento disponible
   *
   * @param treatment - Tratamiento base
   * @returns Tratamiento aplicado con ID único
   */
  static createAppliedTreatment(treatment: Treatment): AppliedTreatment {
    const appliedConditions: TreatmentCondition[] = treatment.conditions.map(cond => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: cond.label,
      price: cond.price,
      quantity: 1 // Cada condición inicia con 1 pieza
    }));

    const totalAmount = this.calculateTreatmentTotal(appliedConditions);

    return {
      id: `treatment-${Date.now()}`,
      treatmentId: treatment.id,
      treatmentName: treatment.nombre,
      conditions: appliedConditions,
      totalAmount
    };
  }

  /**
   * Calcula el total de un tratamiento
   *
   * @param conditions - Condiciones del tratamiento
   * @returns Total calculado
   */
  static calculateTreatmentTotal(conditions: TreatmentCondition[]): number {
    return conditions.reduce((sum, cond) => sum + (cond.price * cond.quantity), 0);
  }

  /**
   * Calcula el gran total de todos los tratamientos aplicados
   *
   * @param treatments - Array de tratamientos aplicados
   * @returns Gran total
   */
  static calculateGrandTotal(treatments: AppliedTreatment[]): number {
    return treatments.reduce((sum, t) => sum + t.totalAmount, 0);
  }

  /**
   * Actualiza el nombre de un tratamiento
   *
   * @param treatments - Array de tratamientos
   * @param treatmentId - ID del tratamiento a actualizar
   * @param newName - Nuevo nombre
   * @returns Array actualizado
   */
  static updateTreatmentName(
    treatments: AppliedTreatment[],
    treatmentId: string,
    newName: string
  ): AppliedTreatment[] {
    return treatments.map(t =>
      t.id === treatmentId ? { ...t, treatmentName: newName } : t
    );
  }

  /**
   * Elimina un tratamiento
   *
   * @param treatments - Array de tratamientos
   * @param treatmentId - ID del tratamiento a eliminar
   * @returns Array actualizado
   */
  static removeTreatment(
    treatments: AppliedTreatment[],
    treatmentId: string
  ): AppliedTreatment[] {
    return treatments.filter(t => t.id !== treatmentId);
  }

  /**
   * Actualiza la cantidad de una condición
   *
   * @param treatments - Array de tratamientos
   * @param treatmentId - ID del tratamiento
   * @param conditionId - ID de la condición
   * @param newQuantity - Nueva cantidad
   * @returns Array actualizado
   */
  static updateConditionQuantity(
    treatments: AppliedTreatment[],
    treatmentId: string,
    conditionId: string,
    newQuantity: number
  ): AppliedTreatment[] {
    if (newQuantity <= 0) return treatments;

    return treatments.map(t => {
      if (t.id === treatmentId) {
        const updatedConditions = t.conditions.map(c =>
          c.id === conditionId ? { ...c, quantity: newQuantity } : c
        );
        const totalAmount = this.calculateTreatmentTotal(updatedConditions);
        return { ...t, conditions: updatedConditions, totalAmount };
      }
      return t;
    });
  }

  /**
   * Actualiza el label de una condición
   *
   * @param treatments - Array de tratamientos
   * @param treatmentId - ID del tratamiento
   * @param conditionId - ID de la condición
   * @param newLabel - Nuevo label
   * @returns Array actualizado
   */
  static updateConditionLabel(
    treatments: AppliedTreatment[],
    treatmentId: string,
    conditionId: string,
    newLabel: string
  ): AppliedTreatment[] {
    return treatments.map(t => {
      if (t.id === treatmentId) {
        return {
          ...t,
          conditions: t.conditions.map(c =>
            c.id === conditionId ? { ...c, label: newLabel } : c
          )
        };
      }
      return t;
    });
  }

  /**
   * Actualiza el precio de una condición
   *
   * @param treatments - Array de tratamientos
   * @param treatmentId - ID del tratamiento
   * @param conditionId - ID de la condición
   * @param newPrice - Nuevo precio
   * @returns Array actualizado
   */
  static updateConditionPrice(
    treatments: AppliedTreatment[],
    treatmentId: string,
    conditionId: string,
    newPrice: number
  ): AppliedTreatment[] {
    return treatments.map(t => {
      if (t.id === treatmentId) {
        const updatedConditions = t.conditions.map(c =>
          c.id === conditionId ? { ...c, price: newPrice } : c
        );
        const totalAmount = this.calculateTreatmentTotal(updatedConditions);
        return { ...t, conditions: updatedConditions, totalAmount };
      }
      return t;
    });
  }

  /**
   * Elimina una condición de un tratamiento
   *
   * @param treatments - Array de tratamientos
   * @param treatmentId - ID del tratamiento
   * @param conditionId - ID de la condición a eliminar
   * @returns Array actualizado
   */
  static removeCondition(
    treatments: AppliedTreatment[],
    treatmentId: string,
    conditionId: string
  ): AppliedTreatment[] {
    return treatments.map(t => {
      if (t.id === treatmentId) {
        const updatedConditions = t.conditions.filter(c => c.id !== conditionId);
        const totalAmount = this.calculateTreatmentTotal(updatedConditions);
        return { ...t, conditions: updatedConditions, totalAmount };
      }
      return t;
    });
  }
}

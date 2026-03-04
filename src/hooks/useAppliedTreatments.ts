/**
 * useAppliedTreatments Hook
 *
 * Maneja el estado y lógica de tratamientos aplicados en el plan de tratamiento
 *
 * NOTA: Este hook actualmente retorna una lista vacía de tratamientos disponibles.
 * Requiere implementación de API real para cargar tratamientos desde el backend.
 */

import { useState, useEffect } from 'react';
import { TreatmentService } from '@/services/treatment';
import type { AppliedTreatment } from '@/services/treatment';
import type { Treatment } from '@/types';

interface UseAppliedTreatmentsProps {
  currentRecord: any;
  setCurrentRecord: (record: any) => void;
  setUnsavedChanges: (val: boolean) => void;
}

interface UseAppliedTreatmentsReturn {
  // Estado
  availableTreatments: Treatment[];
  appliedTreatments: AppliedTreatment[];
  selectedTreatmentId: string;
  grandTotal: number;

  // Setters
  setSelectedTreatmentId: (id: string) => void;

  // Actions - Tratamientos
  addTreatment: () => void;
  removeTreatment: (treatmentId: string) => void;
  updateTreatmentName: (treatmentId: string, newName: string) => void;

  // Actions - Condiciones
  updateConditionQuantity: (treatmentId: string, conditionId: string, quantity: number) => void;
  updateConditionLabel: (treatmentId: string, conditionId: string, label: string) => void;
  updateConditionPrice: (treatmentId: string, conditionId: string, price: number) => void;
  removeCondition: (treatmentId: string, conditionId: string) => void;
}

/**
 * Hook para manejar tratamientos aplicados
 */
export const useAppliedTreatments = ({
  currentRecord,
  setCurrentRecord,
  setUnsavedChanges
}: UseAppliedTreatmentsProps): UseAppliedTreatmentsReturn => {
  const [availableTreatments, setAvailableTreatments] = useState<Treatment[]>([]);
  const [appliedTreatments, setAppliedTreatments] = useState<AppliedTreatment[]>(
    currentRecord.appliedTreatments || []
  );
  const [selectedTreatmentId, setSelectedTreatmentId] = useState('');

  // Cargar tratamientos disponibles (stub - requiere API)
  useEffect(() => {
    console.warn('⚠️ useAppliedTreatments: Stub - requiere API para cargar tratamientos');
    // TODO: Implementar llamada a API para cargar tratamientos
    setAvailableTreatments([]);
  }, []);

  /**
   * Actualiza el estado y sincroniza con currentRecord
   */
  const updateAppliedTreatments = (updated: AppliedTreatment[]) => {
    setAppliedTreatments(updated);
    setCurrentRecord({ ...currentRecord, appliedTreatments: updated });
    setUnsavedChanges(true);
  };

  /**
   * Agrega un tratamiento al plan
   */
  const addTreatment = () => {
    if (!selectedTreatmentId) return;

    const treatment = availableTreatments.find(t => t.id === selectedTreatmentId);
    if (!treatment) return;

    const newTreatment = TreatmentService.createAppliedTreatment(treatment);
    const updated = [...appliedTreatments, newTreatment];

    updateAppliedTreatments(updated);
    setSelectedTreatmentId('');
  };

  /**
   * Elimina un tratamiento
   */
  const removeTreatment = (treatmentId: string) => {
    const updated = TreatmentService.removeTreatment(appliedTreatments, treatmentId);
    updateAppliedTreatments(updated);
  };

  /**
   * Actualiza el nombre de un tratamiento
   */
  const updateTreatmentName = (treatmentId: string, newName: string) => {
    const updated = TreatmentService.updateTreatmentName(appliedTreatments, treatmentId, newName);
    updateAppliedTreatments(updated);
  };

  /**
   * Actualiza la cantidad de una condición
   */
  const updateConditionQuantity = (treatmentId: string, conditionId: string, quantity: number) => {
    const updated = TreatmentService.updateConditionQuantity(
      appliedTreatments,
      treatmentId,
      conditionId,
      quantity
    );
    updateAppliedTreatments(updated);
  };

  /**
   * Actualiza el label de una condición
   */
  const updateConditionLabel = (treatmentId: string, conditionId: string, label: string) => {
    const updated = TreatmentService.updateConditionLabel(
      appliedTreatments,
      treatmentId,
      conditionId,
      label
    );
    updateAppliedTreatments(updated);
  };

  /**
   * Actualiza el precio de una condición
   */
  const updateConditionPrice = (treatmentId: string, conditionId: string, price: number) => {
    const updated = TreatmentService.updateConditionPrice(
      appliedTreatments,
      treatmentId,
      conditionId,
      price
    );
    updateAppliedTreatments(updated);
  };

  /**
   * Elimina una condición
   */
  const removeCondition = (treatmentId: string, conditionId: string) => {
    const updated = TreatmentService.removeCondition(appliedTreatments, treatmentId, conditionId);
    updateAppliedTreatments(updated);
  };

  // Calcular gran total usando el servicio
  const grandTotal = TreatmentService.calculateGrandTotal(appliedTreatments);

  return {
    // Estado
    availableTreatments,
    appliedTreatments,
    selectedTreatmentId,
    grandTotal,

    // Setters
    setSelectedTreatmentId,

    // Actions
    addTreatment,
    removeTreatment,
    updateTreatmentName,
    updateConditionQuantity,
    updateConditionLabel,
    updateConditionPrice,
    removeCondition
  };
};

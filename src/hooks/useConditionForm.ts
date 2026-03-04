/**
 * useConditionForm Hook
 *
 * Maneja el estado del formulario para agregar/editar condiciones
 * Separa la lógica de formulario del resto del componente
 */

import { useState } from 'react';
import { DiagnosisService } from '@/services/diagnosis';

interface UseConditionFormReturn {
  // Form state
  toothNumber: string;
  conditionId: string;
  price: string;
  notes: string;
  isEditing: boolean;
  editingId: string | null;

  // Form setters
  setToothNumber: (value: string) => void;
  setConditionId: (value: string) => void;
  setPrice: (value: string) => void;
  setNotes: (value: string) => void;

  // Form actions
  startEdit: (condition: any) => void;
  cancelEdit: () => void;
  resetForm: () => void;
  autoFillPrice: (conditionId: string) => void;

  // Validation
  isFormValid: () => boolean;
  getFormData: () => {
    toothNumber: string;
    conditionId: string;
    price: number;
    notes: string;
  } | null;
}

/**
 * Hook para manejar el formulario de condiciones
 */
export const useConditionForm = (): UseConditionFormReturn => {
  const [toothNumber, setToothNumber] = useState<string>('');
  const [conditionId, setConditionId] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  /**
   * Inicia el modo edición cargando los datos de una condición
   */
  const startEdit = (condition: any) => {
    setIsEditing(true);
    setEditingId(condition.id);
    setToothNumber(condition.toothNumber);
    setConditionId(condition.definitive.conditionId);
    setPrice(condition.definitive.price.toString());
    setNotes(condition.definitive.notes || '');
  };

  /**
   * Cancela el modo edición y resetea el formulario
   */
  const cancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    resetForm();
  };

  /**
   * Resetea todos los campos del formulario
   */
  const resetForm = () => {
    setToothNumber('');
    setConditionId('');
    setPrice('');
    setNotes('');
  };

  /**
   * Auto-completa el precio cuando se selecciona una condición
   */
  const autoFillPrice = (selectedConditionId: string) => {
    setConditionId(selectedConditionId);
    const defaultPrice = DiagnosisService.getConditionDefaultPrice(selectedConditionId);
    if (defaultPrice > 0) {
      setPrice(defaultPrice.toString());
    }
  };

  /**
   * Valida que todos los campos obligatorios estén completos
   */
  const isFormValid = (): boolean => {
    return DiagnosisService.validateConditionFields(toothNumber, conditionId, price);
  };

  /**
   * Obtiene los datos del formulario parseados
   */
  const getFormData = () => {
    if (!isFormValid()) {
      return null;
    }

    return {
      toothNumber,
      conditionId,
      price: parseFloat(price),
      notes
    };
  };

  return {
    // Form state
    toothNumber,
    conditionId,
    price,
    notes,
    isEditing,
    editingId,

    // Form setters
    setToothNumber,
    setConditionId,
    setPrice,
    setNotes,

    // Form actions
    startEdit,
    cancelEdit,
    resetForm,
    autoFillPrice,

    // Validation
    isFormValid,
    getFormData
  };
};

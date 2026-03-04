/**
 * Hook centralizado para manejo de estado de consultas médicas
 *
 * NOTA: Este hook está en construcción. Actualmente es un placeholder
 * que se irá expandiendo a medida que refactoricemos más steps.
 *
 * Objetivo final: Consolidar los 29 estados de PatientConsultation.tsx aquí
 */

import { useState } from 'react';
import { ConsultationRecord, TreatmentInfo } from '@/types/consultation';

/**
 * Hook básico para gestión de consultas
 *
 * Por ahora solo exporta funciones helper simples.
 * Se expandirá gradualmente.
 */
export const useConsultationForm = () => {
  // TODO: Este hook se expandirá cuando refactoricemos más steps
  // Por ahora es solo un placeholder

  /**
   * Función helper para actualizar el registro médico
   * (Simplifica el patrón repetitivo de setCurrentRecord)
   */
  const createRecordUpdater = (
    currentRecord: ConsultationRecord,
    setCurrentRecord: (record: ConsultationRecord) => void,
    setUnsavedChanges: (val: boolean) => void
  ) => {
    return (updates: Partial<ConsultationRecord>) => {
      setCurrentRecord({
        ...currentRecord,
        ...updates
      });
      setUnsavedChanges(true);
    };
  };

  return {
    // Por ahora solo exportamos helpers
    // En el futuro este hook manejará todo el estado
    createRecordUpdater
  };
};

/**
 * Funciones helper para listas dinámicas
 * (Eliminan duplicación de código de add/remove/update)
 */
export const useDynamicList = (initialValue: string[] = ['']) => {
  const [items, setItems] = useState<string[]>(initialValue);

  const add = () => {
    setItems([...items, '']);
  };

  const remove = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const update = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = value;
    setItems(updated);
  };

  return {
    items,
    add,
    remove,
    update,
    setItems
  };
};

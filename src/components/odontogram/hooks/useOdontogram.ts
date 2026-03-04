import { useState, useEffect, useCallback, useMemo } from 'react';
import { Odontogram, type OdontogramStatistics } from '../classes';
import useOdontogramStore, { type ToothCondition } from '@/store/odontogramStore';
import type { Patient } from '@/types';

interface UseOdontogramProps {
  patient?: Patient | any | null;
  patientId?: string;
  onConditionsChange?: (conditions: ToothCondition[]) => void;
}

export const useOdontogram = ({ patient, patientId, onConditionsChange }: UseOdontogramProps) => {
  const {
    getPatientOdontogram,
    addConditionToPatient,
    removeConditionFromPatient,
    updateConditionPrice,
    exportOdontogram,
    importOdontogram,
    getPatientStatistics
  } = useOdontogramStore();

  const effectivePatientId = patientId || patient?.id;

  // Crear instancia del odontograma
  const odontogram = useMemo(() => {
    if (!effectivePatientId) return null;
    return new Odontogram(effectivePatientId);
  }, [effectivePatientId]);

  // Cargar condiciones desde el store
  useEffect(() => {
    if (odontogram && effectivePatientId) {
      const conditions = getPatientOdontogram(effectivePatientId);
      odontogram.loadConditions(conditions);
    }
  }, [odontogram, effectivePatientId, getPatientOdontogram]);

  // Notificar cambios en las condiciones
  useEffect(() => {
    if (odontogram && onConditionsChange) {
      onConditionsChange(odontogram.getAllConditions());
    }
  }, [odontogram, onConditionsChange]);

  // Agregar condición a un diente
  const addCondition = useCallback((toothNumber: string, condition: ToothCondition) => {
    if (!odontogram || !effectivePatientId) return;

    odontogram.addCondition(toothNumber, condition);
    addConditionToPatient(effectivePatientId, condition);

    if (onConditionsChange) {
      onConditionsChange(odontogram.getAllConditions());
    }
  }, [odontogram, effectivePatientId, addConditionToPatient, onConditionsChange]);

  // Remover condición de un diente
  const removeCondition = useCallback((toothNumber: string, sectionId: string) => {
    if (!odontogram || !effectivePatientId) return;

    odontogram.removeCondition(toothNumber, sectionId);
    removeConditionFromPatient(effectivePatientId, toothNumber, sectionId);

    if (onConditionsChange) {
      onConditionsChange(odontogram.getAllConditions());
    }
  }, [odontogram, effectivePatientId, removeConditionFromPatient, onConditionsChange]);

  // Actualizar precio de condición
  const updatePrice = useCallback((toothNumber: string, sectionId: string, conditionId: string, price: number) => {
    if (!odontogram || !effectivePatientId) return;

    odontogram.updateConditionPrice(toothNumber, sectionId, conditionId, price);
    updateConditionPrice(effectivePatientId, toothNumber, sectionId, price);

    if (onConditionsChange) {
      onConditionsChange(odontogram.getAllConditions());
    }
  }, [odontogram, effectivePatientId, updateConditionPrice, onConditionsChange]);

  // Actualizar precio total de un diente
  const updateToothTotalPrice = useCallback((toothNumber: string, newTotal: number) => {
    if (!odontogram || !effectivePatientId) return;

    odontogram.updateToothTotalPrice(toothNumber, newTotal);

    // Actualizar todos los precios en el store
    const tooth = odontogram.getTooth(toothNumber);
    if (tooth) {
      tooth.getConditions().forEach(condition => {
        updateConditionPrice(effectivePatientId, toothNumber, condition.sectionId, condition.price || 0);
      });
    }

    if (onConditionsChange) {
      onConditionsChange(odontogram.getAllConditions());
    }
  }, [odontogram, effectivePatientId, updateConditionPrice, onConditionsChange]);

  // Limpiar odontograma
  const clearOdontogram = useCallback(() => {
    if (!odontogram) return;

    odontogram.clearAllConditions();

    if (onConditionsChange) {
      onConditionsChange([]);
    }
  }, [odontogram, onConditionsChange]);

  // Obtener estadísticas
  const getStatistics = useCallback((): OdontogramStatistics | null => {
    if (!odontogram) return null;
    return odontogram.getStatistics();
  }, [odontogram]);

  // Exportar odontograma
  const exportData = useCallback(() => {
    if (!odontogram || !effectivePatientId) return null;
    return exportOdontogram(effectivePatientId);
  }, [odontogram, effectivePatientId, exportOdontogram]);

  // Importar odontograma
  const importData = useCallback((data: string) => {
    if (!odontogram || !effectivePatientId) return false;
    return importOdontogram(effectivePatientId, data);
  }, [odontogram, effectivePatientId, importOdontogram]);

  return {
    odontogram,
    addCondition,
    removeCondition,
    updatePrice,
    updateToothTotalPrice,
    clearOdontogram,
    getStatistics,
    exportData,
    importData
  };
};

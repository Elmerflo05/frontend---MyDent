/**
 * useDefinitiveDiagnosis Hook
 *
 * Maneja el estado y lógica del diagnóstico definitivo (columna derecha - editable)
 * Gestiona el CRUD de condiciones definitivas con persistencia en base de datos
 */

import { useState, useEffect, useCallback } from 'react';
import { consultationsApi, DefinitiveDiagnosisConditionData } from '@/services/api/consultationsApi';
import { DiagnosisService } from '@/services/diagnosis';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import type {
  DiagnosticCondition,
  DefinitiveDiagnosticCondition
} from '@/services/diagnosis';

interface UseDefinitiveDiagnosisProps {
  consultationId?: number;
  currentRecord: any;
  setCurrentRecord: (record: any) => void;
  setUnsavedChanges: (val: boolean) => void;
  presumptiveConditions: DiagnosticCondition[];
}

interface UseDefinitiveDiagnosisReturn {
  definitiveConditions: DefinitiveDiagnosticCondition[];
  definitiveTotal: number;
  modifiedCount: number;
  isLoading: boolean;
  isSaving: boolean;
  addCondition: (toothNumber: string, conditionId: string, price: number, notes?: string, surfaces?: string[]) => boolean;
  updateCondition: (id: string, updates: {
    toothNumber?: string;
    conditionId?: string;
    price?: number;
    notes?: string;
    surfaces?: string[];
  }) => boolean;
  removeCondition: (id: string) => void;
  copyFromPresumptive: () => void;
  initializeFromPresumptive: () => void;
  loadFromDatabase: () => Promise<void>;
  saveToDatabase: () => Promise<boolean>;
}

/**
 * Convierte datos de la API a formato del frontend
 */
const mapApiToFrontend = (apiCondition: DefinitiveDiagnosisConditionData): DefinitiveDiagnosticCondition => {
  // Obtener precio del procedimiento si existe
  const procedurePrice = (apiCondition as any).procedure_price;
  const selectedProcedureId = (apiCondition as any).selected_procedure_id;
  const selectedProcedureName = (apiCondition as any).selected_procedure_name;

  return {
    id: `definitive-${apiCondition.definitive_condition_id}`,
    toothNumber: apiCondition.tooth_number,
    surfaces: apiCondition.surfaces || [],
    presumptive: {
      conditionId: apiCondition.presumptive_condition_id ? String(apiCondition.presumptive_condition_id) : '',
      conditionLabel: apiCondition.is_modified_from_presumptive ? 'Original' : apiCondition.condition_label,
      cie10: apiCondition.cie10_code || '',
      price: 0,
      notes: ''
    },
    definitive: {
      conditionId: String(apiCondition.dental_condition_id),
      conditionLabel: apiCondition.condition_label,
      cie10: apiCondition.cie10_code || '',
      price: Number(apiCondition.price) || 0,
      notes: apiCondition.notes || '',
      surfaces: apiCondition.surfaces || []
    },
    modified: apiCondition.is_modified_from_presumptive || false,
    // Datos adicionales para guardar
    _dbId: apiCondition.definitive_condition_id,
    _toothPositionId: apiCondition.tooth_position_id,
    _dentalConditionId: apiCondition.dental_condition_id,
    // Datos del procedimiento asignado (Paso 6)
    selected_procedure_id: selectedProcedureId || null,
    selectedProcedureId: selectedProcedureId || null,
    procedure_price: procedurePrice || null,
    selected_procedure_name: selectedProcedureName || null,
    _selected_procedure_name: selectedProcedureName || null
  } as DefinitiveDiagnosticCondition & {
    _dbId?: number;
    _toothPositionId?: number;
    _dentalConditionId?: number;
    selected_procedure_id?: number | null;
    selectedProcedureId?: number | null;
    procedure_price?: number | null;
    selected_procedure_name?: string | null;
    _selected_procedure_name?: string | null;
  };
};

/**
 * Hook para manejar el diagnóstico definitivo con persistencia en BD
 */
export const useDefinitiveDiagnosis = ({
  consultationId,
  currentRecord,
  setCurrentRecord,
  setUnsavedChanges,
  presumptiveConditions
}: UseDefinitiveDiagnosisProps): UseDefinitiveDiagnosisReturn => {
  const [definitiveConditions, setDefinitiveConditions] = useState<DefinitiveDiagnosticCondition[]>(
    currentRecord.definitiveConditions || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Obtener configuración del odontograma desde el store (desde BD)
  const { toothPositions, dentalConditions } = useOdontogramConfigStore();

  /**
   * Carga las condiciones desde la base de datos
   */
  const loadFromDatabase = useCallback(async () => {
    if (!consultationId) return;

    setIsLoading(true);
    try {
      const response = await consultationsApi.getDefinitiveDiagnosis(consultationId);
      if (response.success && response.data.conditions.length > 0) {
        const mappedConditions = response.data.conditions.map(mapApiToFrontend);
        setDefinitiveConditions(mappedConditions);
        setCurrentRecord({
          ...currentRecord,
          definitiveConditions: mappedConditions
        });
      }
    } catch (error) {
      console.error('Error al cargar diagnóstico definitivo:', error);
    } finally {
      setIsLoading(false);
    }
  }, [consultationId, currentRecord, setCurrentRecord]);

  /**
   * Guarda todas las condiciones en la base de datos (bulk save)
   */
  const saveToDatabase = useCallback(async (): Promise<boolean> => {
    if (!consultationId) {
      console.warn('No hay consultationId para guardar');
      return false;
    }

    setIsSaving(true);
    try {
      // Mapear condiciones del frontend al formato de la API
      const conditionsToSave = definitiveConditions.map(cond => {
        // Buscar tooth_position_id desde el store
        const toothPosition = toothPositions.find(
          tp => tp.tooth_number === cond.toothNumber
        );

        // Buscar dental_condition_id desde el store o usar el existente
        const dentalCondition = dentalConditions.find(
          dc => dc.condition_id === Number(cond.definitive.conditionId) ||
                dc.condition_code === cond.definitive.conditionId
        );

        return {
          presumptive_condition_id: null,
          tooth_position_id: (cond as any)._toothPositionId || toothPosition?.tooth_position_id || 1,
          tooth_number: cond.toothNumber,
          dental_condition_id: (cond as any)._dentalConditionId || dentalCondition?.condition_id || Number(cond.definitive.conditionId),
          condition_label: cond.definitive.conditionLabel,
          cie10_code: cond.definitive.cie10 || null,
          surfaces: (cond.definitive as any).surfaces || (cond as any).surfaces || [],
          price: cond.definitive.price,
          notes: cond.definitive.notes || null,
          is_modified_from_presumptive: cond.modified,
          modification_reason: cond.modified ? 'Modificado por el usuario' : null
        };
      });

      const response = await consultationsApi.saveDefinitiveDiagnosisBulk(
        consultationId,
        conditionsToSave
      );

      if (response.success) {
        // Actualizar las condiciones con los IDs de la BD
        const updatedConditions = response.data.conditions.map(mapApiToFrontend);
        setDefinitiveConditions(updatedConditions);
        setCurrentRecord({
          ...currentRecord,
          definitiveConditions: updatedConditions
        });
        setUnsavedChanges(false);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error al guardar diagnóstico definitivo:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [consultationId, definitiveConditions, toothPositions, dentalConditions, currentRecord, setCurrentRecord, setUnsavedChanges]);

  /**
   * Inicializa las condiciones definitivas copiando del presuntivo
   * (solo si no existen condiciones definitivas)
   */
  const initializeFromPresumptive = () => {
    if (definitiveConditions.length === 0 && presumptiveConditions.length > 0) {
      const initialConditions = DiagnosisService.convertPresumptiveToDefinitive(presumptiveConditions);
      setDefinitiveConditions(initialConditions);
      setCurrentRecord({
        ...currentRecord,
        definitiveConditions: initialConditions
      });
    }
  };

  /**
   * Copia todas las condiciones del presuntivo al definitivo (resetea el definitivo)
   */
  const copyFromPresumptive = () => {
    const copiedConditions = DiagnosisService.convertPresumptiveToDefinitive(presumptiveConditions);
    setDefinitiveConditions(copiedConditions);
    setCurrentRecord({
      ...currentRecord,
      definitiveConditions: copiedConditions
    });
    setUnsavedChanges(true);
  };

  /**
   * Agrega una nueva condición definitiva
   */
  const addCondition = (
    toothNumber: string,
    conditionId: string,
    price: number,
    notes?: string,
    surfaces?: string[]
  ): boolean => {
    // Validar campos
    if (!DiagnosisService.validateConditionFields(toothNumber, conditionId, price)) {
      return false;
    }

    // Buscar condición en el store (desde BD)
    const selectedCondition = dentalConditions.find(
      c => c.condition_id === Number(conditionId) || c.condition_code === conditionId
    );

    // Buscar posición del diente
    const toothPosition = toothPositions.find(tp => tp.tooth_number === toothNumber);

    const newCondition: DefinitiveDiagnosticCondition = {
      id: `definitive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      toothNumber: toothNumber,
      surfaces: surfaces || [],
      presumptive: {
        conditionId: '',
        conditionLabel: 'Nueva condición',
        cie10: '',
        price: 0,
        notes: ''
      },
      definitive: {
        conditionId: conditionId,
        conditionLabel: selectedCondition?.condition_name || 'Condición',
        cie10: selectedCondition?.cie10_code || '',
        price: price,
        notes: notes || '',
        surfaces: surfaces || []
      },
      modified: true,
      // Guardar IDs para persistencia
      _toothPositionId: toothPosition?.tooth_position_id,
      _dentalConditionId: selectedCondition?.condition_id || Number(conditionId)
    } as DefinitiveDiagnosticCondition & { _toothPositionId?: number; _dentalConditionId?: number };

    // Actualizar estado
    const updatedConditions = [...definitiveConditions, newCondition];
    setDefinitiveConditions(updatedConditions);
    setCurrentRecord({
      ...currentRecord,
      definitiveConditions: updatedConditions
    });
    setUnsavedChanges(true);

    return true;
  };

  /**
   * Actualiza una condición existente
   */
  const updateCondition = (
    id: string,
    updates: {
      toothNumber?: string;
      conditionId?: string;
      price?: number;
      notes?: string;
      surfaces?: string[];
    }
  ): boolean => {
    // Validar campos
    const toothNumber = updates.toothNumber || '';
    const conditionId = updates.conditionId || '';
    const price = updates.price || 0;

    if (!DiagnosisService.validateConditionFields(toothNumber, conditionId, price)) {
      return false;
    }

    // Buscar condición en el store (desde BD)
    const selectedCondition = dentalConditions.find(
      c => c.condition_id === Number(conditionId) || c.condition_code === conditionId
    );

    // Buscar posición del diente
    const toothPosition = toothPositions.find(tp => tp.tooth_number === toothNumber);

    // Actualizar condición
    const updatedConditions = definitiveConditions.map(cond => {
      if (cond.id === id) {
        const newDefinitive = {
          conditionId: conditionId,
          conditionLabel: selectedCondition?.condition_name || cond.definitive.conditionLabel,
          cie10: selectedCondition?.cie10_code || cond.definitive.cie10,
          price: price,
          notes: updates.notes !== undefined ? updates.notes : cond.definitive.notes,
          surfaces: updates.surfaces || (cond.definitive as any).surfaces || []
        };

        // Verificar si fue modificado
        const isModified = DiagnosisService.isConditionModified(cond.presumptive, newDefinitive);

        return {
          ...cond,
          toothNumber: toothNumber || cond.toothNumber,
          surfaces: updates.surfaces || (cond as any).surfaces || [],
          definitive: newDefinitive,
          modified: isModified,
          _toothPositionId: toothPosition?.tooth_position_id || (cond as any)._toothPositionId,
          _dentalConditionId: selectedCondition?.condition_id || (cond as any)._dentalConditionId
        };
      }
      return cond;
    });

    setDefinitiveConditions(updatedConditions);
    setCurrentRecord({
      ...currentRecord,
      definitiveConditions: updatedConditions
    });
    setUnsavedChanges(true);

    return true;
  };

  /**
   * Elimina una condición
   */
  const removeCondition = (id: string) => {
    const updatedConditions = definitiveConditions.filter(c => c.id !== id);
    setDefinitiveConditions(updatedConditions);
    setCurrentRecord({
      ...currentRecord,
      definitiveConditions: updatedConditions
    });
    setUnsavedChanges(true);
  };

  // Cargar desde BD al montar si hay consultationId
  useEffect(() => {
    if (consultationId && definitiveConditions.length === 0) {
      loadFromDatabase();
    }
  }, [consultationId]);

  // Auto-inicializar desde presuntivo cuando esté disponible
  useEffect(() => {
    if (!isLoading && definitiveConditions.length === 0) {
      initializeFromPresumptive();
    }
  }, [presumptiveConditions, isLoading]);

  // Calcular totales y contadores
  const definitiveTotal = DiagnosisService.calculateDefinitiveTotal(definitiveConditions);
  const modifiedCount = DiagnosisService.countModifiedConditions(definitiveConditions);

  return {
    definitiveConditions,
    definitiveTotal,
    modifiedCount,
    isLoading,
    isSaving,
    addCondition,
    updateCondition,
    removeCondition,
    copyFromPresumptive,
    initializeFromPresumptive,
    loadFromDatabase,
    saveToDatabase
  };
};

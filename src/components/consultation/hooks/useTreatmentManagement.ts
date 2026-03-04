import { useState, useEffect } from 'react';
import { treatmentPacksApi, TreatmentPack } from '@/services/api/treatmentPacksApi';

/**
 * Hook para manejar la gestión de tratamientos aplicados
 * Carga los tratamientos desde la API (tabla treatments del backend)
 */

export interface TreatmentCondition {
  id: string;
  label: string;
  price: number;
  quantity: number;
  definitiveConditionId?: number | null;  // FK al diagnostico definitivo
  // Campos para vinculo con catalogo de sub-procedimientos
  subProcedureId?: number | null;      // FK a sub_procedures (NULL = manual)
  subProcedureCode?: string | null;    // Codigo del catalogo
  specialty?: string | null;           // Especialidad
  isFromCatalog?: boolean;             // Flag para UI
}

export interface AppliedTreatment {
  id: string;
  treatmentId: string;
  treatmentName: string;
  conditions: TreatmentCondition[];
  totalAmount: number;
}

interface DeleteModalState {
  show: boolean;
  type: 'treatment' | 'condition';
  treatmentId?: string;
  conditionId?: string;
  label: string;
}

interface UseTreatmentManagementProps {
  currentRecord: any;
  setCurrentRecord: (record: any) => void;
  setUnsavedChanges: (val: boolean) => void;
}

export const useTreatmentManagement = ({
  currentRecord,
  setCurrentRecord,
  setUnsavedChanges
}: UseTreatmentManagementProps) => {
  const [availableTreatments, setAvailableTreatments] = useState<TreatmentPack[]>([]);
  const [isLoadingTreatments, setIsLoadingTreatments] = useState(false);
  const [appliedTreatments, setAppliedTreatments] = useState<AppliedTreatment[]>(
    currentRecord.appliedTreatments || []
  );
  const [selectedTreatmentId, setSelectedTreatmentId] = useState('');
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    show: false,
    type: 'treatment',
    label: ''
  });

  // Cargar tratamientos disponibles desde la API (tabla treatments del backend)
  useEffect(() => {
    const loadTreatments = async () => {
      setIsLoadingTreatments(true);
      try {
        // Obtener tratamientos activos desde la API
        const response = await treatmentPacksApi.getTreatmentPacks({
          is_active: true,
          limit: 100
        });

        if (response.success && response.data) {
          setAvailableTreatments(response.data);
        }
      } catch (error) {
        console.error('Error al cargar tratamientos desde API:', error);
      } finally {
        setIsLoadingTreatments(false);
      }
    };
    loadTreatments();
  }, []);

  // Agregar tratamiento
  const handleAddTreatment = async () => {
    if (!selectedTreatmentId) return;

    const treatment = availableTreatments.find(t => String(t.treatment_id) === selectedTreatmentId);
    if (!treatment) return;

    // Cargar detalles completos del tratamiento (con items)
    let conditionItems: Array<{ id: string; label: string; price: number; quantity: number }> = [];

    try {
      const detailResponse = await treatmentPacksApi.getTreatmentPackById(treatment.treatment_id!);
      if (detailResponse.success && detailResponse.data) {
        const packDetails = detailResponse.data;

        // Mapear condition_items
        if (packDetails.condition_items && packDetails.condition_items.length > 0) {
          conditionItems = packDetails.condition_items.map(item => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            label: item.condition_name || item.procedure_name || 'Item sin nombre',
            price: item.unit_price || 0,
            quantity: item.quantity || 1
          }));
        }

        // Agregar custom_items también
        if (packDetails.custom_items && packDetails.custom_items.length > 0) {
          const customMapped = packDetails.custom_items.map(item => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            label: item.item_name || 'Item personalizado',
            price: Number(item.unit_price) || 0,
            quantity: item.quantity || 1
          }));
          conditionItems = [...conditionItems, ...customMapped];
        }

        // Agregar sub_procedure_items
        if (packDetails.sub_procedure_items && packDetails.sub_procedure_items.length > 0) {
          const subProcMapped = packDetails.sub_procedure_items.map((item: any) => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            label: item.sub_procedure_name || 'Sub-procedimiento',
            price: Number(item.price_without_plan) || Number(item.unit_price) || 0,
            quantity: item.quantity || 1
          }));
          conditionItems = [...conditionItems, ...subProcMapped];
        }
      }
    } catch (error) {
      // Error silencioso - cargar tratamiento sin detalles
    }

    // Si no hay items, usar el precio total como único item
    if (conditionItems.length === 0) {
      conditionItems = [{
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label: treatment.treatment_name || 'Tratamiento',
        price: treatment.total_price || treatment.base_price || 0,
        quantity: 1
      }];
    }

    const totalAmount = conditionItems.reduce((sum, cond) => sum + (cond.price * cond.quantity), 0);
    const newTreatment: AppliedTreatment = {
      id: `treatment-${Date.now()}`,
      treatmentId: String(treatment.treatment_id),
      treatmentName: treatment.treatment_name || 'Sin nombre',
      conditions: conditionItems,
      totalAmount
    };

    const updated = [...appliedTreatments, newTreatment];
    setAppliedTreatments(updated);
    setCurrentRecord({ ...currentRecord, appliedTreatments: updated });
    setUnsavedChanges(true);
    setSelectedTreatmentId('');
  };

  // Eliminar tratamiento
  const handleRemoveTreatment = (treatmentId: string) => {
    const updated = appliedTreatments.filter(t => t.id !== treatmentId);
    setAppliedTreatments(updated);
    setCurrentRecord({ ...currentRecord, appliedTreatments: updated });
    setUnsavedChanges(true);
    setDeleteModal({ show: false, type: 'treatment', label: '' });
  };

  // Eliminar condición
  const handleRemoveCondition = (treatmentId: string, conditionId: string) => {
    const updated = appliedTreatments.map(t => {
      if (t.id === treatmentId) {
        const updatedConditions = t.conditions.filter(c => c.id !== conditionId);
        const totalAmount = updatedConditions.reduce((sum, c) => sum + (c.price * c.quantity), 0);
        return { ...t, conditions: updatedConditions, totalAmount };
      }
      return t;
    });
    setAppliedTreatments(updated);
    setCurrentRecord({ ...currentRecord, appliedTreatments: updated });
    setUnsavedChanges(true);
    setDeleteModal({ show: false, type: 'condition', label: '' });
  };

  // Editar nombre de tratamiento
  const handleEditTreatmentName = (treatmentId: string, newName: string) => {
    const updated = appliedTreatments.map(t => t.id === treatmentId ? { ...t, treatmentName: newName } : t);
    setAppliedTreatments(updated);
    setCurrentRecord({ ...currentRecord, appliedTreatments: updated });
    setUnsavedChanges(true);
  };

  // Editar cantidad de piezas de una condición específica
  const handleEditConditionQuantity = (treatmentId: string, conditionId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    const updated = appliedTreatments.map(t => {
      if (t.id === treatmentId) {
        const updatedConditions = t.conditions.map(c =>
          c.id === conditionId ? { ...c, quantity: newQuantity } : c
        );
        const totalAmount = updatedConditions.reduce((sum, c) => sum + (c.price * c.quantity), 0);
        return { ...t, conditions: updatedConditions, totalAmount };
      }
      return t;
    });
    setAppliedTreatments(updated);
    setCurrentRecord({ ...currentRecord, appliedTreatments: updated });
    setUnsavedChanges(true);
  };

  // Editar nombre de condición
  const handleEditConditionLabel = (treatmentId: string, conditionId: string, newLabel: string) => {
    const updated = appliedTreatments.map(t => {
      if (t.id === treatmentId) {
        return { ...t, conditions: t.conditions.map(c => c.id === conditionId ? { ...c, label: newLabel } : c) };
      }
      return t;
    });
    setAppliedTreatments(updated);
    setCurrentRecord({ ...currentRecord, appliedTreatments: updated });
    setUnsavedChanges(true);
  };

  // Editar precio de condición
  const handleEditConditionPrice = (treatmentId: string, conditionId: string, newPrice: number) => {
    const updated = appliedTreatments.map(t => {
      if (t.id === treatmentId) {
        const updatedConditions = t.conditions.map(c => c.id === conditionId ? { ...c, price: newPrice } : c);
        const totalAmount = updatedConditions.reduce((sum, c) => sum + (c.price * c.quantity), 0);
        return { ...t, conditions: updatedConditions, totalAmount };
      }
      return t;
    });
    setAppliedTreatments(updated);
    setCurrentRecord({ ...currentRecord, appliedTreatments: updated });
    setUnsavedChanges(true);
  };

  // Agregar condicion manual a un tratamiento
  // Opcionalmente puede incluir definitiveConditionId para vincular con el diagnostico definitivo
  // Nuevos parametros opcionales para catalogo de sub-procedimientos
  const handleAddConditionToTreatment = (
    treatmentId: string,
    label: string,
    price: number,
    definitiveConditionId?: number | null,
    // Nuevos parametros opcionales para catalogo
    subProcedureId?: number | null,
    subProcedureCode?: string | null,
    specialty?: string | null
  ) => {
    const newCondition: TreatmentCondition = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: label.trim(),
      price: price,
      quantity: 1,
      definitiveConditionId: definitiveConditionId || null,
      subProcedureId: subProcedureId || null,
      subProcedureCode: subProcedureCode || null,
      specialty: specialty || null,
      isFromCatalog: !!subProcedureId
    };

    const updated = appliedTreatments.map(t => {
      if (t.id === treatmentId) {
        const updatedConditions = [...t.conditions, newCondition];
        const totalAmount = updatedConditions.reduce((sum, c) => sum + (c.price * c.quantity), 0);
        return { ...t, conditions: updatedConditions, totalAmount };
      }
      return t;
    });

    setAppliedTreatments(updated);
    setCurrentRecord({ ...currentRecord, appliedTreatments: updated });
    setUnsavedChanges(true);
  };

  // Nombre del tratamiento genérico para sub-procedimientos sueltos
  const STANDALONE_TREATMENT_NAME = 'Procedimientos Adicionales';
  const STANDALONE_TREATMENT_ID = 'standalone-procedures';

  // Agregar sub-procedimiento de forma independiente (sin tratamiento previo)
  // Crea o reutiliza un tratamiento genérico "Procedimientos Adicionales"
  const handleAddStandaloneSubProcedure = (
    label: string,
    price: number,
    subProcedureId?: number | null,
    subProcedureCode?: string | null,
    specialty?: string | null
  ) => {
    const newCondition: TreatmentCondition = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: label.trim(),
      price: price,
      quantity: 1,
      definitiveConditionId: null,
      subProcedureId: subProcedureId || null,
      subProcedureCode: subProcedureCode || null,
      specialty: specialty || null,
      isFromCatalog: !!subProcedureId
    };

    // Buscar si ya existe el tratamiento genérico
    const existingStandalone = appliedTreatments.find(
      t => t.treatmentName === STANDALONE_TREATMENT_NAME || t.id === STANDALONE_TREATMENT_ID
    );

    let updated: AppliedTreatment[];

    if (existingStandalone) {
      // Agregar al tratamiento existente
      updated = appliedTreatments.map(t => {
        if (t.id === existingStandalone.id) {
          const updatedConditions = [...t.conditions, newCondition];
          const totalAmount = updatedConditions.reduce((sum, c) => sum + (c.price * c.quantity), 0);
          return { ...t, conditions: updatedConditions, totalAmount };
        }
        return t;
      });
    } else {
      // Crear nuevo tratamiento genérico
      const standaloneTreatment: AppliedTreatment = {
        id: `${STANDALONE_TREATMENT_ID}-${Date.now()}`,
        treatmentId: STANDALONE_TREATMENT_ID,
        treatmentName: STANDALONE_TREATMENT_NAME,
        conditions: [newCondition],
        totalAmount: newCondition.price * newCondition.quantity
      };
      updated = [...appliedTreatments, standaloneTreatment];
    }

    setAppliedTreatments(updated);
    setCurrentRecord({ ...currentRecord, appliedTreatments: updated });
    setUnsavedChanges(true);
  };

  // Calcular gran total
  const grandTotal = appliedTreatments.reduce((sum, t) => sum + t.totalAmount, 0);

  return {
    availableTreatments,
    isLoadingTreatments,
    appliedTreatments,
    selectedTreatmentId,
    setSelectedTreatmentId,
    deleteModal,
    setDeleteModal,
    handleAddTreatment,
    handleRemoveTreatment,
    handleRemoveCondition,
    handleEditTreatmentName,
    handleEditConditionQuantity,
    handleEditConditionLabel,
    handleEditConditionPrice,
    handleAddConditionToTreatment,
    handleAddStandaloneSubProcedure,
    grandTotal
  };
};

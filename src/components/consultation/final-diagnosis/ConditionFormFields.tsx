import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Save } from 'lucide-react';
import type { ToothCondition } from '@/types';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import { formatCurrency } from '../utils/treatmentPlanHelpers';
import { getPriceForPlan, type ProcedureWithPlanPrices } from '@/constants/healthPlanCodes';
import { getConditionProcedurePriceForPatient } from '@/services/pricing/consultationPricingService';

interface ConditionFormFieldsProps {
  isEditing: boolean;
  toothNumber: string;
  conditionId: string;
  price: string;
  notes: string;
  surfaces?: string[];
  availableConditions: ToothCondition[];
  /** Plan de salud del paciente para calcular precios preferenciales (fallback) */
  patientHealthPlan?: string | null;
  /** ID numérico del paciente para resolver precios vía API (empresa > plan > regular) */
  patientId?: number | null;
  onToothNumberChange: (value: string) => void;
  onConditionIdChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSurfacesChange?: (surfaces: string[]) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const ConditionFormFields = ({
  isEditing,
  toothNumber,
  conditionId,
  price,
  notes,
  surfaces = [],
  availableConditions,
  patientHealthPlan,
  patientId,
  onToothNumberChange,
  onConditionIdChange,
  onPriceChange,
  onNotesChange,
  onSurfacesChange,
  onSubmit,
  onCancel
}: ConditionFormFieldsProps) => {
  // Obtener posiciones y superficies dentales del store (desde BD)
  const { toothPositions, toothSurfaces } = useOdontogramConfigStore();

  // Precio base unitario (por superficie)
  const [basePrice, setBasePrice] = useState<number>(0);

  // Agrupar dientes por cuadrante para mejor visualización (desde BD)
  const toothGroups = useMemo(() => {
    if (!toothPositions || toothPositions.length === 0) {
      return [];
    }

    // Agrupar por cuadrante
    const groupedByQuadrant: { [key: number]: { tooth_number: string; tooth_name: string }[] } = {};

    toothPositions
      .filter(pos => pos.status === 'active')
      .forEach(pos => {
        if (!groupedByQuadrant[pos.quadrant]) {
          groupedByQuadrant[pos.quadrant] = [];
        }
        groupedByQuadrant[pos.quadrant].push({
          tooth_number: pos.tooth_number,
          tooth_name: pos.tooth_name
        });
      });

    // Definir nombres de cuadrantes
    const quadrantLabels: { [key: number]: string } = {
      1: 'Superior Derecho (Q1)',
      2: 'Superior Izquierdo (Q2)',
      3: 'Inferior Izquierdo (Q3)',
      4: 'Inferior Derecho (Q4)',
      5: 'Temporal Sup. Der. (Q5)',
      6: 'Temporal Sup. Izq. (Q6)',
      7: 'Temporal Inf. Izq. (Q7)',
      8: 'Temporal Inf. Der. (Q8)'
    };

    // Convertir a formato de grupos
    return Object.keys(groupedByQuadrant)
      .sort((a, b) => Number(a) - Number(b))
      .map(quadrant => ({
        label: quadrantLabels[Number(quadrant)] || `Cuadrante ${quadrant}`,
        teeth: groupedByQuadrant[Number(quadrant)]
      }));
  }, [toothPositions]);

  // Superficies dentales desde BD
  const surfaceOptions = useMemo(() => {
    if (!toothSurfaces || toothSurfaces.length === 0) {
      return [];
    }

    return toothSurfaces
      .filter(surf => surf.status === 'active')
      .map(surf => ({
        id: surf.surface_code,
        label: surf.surface_name,
        shortLabel: surf.surface_code,
        description: surf.description
      }));
  }, [toothSurfaces]);

  /**
   * Obtener precio de la condición según cobertura del paciente.
   * Prioridad (manejada por backend): empresa > plan > regular.
   * Fallback local si la API falla o no hay patientId.
   */
  const getConditionBasePrice = (condition: any): number => {
    // 1. Si la condición tiene procedimientos con precios por plan, usar el primer procedimiento
    if (condition?.procedures && condition.procedures.length > 0) {
      const firstProcedure = condition.procedures[0];
      if (firstProcedure?.price_without_plan !== undefined) {
        return getPriceForPlan(firstProcedure as ProcedureWithPlanPrices, patientHealthPlan);
      }
    }

    // 2. Si la condición misma tiene precios por plan, usarlos
    if (condition?.price_without_plan !== undefined) {
      return getPriceForPlan(condition as ProcedureWithPlanPrices, patientHealthPlan);
    }

    // 3. Fallback para condiciones sin precios por plan
    return Number(condition?.price_base || condition?.default_price || condition?.price || 0);
  };

  // Cuando cambia la condición, resolver precio vía API (async) con fallback local (sync)
  useEffect(() => {
    if (conditionId) {
      const selectedCondition = availableConditions.find(c => c.id === conditionId);
      if (selectedCondition) {
        // Precio local inmediato (fallback)
        const localPrice = getConditionBasePrice(selectedCondition);
        setBasePrice(localPrice);

        // Resolver vía API si hay patientId y procedimientos
        if (patientId && selectedCondition.procedures?.length > 0) {
          const firstProc = (selectedCondition as any).procedures[0];
          const procId = firstProc?.procedure_id || firstProc?.condition_procedure_id;
          if (procId) {
            getConditionProcedurePriceForPatient(procId, patientId, firstProc)
              .then(resolved => {
                if (resolved.pricingSource !== 'fallback') {
                  setBasePrice(resolved.price);
                }
              })
              .catch(() => { /* mantener precio local */ });
          }
        }
      }
    }
  }, [conditionId, availableConditions, patientId]);

  // Toggle superficie y recalcular precio
  const handleSurfaceToggle = (surfaceId: string) => {
    if (!onSurfacesChange) return;

    const newSurfaces = surfaces.includes(surfaceId)
      ? surfaces.filter(s => s !== surfaceId)
      : [...surfaces, surfaceId];

    onSurfacesChange(newSurfaces);

    // Recalcular precio: precio base × cantidad de superficies (mínimo 1)
    if (basePrice > 0) {
      const multiplier = newSurfaces.length > 0 ? newSurfaces.length : 1;
      const newPrice = basePrice * multiplier;
      onPriceChange(newPrice.toString());
    }
  };

  // Handler para cuando se selecciona una condición
  const handleConditionSelect = (selectedConditionId: string) => {
    const selectedCondition = availableConditions.find(
      (c) => c.id === selectedConditionId
    );
    onConditionIdChange(selectedConditionId);

    if (selectedCondition) {
      const newBasePrice = getConditionBasePrice(selectedCondition);
      setBasePrice(newBasePrice);

      // Calcular precio inicial según superficies ya seleccionadas
      const multiplier = surfaces.length > 0 ? surfaces.length : 1;
      const calculatedPrice = newBasePrice * multiplier;
      onPriceChange(calculatedPrice.toString());
    }
  };

  return (
    <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-4 mb-4">
      <h5 className="font-semibold text-emerald-900 mb-3">
        {isEditing ? 'Editar Condicion' : 'Agregar Nueva Condicion'}
      </h5>

      <div className="space-y-3">
        {/* Fila 1: Diente y Condición */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diente *
            </label>
            <select
              value={toothNumber}
              onChange={(e) => onToothNumberChange(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
              required
            >
              <option value="">Seleccione...</option>
              {toothGroups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.teeth.map((tooth) => (
                    <option key={tooth.tooth_number} value={tooth.tooth_number}>
                      {tooth.tooth_number} - {tooth.tooth_name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condicion *
            </label>
            <select
              value={conditionId}
              onChange={(e) => handleConditionSelect(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
              required
            >
              <option value="">Seleccione...</option>
              {availableConditions.map((condition) => (
                <option key={condition.id} value={condition.id}>
                  {condition.label}
                  {(condition as any).cie10 ? ` (${(condition as any).cie10})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fila 2: Superficies (selección múltiple con checkboxes) */}
        {onSurfacesChange && surfaceOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Superficies afectadas {surfaces.length > 0 && <span className="text-emerald-600">({surfaces.length} seleccionada{surfaces.length > 1 ? 's' : ''})</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {surfaceOptions.map((surface) => {
                const isSelected = surfaces.includes(surface.id);
                return (
                  <button
                    key={surface.id}
                    type="button"
                    onClick={() => handleSurfaceToggle(surface.id)}
                    className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-emerald-400'
                    }`}
                    title={surface.description || surface.label}
                  >
                    {surface.shortLabel} - {surface.label}
                  </button>
                );
              })}
            </div>
            {basePrice > 0 && surfaces.length > 0 && (
              <p className="text-xs text-blue-600 mt-2 bg-blue-50 px-2 py-1 rounded">
                Calculo: {formatCurrency(basePrice)} x {surfaces.length} superficie{surfaces.length > 1 ? 's' : ''} = {formatCurrency(basePrice * surfaces.length)}
              </p>
            )}
          </div>
        )}

        {/* Fila 3: Precio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio Total (S/) * <span className="text-xs text-gray-500 font-normal">(editable)</span>
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
            placeholder="0.00"
            required
          />
        </div>

        {/* Fila 4: Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all resize-none"
            placeholder="Observaciones adicionales..."
          />
        </div>

        {/* Botones */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Agregar Condicion
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

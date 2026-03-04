import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { TreatmentPack } from '@/services/api/treatmentPacksApi';
import { formatCurrency } from '../../utils/treatmentPlanHelpers';

interface TreatmentFormProps {
  availableTreatments: TreatmentPack[];
  selectedTreatmentId: string;
  setSelectedTreatmentId: (id: string) => void;
  handleAddTreatment: () => void;
  readOnly?: boolean;
  isLoading?: boolean;
}

export const TreatmentForm: React.FC<TreatmentFormProps> = ({
  availableTreatments,
  selectedTreatmentId,
  setSelectedTreatmentId,
  handleAddTreatment,
  readOnly = false,
  isLoading = false
}) => {
  if (readOnly) return null;

  // Calcular cantidad total de items de un pack
  // IMPORTANTE: PostgreSQL devuelve COUNT como string (BigInt), hay que convertir a numero
  const getItemsCount = (treatment: TreatmentPack) => {
    const conditionCount = Number(treatment.condition_items_count) || 0;
    const customCount = Number(treatment.custom_items_count) || 0;
    const subProcCount = Number(treatment.sub_procedure_items_count) || 0;
    return conditionCount + customCount + subProcCount;
  };

  return (
    <div className="flex gap-2 items-center bg-purple-50 rounded-lg p-2 border border-purple-100">
      <select
        value={selectedTreatmentId}
        onChange={(e) => setSelectedTreatmentId(e.target.value)}
        disabled={isLoading}
        className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-purple-400 focus:border-purple-400 disabled:bg-gray-100"
      >
        <option value="">
          {isLoading ? 'Cargando tratamientos...' : 'Seleccionar tratamiento...'}
        </option>
        {availableTreatments.map(treatment => (
          <option key={treatment.treatment_id} value={String(treatment.treatment_id)}>
            {treatment.treatment_name} - {formatCurrency(treatment.total_price || treatment.base_price || 0)} ({getItemsCount(treatment)} items)
          </option>
        ))}
      </select>
      <button
        onClick={handleAddTreatment}
        disabled={!selectedTreatmentId || isLoading}
        className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        Agregar
      </button>
    </div>
  );
};

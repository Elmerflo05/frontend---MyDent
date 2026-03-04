/**
 * ConditionForm Component
 *
 * Formulario para agregar o editar condiciones definitivas
 */

import { CheckCircle, Plus } from 'lucide-react';
import { OFFICIAL_DENTAL_CONDITIONS } from '@/constants/dentalConditions';

interface ConditionFormProps {
  toothNumber: string;
  conditionId: string;
  price: string;
  notes: string;
  isEditing: boolean;
  onToothNumberChange: (value: string) => void;
  onConditionChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const ConditionForm = ({
  toothNumber,
  conditionId,
  price,
  notes,
  isEditing,
  onToothNumberChange,
  onConditionChange,
  onPriceChange,
  onNotesChange,
  onSubmit,
  onCancel
}: ConditionFormProps) => {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
      <h5 className="font-semibold text-emerald-900 mb-4">
        {isEditing ? 'Editar Condición' : 'Agregar Nueva Condición'}
      </h5>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pieza Dental <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={toothNumber}
            onChange={(e) => onToothNumberChange(e.target.value)}
            placeholder="Ej: 1.1, 2.1, 5.1..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condición <span className="text-red-500">*</span>
          </label>
          <select
            value={conditionId}
            onChange={(e) => onConditionChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Seleccione...</option>
            {OFFICIAL_DENTAL_CONDITIONS.map(condition => (
              <option key={condition.id} value={condition.id}>
                {condition.label} {condition.cie10 ? `(${condition.cie10})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Precio (S/) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas adicionales
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Observaciones..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        {isEditing ? (
          <>
            <button
              onClick={onSubmit}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Guardar Cambios
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar Condición
          </button>
        )}
      </div>
    </div>
  );
};

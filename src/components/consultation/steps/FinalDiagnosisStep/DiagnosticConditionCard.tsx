/**
 * DiagnosticConditionCard Component
 *
 * Card para mostrar una condición diagnóstica (presuntiva o definitiva)
 * Soporta modo lectura y modo editable
 */

import { motion } from 'framer-motion';
import { Edit3, Trash2, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/treatmentPlanHelpers';

interface DiagnosticConditionCardProps {
  condition: {
    id: string;
    toothNumber: string;
    conditionLabel?: string;
    cie10?: string;
    price: number;
    notes?: string;
  };
  index: number;
  mode: 'presumptive' | 'definitive';
  modified?: boolean;
  readOnly?: boolean;
  onEdit?: (condition: any) => void;
  onDelete?: (condition: any) => void;
}

export const DiagnosticConditionCard = ({
  condition,
  index,
  mode,
  modified = false,
  readOnly = false,
  onEdit,
  onDelete
}: DiagnosticConditionCardProps) => {
  const isPresumptive = mode === 'presumptive';

  const bgColor = isPresumptive
    ? 'bg-blue-50 border-blue-200'
    : modified
    ? 'bg-amber-50 border-amber-300'
    : 'bg-white border-emerald-200';

  const badgeColor = isPresumptive
    ? 'bg-blue-100 text-blue-700'
    : 'bg-emerald-100 text-emerald-700';

  const circleColor = isPresumptive
    ? 'bg-blue-500'
    : modified
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-lg p-4 border-2 ${bgColor}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${circleColor}`}>
            {condition.toothNumber}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h6 className="font-semibold text-gray-900">
                {condition.conditionLabel}
              </h6>
              {modified && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                  ✏️ Modificado
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {condition.cie10 && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                  CIE-10: {condition.cie10}
                </span>
              )}
              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${badgeColor}`}>
                {formatCurrency(condition.price)}
              </span>
            </div>
            {condition.notes && (
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Notas:</span> {condition.notes}
              </p>
            )}
          </div>
        </div>

        {!readOnly && !isPresumptive && onEdit && onDelete && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => onEdit(condition)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(condition)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

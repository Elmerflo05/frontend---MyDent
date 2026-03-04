import { motion } from 'framer-motion';
import { DollarSign, FileText } from 'lucide-react';
import type { DiagnosticCondition } from '@/types';
import { formatCurrency } from '../utils/treatmentPlanHelpers';

interface PresumptiveConditionsListProps {
  conditions: DiagnosticCondition[];
  total: number;
}

export const PresumptiveConditionsList = ({
  conditions,
  total
}: PresumptiveConditionsListProps) => {
  if (conditions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p>No hay condiciones en el diagnóstico presuntivo.</p>
        <p className="text-sm mt-1">
          Complete el odontograma y el diagnóstico presuntivo primero.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h5 className="font-semibold text-gray-800">
          Condiciones Presuntivas ({conditions.length})
        </h5>
        <div className="flex items-center gap-2 text-lg font-bold text-blue-600">
          <DollarSign className="w-5 h-5" />
          {formatCurrency(total)}
        </div>
      </div>

      <div className="space-y-2">
        {conditions.map((condition, index) => (
          <motion.div
            key={condition.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border-2 border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                {condition.toothNumber}
              </div>
              <div className="flex-1 min-w-0">
                <h6 className="font-semibold text-gray-900 mb-1">
                  {condition.conditionLabel}
                </h6>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {condition.cie10 && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                      CIE-10: {condition.cie10}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                    {formatCurrency(condition.price)}
                  </span>
                  {/* Mostrar superficie: primero surfaceName, luego surfaces array */}
                  {(condition.surfaceName || (condition.surfaces && condition.surfaces.length > 0)) && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                      Sup: {condition.surfaceName || condition.surfaces?.join(', ')}
                    </span>
                  )}
                </div>
                {condition.notes && (
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Notas:</span> {condition.notes}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
};

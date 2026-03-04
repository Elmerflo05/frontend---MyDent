import React from 'react';
import { CheckCircle, AlertCircle, Edit2, Stethoscope, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/treatmentPlanHelpers';

interface TreatmentSummaryProps {
  groupedConditionsByTooth: Record<string, any[]>;
  readOnly?: boolean;
  patientHealthPlan?: string | null;
}

const getCategoryStyle = (category?: string) => {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    'Patologia': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    'Tratamiento': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'Protesis': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'Anomalia': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'Ortodoncia': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  };
  return styles[category || ''] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
};

export const TreatmentSummary: React.FC<TreatmentSummaryProps> = ({
  groupedConditionsByTooth,
  readOnly = true,
  patientHealthPlan
}) => {
  if (Object.keys(groupedConditionsByTooth).length === 0) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 font-medium">Sin diagnostico definitivo</p>
        <p className="text-xs text-gray-400 mt-1">Complete el paso "Diagnostico Definitivo" primero</p>
      </div>
    );
  }

  const allConditions = Object.values(groupedConditionsByTooth).flat();

  // Calcular totales
  // El precio total debe considerar el procedure_price si existe, sino el price de la condición
  const totalPrice = allConditions.reduce((sum, cond) => {
    const price = cond.procedure_price || cond.price || 0;
    return sum + Number(price);
  }, 0);

  const modifiedCount = allConditions.filter(cond => cond.modified).length;
  const withProcedureCount = allConditions.filter(cond => cond.selected_procedure_name).length;

  return (
    <div className="p-3 max-h-[500px] overflow-y-auto">
      <div className="space-y-2">
        {allConditions.map((condition: any, idx: number) => {
          const categoryStyle = getCategoryStyle(condition.category);
          const conditionId = condition.id || condition.definitive_condition_id;
          const toothNumber = condition.toothNumber || condition.tooth_number || 'N/A';

          // Procedimiento seleccionado (viene del Paso 6)
          const selectedProcName = condition.selected_procedure_name || condition._selected_procedure_name;
          const selectedProcPrice = condition.procedure_price;
          const hasProcedure = !!selectedProcName;

          // Precio a mostrar: si hay procedimiento usar su precio, sino el de la condición
          const displayPrice = selectedProcPrice || condition.price || 0;

          return (
            <div
              key={`condition-${conditionId}-${idx}`}
              className={`rounded-xl border-2 ${categoryStyle.border} ${categoryStyle.bg} overflow-hidden shadow-sm`}
            >
              {/* Card principal con layout horizontal */}
              <div className="flex items-stretch">
                {/* Número de diente */}
                <div className="flex-shrink-0 w-14 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{toothNumber}</span>
                </div>

                {/* Información de la condición */}
                <div className="flex-1 p-3 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Nombre de la condición */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold ${categoryStyle.text}`}>
                          {condition.conditionName || condition.conditionCode || 'Condicion sin nombre'}
                        </span>
                        {condition.modified && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium text-amber-700 bg-amber-100 rounded-full flex items-center gap-0.5">
                            <Edit2 className="w-2.5 h-2.5" />
                            Modificado
                          </span>
                        )}
                      </div>

                      {/* Metadatos: CIE-10, Precio base, Superficie */}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {condition.cie10 && (
                          <span className="text-[11px] text-gray-600 bg-white/80 px-1.5 py-0.5 rounded">
                            CIE-10: <span className="font-mono font-medium">{condition.cie10}</span>
                          </span>
                        )}
                        <span className="text-[11px] text-gray-500 bg-white/80 px-1.5 py-0.5 rounded">
                          Base: {formatCurrency(condition.price)}
                        </span>
                        {(condition.surfaceName || condition.surfaceCode || (condition.surfaces && condition.surfaces.length > 0)) && (
                          <span className="text-[11px] text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">
                            Sup: {condition.surfaceCode || condition.surfaceName || condition.surfaces?.join(', ')}
                          </span>
                        )}
                      </div>

                      {/* Notas */}
                      {condition.notes && (
                        <p className="text-[10px] text-gray-500 mt-1.5 italic">
                          Notas: {condition.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sección de Procedimiento (derecha) - zona amarilla */}
                <div className="flex-shrink-0 w-52 border-l border-gray-200 bg-gradient-to-r from-amber-50 to-yellow-50 flex flex-col justify-center p-2">
                  {hasProcedure ? (
                    // Procedimiento asignado en el Paso 6
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Stethoscope className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[9px] text-amber-700 font-medium uppercase">Procedimiento</span>
                      </div>
                      <p className="text-[11px] font-semibold text-gray-800 leading-tight mb-1">
                        {selectedProcName}
                      </p>
                      <div className="flex items-center justify-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-base font-bold text-emerald-600">
                          {formatCurrency(selectedProcPrice || 0)}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] rounded-full">
                          <CheckCircle className="w-2.5 h-2.5" />
                          Asignado
                        </span>
                      </div>
                    </div>
                  ) : (
                    // Sin procedimiento asignado
                    <div className="text-center">
                      <Stethoscope className="w-5 h-5 mx-auto mb-1 text-gray-300" />
                      <p className="text-[10px] text-gray-400">Sin procedimiento</p>
                      <p className="text-[9px] text-gray-300 mt-0.5">Asignar en Paso 6</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen total */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span><strong>{Object.keys(groupedConditionsByTooth).length}</strong> piezas</span>
            </div>
            <span className="text-gray-300">|</span>
            <span><strong>{allConditions.length}</strong> condiciones</span>
            {withProcedureCount > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-amber-600">
                  <strong>{withProcedureCount}</strong> con procedimiento
                </span>
              </>
            )}
            {modifiedCount > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-amber-600"><strong>{modifiedCount}</strong> modificadas</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 text-lg font-bold text-emerald-600">
            <span className="text-xs text-gray-500 font-normal">Total:</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

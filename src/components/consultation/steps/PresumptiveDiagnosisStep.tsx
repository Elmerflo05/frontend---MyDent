/**
 * Step 3: Diagnóstico Presuntivo
 *
 * Componente para establecer el diagnóstico inicial basado en:
 * - Condiciones registradas en el odontograma (auto-poblado)
 * - Campo de información adicional para observaciones del doctor
 *
 * Muestra las condiciones dentales con sus códigos CIE-10 correspondientes.
 */

import { AlertCircle, Edit3, FileCheck } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import { StepHeader, StepNavigationButtons } from '@/components/consultation/shared';
import { OFFICIAL_DENTAL_CONDITIONS } from '@/constants/dentalConditions';

interface PresumptiveDiagnosisStepProps {
  // Estado del registro
  currentRecord: any;
  setCurrentRecord: (fn: (prev: any) => any) => void;

  // Odontograma para mostrar condiciones con CIE-10
  currentOdontogram?: any[];

  // Handlers
  setUnsavedChanges: (val: boolean) => void;

  // Control de acceso
  readOnly?: boolean;

  // Navegación
  onBack: () => void;
  onSave: () => void;
  onContinue: () => void;
}

/**
 * Componente del Step 3: Diagnóstico Presuntivo
 * OPTIMIZACIÓN: Envuelto en React.memo para evitar re-renders innecesarios
 */
const PresumptiveDiagnosisStepComponent = ({
  currentRecord,
  setCurrentRecord,
  currentOdontogram = [],
  setUnsavedChanges,
  readOnly = false,
  onBack,
  onSave,
  onContinue
}: PresumptiveDiagnosisStepProps) => {
  // Estado local para el textarea - permite escritura fluida
  const [localObservaciones, setLocalObservaciones] = useState(
    currentRecord.presumptiveDiagnosis?.observacionesDiagnostico || ''
  );

  // Sincronizar estado local cuando cambie el valor del padre (ej: al cargar datos)
  useEffect(() => {
    const parentValue = currentRecord.presumptiveDiagnosis?.observacionesDiagnostico || '';
    if (parentValue !== localObservaciones && parentValue !== '') {
      setLocalObservaciones(parentValue);
    }
  }, [currentRecord.presumptiveDiagnosis?.observacionesDiagnostico]);

  // Debounce para sincronizar con el estado padre (evita re-renders excesivos)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentValue = currentRecord.presumptiveDiagnosis?.observacionesDiagnostico || '';
      if (localObservaciones !== currentValue) {
        setCurrentRecord((prev: any) => ({
          ...prev,
          presumptiveDiagnosis: {
            ...prev.presumptiveDiagnosis,
            observacionesDiagnostico: localObservaciones
          }
        }));
        setUnsavedChanges(true);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localObservaciones]);

  // Contar condiciones patológicas (para el mensaje de auto-poblado)
  const pathologicalConditionsCount = currentOdontogram.filter(condition => {
    const officialCondition = OFFICIAL_DENTAL_CONDITIONS.find(c => c.id === condition.conditionId);
    return officialCondition?.category === 'patologia' || officialCondition?.category === 'anomalia';
  }).length;

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <StepHeader
        icon={AlertCircle}
        title="Diagnóstico Presuntivo"
        description="Diagnóstico inicial basado en el examen clínico preliminar"
        color="orange"
        className="mb-6"
      />

      <div className="space-y-6">
        {/* Condiciones del Odontograma con CIE-10 */}
        {currentOdontogram && currentOdontogram.length > 0 ? (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-purple-900 mb-1">
                  Condiciones Registradas en Odontograma
                </h4>
                <p className="text-sm text-purple-700">
                  Se detectaron {currentOdontogram.length} condición(es) dental(es). A continuación se listan con sus códigos CIE-10 correspondientes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentOdontogram.map((condition, index) => {
                const officialCondition = OFFICIAL_DENTAL_CONDITIONS.find(
                  c => c.id === condition.conditionId
                );

                // Mostrar todas las condiciones, no solo las que tienen configuración oficial
                const conditionLabel = officialCondition?.label || condition.condition_name || condition.conditionId;

                return (
                  <div
                    key={`${condition.toothNumber}-${condition.conditionId}-${index}`}
                    className="bg-white rounded-lg p-4 border border-purple-100 hover:shadow-md transition-shadow"
                  >
                    <div className="mb-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {conditionLabel}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Diente: <span className="font-medium text-purple-700">{condition.toothNumber}</span>
                        {condition.sectionId && condition.sectionId !== 'general' && (
                          <span className="ml-1">
                            • Superficie: <span className="font-medium">{condition.sectionId}</span>
                          </span>
                        )}
                      </p>
                    </div>

                    {officialCondition?.cie10 ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                        <FileCheck className="w-3 h-3" />
                        CIE-10: {officialCondition.cie10}
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        Sin código CIE-10
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              No hay condiciones registradas en el odontograma.
              Regrese al paso anterior para marcar las condiciones del paciente.
            </p>
          </div>
        )}

        {/* Indicador de auto-población desde odontograma */}
        {pathologicalConditionsCount > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">
                  Diagnósticos Auto-poblados desde Odontograma
                </h4>
                <p className="text-sm text-blue-700">
                  Se han detectado {pathologicalConditionsCount} condición(es) patológica(s) en el odontograma.
                  Los diagnósticos correspondientes se han marcado automáticamente. Puede agregar o quitar diagnósticos según sea necesario.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Campo de Información Adicional */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-gray-600" />
            Información Adicional
          </h4>

          <div>
            <textarea
              value={localObservaciones}
              onChange={(e) => setLocalObservaciones(e.target.value)}
              placeholder="Información adicional sobre el diagnóstico presuntivo..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={4}
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="pt-4">
          <StepNavigationButtons
            onBack={onBack}
            onSave={onSave}
            onContinue={onContinue}
            continueLabel="Continuar a Plan Diagnóstico"
          />
        </div>
      </div>
    </div>
  );
};

// OPTIMIZACIÓN: Exportar versión memoizada
export const PresumptiveDiagnosisStep = memo(PresumptiveDiagnosisStepComponent);

/**
 * Step 2: Odontograma
 *
 * Componente para el registro visual del estado dental del paciente.
 * Utiliza el componente Odontogram oficial (del super admin) para la interacción y
 * DetailedReportPanel para mostrar el reporte visual.
 *
 * NOTA: Ahora usa el odontograma completo con todas las condiciones oficiales
 * del Colegio Odontológico del Perú.
 */

import { motion } from 'framer-motion';
import { Grid3x3, Clock, CheckCircle } from 'lucide-react';
import { useState, memo } from 'react';
import Odontogram from '@/components/odontogram/Odontogram';
import DetailedReportPanel from '@/components/odontogram/DetailedReportPanel';
import { StepHeader, StepNavigationButtons } from '@/components/consultation/shared';

interface OdontogramStepProps {
  // Datos del paciente
  selectedPatient: any;

  // Estado del odontograma
  currentOdontogram: any[];
  setCurrentOdontogram: (data: any[]) => void;

  // Estado de completitud del odontograma
  isOdontogramIncomplete?: boolean;
  setIsOdontogramIncomplete?: (incomplete: boolean) => void;

  // Handlers
  setUnsavedChanges: (val: boolean) => void;
  handleOdontogramChange: (toothData: any) => void;

  // Control de acceso
  readOnly?: boolean;

  // Navegación
  onBack: () => void;
  onSave: () => void;
  onContinue: () => void;
}

/**
 * Componente del Step 2: Odontograma
 *
 * Este es el paso más pequeño del wizard (68 líneas originales)
 * y sirve como prueba de concepto para la refactorización.
 *
 * OPTIMIZACIÓN: Envuelto en React.memo para evitar re-renders innecesarios
 */
const OdontogramStepComponent = ({
  selectedPatient,
  currentOdontogram,
  setCurrentOdontogram,
  isOdontogramIncomplete = false,
  setIsOdontogramIncomplete,
  setUnsavedChanges,
  handleOdontogramChange,
  readOnly = false,
  onBack,
  onSave,
  onContinue
}: OdontogramStepProps) => {
  // Estado local para el checkbox de odontograma incompleto
  const [localIncompleteState, setLocalIncompleteState] = useState(isOdontogramIncomplete);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <StepHeader
        icon={Grid3x3}
        title="Odontograma"
        description="Registro dental interactivo del paciente"
        color="indigo"
        className="mb-6"
      />

      <div className="mb-6">
        <Odontogram
          patient={selectedPatient}
          patientId={selectedPatient?.id}
          key={`odontogram-${selectedPatient?.id || 'no-patient'}-${currentOdontogram?.length || 0}`}
          initialConditions={currentOdontogram || []}
          onConditionsChange={(conditions) => {
            setCurrentOdontogram(conditions);
            setUnsavedChanges(true);
          }}
          onToothUpdate={handleOdontogramChange}
          hideStatsCards={true}
          readOnly={readOnly}
        />
      </div>

      {/* Flag de Odontograma Incompleto */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="odontogram-incomplete"
                checked={localIncompleteState}
                onChange={(e) => {
                  const isIncomplete = e.target.checked;
                  setLocalIncompleteState(isIncomplete);
                  setIsOdontogramIncomplete?.(isIncomplete);
                  setUnsavedChanges(true);
                }}
                className="w-5 h-5 text-amber-600 bg-white border-2 border-amber-300 rounded focus:ring-amber-500 focus:ring-2"
                disabled={readOnly}
              />
              <label htmlFor="odontogram-incomplete" className="ml-3 flex items-center gap-2 font-medium text-amber-800 cursor-pointer">
                {localIncompleteState ? (
                  <>
                    <Clock className="w-5 h-5 text-amber-600" />
                    Odontograma incompleto - se completará en tratamiento
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-amber-600" />
                    Odontograma completo
                  </>
                )}
              </label>
            </div>
          </div>
          <p className="text-sm text-amber-700 mt-2 ml-8">
            {localIncompleteState
              ? "Marque esta opción si necesita completar el registro dental durante el tratamiento. Las patologías registradas se transferirán automáticamente para su seguimiento."
              : "El registro dental está completo y listo para el diagnóstico."
            }
          </p>
        </div>
      </motion.div>

      {/* Historia Clínica Dental */}
      {selectedPatient && currentOdontogram.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <DetailedReportPanel
            patient={selectedPatient}
            conditions={currentOdontogram}
            className="max-w-full"
          />
        </motion.div>
      )}

      <StepNavigationButtons
        onBack={onBack}
        onSave={onSave}
        onContinue={onContinue}
        continueLabel="Continuar a Diagnóstico Presuntivo"
      />
    </div>
  );
};

// OPTIMIZACIÓN: Exportar versión memoizada
export const OdontogramStep = memo(OdontogramStepComponent);

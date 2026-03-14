/**
 * TreatmentOdontogramSection - Comparativa de Odontogramas (Inicial vs Final)
 *
 * COMPORTAMIENTO:
 * 1. Muestra DOS odontogramas lado a lado (responsive):
 *    - INICIAL: Estado del paciente al comenzar (todas las condiciones en ROJO)
 *    - FINAL: Estado actual/después del tratamiento (condiciones completadas en AZUL)
 * 2. Ambos odontogramas son de SOLO LECTURA
 * 3. El odontograma FINAL se actualiza cuando se marcan tratamientos en el Checklist
 * 4. Layout responsive: lado a lado en desktop, vertical en móvil
 */

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3x3, Eye, Loader2, ArrowRight, ChevronDown } from 'lucide-react';

// Interface para exponer funciones al padre via ref (mantener compatibilidad)
export interface TreatmentOdontogramSectionRef {
  saveAll: () => Promise<boolean>;
  getPendingCount: () => number;
  hasPendingChanges: () => boolean;
}

import { SectionCard } from '@/components/consultation/shared';
import { getPatientEvolution } from './treatment-performed-helpers';
import Odontogram from '@/components/odontogram/Odontogram';

interface TreatmentOdontogramSectionProps {
  patient: any;
  /** Condiciones del odontograma INICIAL (del paso 2 - Odontograma) */
  initialOdontogramData?: any[];
  /** Condiciones del odontograma de evolucion/FINAL - se actualiza con el checklist */
  odontogramData: any[];
  /** Callback para sincronizar cambios visuales (cuando el checklist marca algo como completado) */
  onConditionsChange: (conditions: any[]) => void;
  setUnsavedChanges: (val: boolean) => void;
  setCurrentOdontogram?: (data: any[]) => void;
  consultationId?: number;
  branchId?: number;
  dentistId?: number;
  appointmentId?: number | string;
  onProcedureCompleted?: (result: any) => void;
  onSaveComplete?: () => void;
  /**
   * @deprecated El odontograma es de solo lectura, no emite cambios de estado
   */
  onToothStateChange?: (toothNumber: string, conditionId: string, newState: 'good' | 'bad', conditionData: any) => void;
  /** @deprecated El guardado se maneja desde el Checklist */
  showSaveButton?: boolean;
}

export const TreatmentOdontogramSection = forwardRef<TreatmentOdontogramSectionRef, TreatmentOdontogramSectionProps>(({
  patient,
  initialOdontogramData,
  odontogramData,
  onConditionsChange,
  setUnsavedChanges,
  setCurrentOdontogram,
  consultationId,
  branchId,
  dentistId
}, ref) => {
  // Estado para tracking de condiciones guardadas (para mostrar estadisticas)
  const [savedConditionsCount, setSavedConditionsCount] = useState(0);
  const [isLoadingEvolution, setIsLoadingEvolution] = useState(false);

  // Estado para los desplegables de los odontogramas
  const [isInitialExpanded, setIsInitialExpanded] = useState(false);
  const [isActualExpanded, setIsActualExpanded] = useState(false);

  const patientId = patient?.patient_id || patient?.id;

  // Preparar datos del odontograma INICIAL (todo en rojo/pendiente)
  // FALLBACK ROBUSTO: Si initialOdontogramData está vacío (ej: tras reload de página),
  // usar odontogramData (O. Actual) como base — mismas condiciones, pero todo forzado a rojo.
  // Esto garantiza que el O. Inicial siempre muestre datos si el O. Actual los tiene.
  const initialDataSource = (initialOdontogramData && initialOdontogramData.length > 0)
    ? initialOdontogramData
    : odontogramData;
  const initialConditions = initialDataSource.map(cond => ({
    ...cond,
    state: 'bad',
    color: 'red'
  }));

  // Cargar evolucion del paciente al montar (para mostrar estadisticas de progreso)
  useEffect(() => {
    const loadEvolution = async () => {
      if (!patientId) return;

      setIsLoadingEvolution(true);
      try {
        const evolution = await getPatientEvolution(parseInt(patientId));
        if (evolution.raw && evolution.raw.length > 0) {
          // Contar condiciones completadas
          const completedCount = evolution.raw.filter(
            (evo: any) => evo.condition_status === 'completed'
          ).length;
          setSavedConditionsCount(completedCount);
        }
      } catch (error) {
        console.error('Error cargando evolucion:', error);
      } finally {
        setIsLoadingEvolution(false);
      }
    };

    loadEvolution();
  }, [patientId]);

  // Exponer funciones al padre via ref (mantener compatibilidad - el guardado se hace desde Checklist)
  useImperativeHandle(ref, () => ({
    saveAll: async () => true, // No hay nada que guardar desde el odontograma
    getPendingCount: () => 0, // El odontograma no tiene cambios pendientes
    hasPendingChanges: () => false // El odontograma no tiene cambios pendientes
  }), []);

  // Calcular estadisticas de visualizacion (basadas en el odontograma final)
  const pendingConditions = odontogramData.filter(c => c.state === 'bad' || c.color === 'red').length;
  const completedConditions = odontogramData.filter(c => c.state === 'good' || c.color === 'blue').length;
  const totalConditions = pendingConditions + completedConditions;
  const totalInitialConditions = initialConditions.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-6"
    >
      <SectionCard
        icon={Grid3x3}
        title="Odontograma de Evolucion"
        subtitle="Comparativa del estado inicial vs estado actual del tratamiento"
        colorScheme="purple"
        gradientTo="indigo"
        animationDelay={0}
      >
        {/* Banner informativo */}
        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200 mb-4">
          <p className="text-sm text-blue-800 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="font-medium">Modo Visualizacion:</span>
            Compare el estado inicial del paciente con el progreso actual. Use el Checklist de abajo para marcar tratamientos.
          </p>
        </div>

        {/* Indicador de carga */}
        {isLoadingEvolution && (
          <div className="flex items-center gap-2 px-3 py-2 rounded text-sm bg-purple-50 text-purple-700 border border-purple-200 mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Cargando historial de evolucion...</span>
          </div>
        )}

        {/* Resumen de progreso */}
        {totalConditions > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-200 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-purple-800 font-medium">
                Progreso del tratamiento:
              </span>
              <span className="text-sm font-bold text-purple-900">
                {completedConditions} de {totalConditions} completados ({totalConditions > 0 ? Math.round((completedConditions / totalConditions) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2.5 overflow-hidden">
              <div
                style={{
                  width: `${totalConditions > 0 ? (completedConditions / totalConditions) * 100 : 0}%`
                }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500"
              />
            </div>
            <div className="flex gap-6 mt-2 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-700">Pendientes ({pendingConditions})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Realizados ({completedConditions})</span>
              </div>
              {savedConditionsCount > 0 && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-purple-600 font-medium">
                    {savedConditionsCount} guardados en historial
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leyenda de colores */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
          <div className="text-xs font-semibold text-gray-700 mb-2">Leyenda de colores:</div>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-red-500 rounded border border-red-600"></div>
              <span className="text-gray-700">Condicion pendiente de tratamiento</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-blue-500 rounded border border-blue-600"></div>
              <span className="text-gray-700">Tratamiento realizado</span>
            </div>
          </div>
        </div>

        {/* Odontogramas desplegables */}
        <div className="space-y-4">
          {/* Odontograma INICIAL - Desplegable */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-2 border-red-200 overflow-hidden">
            {/* Header clickeable del odontograma inicial */}
            <button
              onClick={() => setIsInitialExpanded(!isInitialExpanded)}
              className="w-full bg-red-100 px-4 py-3 border-b border-red-200 hover:bg-red-150 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ChevronDown
                    className={`w-5 h-5 text-red-600 transition-transform duration-300 ${isInitialExpanded ? 'rotate-180' : ''}`}
                  />
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-red-800">Odontograma Inicial</h3>
                    <p className="text-xs text-red-600">Estado al comenzar el tratamiento</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {totalInitialConditions} condiciones
                  </div>
                  <span className="text-xs text-red-600 font-medium">
                    {isInitialExpanded ? 'Ocultar' : 'Ver'}
                  </span>
                </div>
              </div>
            </button>

            {/* Contenedor colapsable del odontograma inicial */}
            <AnimatePresence>
              {isInitialExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-4 odontogram-initial-container">
                    {initialConditions.length > 0 ? (
                      <div className="evolution-odontogram-readonly treatment-mode-odontogram-initial">
                        <Odontogram
                          key={`odontogram-initial-${initialConditions.length}-${initialConditions.filter(c => c.state === 'good').length}`}
                          patient={patient}
                          patientId={patient?.id}
                          readOnly={true}
                          initialConditions={initialConditions}
                          hideStatsCards={true}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-gray-500">
                        <p className="text-sm">No hay condiciones iniciales registradas</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Flecha indicadora vertical */}
          <div className="flex justify-center -my-1">
            <div className="bg-purple-500 text-white p-2 rounded-full shadow-lg">
              <ArrowRight className="w-5 h-5 rotate-90" />
            </div>
          </div>

          {/* Odontograma FINAL/ACTUAL - Desplegable */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 overflow-hidden">
            {/* Header clickeable del odontograma final */}
            <button
              onClick={() => setIsActualExpanded(!isActualExpanded)}
              className="w-full bg-blue-100 px-4 py-3 border-b border-blue-200 hover:bg-blue-150 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ChevronDown
                    className={`w-5 h-5 text-blue-600 transition-transform duration-300 ${isActualExpanded ? 'rotate-180' : ''}`}
                  />
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-blue-800">Odontograma Actual</h3>
                    <p className="text-xs text-blue-600">Estado despues del tratamiento</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pendingConditions > 0 && (
                    <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {pendingConditions} pendientes
                    </div>
                  )}
                  {completedConditions > 0 && (
                    <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {completedConditions} realizados
                    </div>
                  )}
                  <span className="text-xs text-blue-600 font-medium ml-2">
                    {isActualExpanded ? 'Ocultar' : 'Ver'}
                  </span>
                </div>
              </div>
            </button>

            {/* Contenedor colapsable del odontograma final */}
            <AnimatePresence>
              {isActualExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-4 odontogram-final-container">
                    {odontogramData.length > 0 ? (
                      <div className="evolution-odontogram-readonly treatment-mode-odontogram">
                        <Odontogram
                          key={`odontogram-actual-${odontogramData.length}-${odontogramData.filter(c => c.state === 'good').length}`}
                          patient={patient}
                          patientId={patient?.id}
                          readOnly={true}
                          initialConditions={odontogramData}
                          hideStatsCards={true}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-gray-500">
                        <p className="text-sm">No hay condiciones registradas</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Instrucciones adicionales */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <strong>Instrucciones:</strong> Para marcar un tratamiento como realizado,
            busque el procedimiento en el "Checklist de Tratamientos" de abajo y marque la casilla correspondiente.
            El diente cambiara automaticamente de rojo a azul en el odontograma actual.
          </p>
        </div>
      </SectionCard>
    </motion.div>
  );
});

// Display name para debugging
TreatmentOdontogramSection.displayName = 'TreatmentOdontogramSection';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatTimestampToLima } from '@/utils/dateUtils';
import { History, ChevronUp, ChevronDown, Calendar, FileText, User, DollarSign, Loader2, RefreshCw, Circle } from 'lucide-react';
import type { TreatmentHistoryEntry } from '@/types';
import { procedureHistoryApi, type ProcedureHistoryData } from '@/services/api/procedureHistoryApi';

interface TreatmentHistorySectionProps {
  history: TreatmentHistoryEntry[];
  patientId?: number | string;
}

export const TreatmentHistorySection = ({ history, patientId }: TreatmentHistorySectionProps) => {
  const [showHistory, setShowHistory] = useState(false);
  const [apiHistory, setApiHistory] = useState<ProcedureHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useApiData, setUseApiData] = useState(true);

  // Cargar historial directamente desde la API cuando se expande
  useEffect(() => {
    const loadApiHistory = async () => {
      if (!showHistory || !patientId || !useApiData) return;

      setIsLoading(true);
      try {
        const numericPatientId = typeof patientId === 'string' ? parseInt(patientId) : patientId;
        if (isNaN(numericPatientId)) return;

        const data = await procedureHistoryApi.getPatientProcedureHistory(numericPatientId);
        setApiHistory(data);
      } catch (error) {
        console.error('Error al cargar historial desde API:', error);
        // Si falla, usar los datos del prop
        setUseApiData(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadApiHistory();
  }, [showHistory, patientId, useApiData]);

  // Refrescar historial
  const handleRefresh = async () => {
    if (!patientId) return;

    setIsLoading(true);
    try {
      const numericPatientId = typeof patientId === 'string' ? parseInt(patientId) : patientId;
      if (isNaN(numericPatientId)) return;

      const data = await procedureHistoryApi.getPatientProcedureHistory(numericPatientId);
      setApiHistory(data);
      setUseApiData(true);
    } catch (error) {
      console.error('Error al refrescar historial:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Determinar que datos mostrar
  const displayHistory = useApiData && apiHistory.length > 0 ? apiHistory : [];
  const legacyHistory = history || [];

  // Si no hay datos de ninguna fuente
  if (displayHistory.length === 0 && legacyHistory.length === 0) {
    return null;
  }

  // Agrupar historial de API por consulta
  const groupedApiHistory = displayHistory.reduce((groups: Record<string, ProcedureHistoryData[]>, item) => {
    const key = item.consultation_id?.toString() || item.performed_date || 'sin-fecha';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg mb-6 border border-amber-200 overflow-hidden"
    >
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="w-full p-4 flex items-center justify-between hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-amber-600" />
          <h4 className="font-semibold text-amber-900">
            Historial de Tratamientos ({useApiData ? displayHistory.length : legacyHistory.length})
          </h4>
          {useApiData && displayHistory.length > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
              Desde API
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />}
          {showHistory ? (
            <ChevronUp className="w-5 h-5 text-amber-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-amber-600" />
          )}
        </div>
      </button>

      {showHistory && (
        <div className="p-4 pt-0 space-y-3 max-h-96 overflow-y-auto">
          {/* Boton de refrescar */}
          {patientId && (
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 text-xs text-amber-700 hover:text-amber-900 transition-colors mb-2"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar historial
            </button>
          )}

          {/* Mostrar datos de API (nuevo formato) */}
          {useApiData && displayHistory.length > 0 && (
            Object.entries(groupedApiHistory).map(([consultationKey, procedures], groupIndex) => {
              const firstProcedure = procedures[0];
              const totalAmount = procedures.reduce((sum, p) => {
                // Nota: amount no viene directamente en procedure_history,
                // tendria que venir de procedure_income
                return sum;
              }, 0);

              return (
                <motion.div
                  key={consultationKey}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: groupIndex * 0.05 }}
                  className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm"
                >
                  {/* Header: Fecha de consulta */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-bold text-amber-900">
                        {firstProcedure.performed_date
                          ? formatTimestampToLima(firstProcedure.performed_date, 'date')
                          : 'Fecha no especificada'}
                      </span>
                    </div>
                    {firstProcedure.performed_time && (
                      <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">
                        {firstProcedure.performed_time}
                      </span>
                    )}
                  </div>

                  {/* Trazabilidad profesional */}
                  <div className="mb-3 bg-gradient-to-r from-slate-50 to-gray-50 border-l-4 border-blue-500 rounded-r-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="uppercase tracking-wide">Registro del Tratamiento</span>
                    </div>

                    {/* Doctor responsable */}
                    <div className="flex items-start gap-2 text-xs">
                      <User className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-semibold text-gray-700">Profesional:</span>
                        <div className="text-gray-600 mt-0.5">
                          {firstProcedure.dentist_name
                            ? `Dr. ${firstProcedure.dentist_name}${firstProcedure.dentist_cop ? ` - COP: ${firstProcedure.dentist_cop}` : ''}`
                            : 'No especificado'}
                        </div>
                      </div>
                    </div>

                    {/* Fecha de registro */}
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-700">Registrado:</span>
                        <span className="text-gray-600 ml-1">
                          {firstProcedure.date_time_registration
                            ? formatTimestampToLima(firstProcedure.date_time_registration, 'datetime')
                            : 'No especificado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lista de procedimientos */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-700 mb-1">
                      Procedimientos realizados ({procedures.length}):
                    </div>
                    {procedures.map((procedure, idx) => (
                      <div
                        key={procedure.procedure_history_id || idx}
                        className="bg-gray-50 p-2 rounded border border-gray-200 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {procedure.tooth_number && (
                              <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                <Circle className="w-3 h-3" />
                                {procedure.tooth_number}
                              </span>
                            )}
                            <span className="font-medium text-gray-800">
                              {procedure.procedure_name}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            procedure.procedure_status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : procedure.procedure_status === 'partial'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {procedure.procedure_status === 'completed' ? 'Completado' :
                             procedure.procedure_status === 'partial' ? 'Parcial' :
                             procedure.procedure_status || 'Sin estado'}
                          </span>
                        </div>
                        {procedure.clinical_notes && (
                          <p className="text-gray-600 mt-1 pl-2 border-l-2 border-gray-300">
                            {procedure.clinical_notes}
                          </p>
                        )}
                        {procedure.surface_name && (
                          <span className="text-gray-500 text-xs">
                            Superficie: {procedure.surface_name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Resultado y siguientes pasos */}
                  {(firstProcedure.procedure_result || firstProcedure.next_steps) && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      {firstProcedure.procedure_result && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-gray-700">Resultado:</span>
                          <span className={`px-2 py-0.5 rounded ${
                            firstProcedure.procedure_result === 'successful'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {firstProcedure.procedure_result === 'successful' ? 'Exitoso' :
                             firstProcedure.procedure_result === 'needs_followup' ? 'Requiere seguimiento' :
                             firstProcedure.procedure_result}
                          </span>
                        </div>
                      )}
                      {firstProcedure.next_steps && (
                        <p className="text-xs text-gray-600 mt-1">
                          <span className="font-semibold">Siguiente paso:</span> {firstProcedure.next_steps}
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}

          {/* Mostrar datos legacy si no hay datos de API */}
          {(!useApiData || displayHistory.length === 0) && legacyHistory.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm"
            >
              {/* Header: Fecha de consulta */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-bold text-amber-900">
                    Consulta del {new Date(entry.date).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">
                  {new Date(entry.date).toLocaleTimeString('es-PE', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              {/* Trazabilidad profesional */}
              <div className="mb-3 bg-gradient-to-r from-slate-50 to-gray-50 border-l-4 border-blue-500 rounded-r-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="uppercase tracking-wide">Registro del Tratamiento</span>
                </div>

                {/* Doctor responsable */}
                {entry.treatmentData.doctorComment ? (
                  <div className="flex items-start gap-2 text-xs">
                    <User className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-700">Profesional:</span>
                      <div className="text-gray-600 mt-0.5">{entry.treatmentData.doctorComment}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs">
                    <User className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-700">Profesional:</span>
                      <div className="text-gray-500 italic mt-0.5">No registrado</div>
                    </div>
                  </div>
                )}

                {/* Fecha de registro del checklist */}
                {entry.treatmentData.checklistSavedAt ? (
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-700">Registrado el:</span>
                      <span className="text-gray-600 ml-1">
                        {new Date(entry.treatmentData.checklistSavedAt).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })} a las {new Date(entry.treatmentData.checklistSavedAt).toLocaleTimeString('es-PE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-700">Registrado el:</span>
                      <span className="text-gray-500 italic ml-1">No especificado</span>
                    </div>
                  </div>
                )}
              </div>

              {entry.treatmentData.observations && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 font-medium mb-1">Observaciones:</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    {entry.treatmentData.observations}
                  </p>
                </div>
              )}

              {entry.treatmentData.appliedTreatments && entry.treatmentData.appliedTreatments.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 font-medium mb-1">
                    Tratamientos aplicados: {entry.treatmentData.appliedTreatments.length}
                  </p>
                </div>
              )}
            </motion.div>
          ))}

          {/* Mensaje si no hay historial */}
          {displayHistory.length === 0 && legacyHistory.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <History className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No hay tratamientos registrados</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import type { Consultorio, Appointment } from '@/types';

interface ConsultorioHistorialModalProps {
  isOpen: boolean;
  consultorio: Consultorio | null;
  appointments: Appointment[];
  estadisticas: {
    totalCitas: number;
    completadas: number;
    canceladas: number;
    pendientes: number;
    ocupacion: string;
    promediosDiarios: string;
  } | null;
  onClose: () => void;
}

export const ConsultorioHistorialModal = ({
  isOpen,
  consultorio,
  appointments,
  estadisticas,
  onClose
}: ConsultorioHistorialModalProps) => {
  if (!isOpen || !consultorio) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {consultorio.nombre}
            </h2>
            <p className="text-sm text-gray-600">
              Historial y estadísticas de ocupación
            </p>
          </div>

          <div className="p-6">
            {estadisticas && (
              <>
                {/* Estadísticas del Mes */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    Estadísticas del Mes
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium">Total Citas</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">
                        {estadisticas.totalCitas}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600 font-medium">Completadas</p>
                      <p className="text-2xl font-bold text-green-900 mt-1">
                        {estadisticas.completadas}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-sm text-red-600 font-medium">Canceladas</p>
                      <p className="text-2xl font-bold text-red-900 mt-1">
                        {estadisticas.canceladas}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-600 font-medium">% Ocupación</p>
                      <p className="text-2xl font-bold text-purple-900 mt-1">
                        {estadisticas.ocupacion}%
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-sm text-yellow-600 font-medium">Prom. Diario</p>
                      <p className="text-2xl font-bold text-yellow-900 mt-1">
                        {estadisticas.promediosDiarios}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 font-medium">Pendientes</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {estadisticas.pendientes}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Historial de Citas */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    Historial de Citas ({appointments.length})
                  </h3>

                  {appointments.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {appointments.slice(0, 20).map(appointment => (
                        <div
                          key={appointment.id}
                          className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {new Date(appointment.date).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {appointment.notes || 'Sin notas'}
                            </p>
                          </div>
                          <div>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                appointment.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : appointment.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {appointment.status === 'completed'
                                ? 'Completada'
                                : appointment.status === 'cancelled'
                                ? 'Cancelada'
                                : 'Pendiente'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">
                        No hay historial de citas para este consultorio
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

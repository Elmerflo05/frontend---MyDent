import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { PlayCircle } from 'lucide-react';
import { getStatusBadge, getPriorityBadge, getTreatmentProgress } from './treatment-helpers';
import type { TreatmentPlan } from '@/types';

interface TreatmentDetailsModalProps {
  treatment: TreatmentPlan | null;
  getPatientName: (patientId: string) => string;
  onClose: () => void;
}

export const TreatmentDetailsModal = ({
  treatment,
  getPatientName,
  onClose
}: TreatmentDetailsModalProps) => {
  if (!treatment) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Plan de Tratamiento - {treatment.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Treatment Info */}
          <div className="lg:col-span-1">
            <h4 className="font-semibold text-gray-900 mb-3">Información General</h4>
            <div className="space-y-3 text-sm">
              <div><strong>Paciente:</strong> {getPatientName(treatment.patientId)}</div>
              <div><strong>Estado:</strong> {getStatusBadge(treatment.status)}</div>
              <div><strong>Prioridad:</strong> {getPriorityBadge(treatment.priority)}</div>
              <div><strong>Costo Total:</strong> S/ {treatment.totalCost.toLocaleString()}</div>
              <div><strong>Inicio:</strong> {new Date(treatment.startDate).toLocaleDateString('es-ES')}</div>
              {treatment.estimatedEndDate && (
                <div><strong>Fin Estimado:</strong> {new Date(treatment.estimatedEndDate).toLocaleDateString('es-ES')}</div>
              )}
              {treatment.actualEndDate && (
                <div><strong>Fin Real:</strong> {new Date(treatment.actualEndDate).toLocaleDateString('es-ES')}</div>
              )}
            </div>

            <div className="mt-4">
              <h5 className="font-medium text-gray-900 mb-2">Progreso General</h5>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${getTreatmentProgress(treatment)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{getTreatmentProgress(treatment)}%</span>
              </div>
            </div>

            {treatment.notes && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-900 mb-2">Notas del Tratamiento</h5>
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {treatment.notes}
                </div>
              </div>
            )}
          </div>

          {/* Procedures */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-gray-900 mb-3">
              Procedimientos ({treatment.procedures?.length || 0})
            </h4>

            <div className="space-y-3">
              {treatment.procedures?.map((procedure, index) => (
                <div key={procedure.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <h5 className="font-medium text-gray-900">{procedure.name}</h5>
                        {procedure.tooth && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Pieza {procedure.tooth}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-2">{procedure.description}</p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>S/ {procedure.cost.toLocaleString()}</span>
                        <span>{procedure.duration} min</span>
                        {procedure.scheduledDate && (
                          <span>Programado: {new Date(procedure.scheduledDate).toLocaleDateString('es-ES')}</span>
                        )}
                        {procedure.completedDate && (
                          <span>Completado: {new Date(procedure.completedDate).toLocaleDateString('es-ES')}</span>
                        )}
                      </div>

                      {procedure.notes && (
                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          {procedure.notes}
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      {procedure.status === 'completed' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completado
                        </span>
                      )}
                      {procedure.status === 'in_progress' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <PlayCircle className="w-3 h-3 mr-1" />
                          En Progreso
                        </span>
                      )}
                      {procedure.status === 'pending' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendiente
                        </span>
                      )}
                      {procedure.status === 'cancelled' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Cancelado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
          <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Editar Tratamiento
          </button>
          <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Agregar Procedimiento
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

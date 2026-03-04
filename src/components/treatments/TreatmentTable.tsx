import { motion } from 'framer-motion';
import { Eye, Trash2, Calendar } from 'lucide-react';
import { getStatusBadge, getPriorityBadge, getTreatmentProgress } from './treatment-helpers';
import type { TreatmentPlan } from '@/types';

interface TreatmentTableProps {
  treatments: TreatmentPlan[];
  getPatientName: (patientId: string) => string;
  onViewDetails: (treatment: TreatmentPlan) => void;
  onDeleteTreatment: (treatment: TreatmentPlan) => void;
}

export const TreatmentTable = ({
  treatments,
  getPatientName,
  onViewDetails,
  onDeleteTreatment
}: TreatmentTableProps) => {
  if (treatments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <Calendar className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No se encontraron planes de tratamiento
        </h3>
        <p className="text-gray-600">
          Los planes de tratamiento que crees aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tratamiento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progreso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Costo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fechas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {treatments.map((treatment, index) => {
              const progress = getTreatmentProgress(treatment);

              return (
                <motion.tr
                  key={treatment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Treatment Title */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{treatment.title}</div>
                        <div className="text-sm text-gray-500">{getPriorityBadge(treatment.priority)}</div>
                      </div>
                    </div>
                  </td>

                  {/* Patient */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {getPatientName(treatment.patientId)}
                    </div>
                  </td>

                  {/* Progress */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[100px]">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-right">
                        {progress}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {treatment.procedures?.filter(p => p.status === 'completed').length || 0} de{' '}
                      {treatment.procedures?.length || 0} procedimientos
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {getStatusBadge(treatment.status)}
                  </td>

                  {/* Cost */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      S/ {treatment.totalCost.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </div>
                    {treatment.paymentStatus && (
                      <div className={`text-xs mt-1 ${
                        treatment.paymentStatus === 'paid' ? 'text-green-600' :
                        treatment.paymentStatus === 'partial' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {treatment.paymentStatus === 'paid' ? 'Pagado' :
                         treatment.paymentStatus === 'partial' ? 'Parcial' : 'Pendiente'}
                      </div>
                    )}
                  </td>

                  {/* Dates */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(treatment.startDate).toLocaleDateString('es-PE')}
                    </div>
                    {treatment.estimatedEndDate && (
                      <div className="text-xs text-gray-500">
                        hasta {new Date(treatment.estimatedEndDate).toLocaleDateString('es-PE')}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewDetails(treatment)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTreatment(treatment)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

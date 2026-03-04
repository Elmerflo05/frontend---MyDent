import { motion } from 'framer-motion';
import { UserCheck, RefreshCw } from 'lucide-react';
import type { ReportePorDoctor } from '@/services/estadisticasOdontologicas';

interface DoctorReportProps {
  reportes: ReportePorDoctor[];
  loading: boolean;
}

export const DoctorReport = ({ reportes, loading }: DoctorReportProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center gap-3 mb-6">
          <UserCheck className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">Reporte por Doctor (Citas y Bruto Generado)</h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            Cargando reportes...
          </div>
        ) : reportes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay datos disponibles para el período seleccionado
          </div>
        ) : (
          <div className="space-y-4">
            {reportes.map((reporte, index) => (
              <motion.div
                key={reporte.doctorId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{reporte.nombreCompleto}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {reporte.especialidades.map((esp, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {esp}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Top {index + 1}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Citas</p>
                    <p className="text-xl font-bold text-blue-600">{reporte.totalCitas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completadas</p>
                    <p className="text-xl font-bold text-green-600">{reporte.citasCompletadas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Canceladas</p>
                    <p className="text-xl font-bold text-red-600">{reporte.citasCanceladas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ingresos Bruto</p>
                    <p className="text-xl font-bold text-purple-600">S/ {reporte.ingresosBruto.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Promedio/Cita</p>
                    <p className="text-xl font-bold text-orange-600">S/ {reporte.promedioIngresoPorCita.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tasa Completación</p>
                    <p className="text-xl font-bold text-indigo-600">{reporte.tasaCompletacion}%</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

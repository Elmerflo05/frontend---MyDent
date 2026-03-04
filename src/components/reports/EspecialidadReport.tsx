import { motion } from 'framer-motion';
import { Stethoscope, RefreshCw } from 'lucide-react';
import type { ReportePorEspecialidad } from '@/services/estadisticasOdontologicas';

interface EspecialidadReportProps {
  reportes: ReportePorEspecialidad[];
  loading: boolean;
}

export const EspecialidadReport = ({ reportes, loading }: EspecialidadReportProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center gap-3 mb-6">
          <Stethoscope className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">Reporte por Especialidad</h2>
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
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{reporte.especialidad}</h3>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {reporte.totalCitas} citas
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {reporte.doctores} doctores
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Citas Completadas</p>
                    <p className="text-xl font-bold text-green-600">{reporte.citasCompletadas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ingresos Bruto</p>
                    <p className="text-xl font-bold text-purple-600">S/ {reporte.ingresosBruto.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Precio Promedio</p>
                    <p className="text-xl font-bold text-blue-600">S/ {reporte.precioPromedio.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tasa Completación</p>
                    <p className="text-xl font-bold text-indigo-600">
                      {reporte.totalCitas > 0 ? Math.round((reporte.citasCompletadas / reporte.totalCitas) * 100) : 0}%
                    </p>
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

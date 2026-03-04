import { motion } from 'framer-motion';
import { DoorOpen, RefreshCw } from 'lucide-react';
import type { ReportePorConsultorio } from '@/services/estadisticasOdontologicas';

interface ConsultorioReportProps {
  reportes: ReportePorConsultorio[];
  loading: boolean;
}

export const ConsultorioReport = ({ reportes, loading }: ConsultorioReportProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center gap-3 mb-6">
          <DoorOpen className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Reporte por Consultorio</h2>
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
                  <h3 className="text-lg font-semibold text-gray-900">{reporte.consultorio}</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {reporte.totalCitas} citas
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                    <p className="text-sm text-gray-600">Duración Promedio</p>
                    <p className="text-xl font-bold text-blue-600">{reporte.duracionPromedio} min</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tasa Ocupación</p>
                    <p className="text-xl font-bold text-indigo-600">{reporte.tasaOcupacion}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ingreso/Cita</p>
                    <p className="text-xl font-bold text-orange-600">
                      S/ {reporte.totalCitas > 0 ? Math.round(reporte.ingresosBruto / reporte.totalCitas) : 0}
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

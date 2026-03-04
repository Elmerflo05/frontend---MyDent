import { motion } from 'framer-motion';
import { DoorOpen, Calendar, Activity, TrendingUp, RefreshCw } from 'lucide-react';
import type { EstadisticasConsultorio } from '@/services/estadisticasConsultorios';

interface ConsultoriosStatisticsReportProps {
  estadisticas: EstadisticasConsultorio[];
  resumen: any;
  loading: boolean;
}

export const ConsultoriosStatisticsReport = ({
  estadisticas,
  resumen,
  loading
}: ConsultoriosStatisticsReportProps) => {
  return (
    <div className="space-y-6">
      {/* Resumen General */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-sm border"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Consultorios</p>
              <DoorOpen className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{resumen.totalConsultorios}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow-sm border"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Citas</p>
              <Calendar className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{resumen.totalCitas}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-sm border"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Ocupación Promedio</p>
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{resumen.ocupacionPromedio}%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-sm border"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Más Ocupado</p>
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-lg font-bold text-gray-900 truncate">{resumen.consultorioMasOcupado}</p>
          </motion.div>
        </div>
      )}

      {/* Detalles por Consultorio */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center gap-3 mb-6">
          <DoorOpen className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Estadísticas por Consultorio</h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            Cargando estadísticas...
          </div>
        ) : estadisticas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay datos disponibles para el período seleccionado
          </div>
        ) : (
          <div className="space-y-6">
            {estadisticas.map((consultorio, index) => (
              <motion.div
                key={consultorio.consultorioId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border rounded-lg p-6"
              >
                {/* Header del Consultorio */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">{consultorio.nombre}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    consultorio.ocupacionPorcentaje >= 80 ? 'bg-red-100 text-red-700' :
                    consultorio.ocupacionPorcentaje >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {consultorio.ocupacionPorcentaje}% Ocupación
                  </span>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Total Citas</p>
                    <p className="text-2xl font-bold text-blue-900">{consultorio.totalCitas}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Completadas</p>
                    <p className="text-2xl font-bold text-green-900">{consultorio.citasCompletadas}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">Canceladas</p>
                    <p className="text-2xl font-bold text-red-900">{consultorio.citasCanceladas}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-600 font-medium">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-900">{consultorio.citasPendientes}</p>
                  </div>
                </div>

                {/* Gráficos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gráfico de Citas por Mes */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Citas por Mes</h4>
                    <div className="h-48 flex items-end justify-between gap-2">
                      {consultorio.citasPorMes.map((data, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div className="w-full bg-blue-500 rounded-t" style={{
                            height: `${Math.max((data.cantidad / Math.max(...consultorio.citasPorMes.map(d => d.cantidad))) * 100, 4)}%`
                          }}>
                            <div className="text-xs text-white text-center pt-1">{data.cantidad}</div>
                          </div>
                          <span className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-left">{data.mes}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gráfico de Estado de Citas */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Estado de Citas</h4>
                    <div className="space-y-3">
                      {consultorio.estadoCitas.map((estado, idx) => {
                        const porcentaje = consultorio.totalCitas > 0
                          ? (estado.cantidad / consultorio.totalCitas) * 100
                          : 0;
                        const colores = ['bg-green-500', 'bg-red-500', 'bg-yellow-500'];

                        return (
                          <div key={idx}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-700">{estado.estado}</span>
                              <span className="text-sm font-medium text-gray-900">{estado.cantidad} ({porcentaje.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className={`${colores[idx]} h-3 rounded-full transition-all duration-300`}
                                style={{ width: `${porcentaje}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
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

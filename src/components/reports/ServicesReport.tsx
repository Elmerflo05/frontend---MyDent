import { Stethoscope, TestTube, Activity, Loader2 } from 'lucide-react';
import type { ReportData } from './reports-helpers';

interface ServicesReportProps {
  data: ReportData;
  loading?: boolean;
}

export const ServicesReport = ({ data, loading = false }: ServicesReportProps) => {
  // Calcular el máximo para las barras de progreso
  const maxClinic = Math.max(...(data.services.clinic.map(s => s.count) || [1]), 1);
  const maxLab = Math.max(...(data.services.laboratory.map(s => s.count) || [1]), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clinic Services */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-4">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Servicios de Clínica</h3>
          </div>
          <div className="space-y-3">
            {data.services.clinic.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No hay servicios de clínica en este período</p>
            ) : (
              data.services.clinic.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">{service.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(service.count / maxClinic) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-blue-600 w-8">{service.count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Laboratory Services */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-4">
            <TestTube className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Servicios de Laboratorio</h3>
          </div>
          <div className="space-y-3">
            {data.services.laboratory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No hay servicios de laboratorio en este período</p>
            ) : (
              data.services.laboratory.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">{service.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-purple-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${(service.count / maxLab) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-purple-600 w-8">{service.count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Service Comparison */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparación de Servicios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Servicios de Clínica</h4>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {data.services.clinic.reduce((sum, service) => sum + service.count, 0)}
            </p>
            <p className="text-sm text-gray-600">Total de servicios realizados</p>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <TestTube className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Servicios de Laboratorio</h4>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              {data.services.laboratory.reduce((sum, service) => sum + service.count, 0)}
            </p>
            <p className="text-sm text-gray-600">Total de análisis realizados</p>
          </div>
        </div>
      </div>
    </div>
  );
};

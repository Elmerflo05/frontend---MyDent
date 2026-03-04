import { DollarSign, TrendingUp, PieChart, Loader2 } from 'lucide-react';
import type { ReportData } from './reports-helpers';

interface RevenueReportProps {
  data: ReportData;
  loading?: boolean;
}

export const RevenueReport = ({ data, loading = false }: RevenueReportProps) => {
  // Calcular el máximo para las barras de progreso
  const maxIngreso = Math.max(...(data.revenue.services.map(s => s.amount) || [1]), 1);
  const totalIngresos = data.revenue.total || 0;
  const totalServicios = data.revenue.services.reduce((sum, s) => sum + s.amount, 0);

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
      {/* KPI Cards de Ingresos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900">S/ {totalIngresos.toLocaleString()}</p>
            </div>
            <DollarSign className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Promedio por Servicio</p>
              <p className="text-2xl font-bold text-gray-900">
                S/ {data.revenue.services.length > 0
                  ? Math.round(totalServicios / data.revenue.services.length).toLocaleString()
                  : 0}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tipos de Servicios</p>
              <p className="text-2xl font-bold text-gray-900">{data.revenue.services.length}</p>
            </div>
            <PieChart className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Desglose de Ingresos por Servicio */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Ingresos por Servicio</h3>
        </div>
        <div className="space-y-4">
          {data.revenue.services.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No hay ingresos registrados en este período</p>
          ) : (
            data.revenue.services.map((service, index) => {
              const porcentaje = totalServicios > 0 ? Math.round((service.amount / totalServicios) * 100) : 0;
              return (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{service.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{porcentaje}%</span>
                      <span className="text-lg font-bold text-green-600">S/ {service.amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((service.amount / maxIngreso) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Distribución Visual */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Ingresos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lista de servicios con porcentaje */}
          <div className="space-y-3">
            {data.revenue.services.map((service, index) => {
              const porcentaje = totalServicios > 0 ? Math.round((service.amount / totalServicios) * 100) : 0;
              const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
              const color = colors[index % colors.length];

              return (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${color}`}></div>
                  <span className="flex-1 text-sm text-gray-700">{service.name}</span>
                  <span className="text-sm font-medium text-gray-900">{porcentaje}%</span>
                </div>
              );
            })}
          </div>

          {/* Resumen */}
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <DollarSign className="w-12 h-12 text-green-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Total del Período</p>
            <p className="text-3xl font-bold text-green-700">S/ {totalIngresos.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">
              {data.revenue.services.length} servicios registrados
            </p>
          </div>
        </div>
      </div>

      {/* Tabla Detallada */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalle de Ingresos</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Servicio</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Monto (S/)</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Participación</th>
              </tr>
            </thead>
            <tbody>
              {data.revenue.services.map((service, index) => {
                const porcentaje = totalServicios > 0 ? ((service.amount / totalServicios) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{service.name}</td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-green-600">
                      S/ {service.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-500">{porcentaje}%</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50 font-bold">
                <td className="py-3 px-4 text-sm text-gray-900">TOTAL</td>
                <td className="py-3 px-4 text-sm text-right text-green-700">
                  S/ {totalServicios.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-sm text-right text-gray-700">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

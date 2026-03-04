import { Calendar, Users, DollarSign, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import type { ReportData } from './reports-helpers';

interface OverviewReportProps {
  data: ReportData;
  loading?: boolean;
}

export const OverviewReport = ({ data, loading = false }: OverviewReportProps) => {
  // Calcular tasa de completación evitando división por 0
  const tasaCompletacion = data.appointments.total > 0
    ? Math.round((data.appointments.completed / data.appointments.total) * 100)
    : 0;

  // Calcular máximos dinámicos para las barras de progreso
  const maxCitasMes = Math.max(...data.appointments.monthlyData.map(d => d.count), 1);
  const maxIngresoServicio = Math.max(...data.revenue.services.map(s => s.amount), 1);
  const maxPacientesEdad = Math.max(...data.patients.ageGroups.map(g => g.count), 1);

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
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Citas</p>
              <p className="text-2xl font-bold text-gray-900">{data.appointments.total}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
              <p className="text-2xl font-bold text-gray-900">{data.patients.total}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900">S/ {data.revenue.total.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasa de Completación</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasaCompletacion}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Citas por Mes</h3>
          <div className="space-y-3">
            {data.appointments.monthlyData.map((dataPoint, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{dataPoint.month}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min((dataPoint.count / maxCitasMes) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{dataPoint.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Appointment Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Citas</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Completadas</span>
              </div>
              <span className="text-lg font-bold text-green-600">{data.appointments.completed}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-gray-900">Pendientes</span>
              </div>
              <span className="text-lg font-bold text-yellow-600">{data.appointments.pending}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-gray-900">Canceladas</span>
              </div>
              <span className="text-lg font-bold text-red-600">{data.appointments.cancelled}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue and Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services Revenue */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingresos por Servicio</h3>
          <div className="space-y-3">
            {data.revenue.services.map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{service.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${Math.min((service.amount / maxIngresoServicio) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-16">S/ {service.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Patient Demographics */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Edad</h3>
          <div className="space-y-3">
            {data.patients.ageGroups.map((group, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{group.range} años</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${Math.min((group.count / maxPacientesEdad) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{group.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

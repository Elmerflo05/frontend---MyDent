import { UserCheck, Users, RefreshCw, Loader2 } from 'lucide-react';
import type { ReportData } from './reports-helpers';

interface PatientsReportProps {
  data: ReportData;
  loading?: boolean;
}

export const PatientsReport = ({ data, loading = false }: PatientsReportProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  // Proteger contra división por 0
  const totalPacientes = data.patients.total || 1;

  return (
    <div className="space-y-6">
      {/* Patient Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
              <p className="text-2xl font-bold text-gray-900">{data.patients.total}</p>
            </div>
            <UserCheck className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pacientes Nuevos</p>
              <p className="text-2xl font-bold text-green-600">{data.patients.new}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pacientes Continuadores</p>
              <p className="text-2xl font-bold text-purple-600">{data.patients.continuing}</p>
            </div>
            <RefreshCw className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Detailed Age Distribution */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribución Detallada por Edad</h3>
        <div className="space-y-4">
          {data.patients.ageGroups.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No hay datos de distribución por edad</p>
          ) : (
            data.patients.ageGroups.map((group, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{group.range} años</span>
                  <span className="text-lg font-bold text-blue-600">{group.count} pacientes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(group.count / totalPacientes) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {data.patients.total > 0 ? Math.round((group.count / data.patients.total) * 100) : 0}% del total
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

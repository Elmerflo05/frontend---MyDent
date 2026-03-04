import { Filter, Building, RefreshCw } from 'lucide-react';
import type { Sede } from '@/types';

interface ReportsFiltersProps {
  dateRange: string;
  reportType: string;
  selectedSede: string;
  canFilterBySede: boolean;
  sedesDisponibles: Sede[];
  onDateRangeChange: (value: string) => void;
  onReportTypeChange: (value: string) => void;
  onSedeChange: (value: string) => void;
  onRefresh?: () => void;
}

export const ReportsFilters = ({
  dateRange,
  reportType,
  selectedSede,
  canFilterBySede,
  sedesDisponibles,
  onDateRangeChange,
  onReportTypeChange,
  onSedeChange,
  onRefresh
}: ReportsFiltersProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros:</span>
        </div>

        <select
          value={dateRange}
          onChange={(e) => onDateRangeChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="week">Última Semana</option>
          <option value="month">Último Mes</option>
          <option value="quarter">Último Trimestre</option>
          <option value="year">Último Año</option>
        </select>

        <select
          value={reportType}
          onChange={(e) => onReportTypeChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="overview">Vista General</option>
          <option value="services">Servicios</option>
          <option value="patients">Pacientes</option>
          <option value="revenue">Ingresos</option>
          <option value="consultorios">Consultorios</option>
          <option value="consultorio">Por Consultorio</option>
          <option value="especialidad">Por Especialidad</option>
          <option value="doctor">Por Doctor</option>
        </select>

        {canFilterBySede ? (
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-gray-500" />
            <select
              value={selectedSede}
              onChange={(e) => onSedeChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 min-w-[200px]"
            >
              <option value="all">Todas las Sedes</option>
              {sedesDisponibles.map((sede) => (
                <option key={sede.id} value={sede.id}>
                  {sede.nombre}
                </option>
              ))}
            </select>
          </div>
        ) : selectedSede !== 'all' && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
            <Building className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              {sedesDisponibles.find(s => s.id === selectedSede)?.nombre || 'Mi Sede'}
            </span>
          </div>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        )}
      </div>
    </div>
  );
};

import { Search, Grid3X3, List, Clock, Calendar } from 'lucide-react';
import type { User } from '@/types';

interface AppointmentFiltersAdminProps {
  searchTerm: string;
  selectedDoctor: string;
  viewMode: 'MONTH' | 'WEEK' | 'DAY';
  dateFrom: string;
  dateTo: string;
  doctors: User[];
  onSearchChange: (value: string) => void;
  onDoctorChange: (value: string) => void;
  onViewModeChange: (mode: 'MONTH' | 'WEEK' | 'DAY') => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

export const AppointmentFiltersAdmin = ({
  searchTerm,
  selectedDoctor,
  viewMode,
  dateFrom,
  dateTo,
  doctors,
  onSearchChange,
  onDoctorChange,
  onViewModeChange,
  onDateFromChange,
  onDateToChange
}: AppointmentFiltersAdminProps) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por paciente o doctor..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-64"
          />
        </div>

        <select
          value={selectedDoctor}
          onChange={(e) => onDoctorChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="all">Todos los doctores</option>
          {doctors.map(doctor => (
            <option key={doctor.id} value={doctor.id}>
              Dr. {doctor.firstName} {doctor.lastName}
            </option>
          ))}
        </select>

        {/* Rango de Fechas */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <input
            type="date"
            value={dateFrom || ''}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Desde"
          />
          <span className="text-gray-500">-</span>
          <input
            type="date"
            value={dateTo || ''}
            onChange={(e) => onDateToChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Hasta"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => onViewModeChange('MONTH')}
            className={`p-2 rounded-lg ${viewMode === 'MONTH' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Vista Mes"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('WEEK')}
            className={`p-2 rounded-lg ${viewMode === 'WEEK' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Vista Semana"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('DAY')}
            className={`p-2 rounded-lg ${viewMode === 'DAY' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Vista Día"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

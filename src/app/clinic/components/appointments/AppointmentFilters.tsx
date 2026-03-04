import { Search, FilterX, Calendar } from 'lucide-react';
import { SPECIALTIES, CALENDAR_VIEWS } from './constants';
import type { User as UserType } from '@/types';

interface AppointmentFiltersProps {
  searchTerm: string;
  selectedDoctor: string;
  selectedSpecialty: string;
  viewMode: 'month' | 'week' | 'day';
  doctors: UserType[];
  dateFrom?: string;
  dateTo?: string;
  onSearchChange: (value: string) => void;
  onDoctorChange: (value: string) => void;
  onSpecialtyChange: (value: string) => void;
  onViewModeChange: (mode: 'month' | 'week' | 'day') => void;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  onClearFilters: () => void;
  userRole?: string;
}

export const AppointmentFilters = ({
  searchTerm,
  selectedDoctor,
  selectedSpecialty,
  viewMode,
  doctors,
  dateFrom = '',
  dateTo = '',
  onSearchChange,
  onDoctorChange,
  onSpecialtyChange,
  onViewModeChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  userRole
}: AppointmentFiltersProps) => {
  // El dentista solo ve sus propias citas, no necesita filtro de doctores
  const showDoctorFilter = userRole !== 'doctor';
  const hasActiveFilters = searchTerm || (showDoctorFilter && selectedDoctor !== 'all') || selectedSpecialty !== 'all';

  return (
    <div className="flex flex-wrap gap-4 items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por paciente, doctor o notas..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-64"
          />
        </div>

        {/* Doctor Filter - Solo visible para roles que no sean dentista */}
        {showDoctorFilter && (
          <select
            value={selectedDoctor}
            onChange={(e) => onDoctorChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">Todos los doctores</option>
            {doctors.map(doctor => (
              <option key={doctor.id} value={doctor.id}>
                Dr. {doctor.profile.firstName} {doctor.profile.lastName}
              </option>
            ))}
          </select>
        )}

        {/* Specialty Filter */}
        <select
          value={selectedSpecialty}
          onChange={(e) => onSpecialtyChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="all">Todas las especialidades</option>
          {Object.entries(SPECIALTIES).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>

        {/* Date Range Filters */}
        {onDateFromChange && onDateToChange && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              title="Fecha desde"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              title="Fecha hasta"
            />
          </div>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <FilterX className="w-4 h-4" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* View Mode Switcher */}
      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
        {(Object.keys(CALENDAR_VIEWS) as Array<keyof typeof CALENDAR_VIEWS>).map(mode => {
          const viewConfig = CALENDAR_VIEWS[mode];
          const Icon = viewConfig.icon;
          return (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                viewMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{viewConfig.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

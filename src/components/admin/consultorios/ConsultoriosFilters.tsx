import { Search } from 'lucide-react';
import type { Sede } from '@/types';

interface ConsultoriosFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedSede: string;
  onSedeChange: (value: string) => void;
  filterEstado: string;
  onEstadoChange: (value: string) => void;
  sedes: Sede[];
  showSedeFilter: boolean;
}

export const ConsultoriosFilters = ({
  searchTerm,
  onSearchChange,
  selectedSede,
  onSedeChange,
  filterEstado,
  onEstadoChange,
  sedes,
  showSedeFilter
}: ConsultoriosFiltersProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o número..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {showSedeFilter && (
          <select
            value={selectedSede}
            onChange={(e) => onSedeChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas las sedes</option>
            {sedes.map(sede => (
              <option key={sede.id} value={sede.id}>{sede.nombre}</option>
            ))}
          </select>
        )}

        <select
          value={filterEstado}
          onChange={(e) => onEstadoChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="ocupado">Ocupado</option>
          <option value="mantenimiento">Mantenimiento</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>
    </div>
  );
};

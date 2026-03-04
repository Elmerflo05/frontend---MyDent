import { Search } from 'lucide-react';

interface PatientsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  genderFilter: string;
  onGenderFilterChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
}

export const PatientsFilters = ({
  searchTerm,
  onSearchChange,
  genderFilter,
  onGenderFilterChange,
  filteredCount,
  totalCount
}: PatientsFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-4 items-center mb-6">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar pacientes por nombre, DNI o email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 w-80"
        />
      </div>

      <select
        value={genderFilter}
        onChange={(e) => onGenderFilterChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2"
      >
        <option value="all">Todos los géneros</option>
        <option value="M">Masculino</option>
        <option value="F">Femenino</option>
        <option value="O">Otro</option>
      </select>

      <div className="ml-auto text-sm text-gray-600">
        {filteredCount} de {totalCount} pacientes
      </div>
    </div>
  );
};

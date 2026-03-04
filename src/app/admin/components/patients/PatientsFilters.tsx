import { Search, Filter, Building2 } from 'lucide-react';
import { Company } from '@/types';

interface TreatmentFilters {
  ortodoncia: boolean;
  rehabilitacion: boolean;
  implantes: boolean;
}

interface PatientsFiltersProps {
  searchTerm: string;
  companyFilter: string;
  treatmentFilters: TreatmentFilters;
  companies: Company[];
  onSearchChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
  onTreatmentFilterChange: (filters: TreatmentFilters) => void;
}

export const PatientsFilters = ({
  searchTerm,
  companyFilter,
  treatmentFilters,
  companies,
  onSearchChange,
  onCompanyChange,
  onTreatmentFilterChange
}: PatientsFiltersProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
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

        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <select
            value={companyFilter}
            onChange={(e) => onCompanyChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 min-w-[200px]"
          >
            <option key="all" value="all">Todas las empresas</option>
            <option key="particular" value="particular">Pacientes particulares</option>
            {companies
              .filter(company => {
                if (!company.id || !company.nombre) {
                  console.warn('[PatientsFilters] Empresa con datos inválidos:', company);
                  return false;
                }
                return true;
              })
              .map((company) => (
                <option key={company.id} value={company.id}>
                  {company.nombre}
                </option>
              ))
            }
          </select>
        </div>

        {/* Treatment filters */}
        <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Tratamientos:</span>
        </div>

        <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={treatmentFilters.ortodoncia}
            onChange={(e) => onTreatmentFilterChange({ ...treatmentFilters, ortodoncia: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Ortodoncia</span>
        </label>

        <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={treatmentFilters.rehabilitacion}
            onChange={(e) => onTreatmentFilterChange({ ...treatmentFilters, rehabilitacion: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Rehabilitación Bucal</span>
        </label>

        <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={treatmentFilters.implantes}
            onChange={(e) => onTreatmentFilterChange({ ...treatmentFilters, implantes: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Implantes</span>
        </label>
      </div>
    </div>
  );
};

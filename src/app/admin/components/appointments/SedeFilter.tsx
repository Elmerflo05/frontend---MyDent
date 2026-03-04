import { motion } from 'framer-motion';
import { Building2, ChevronDown } from 'lucide-react';

interface Sede {
  id: string;
  nombre: string;
  codigo: string;
}

interface SedeFilterProps {
  selectedSede: string;
  sedes: Sede[];
  showSedeDropdown: boolean;
  getSelectedSedeName: () => string;
  onSedeChange: (sedeId: string) => void;
  onToggleDropdown: () => void;
}

export const SedeFilter = ({
  selectedSede,
  sedes,
  showSedeDropdown,
  getSelectedSedeName,
  onSedeChange,
  onToggleDropdown
}: SedeFilterProps) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            Filtro por Sede
          </h3>
          <p className="text-xs text-gray-600">
            Selecciona una sede específica para filtrar las citas
          </p>
        </div>

        <div className="relative" data-dropdown="sede">
          <button
            onClick={onToggleDropdown}
            className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors min-w-48"
          >
            <Building2 className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-900">
              {getSelectedSedeName()}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showSedeDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showSedeDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
            >
              <div className="p-2">
                <button
                  onClick={() => onSedeChange('all')}
                  className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${
                    selectedSede === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span className="font-medium">Todas las Sedes</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">Ver citas de todas las sedes</p>
                </button>

                {sedes.map((sede) => (
                  <button
                    key={sede.id}
                    onClick={() => onSedeChange(sede.id)}
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${
                      selectedSede === sede.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium">{sede.nombre}</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">{sede.codigo}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

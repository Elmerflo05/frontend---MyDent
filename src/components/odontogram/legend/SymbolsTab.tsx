import { Info, Square, Search, X } from 'lucide-react';
import { OFFICIAL_DENTAL_CONDITIONS, CONDITION_CATEGORIES, OFFICIAL_COLORS } from '@/constants/dentalConditions';
import { DentalSymbol } from '../DentalSymbols';

interface SymbolsTabProps {
  filteredConditions: typeof OFFICIAL_DENTAL_CONDITIONS;
  searchTerm: string;
  onClearSearch: () => void;
}

export const SymbolsTab = ({ filteredConditions, searchTerm, onClearSearch }: SymbolsTabProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="mb-2">
              Cada condición dental se representa con un símbolo específico según las disposiciones oficiales.
              Los símbolos NO son editables y cumplen con la normativa del Colegio Odontológico del Perú.
            </p>
            <p className="text-xs">
              <strong>Códigos CIE-10:</strong> Se incluyen los códigos de la Clasificación Internacional de Enfermedades (CIE-10)
              para las patologías y anomalías que lo requieren según estándares internacionales de salud.
            </p>
          </div>
        </div>
      </div>

      {/* Mensaje de sin resultados */}
      {searchTerm && filteredConditions.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
          <p className="text-sm text-gray-600 mb-4">
            No hay condiciones que coincidan con "<span className="font-semibold">{searchTerm}</span>"
          </p>
          <button
            onClick={onClearSearch}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <X className="w-4 h-4" />
            Limpiar búsqueda
          </button>
        </div>
      )}

      {/* Por categoría */}
      {!searchTerm || filteredConditions.length > 0 ? CONDITION_CATEGORIES.map(category => {
        const categoryConditions = filteredConditions.filter(c => c.category === category.id);
        if (categoryConditions.length === 0) return null;

        return (
          <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <span>{category.icon}</span>
                <span>{category.label}</span>
                <span className="text-xs text-gray-500 font-normal">({categoryConditions.length} condiciones)</span>
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {categoryConditions.map(condition => (
                <div key={condition.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Símbolo visual */}
                    <div className="flex-shrink-0 w-20 h-20 flex items-center justify-center bg-white border-2 border-gray-200 rounded-lg">
                      {condition.symbolType === 'fill' ? (
                        <div className="relative w-12 h-12">
                          <Square className="w-12 h-12" style={{ color: OFFICIAL_COLORS[condition.color], fill: OFFICIAL_COLORS[condition.color], opacity: 0.7 }} />
                          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
                            FILL
                          </span>
                        </div>
                      ) : condition.symbolType === 'text' ? (
                        <div className="text-center">
                          <div className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                            {condition.abbreviation}
                          </div>
                        </div>
                      ) : (
                        <svg width="60" height="60" viewBox="0 0 60 60">
                          <DentalSymbol
                            symbolType={condition.symbolType}
                            x={30}
                            y={30}
                            color={condition.color}
                            size={25}
                          />
                        </svg>
                      )}
                    </div>

                    {/* Información */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{condition.label}</h4>
                        {condition.cie10 && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                            CIE-10: {condition.cie10}
                          </span>
                        )}
                        <div
                          className="w-3 h-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: OFFICIAL_COLORS[condition.color] }}
                          title={`Color: ${condition.color === 'blue' ? 'Azul (buen estado)' : 'Rojo (patología/temporal)'}`}
                        />
                      </div>

                      <p className="text-sm text-gray-700 mb-2">{condition.description}</p>

                      {condition.specifications && (
                        <p className="text-xs text-gray-600 italic">
                          <strong>Especificaciones:</strong> {condition.specifications}
                        </p>
                      )}

                      {condition.abbreviations && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="text-xs font-medium text-gray-600">Opciones:</span>
                          {Object.entries(condition.abbreviations).map(([abbr, desc]) => (
                            <span
                              key={abbr}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded"
                            >
                              <strong>{abbr}</strong> = {desc}
                            </span>
                          ))}
                        </div>
                      )}

                      {condition.colorConditional && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="font-medium text-gray-600">Color condicional:</span>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                            <span>Buen estado</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-600" />
                            <span>Mal estado</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }) : null}
    </div>
  );
};

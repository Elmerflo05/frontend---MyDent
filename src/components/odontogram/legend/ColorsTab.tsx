import { Info, Circle } from 'lucide-react';
import { OFFICIAL_DENTAL_CONDITIONS, OFFICIAL_COLORS } from '@/constants/dentalConditions';

interface ColorsTabProps {
  filteredConditions: typeof OFFICIAL_DENTAL_CONDITIONS;
}

export const ColorsTab = ({ filteredConditions }: ColorsTabProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-900">
            El sistema de colores es <strong>ESTRICTO y NO EDITABLE</strong>. Solo se permiten 2 colores oficiales
            según la normativa del Colegio Odontológico del Perú.
          </p>
        </div>
      </div>

      {/* AZUL */}
      <div className="border-2 border-blue-300 rounded-lg overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <Circle className="w-8 h-8" fill="white" />
            COLOR AZUL
          </h3>
          <p className="text-sm text-blue-100 mt-1">Código Hex: {OFFICIAL_COLORS.blue}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">SIGNIFICADO:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Condiciones en <strong>BUEN ESTADO</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Tratamientos <strong>DEFINITIVOS</strong> y completados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Condiciones <strong>PERMANENTES</strong> estables</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">EJEMPLOS DE USO:</h4>
            <div className="grid grid-cols-2 gap-3">
              {filteredConditions.filter(c => c.color === 'blue' && !c.colorConditional).slice(0, 6).map(c => (
                <div key={c.id} className="px-3 py-2 bg-blue-50 border border-blue-200 rounded text-xs">
                  <strong>{c.label}</strong>
                </div>
              ))}
            </div>
            {filteredConditions.filter(c => c.color === 'blue' && !c.colorConditional).length === 0 && (
              <p className="text-sm text-gray-500 italic">No se encontraron condiciones que coincidan con la búsqueda</p>
            )}
          </div>
        </div>
      </div>

      {/* ROJO */}
      <div className="border-2 border-red-300 rounded-lg overflow-hidden">
        <div className="bg-red-600 px-6 py-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <Circle className="w-8 h-8" fill="white" />
            COLOR ROJO
          </h3>
          <p className="text-sm text-red-100 mt-1">Código Hex: {OFFICIAL_COLORS.red}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">SIGNIFICADO:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span><strong>PATOLOGÍAS ACTIVAS</strong> (caries, fracturas)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Tratamientos <strong>TEMPORALES</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Condiciones en <strong>MAL ESTADO</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span><strong>URGENCIAS</strong> o condiciones que requieren atención</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">EJEMPLOS DE USO:</h4>
            <div className="grid grid-cols-2 gap-3">
              {filteredConditions.filter(c => c.color === 'red').slice(0, 6).map(c => (
                <div key={c.id} className="px-3 py-2 bg-red-50 border border-red-200 rounded text-xs">
                  <strong>{c.label}</strong>
                </div>
              ))}
            </div>
            {filteredConditions.filter(c => c.color === 'red').length === 0 && (
              <p className="text-sm text-gray-500 italic">No se encontraron condiciones que coincidan con la búsqueda</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

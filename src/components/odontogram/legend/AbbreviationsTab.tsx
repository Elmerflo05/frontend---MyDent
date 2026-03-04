import { Info } from 'lucide-react';

interface AbbreviationsTabProps {
  allAbbreviations: Array<{ abbr: string; description: string; color: string }>;
}

export const AbbreviationsTab = ({ allAbbreviations }: AbbreviationsTabProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-purple-900">
            Las abreviaturas son <strong>CÓDIGOS OFICIALES</strong> que aparecen en los recuadros superior/inferior
            de cada diente. NO son editables y representan materiales, tratamientos o condiciones específicas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allAbbreviations.map((item, idx) => (
          <div
            key={`${item.abbr}-${idx}`}
            className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
          >
            <div
              className="px-3 py-2 font-bold text-white text-sm rounded min-w-[50px] text-center"
              style={{ backgroundColor: item.color }}
            >
              {item.abbr}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Notas importantes:</h4>
        <ul className="space-y-1 text-sm text-gray-700">
          <li>• Las abreviaturas siempre van en <strong>MAYÚSCULAS</strong></li>
          <li>• Se escriben en los cuadrados superior o inferior del diente</li>
          <li>• El color de la abreviatura coincide con el color de la condición</li>
          <li>• NO se pueden crear abreviaturas personalizadas</li>
        </ul>
      </div>
    </div>
  );
};

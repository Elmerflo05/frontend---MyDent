import { Info } from 'lucide-react';

export const InstructionsBanner: React.FC = () => {
  return (
    <div className="hidden sm:block mb-2 sm:mb-3 lg:mb-4 xl:mb-6 p-2 sm:p-2.5 lg:p-3 xl:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div className="flex items-start gap-1.5 sm:gap-2 lg:gap-3">
        <Info className="w-3.5 lg:w-4 xl:w-5 xl:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-xs lg:text-sm font-semibold text-gray-800 mb-1">Instrucciones de Uso</h3>
          <ul className="text-[10px] lg:text-xs text-gray-700 space-y-1">
            <li>• Click <strong>sección</strong> para condiciones</li>
            <li>• Click <strong>diente completo</strong> para condiciones generales</li>
            <li>• Click <strong>recuadros superiores</strong> para anotaciones</li>
            <li>• <span className="text-blue-600 font-semibold">Azul</span> (OK), <span className="text-red-600 font-semibold">Rojo</span> (patología)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

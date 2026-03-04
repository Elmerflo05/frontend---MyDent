import { Info } from 'lucide-react';

export const NomenclatureTab = () => {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-900">
            El sistema utiliza la <strong>Nomenclatura FDI (Fédération Dentaire Internationale)</strong>,
            estándar internacional para numeración dental. Cada diente tiene un código único de 2 dígitos.
          </p>
        </div>
      </div>

      {/* Dentición Permanente */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            DENTICIÓN PERMANENTE (Adultos - 32 dientes)
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Superior Derecho */}
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">1</span>
                Cuadrante Superior Derecho
              </h4>
              <div className="space-y-1 text-sm">
                <p><strong>1.8</strong> - Tercer molar (muela del juicio)</p>
                <p><strong>1.7</strong> - Segundo molar</p>
                <p><strong>1.6</strong> - Primer molar</p>
                <p><strong>1.5</strong> - Segundo premolar</p>
                <p><strong>1.4</strong> - Primer premolar</p>
                <p><strong>1.3</strong> - Canino</p>
                <p><strong>1.2</strong> - Incisivo lateral</p>
                <p><strong>1.1</strong> - Incisivo central</p>
              </div>
            </div>

            {/* Superior Izquierdo */}
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">2</span>
                Cuadrante Superior Izquierdo
              </h4>
              <div className="space-y-1 text-sm">
                <p><strong>2.1</strong> - Incisivo central</p>
                <p><strong>2.2</strong> - Incisivo lateral</p>
                <p><strong>2.3</strong> - Canino</p>
                <p><strong>2.4</strong> - Primer premolar</p>
                <p><strong>2.5</strong> - Segundo premolar</p>
                <p><strong>2.6</strong> - Primer molar</p>
                <p><strong>2.7</strong> - Segundo molar</p>
                <p><strong>2.8</strong> - Tercer molar (muela del juicio)</p>
              </div>
            </div>

            {/* Inferior Derecho */}
            <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">4</span>
                Cuadrante Inferior Derecho
              </h4>
              <div className="space-y-1 text-sm">
                <p><strong>4.8</strong> - Tercer molar (muela del juicio)</p>
                <p><strong>4.7</strong> - Segundo molar</p>
                <p><strong>4.6</strong> - Primer molar</p>
                <p><strong>4.5</strong> - Segundo premolar</p>
                <p><strong>4.4</strong> - Primer premolar</p>
                <p><strong>4.3</strong> - Canino</p>
                <p><strong>4.2</strong> - Incisivo lateral</p>
                <p><strong>4.1</strong> - Incisivo central</p>
              </div>
            </div>

            {/* Inferior Izquierdo */}
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">3</span>
                Cuadrante Inferior Izquierdo
              </h4>
              <div className="space-y-1 text-sm">
                <p><strong>3.1</strong> - Incisivo central</p>
                <p><strong>3.2</strong> - Incisivo lateral</p>
                <p><strong>3.3</strong> - Canino</p>
                <p><strong>3.4</strong> - Primer premolar</p>
                <p><strong>3.5</strong> - Segundo premolar</p>
                <p><strong>3.6</strong> - Primer molar</p>
                <p><strong>3.7</strong> - Segundo molar</p>
                <p><strong>3.8</strong> - Tercer molar (muela del juicio)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dentición Temporal */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            DENTICIÓN TEMPORAL (Niños - 20 dientes)
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
              <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">5</span>
                Superior Derecho
              </h4>
              <div className="space-y-1 text-sm">
                <p><strong>5.5</strong> - Segundo molar temporal</p>
                <p><strong>5.4</strong> - Primer molar temporal</p>
                <p><strong>5.3</strong> - Canino temporal</p>
                <p><strong>5.2</strong> - Incisivo lateral temporal</p>
                <p><strong>5.1</strong> - Incisivo central temporal</p>
              </div>
            </div>

            <div className="border border-pink-200 rounded-lg p-4 bg-pink-50">
              <h4 className="font-semibold text-pink-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">6</span>
                Superior Izquierdo
              </h4>
              <div className="space-y-1 text-sm">
                <p><strong>6.1</strong> - Incisivo central temporal</p>
                <p><strong>6.2</strong> - Incisivo lateral temporal</p>
                <p><strong>6.3</strong> - Canino temporal</p>
                <p><strong>6.4</strong> - Primer molar temporal</p>
                <p><strong>6.5</strong> - Segundo molar temporal</p>
              </div>
            </div>

            <div className="border border-cyan-200 rounded-lg p-4 bg-cyan-50">
              <h4 className="font-semibold text-cyan-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">8</span>
                Inferior Derecho
              </h4>
              <div className="space-y-1 text-sm">
                <p><strong>8.5</strong> - Segundo molar temporal</p>
                <p><strong>8.4</strong> - Primer molar temporal</p>
                <p><strong>8.3</strong> - Canino temporal</p>
                <p><strong>8.2</strong> - Incisivo lateral temporal</p>
                <p><strong>8.1</strong> - Incisivo central temporal</p>
              </div>
            </div>

            <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
              <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">7</span>
                Inferior Izquierdo
              </h4>
              <div className="space-y-1 text-sm">
                <p><strong>7.1</strong> - Incisivo central temporal</p>
                <p><strong>7.2</strong> - Incisivo lateral temporal</p>
                <p><strong>7.3</strong> - Canino temporal</p>
                <p><strong>7.4</strong> - Primer molar temporal</p>
                <p><strong>7.5</strong> - Segundo molar temporal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

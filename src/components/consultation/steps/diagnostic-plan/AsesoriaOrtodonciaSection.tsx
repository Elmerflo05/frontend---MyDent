interface AsesoriaOrtodonciaProps {
  paquete1ConAsesoria: boolean;
  paquete1SinAsesoria: boolean;
  paquete2ConAsesoria: boolean;
  paquete2SinAsesoria: boolean;
  paquete3ConAsesoria: boolean;
  paquete3SinAsesoria: boolean;
  alteracionesInmediatas: boolean;
  escaneoImpresionDigital: boolean;
  modelosEstudio3d: boolean;
  onChange: (field: string, value: boolean) => void;
  readOnly?: boolean;
}

export const AsesoriaOrtodonciaSection = ({
  paquete1ConAsesoria,
  paquete1SinAsesoria,
  paquete2ConAsesoria,
  paquete2SinAsesoria,
  paquete3ConAsesoria,
  paquete3SinAsesoria,
  alteracionesInmediatas,
  escaneoImpresionDigital,
  modelosEstudio3d,
  onChange,
  readOnly = false
}: AsesoriaOrtodonciaProps) => {
  const handlePaqueteChange = (paquete: number, conAsesoria: boolean) => {
    if (paquete === 1) {
      onChange('paquete1ConAsesoria', conAsesoria);
      onChange('paquete1SinAsesoria', !conAsesoria);
    } else if (paquete === 2) {
      onChange('paquete2ConAsesoria', conAsesoria);
      onChange('paquete2SinAsesoria', !conAsesoria);
    } else if (paquete === 3) {
      onChange('paquete3ConAsesoria', conAsesoria);
      onChange('paquete3SinAsesoria', !conAsesoria);
    }
  };

  return (
    <div className="bg-purple-50/50 rounded-lg p-5 border border-purple-200">
      <h3 className="font-bold text-purple-900 mb-4 text-lg">📋 ASESORÍA ORTODONCIA</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Paquete 1 */}
        <div className="border border-purple-300 rounded-lg p-4 bg-white">
          <h4 className="font-semibold text-purple-900 mb-3">Paquete 1</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="paq1"
                checked={paquete1ConAsesoria}
                onChange={() => handlePaqueteChange(1, true)}
                className="w-4 h-4 text-purple-600"
                disabled={readOnly}
              />
              <span className="text-sm">Con asesoría</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="paq1"
                checked={paquete1SinAsesoria}
                onChange={() => handlePaqueteChange(1, false)}
                className="w-4 h-4 text-purple-600"
                disabled={readOnly}
              />
              <span className="text-sm">Sin asesoría</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            <p className="font-semibold mb-1">Incluye:</p>
            <ul className="space-y-1">
              <li>• RX Cefalométrica</li>
              <li>• Estudio de modelos</li>
              <li>• RX Panorámica</li>
              <li>• Análisis CBCT</li>
            </ul>
          </div>
        </div>

        {/* Paquete 2 */}
        <div className="border border-purple-300 rounded-lg p-4 bg-white">
          <h4 className="font-semibold text-purple-900 mb-3">Paquete 2</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="paq2"
                checked={paquete2ConAsesoria}
                onChange={() => handlePaqueteChange(2, true)}
                className="w-4 h-4 text-purple-600"
                disabled={readOnly}
              />
              <span className="text-sm">Con asesoría</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="paq2"
                checked={paquete2SinAsesoria}
                onChange={() => handlePaqueteChange(2, false)}
                className="w-4 h-4 text-purple-600"
                disabled={readOnly}
              />
              <span className="text-sm">Sin asesoría</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            <p className="font-semibold mb-1">Incluye:</p>
            <ul className="space-y-1">
              <li>• RX Tracephoto</li>
              <li>• RX Panorámica</li>
              <li>• RX Cefalométrica</li>
              <li>• Análisis</li>
            </ul>
          </div>
        </div>

        {/* Paquete 3 */}
        <div className="border border-purple-300 rounded-lg p-4 bg-white">
          <h4 className="font-semibold text-purple-900 mb-3">Paquete 3</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="paq3"
                checked={paquete3ConAsesoria}
                onChange={() => handlePaqueteChange(3, true)}
                className="w-4 h-4 text-purple-600"
                disabled={readOnly}
              />
              <span className="text-sm">Con asesoría</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="paq3"
                checked={paquete3SinAsesoria}
                onChange={() => handlePaqueteChange(3, false)}
                className="w-4 h-4 text-purple-600"
                disabled={readOnly}
              />
              <span className="text-sm">Sin asesoría</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            <p className="font-semibold mb-1">Incluye:</p>
            <ul className="space-y-1">
              <li>• RX Tracephoto</li>
              <li>• RX Cefalométrica</li>
              <li>• Análisis Cb</li>
              <li>• Impresión Digital</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Servicios Adicionales */}
      <h4 className="font-semibold text-purple-900 mb-3">Servicios Adicionales:</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={alteracionesInmediatas}
            onChange={(e) => onChange('alteracionesInmediatas', e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded"
            disabled={readOnly}
          />
          <span className="text-sm flex-1">Alineadores invisibles</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={escaneoImpresionDigital}
            onChange={(e) => onChange('escaneoImpresionDigital', e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded"
            disabled={readOnly}
          />
          <span className="text-sm flex-1">Escaneo impresión digital</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={modelosEstudio3d}
            onChange={(e) => onChange('modelosEstudio3d', e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded"
            disabled={readOnly}
          />
          <span className="text-sm flex-1">Modelos de estudio 3D</span>
        </div>
      </div>
    </div>
  );
};

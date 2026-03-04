interface PeriapicalSectionProps {
  modoFisicoActivo: boolean;
  modoDigitalActivo: boolean;
  selectedTeethFisico: number[];
  selectedTeethDigital: number[];
  onToggleModoFisico: () => void;
  onToggleModoDigital: () => void;
  onToggleToothFisico: (toothNumber: number) => void;
  onToggleToothDigital: (toothNumber: number) => void;
  readOnly?: boolean;
}

export const PeriapicalSection = ({
  modoFisicoActivo,
  modoDigitalActivo,
  selectedTeethFisico,
  selectedTeethDigital,
  onToggleModoFisico,
  onToggleModoDigital,
  onToggleToothFisico,
  onToggleToothDigital,
  readOnly = false
}: PeriapicalSectionProps) => {
  return (
    <div className="bg-pink-50/50 rounded-lg p-5 border border-pink-200">
      <h3 className="font-bold text-pink-900 mb-4 text-lg">📋 PERIAPICAL</h3>

      {/* Botones para activar modos */}
      <div className="mb-4 flex gap-3">
        <button
          onClick={onToggleModoFisico}
          disabled={readOnly}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            modoFisicoActivo
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white border-2 border-pink-300 text-pink-700 hover:bg-pink-50'
          } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          📦 FÍSICO
        </button>
        <button
          onClick={onToggleModoDigital}
          disabled={readOnly}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            modoDigitalActivo
              ? 'bg-indigo-500 text-white shadow-md'
              : 'bg-white border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50'
          } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          💻 DIGITAL
        </button>
      </div>

      {/* Panel de selección de dientes - MODO FÍSICO */}
      {modoFisicoActivo && (
        <div className="mb-6 bg-white rounded-lg p-4 border-2 border-pink-300">
          <h4 className="font-bold text-pink-700 mb-3 text-base flex items-center gap-2">
            📦 Selección de Dientes - FÍSICO
          </h4>

          {/* Cuadrantes Superiores */}
          <div className="mb-4">
            <h5 className="font-semibold text-gray-700 mb-2 text-sm">Cuadrantes Superiores</h5>
            <div className="flex flex-wrap gap-2 ml-4">
              {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map(num => (
                <button
                  key={num}
                  onClick={() => onToggleToothFisico(num)}
                  disabled={readOnly}
                  className={`
                    w-12 h-12 border-2 rounded-lg flex items-center justify-center
                    text-sm font-semibold transition-all duration-200
                    ${selectedTeethFisico.includes(num)
                      ? 'bg-pink-500 border-pink-600 text-white shadow-md'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-pink-50 hover:border-pink-400'
                    }
                    ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Cuadrantes Inferiores */}
          <div className="mb-4">
            <h5 className="font-semibold text-gray-700 mb-2 text-sm">Cuadrantes Inferiores</h5>
            <div className="flex flex-wrap gap-2 ml-4">
              {[38, 37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47, 48].map(num => (
                <button
                  key={num}
                  onClick={() => onToggleToothFisico(num)}
                  disabled={readOnly}
                  className={`
                    w-12 h-12 border-2 rounded-lg flex items-center justify-center
                    text-sm font-semibold transition-all duration-200
                    ${selectedTeethFisico.includes(num)
                      ? 'bg-pink-500 border-pink-600 text-white shadow-md'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-pink-50 hover:border-pink-400'
                    }
                    ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Cuadrantes Temporales */}
          <div>
            <h5 className="font-semibold text-gray-700 mb-2 text-sm">Cuadrantes Temporales</h5>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 ml-4">
                {[51, 52, 53, 54, 55, 61, 62, 63, 64, 65].map(num => (
                  <button
                    key={num}
                    onClick={() => onToggleToothFisico(num)}
                    disabled={readOnly}
                    className={`
                      w-12 h-12 border-2 rounded-lg flex items-center justify-center
                      text-sm font-semibold transition-all duration-200
                      ${selectedTeethFisico.includes(num)
                        ? 'bg-pink-500 border-pink-600 text-white shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-pink-50 hover:border-pink-400'
                      }
                      ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 ml-4">
                {[71, 72, 73, 74, 75, 81, 82, 83, 84, 85].map(num => (
                  <button
                    key={num}
                    onClick={() => onToggleToothFisico(num)}
                    disabled={readOnly}
                    className={`
                      w-12 h-12 border-2 rounded-lg flex items-center justify-center
                      text-sm font-semibold transition-all duration-200
                      ${selectedTeethFisico.includes(num)
                        ? 'bg-pink-500 border-pink-600 text-white shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-pink-50 hover:border-pink-400'
                      }
                      ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel de selección de dientes - MODO DIGITAL */}
      {modoDigitalActivo && (
        <div className="mb-6 bg-white rounded-lg p-4 border-2 border-indigo-300">
          <h4 className="font-bold text-indigo-700 mb-3 text-base flex items-center gap-2">
            💻 Selección de Dientes - DIGITAL
          </h4>

          {/* Cuadrantes Superiores */}
          <div className="mb-4">
            <h5 className="font-semibold text-gray-700 mb-2 text-sm">Cuadrantes Superiores</h5>
            <div className="flex flex-wrap gap-2 ml-4">
              {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map(num => (
                <button
                  key={num}
                  onClick={() => onToggleToothDigital(num)}
                  disabled={readOnly}
                  className={`
                    w-12 h-12 border-2 rounded-lg flex items-center justify-center
                    text-sm font-semibold transition-all duration-200
                    ${selectedTeethDigital.includes(num)
                      ? 'bg-indigo-500 border-indigo-600 text-white shadow-md'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-400'
                    }
                    ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Cuadrantes Inferiores */}
          <div className="mb-4">
            <h5 className="font-semibold text-gray-700 mb-2 text-sm">Cuadrantes Inferiores</h5>
            <div className="flex flex-wrap gap-2 ml-4">
              {[38, 37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47, 48].map(num => (
                <button
                  key={num}
                  onClick={() => onToggleToothDigital(num)}
                  disabled={readOnly}
                  className={`
                    w-12 h-12 border-2 rounded-lg flex items-center justify-center
                    text-sm font-semibold transition-all duration-200
                    ${selectedTeethDigital.includes(num)
                      ? 'bg-indigo-500 border-indigo-600 text-white shadow-md'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-400'
                    }
                    ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Cuadrantes Temporales */}
          <div>
            <h5 className="font-semibold text-gray-700 mb-2 text-sm">Cuadrantes Temporales</h5>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 ml-4">
                {[51, 52, 53, 54, 55, 61, 62, 63, 64, 65].map(num => (
                  <button
                    key={num}
                    onClick={() => onToggleToothDigital(num)}
                    disabled={readOnly}
                    className={`
                      w-12 h-12 border-2 rounded-lg flex items-center justify-center
                      text-sm font-semibold transition-all duration-200
                      ${selectedTeethDigital.includes(num)
                        ? 'bg-indigo-500 border-indigo-600 text-white shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-400'
                      }
                      ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 ml-4">
                {[71, 72, 73, 74, 75, 81, 82, 83, 84, 85].map(num => (
                  <button
                    key={num}
                    onClick={() => onToggleToothDigital(num)}
                    disabled={readOnly}
                    className={`
                      w-12 h-12 border-2 rounded-lg flex items-center justify-center
                      text-sm font-semibold transition-all duration-200
                      ${selectedTeethDigital.includes(num)
                        ? 'bg-indigo-500 border-indigo-600 text-white shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-400'
                      }
                      ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

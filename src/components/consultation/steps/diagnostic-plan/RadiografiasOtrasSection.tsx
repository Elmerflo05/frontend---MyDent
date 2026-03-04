interface RadiografiasOtrasSectionProps {
  bitewingAmbos: boolean;
  bitewingDerecho: boolean;
  bitewingIzquierdo: boolean;
  oclusalSuperiores: boolean;
  oclusalInferiores: boolean;
  seriada: boolean;
  fotografiaIntraoral: boolean;
  onChange: (field: string, value: boolean) => void;
  readOnly?: boolean;
}

export const RadiografiasOtrasSection = ({
  bitewingAmbos,
  bitewingDerecho,
  bitewingIzquierdo,
  oclusalSuperiores,
  oclusalInferiores,
  seriada,
  fotografiaIntraoral,
  onChange,
  readOnly = false
}: RadiografiasOtrasSectionProps) => {
  return (
    <>
      {/* BITEWING y OCLUSAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="font-semibold text-gray-700 mb-3">BITEWING:</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={bitewingAmbos}
                onChange={(e) => onChange('bitewingAmbos', e.target.checked)}
                className="w-4 h-4 text-pink-600 rounded"
                disabled={readOnly}
              />
              <span className="text-sm">Ambos lados</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={bitewingDerecho}
                onChange={(e) => onChange('bitewingDerecho', e.target.checked)}
                className="w-4 h-4 text-pink-600 rounded"
                disabled={readOnly}
              />
              <span className="text-sm">Lado derecho</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={bitewingIzquierdo}
                onChange={(e) => onChange('bitewingIzquierdo', e.target.checked)}
                className="w-4 h-4 text-pink-600 rounded"
                disabled={readOnly}
              />
              <span className="text-sm">Lado izquierdo</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-3">OCLUSAL:</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={oclusalSuperiores}
                onChange={(e) => onChange('oclusalSuperiores', e.target.checked)}
                className="w-4 h-4 text-pink-600 rounded"
                disabled={readOnly}
              />
              <span className="text-sm">Superiores</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={oclusalInferiores}
                onChange={(e) => onChange('oclusalInferiores', e.target.checked)}
                className="w-4 h-4 text-pink-600 rounded"
                disabled={readOnly}
              />
              <span className="text-sm">Inferiores</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seriada y Fotografía */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={seriada}
            onChange={(e) => onChange('seriada', e.target.checked)}
            className="w-4 h-4 text-pink-600 rounded"
            disabled={readOnly}
          />
          <span className="text-sm font-medium">Seriada</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={fotografiaIntraoral}
            onChange={(e) => onChange('fotografiaIntraoral', e.target.checked)}
            className="w-4 h-4 text-pink-600 rounded"
            disabled={readOnly}
          />
          <span className="text-sm font-medium">Fotografía Intraoral</span>
        </div>
      </div>
    </>
  );
};

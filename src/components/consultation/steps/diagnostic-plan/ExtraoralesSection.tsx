interface ExtraoralesSectionProps {
  halografiaPanoramica: boolean;
  halografiaLateral: boolean;
  halografiaPosterior: boolean;
  estudiosAtm: boolean;
  radiografiaCefalometrica: boolean;
  onChange: (field: string, value: boolean) => void;
  readOnly?: boolean;
}

export const ExtraoralesSection = ({
  halografiaPanoramica,
  halografiaLateral,
  halografiaPosterior,
  estudiosAtm,
  radiografiaCefalometrica,
  onChange,
  readOnly = false
}: ExtraoralesSectionProps) => {
  return (
    <div className="bg-blue-50/50 rounded-lg p-5 border border-blue-200">
      <h3 className="font-bold text-blue-900 mb-4 text-lg">📋 EXTRAORALES</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={halografiaPanoramica}
            onChange={(e) => onChange('halografiaPanoramica', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
            disabled={readOnly}
          />
          <span className="text-sm flex-1">Radiografía Panorámica</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={halografiaLateral}
            onChange={(e) => onChange('halografiaLateral', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
            disabled={readOnly}
          />
          <span className="text-sm flex-1">Radiografía Lateral de Cráneo</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={halografiaPosterior}
            onChange={(e) => onChange('halografiaPosterior', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
            disabled={readOnly}
          />
          <span className="text-sm flex-1">Radiografía Posterior Anterior (Frontal)</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={estudiosAtm}
            onChange={(e) => onChange('estudiosAtm', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
            disabled={readOnly}
          />
          <span className="text-sm flex-1">Estudios ATM (Boca abierta)</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={radiografiaCefalometrica}
            onChange={(e) => onChange('radiografiaCefalometrica', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
            disabled={readOnly}
          />
          <span className="text-sm flex-1">Radiografía Cefalométrica</span>
        </div>
      </div>
    </div>
  );
};

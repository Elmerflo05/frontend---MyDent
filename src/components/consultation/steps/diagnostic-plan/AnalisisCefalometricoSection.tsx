interface AnalisisCefalometricoProps {
  ricketts: boolean;
  powell: boolean;
  nordEstelametal: boolean;
  steinerBianco: boolean;
  steiner: boolean;
  bjork: boolean;
  mcNamara: boolean;
  usp: boolean;
  especificarOtros: string;
  onChange: (field: string, value: boolean | string) => void;
  readOnly?: boolean;
}

export const AnalisisCefalometricoSection = ({
  ricketts,
  powell,
  nordEstelametal,
  steinerBianco,
  steiner,
  bjork,
  mcNamara,
  usp,
  especificarOtros,
  onChange,
  readOnly = false
}: AnalisisCefalometricoProps) => {
  const analisis = [
    { key: 'ricketts', label: 'Ricketts', checked: ricketts },
    { key: 'powell', label: 'Powell', checked: powell },
    { key: 'nordEstelametal', label: 'Nord Estelametal', checked: nordEstelametal },
    { key: 'steinerBianco', label: 'Steiner Bianco', checked: steinerBianco },
    { key: 'steiner', label: 'Steiner', checked: steiner },
    { key: 'bjork', label: 'Bjork', checked: bjork },
    { key: 'mcNamara', label: 'Mc. Namara', checked: mcNamara },
    { key: 'usp', label: 'USP', checked: usp }
  ];

  return (
    <div className="bg-green-50/50 rounded-lg p-5 border border-green-200">
      <h3 className="font-bold text-green-900 mb-4 text-lg">📋 ANÁLISIS CEFALOMÉTRICOS</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {analisis.map(item => (
          <div key={item.key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) => onChange(item.key, e.target.checked)}
              className="w-4 h-4 text-green-600 rounded"
              disabled={readOnly}
            />
            <span className="text-sm">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-green-900 mb-2">
          Otros análisis (especificar)
        </label>
        <textarea
          value={especificarOtros}
          onChange={(e) => onChange('especificarOtros', e.target.value)}
          placeholder="Especifique otros análisis cefalométricos"
          rows={2}
          className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          disabled={readOnly}
        />
      </div>
    </div>
  );
};

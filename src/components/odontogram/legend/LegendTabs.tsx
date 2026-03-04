interface LegendTabsProps {
  activeTab: 'symbols' | 'colors' | 'abbreviations' | 'nomenclature';
  onTabChange: (tab: 'symbols' | 'colors' | 'abbreviations' | 'nomenclature') => void;
}

export const LegendTabs = ({ activeTab, onTabChange }: LegendTabsProps) => {
  return (
    <div className="border-b border-gray-200 px-6 flex gap-1">
      <button
        onClick={() => onTabChange('symbols')}
        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'symbols'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        }`}
      >
        Símbolos y Condiciones
      </button>
      <button
        onClick={() => onTabChange('colors')}
        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'colors'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        }`}
      >
        Código de Colores
      </button>
      <button
        onClick={() => onTabChange('abbreviations')}
        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'abbreviations'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        }`}
      >
        Abreviaturas
      </button>
      <button
        onClick={() => onTabChange('nomenclature')}
        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'nomenclature'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        }`}
      >
        Nomenclatura FDI
      </button>
    </div>
  );
};

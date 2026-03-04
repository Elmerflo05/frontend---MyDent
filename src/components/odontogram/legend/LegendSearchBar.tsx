import { Search, X } from 'lucide-react';

interface LegendSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const LegendSearchBar = ({ searchTerm, onSearchChange }: LegendSearchBarProps) => {
  return (
    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar condición, código CIE-10, abreviatura o descripción..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {searchTerm && (
        <p className="text-xs text-gray-600 mt-2">
          Buscando: <span className="font-semibold">"{searchTerm}"</span>
        </p>
      )}
    </div>
  );
};

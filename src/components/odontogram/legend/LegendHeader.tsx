import { X, Book } from 'lucide-react';

interface LegendHeaderProps {
  onClose: () => void;
}

export const LegendHeader = ({ onClose }: LegendHeaderProps) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Book className="w-6 h-6 text-white" />
        <div>
          <h2 className="text-xl font-bold text-white">Manual de Uso del Odontograma</h2>
          <p className="text-xs text-blue-100 mt-0.5">Normas del Colegio Odontológico del Perú</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
      >
        <X className="w-5 h-5 text-white" />
      </button>
    </div>
  );
};

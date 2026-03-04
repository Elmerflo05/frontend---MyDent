interface LegendFooterProps {
  onClose: () => void;
}

export const LegendFooter = ({ onClose }: LegendFooterProps) => {
  return (
    <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-600">
          Documento oficial basado en las normativas del Colegio Odontológico del Perú
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Cerrar Manual
        </button>
      </div>
    </div>
  );
};

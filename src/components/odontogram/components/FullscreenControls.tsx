import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, X } from 'lucide-react';

interface FullscreenControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onToggleFullscreen: () => void;
}

export const FullscreenControls: React.FC<FullscreenControlsProps> = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onToggleFullscreen
}) => {
  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
      {/* Botón Salir */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleFullscreen}
        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-lg shadow-lg transition-all"
        title="Salir de Pantalla Completa (ESC)"
      >
        <X className="w-4 h-4" />
        <span className="text-sm font-semibold">Salir</span>
      </motion.button>

      {/* Controles de Zoom compactos */}
      <div className="flex items-center gap-1 px-2 py-2 bg-white rounded-lg shadow-lg border border-gray-200">
        {/* Zoom Out */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onZoomOut}
          disabled={zoomLevel <= 0.5}
          className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Alejar"
        >
          <ZoomOut className="w-4 h-4 text-gray-700" />
        </motion.button>

        {/* Porcentaje */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onZoomReset}
          className="px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors min-w-[50px] text-center"
          title="Restablecer zoom a 100%"
        >
          <span className="text-xs font-bold text-gray-700">{Math.round(zoomLevel * 100)}%</span>
        </motion.button>

        {/* Zoom In */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onZoomIn}
          disabled={zoomLevel >= 1.5}
          className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Acercar"
        >
          <ZoomIn className="w-4 h-4 text-gray-700" />
        </motion.button>
      </div>
    </div>
  );
};

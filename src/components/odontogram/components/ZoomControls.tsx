import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';

interface ZoomControlsProps {
  zoomLevel: number;
  isFullscreen: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomChange: (value: number) => void;
  onZoomReset: () => void;
  onToggleFullscreen: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoomLevel,
  isFullscreen,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  onZoomReset,
  onToggleFullscreen
}) => {
  return (
    <div className="mt-1 sm:mt-2 lg:mt-3 xl:mt-4 flex items-center justify-end gap-1 sm:gap-2 lg:gap-3">
      {/* Botón Fullscreen - Solo icono en móvil */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleFullscreen}
        className={`flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 lg:px-3 xl:px-4 py-1.5 sm:py-1.5 lg:py-2 rounded-lg transition-all shadow-sm ${
          isFullscreen
            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
            : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700'
        }`}
        title={isFullscreen ? 'Salir de Pantalla Completa (ESC)' : 'Pantalla Completa'}
      >
        {isFullscreen ? (
          <>
            <X className="w-3.5 h-3.5 sm:w-3.5 lg:w-4 lg:h-4" />
            <span className="text-xs lg:text-sm font-semibold hidden sm:inline">Salir</span>
          </>
        ) : (
          <>
            <Maximize2 className="w-3.5 h-3.5 sm:w-3.5 lg:w-4 lg:h-4" />
            <span className="text-xs lg:text-sm font-semibold hidden sm:inline">Pantalla Completa</span>
          </>
        )}
      </motion.button>

      {/* Controles de Zoom */}
      <div className="flex items-center gap-0.5 sm:gap-1 lg:gap-2 px-1.5 sm:px-2.5 lg:px-3 xl:px-4 py-1 sm:py-1.5 lg:py-2 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
        {/* Botón Zoom Out */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onZoomOut}
          disabled={zoomLevel <= 0.5}
          className="p-1 rounded-md bg-white hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-indigo-200"
          title="Alejar (Zoom Out)"
        >
          <ZoomOut className="w-3.5 h-3.5 sm:w-3.5 lg:w-4 lg:h-4 text-indigo-700" />
        </motion.button>

        {/* Slider de Zoom - Más estrecho en móvil */}
        <input
          type="range"
          min="0.5"
          max="1.5"
          step="0.05"
          value={zoomLevel}
          onChange={(e) => onZoomChange(parseFloat(e.target.value))}
          className="w-16 sm:w-24 lg:w-28 xl:w-32 h-1.5 sm:h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          style={{
            background: `linear-gradient(to right, rgb(79 70 229) 0%, rgb(79 70 229) ${((zoomLevel - 0.5) / 1.0) * 100}%, rgb(199 210 254) ${((zoomLevel - 0.5) / 1.0) * 100}%, rgb(199 210 254) 100%)`
          }}
        />

        {/* Botón Zoom In */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onZoomIn}
          disabled={zoomLevel >= 1.5}
          className="p-1 rounded-md bg-white hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-indigo-200"
          title="Acercar (Zoom In)"
        >
          <ZoomIn className="w-3.5 h-3.5 sm:w-3.5 lg:w-4 lg:h-4 text-indigo-700" />
        </motion.button>

        {/* Porcentaje y Reset */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onZoomReset}
          className="px-1.5 sm:px-2 lg:px-2.5 py-0.5 sm:py-1 rounded-md bg-white hover:bg-indigo-100 transition-colors border border-indigo-300 min-w-[40px] sm:min-w-[50px] lg:min-w-[55px] xl:min-w-[60px]"
          title="Restablecer zoom a 100%"
        >
          <span className="text-[10px] sm:text-xs lg:text-sm font-bold text-indigo-700">{Math.round(zoomLevel * 100)}%</span>
        </motion.button>
      </div>
    </div>
  );
};

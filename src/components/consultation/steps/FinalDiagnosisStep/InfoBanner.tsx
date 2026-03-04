/**
 * InfoBanner Component
 *
 * Banner informativo que explica el diseño de 2 columnas y muestra el contador de modificaciones
 */

import { motion } from 'framer-motion';
import { Info, RefreshCw } from 'lucide-react';

interface InfoBannerProps {
  modifiedCount: number;
  onReload: () => void;
}

export const InfoBanner = ({ modifiedCount, onReload }: InfoBannerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 border border-blue-200 rounded-lg p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-semibold text-blue-900 mb-1">Vista Comparativa</h5>
            <p className="text-sm text-blue-800">
              <strong>Columna Izquierda:</strong> Diagnóstico presuntivo basado en el odontograma (solo referencia). <br />
              <strong>Columna Derecha:</strong> Diagnóstico definitivo editable. Inicialmente es una copia del presuntivo, pero puede modificar las condiciones según los resultados auxiliares.
            </p>
            {modifiedCount > 0 && (
              <p className="text-sm text-blue-700 mt-2">
                ✏️ Tiene {modifiedCount} condición(es) modificada(s) respecto al diagnóstico presuntivo.
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onReload}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm flex-shrink-0"
          title="Recargar condiciones del odontograma"
        >
          <RefreshCw className="w-4 h-4" />
          Recargar
        </button>
      </div>
    </motion.div>
  );
};

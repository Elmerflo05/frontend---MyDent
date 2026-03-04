import { motion } from 'framer-motion';
import { OdontogramLegend } from '@/components/odontogram/OdontogramLegend';

export const LegendTab = () => {
  return (
    <motion.div
      key="legend"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Leyenda del Odontograma */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Manual de Uso del Odontograma</h2>
          <p className="text-sm text-gray-600">
            Guía completa de símbolos, colores, abreviaturas y nomenclatura oficial del Colegio Odontológico del Perú
          </p>
        </div>
        <OdontogramLegend isOpen={true} onClose={() => {}} isEmbedded={true} />
      </div>
    </motion.div>
  );
};

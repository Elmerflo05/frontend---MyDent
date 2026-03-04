import { motion } from 'framer-motion';
import Odontogram from '@/components/odontogram/Odontogram';
import { StatsCards } from './StatsCards';

interface PreviewTabProps {
  allConditions: any[];
}

export const PreviewTab = ({ allConditions }: PreviewTabProps) => {
  return (
    <motion.div
      key="preview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Vista Previa del Odontograma</h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Vista en tiempo real con la configuración actual
          </p>
        </div>
        <div className="p-0">
          <Odontogram />
        </div>
      </div>

      {/* Resumen de configuración actual */}
      <StatsCards allConditions={allConditions} />
    </motion.div>
  );
};

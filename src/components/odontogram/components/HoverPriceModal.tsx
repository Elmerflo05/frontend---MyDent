import { motion, AnimatePresence } from 'framer-motion';
import type { ToothCondition } from '@/store/odontogramStore';

interface DentalConditionConfig {
  id: string;
  label: string;
  color: string;
  price?: number;
}

interface HoverPriceModalProps {
  visible: boolean;
  toothNumber: string;
  x: number;
  y: number;
  conditions: ToothCondition[];
  totalPrice: number;
  dentalConditions: DentalConditionConfig[];
  customConditions: DentalConditionConfig[];
  onTotalPriceChange: (toothNumber: string, newTotalPrice: number) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const HoverPriceModal = ({
  visible,
  toothNumber,
  x,
  y,
  conditions,
  totalPrice,
  dentalConditions,
  customConditions,
  onTotalPriceChange,
  onMouseEnter,
  onMouseLeave
}: HoverPriceModalProps) => {
  const sectionNames: Record<string, string> = {
    'mesial': 'Mesial',
    'distal': 'Distal',
    'oclusal': 'Oclusal/Incisal',
    'vestibular': 'Vestibular',
    'lingual': 'Lingual/Palatino',
    'raiz': 'Raíz',
    'raiz-mv': 'Raíz MV',
    'raiz-dv': 'Raíz DV',
    'raiz-distal': 'Raíz Distal',
    'raiz-palatina': 'Raíz Palatina'
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 min-w-[280px] pointer-events-auto"
          style={{
            left: x,
            top: y,
            transform: 'translate(-50%, -100%)',
            marginTop: '-10px'
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              Diente {toothNumber}
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              {conditions.map((condition, index) => {
                const conditionConfig = [...dentalConditions, ...customConditions].find(
                  c => c.id === condition.condition
                );
                const sectionName = sectionNames[condition.sectionId] || condition.sectionId;

                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: condition.color }}
                      />
                      <span>{conditionConfig?.label} ({sectionName})</span>
                    </div>
                    <span className="text-green-600 font-medium">
                      S/ {(condition.price || 0).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Total actual:</span>
              <span className="text-lg font-bold text-green-600">
                S/ {totalPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Nuevo total:</span>
              <input
                type="number"
                min="0"
                step="0.01"
                defaultValue={totalPrice.toFixed(2)}
                className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right font-medium"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    const newPrice = parseFloat(input.value) || 0;
                    onTotalPriceChange(toothNumber, newPrice);
                  }
                }}
                onChange={(e) => {
                  const newPrice = parseFloat(e.target.value) || 0;
                  if (e.target.value && !isNaN(newPrice)) {
                    onTotalPriceChange(toothNumber, newPrice);
                  }
                }}
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Se distribuirá proporcionalmente entre las condiciones
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

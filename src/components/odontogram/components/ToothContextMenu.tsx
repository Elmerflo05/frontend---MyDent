import { motion, AnimatePresence } from 'framer-motion';

interface DentalCondition {
  id: string;
  label: string;
  color: string;
  description: string;
  price?: number;
}

interface ToothContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  toothNumber: string;
  sectionId: string;
  conditions: DentalCondition[];
  hasExistingCondition: boolean;
  onConditionSelect: (conditionId: string) => void;
  onClose: () => void;
}

export const ToothContextMenu = ({
  visible,
  x,
  y,
  toothNumber,
  sectionId,
  conditions,
  hasExistingCondition,
  onConditionSelect,
  onClose
}: ToothContextMenuProps) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 min-w-[200px]"
          style={{
            left: x,
            top: y,
            transform: 'translate(-50%, -50%)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-600">
              Diente {toothNumber} - {sectionId}
            </p>
            <p className="text-xs text-gray-500">Seleccione una condición:</p>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {conditions.map((condition) => (
              <motion.button
                key={condition.id}
                whileHover={{ backgroundColor: '#f3f4f6' }}
                onClick={() => onConditionSelect(condition.id)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <div
                  className="w-4 h-4 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: condition.color }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{condition.label}</p>
                  <p className="text-xs text-gray-500">{condition.description}</p>
                  {condition.price && condition.price > 0 && (
                    <p className="text-xs text-green-600 font-medium">S/ {condition.price.toFixed(2)}</p>
                  )}
                </div>
              </motion.button>
            ))}

            {/* Opción para quitar condición si existe */}
            {hasExistingCondition && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <motion.button
                  whileHover={{ backgroundColor: '#fef2f2' }}
                  onClick={() => onConditionSelect('remove')}
                  className="w-full px-3 py-2 text-left hover:bg-red-50 transition-colors flex items-center gap-3"
                >
                  <div className="w-4 h-4 rounded-full bg-gray-300" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-600">Quitar condición</p>
                    <p className="text-xs text-gray-500">Eliminar condición aplicada</p>
                  </div>
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

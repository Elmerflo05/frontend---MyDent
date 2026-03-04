import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign } from 'lucide-react';

interface PriceConfirmModalProps {
  visible: boolean;
  conditionId: string;
  conditionLabel: string;
  conditionColor: string;
  defaultPrice: number;
  toothNumber: string;
  sectionId: string;
  onConfirm: (conditionId: string, toothNumber: string, sectionId: string, price: number) => void;
  onClose: () => void;
}

export const PriceConfirmModal = ({
  visible,
  conditionId,
  conditionLabel,
  conditionColor,
  defaultPrice,
  toothNumber,
  sectionId,
  onConfirm,
  onClose
}: PriceConfirmModalProps) => {
  const [editablePrice, setEditablePrice] = useState<number>(defaultPrice);

  useEffect(() => {
    setEditablePrice(defaultPrice);
  }, [defaultPrice]);

  const handleConfirm = () => {
    onConfirm(conditionId, toothNumber, sectionId, editablePrice);
    onClose();
  };

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[60]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Confirmar Precio
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Diente {toothNumber} - {sectionId}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg mb-4">
                <div
                  className="w-6 h-6 rounded-full border-2 border-blue-300"
                  style={{ backgroundColor: conditionColor }}
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{conditionLabel}</p>
                  <p className="text-sm text-gray-600">
                    Precio sugerido: S/ {defaultPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Precio final para esta condición
                  </div>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editablePrice}
                  onChange={(e) => setEditablePrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="0.00"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  Este precio se agregará al presupuesto del paciente
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Confirmar y Agregar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

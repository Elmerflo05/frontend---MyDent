/**
 * CopyConfirmationModal Component
 *
 * Modal de confirmación para copiar del diagnóstico presuntivo al definitivo
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Copy } from 'lucide-react';

interface CopyConfirmationModalProps {
  show: boolean;
  conditionsCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CopyConfirmationModal = ({
  show,
  conditionsCount,
  onConfirm,
  onCancel
}: CopyConfirmationModalProps) => {
  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Copy className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Copiar del Presuntivo
                  </h3>
                  <p className="text-sm text-gray-600">
                    Resetear diagnóstico definitivo
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-900 font-medium mb-1">
                      ⚠️ Se perderán todos los cambios actuales
                    </p>
                    <p className="text-sm text-amber-700">
                      ¿Desea resetear el diagnóstico definitivo copiando nuevamente del presuntivo? Todas las modificaciones y condiciones agregadas manualmente se eliminarán.
                    </p>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 rounded-lg p-3 mb-6">
                <p className="text-xs text-blue-700">
                  Se copiarán <strong>{conditionsCount} condición(es)</strong> del diagnóstico presuntivo al definitivo.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, DollarSign, Plus } from 'lucide-react';
import type { ToothCondition } from '@/store/odontogramStore';

interface DentalConditionConfig {
  id: string;
  label: string;
  color: string;
  price?: number;
}

interface EditConditionModalProps {
  visible: boolean;
  toothNumber: string;
  sectionId: string;
  conditions: ToothCondition[];
  dentalConditions: DentalConditionConfig[];
  customConditions: DentalConditionConfig[];
  onClose: () => void;
  onUpdatePrice: (toothNumber: string, sectionId: string, newPrice: number) => void;
  onRemoveCondition: (toothNumber: string, sectionId: string) => void;
  onConditionsUpdate: (conditions: ToothCondition[]) => void;
}

export const EditConditionModal = ({
  visible,
  toothNumber,
  sectionId,
  conditions,
  dentalConditions,
  customConditions,
  onClose,
  onUpdatePrice,
  onRemoveCondition,
  onConditionsUpdate
}: EditConditionModalProps) => {
  const sectionNames: Record<string, string> = {
    'mesial': 'Mesial',
    'distal': 'Distal',
    'oclusal': 'Oclusal',
    'vestibular': 'Vestibular',
    'lingual': 'Lingual',
    'raiz': 'Raíz',
    'raiz-mv': 'Raíz MV',
    'raiz-dv': 'Raíz DV',
    'raiz-distal': 'Raíz Distal',
    'raiz-palatina': 'Raíz Palatina'
  };

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Diente {toothNumber}
                </h3>
                <p className="text-sm text-gray-600">
                  Gestionar condiciones y precios de todas las secciones
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Lista de condiciones actuales */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Condiciones Aplicadas</h4>
              {conditions.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No hay condiciones aplicadas aún</p>
              ) : (
                <div className="space-y-2">
                  {conditions.map((condition, index) => {
                    const conditionConfig = [...dentalConditions, ...customConditions].find(
                      c => c.id === condition.condition
                    );
                    const sectionName = sectionNames[condition.sectionId] || condition.sectionId;

                    return (
                      <div
                        key={`${condition.condition}-${condition.sectionId}-${index}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: condition.color }}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {conditionConfig?.label || condition.condition} - {sectionName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <DollarSign className="w-3 h-3 text-green-600" />
                              <span className="text-xs text-gray-600">Precio:</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={condition.price || 0}
                                onChange={(e) => {
                                  const newPrice = parseFloat(e.target.value) || 0;
                                  onUpdatePrice(condition.toothNumber, condition.sectionId, newPrice);
                                }}
                                className="w-24 px-2 py-1 text-sm font-semibold border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveCondition(condition.toothNumber, condition.sectionId)}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Agregar nueva condición */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Agregar Nueva Condición
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Seleccione una sección específica del diente para agregar condiciones individuales
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 mt-6 pt-6 border-t">
              <button
                onClick={onClose}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

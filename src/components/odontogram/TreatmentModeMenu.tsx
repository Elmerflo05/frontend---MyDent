/**
 * Menú contextual simplificado para modo tratamiento
 * Solo muestra la opción de marcar condiciones como tratadas
 */

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, AlertCircle } from 'lucide-react';
import { OFFICIAL_DENTAL_CONDITIONS } from '@/constants/dentalConditions';

interface ToothCondition {
  toothNumber: string;
  conditionId: string;
  state?: 'good' | 'bad';
  color?: string;
  abbreviation?: string;
  notes?: string;
}

interface TreatmentModeMenuProps {
  toothNumber: string;
  conditions: ToothCondition[];
  x: number;
  y: number;
  onMarkAsTreated: () => void;
  onClose: () => void;
}

export const TreatmentModeMenu = ({
  toothNumber,
  conditions,
  x,
  y,
  onMarkAsTreated,
  onClose
}: TreatmentModeMenuProps) => {
  // Filtrar solo condiciones rojas (sin tratar)
  const redConditions = conditions.filter(c => c.state === 'bad' || c.color === 'red');
  const allTreated = redConditions.length === 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="treatment-mode-menu fixed z-[9999] bg-white rounded-xl shadow-2xl border-2 border-blue-200 overflow-hidden"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          minWidth: '320px',
          maxWidth: '400px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{toothNumber}</span>
            </div>
            <h3 className="text-white font-semibold">Diente {toothNumber}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {allTreated ? (
            // Todas las condiciones ya están tratadas
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="font-semibold text-green-900">Tratamiento completado</p>
              </div>
              <p className="text-sm text-green-700">
                Todas las condiciones de este diente ya han sido marcadas como tratadas.
              </p>
            </div>
          ) : (
            <>
              {/* Lista de condiciones sin tratar */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Condiciones sin tratar:
                </p>
                <div className="space-y-2">
                  {redConditions.map((condition, idx) => {
                    const officialCondition = OFFICIAL_DENTAL_CONDITIONS.find(
                      c => c.id === condition.conditionId
                    );
                    const label = officialCondition?.label || condition.conditionId;

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                      >
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-800 flex-1">{label}</span>
                        {condition.abbreviation && (
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                            {condition.abbreviation}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botón de acción */}
              <button
                onClick={() => {
                  onMarkAsTreated();
                  onClose();
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                <CheckCircle className="w-5 h-5" />
                Marcar como tratado
              </button>

              <p className="text-xs text-gray-500 mt-3 text-center">
                Esto cambiará todas las condiciones rojas a azul (tratadas)
              </p>
            </>
          )}
        </div>

        {/* Footer con info adicional */}
        {!allTreated && (
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              💡 <span className="font-medium">Tip:</span> Presiona ESC o click fuera para cerrar
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

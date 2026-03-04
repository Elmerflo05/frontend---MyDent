import { ALLOWED_COLORS } from './constants';

interface NewCondition {
  label: string;
  code: string;
  color: string;
  category: string;
  description: string;
  applicableSections: string[];
  price: number;
  treatmentPlanNames: string[];
}

interface AddConditionModalProps {
  isOpen: boolean;
  newCondition: NewCondition;
  toothSections: any[];
  onClose: () => void;
  onConditionChange: (condition: NewCondition) => void;
  onSubmit: () => void;
}

export const AddConditionModal = ({
  isOpen,
  newCondition,
  toothSections,
  onClose,
  onConditionChange,
  onSubmit
}: AddConditionModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Nueva Condición</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={newCondition.label}
              onChange={(e) => onConditionChange({ ...newCondition, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Restauración temporal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código *
            </label>
            <input
              type="text"
              value={newCondition.code}
              onChange={(e) => onConditionChange({ ...newCondition, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: RT"
              maxLength={5}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={newCondition.category}
              onChange={(e) => onConditionChange({ ...newCondition, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Personalizado">Personalizado</option>
              <option value="Estado General">Estado General</option>
              <option value="Prótesis">Prótesis</option>
              <option value="Endodoncia">Endodoncia</option>
              <option value="Periodoncia">Periodoncia</option>
              <option value="Ortodoncia">Ortodoncia</option>
              <option value="Cirugía">Cirugía</option>
              <option value="Especial">Especial</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onConditionChange({ ...newCondition, color: ALLOWED_COLORS.RED })}
                className={`flex-1 h-12 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  newCondition.color === ALLOWED_COLORS.RED
                    ? 'border-gray-900 ring-2 ring-gray-900'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: ALLOWED_COLORS.RED }}
              >
                <span className="text-white font-medium text-sm">Rojo</span>
              </button>
              <button
                type="button"
                onClick={() => onConditionChange({ ...newCondition, color: ALLOWED_COLORS.BLUE })}
                className={`flex-1 h-12 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  newCondition.color === ALLOWED_COLORS.BLUE
                    ? 'border-gray-900 ring-2 ring-gray-900'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: ALLOWED_COLORS.BLUE }}
              >
                <span className="text-white font-medium text-sm">Azul</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={newCondition.description}
              onChange={(e) => onConditionChange({ ...newCondition, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Descripción opcional de la condición"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio (S/)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newCondition.price}
              onChange={(e) => onConditionChange({ ...newCondition, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Precio del tratamiento para esta condición
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secciones Aplicables *
            </label>
            <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              {toothSections.filter(section => section.active).map(section => (
                <label key={section.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCondition.applicableSections.includes(section.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onConditionChange({
                          ...newCondition,
                          applicableSections: [...newCondition.applicableSections, section.id]
                        });
                      } else {
                        onConditionChange({
                          ...newCondition,
                          applicableSections: newCondition.applicableSections.filter(s => s !== section.id)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{section.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Seleccione las secciones del diente donde se puede aplicar esta condición
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Agregar Condición
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, X, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { LaboratoryServiceOption } from '@/types';

interface PriceOptionsManagerProps {
  options: LaboratoryServiceOption[];
  onOptionsChange: (options: LaboratoryServiceOption[]) => void;
  isEnabled: boolean;
}

export const PriceOptionsManager: React.FC<PriceOptionsManagerProps> = ({
  options,
  onOptionsChange,
  isEnabled
}) => {
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [editingOption, setEditingOption] = useState<LaboratoryServiceOption | null>(null);
  const [optionFormData, setOptionFormData] = useState({
    name: '',
    description: '',
    price: '',
    isDefault: false
  });

  const resetOptionForm = () => {
    setOptionFormData({
      name: '',
      description: '',
      price: '',
      isDefault: false
    });
    setEditingOption(null);
  };

  const handleAddOption = () => {
    resetOptionForm();
    setShowOptionModal(true);
  };

  const handleEditOption = (option: LaboratoryServiceOption) => {
    setEditingOption(option);
    setOptionFormData({
      name: option.name,
      description: option.description || '',
      price: option.price.toString(),
      isDefault: option.isDefault || false
    });
    setShowOptionModal(true);
  };

  const handleDeleteOption = (optionId: string) => {
    if (confirm('¿Estás seguro de eliminar esta opción?')) {
      const updatedOptions = options.filter(opt => opt.id !== optionId);
      onOptionsChange(updatedOptions);
      toast.success('Opción eliminada correctamente');
    }
  };

  const handleSaveOption = () => {
    // Validaciones
    if (!optionFormData.name.trim()) {
      toast.error('El nombre de la opción es obligatorio');
      return;
    }

    if (!optionFormData.price || parseFloat(optionFormData.price) <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }

    const optionData: LaboratoryServiceOption = {
      id: editingOption?.id || `opt_${Date.now()}`,
      name: optionFormData.name.trim(),
      description: optionFormData.description.trim() || undefined,
      price: parseFloat(optionFormData.price),
      isDefault: optionFormData.isDefault
    };

    let updatedOptions: LaboratoryServiceOption[];

    if (editingOption) {
      // Editar opción existente
      updatedOptions = options.map(opt =>
        opt.id === editingOption.id ? optionData : opt
      );
      toast.success('Opción actualizada correctamente');
    } else {
      // Agregar nueva opción
      updatedOptions = [...options, optionData];
      toast.success('Opción agregada correctamente');
    }

    onOptionsChange(updatedOptions);
    setShowOptionModal(false);
    resetOptionForm();
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Lista de Opciones */}
      <div className="border border-gray-200 rounded-lg">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-900">
              Opciones Configuradas ({options.length})
            </h4>
          </div>
          <button
            type="button"
            onClick={handleAddOption}
            className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar Opción
          </button>
        </div>

        <div className="p-4">
          {options.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">No hay opciones configuradas</p>
              <p className="text-xs text-gray-400 mt-1">
                Agrega opciones con precios individuales para que los clientes puedan seleccionar
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {options.map((option) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-600" />
                      <span className="font-medium text-gray-900">{option.name}</span>
                      {option.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Por defecto
                        </span>
                      )}
                    </div>
                    {option.description && (
                      <p className="text-sm text-gray-600 mt-1 ml-6">
                        {option.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-teal-600">
                      S/ {option.price.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditOption(option)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOption(option.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          💡 <strong>Nota:</strong> El cliente podrá seleccionar las opciones que necesite
          y el precio se calculará automáticamente.
        </p>
      </div>

      {/* Modal para Agregar/Editar Opción */}
      <AnimatePresence>
        {showOptionModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-600 to-blue-600 p-6 text-white rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">
                    {editingOption ? 'Editar Opción' : 'Agregar Nueva Opción'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowOptionModal(false);
                      resetOptionForm();
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Opción *
                  </label>
                  <input
                    type="text"
                    value={optionFormData.name}
                    onChange={(e) => setOptionFormData({ ...optionFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    placeholder="Ej: Vista frontal completa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={optionFormData.description}
                    onChange={(e) => setOptionFormData({ ...optionFormData, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    placeholder="Describe qué incluye esta opción..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">S/</span>
                    <input
                      type="number"
                      value={optionFormData.price}
                      onChange={(e) => setOptionFormData({ ...optionFormData, price: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={optionFormData.isDefault}
                    onChange={(e) => setOptionFormData({ ...optionFormData, isDefault: e.target.checked })}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <label htmlFor="isDefault" className="text-sm text-gray-700">
                    Marcar por defecto (aparecerá seleccionada al hacer la solicitud)
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowOptionModal(false);
                    resetOptionForm();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveOption}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                >
                  {editingOption ? 'Actualizar' : 'Agregar'} Opción
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

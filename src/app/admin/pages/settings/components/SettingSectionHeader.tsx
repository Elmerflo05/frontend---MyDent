import { Edit, Check, X, Eye } from 'lucide-react';

interface SettingSectionHeaderProps {
  title: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  readOnly?: boolean;
}

export const SettingSectionHeader = ({
  title,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  readOnly = false
}: SettingSectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {readOnly ? (
        <span className="flex items-center gap-2 px-3 py-2 text-gray-500 bg-gray-100 rounded-lg">
          <Eye className="w-4 h-4" />
          Solo lectura
        </span>
      ) : !isEditing ? (
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Edit className="w-4 h-4" />
          Editar
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Check className="w-4 h-4" />
            Guardar
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

import { Trash2, Power, Eye } from 'lucide-react';

interface Specialty {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface SpecialtiesSettingsSectionProps {
  specialties: Specialty[];
  loading: boolean;
  newSpecialty: { name: string; description: string };
  setNewSpecialty: (specialty: { name: string; description: string }) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  readOnly?: boolean;
}

export const SpecialtiesSettingsSection = ({
  specialties,
  loading,
  newSpecialty,
  setNewSpecialty,
  onAdd,
  onDelete,
  onToggle,
  readOnly = false
}: SpecialtiesSettingsSectionProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Gestión de Especialidades</h3>
        {readOnly && (
          <span className="flex items-center gap-2 px-3 py-2 text-gray-500 bg-gray-100 rounded-lg">
            <Eye className="w-4 h-4" />
            Solo lectura
          </span>
        )}
      </div>

      {/* Form to add new specialty - Solo visible si no es readOnly */}
      {!readOnly && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Agregar Nueva Especialidad</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
              <input
                type="text"
                value={newSpecialty.name}
                onChange={(e) => setNewSpecialty({ ...newSpecialty, name: e.target.value })}
                placeholder="Ej: Ortodoncia"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <input
                type="text"
                value={newSpecialty.description}
                onChange={(e) => setNewSpecialty({ ...newSpecialty, description: e.target.value })}
                placeholder="Ej: Tratamiento de alineación dental"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={onAdd}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Agregar Especialidad
          </button>
        </div>
      )}

      {/* List of specialties */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Especialidades Existentes</h4>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando especialidades...</div>
        ) : specialties.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay especialidades registradas</div>
        ) : (
          <div className="space-y-2">
            {specialties.map((specialty) => (
              <div
                key={specialty.id}
                className={`flex items-center justify-between p-4 bg-white border rounded-lg hover:border-gray-300 transition-colors ${
                  specialty.isActive ? 'border-gray-200' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className={`font-medium ${specialty.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                      {specialty.name}
                    </h5>
                    {!specialty.isActive && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                        Inactiva
                      </span>
                    )}
                  </div>
                  {specialty.description && (
                    <p className={`text-sm mt-1 ${specialty.isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                      {specialty.description}
                    </p>
                  )}
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggle(specialty.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        specialty.isActive
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={specialty.isActive ? 'Desactivar' : 'Activar'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(specialty.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

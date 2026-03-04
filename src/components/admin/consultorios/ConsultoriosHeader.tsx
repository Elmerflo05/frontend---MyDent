import { Building2, Plus } from 'lucide-react';

interface ConsultoriosHeaderProps {
  onAddClick: () => void;
}

export const ConsultoriosHeader = ({ onAddClick }: ConsultoriosHeaderProps) => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Consultorios</h1>
              <p className="text-sm text-gray-600">
                Gestión de espacios y ocupación
              </p>
            </div>
          </div>
          <button
            onClick={onAddClick}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Consultorio
          </button>
        </div>
      </div>
    </div>
  );
};

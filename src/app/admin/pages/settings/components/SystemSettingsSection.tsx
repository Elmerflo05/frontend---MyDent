import { Database, Shield, Globe } from 'lucide-react';

export const SystemSettingsSection = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Información del Sistema</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Versión del Sistema</h4>
          <p className="text-sm text-gray-600">v2.1.0</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Última Actualización</h4>
          <p className="text-sm text-gray-600">15 de Enero, 2024</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Base de Datos</h4>
          <p className="text-sm text-gray-600">MySQL 8.0.28</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Servidor</h4>
          <p className="text-sm text-gray-600">Ubuntu 22.04 LTS</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Acciones del Sistema</h4>

        <div className="flex flex-wrap gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Database className="w-4 h-4" />
            Respaldar Base de Datos
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            <Shield className="w-4 h-4" />
            Verificar Integridad
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Globe className="w-4 h-4" />
            Limpiar Caché
          </button>
        </div>
      </div>
    </div>
  );
};

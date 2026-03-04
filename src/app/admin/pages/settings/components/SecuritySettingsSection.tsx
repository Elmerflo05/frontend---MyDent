import { SettingSectionHeader } from './SettingSectionHeader';
import type { SecuritySettings } from '../hooks/useOtherSettings';

interface SecuritySettingsSectionProps {
  settings: SecuritySettings;
  setSettings: (settings: SecuritySettings) => void;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  readOnly?: boolean;
}

export const SecuritySettingsSection = ({
  settings,
  setSettings,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  readOnly = false
}: SecuritySettingsSectionProps) => {
  return (
    <div className="space-y-6">
      <SettingSectionHeader
        title="Configuración de Seguridad"
        isEditing={isEditing}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
        readOnly={readOnly}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Timeout */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tiempo de Inactividad de Sesión (minutos)
          </label>
          <input
            type="number"
            value={settings.sessionTimeout}
            onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 30 })}
            disabled={!isEditing}
            min="5"
            max="1440"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            Cerrar sesión automáticamente después de este tiempo de inactividad (5-1440 minutos)
          </p>
        </div>

        {/* Password Expiry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Caducidad de Contraseña (días)
          </label>
          <input
            type="number"
            value={settings.passwordExpiry}
            onChange={(e) => setSettings({ ...settings, passwordExpiry: parseInt(e.target.value) || 90 })}
            disabled={!isEditing}
            min="30"
            max="365"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            Días hasta que la contraseña debe ser cambiada (30-365 días)
          </p>
        </div>

        {/* Max Login Attempts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Máximo de Intentos de Inicio de Sesión
          </label>
          <input
            type="number"
            value={settings.maxLoginAttempts}
            onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) || 3 })}
            disabled={!isEditing}
            min="3"
            max="10"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            Número de intentos fallidos antes de bloquear la cuenta (3-10 intentos)
          </p>
        </div>

        {/* Audit Log */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-900">Registro de Auditoría</label>
            <p className="text-xs text-gray-500 mt-1">Mantener registro detallado de acciones del sistema</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.auditLog}
              onChange={(e) => setSettings({ ...settings, auditLog: e.target.checked })}
              disabled={!isEditing}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

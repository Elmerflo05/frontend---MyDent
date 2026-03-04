import { useState, useEffect } from 'react';
import { SettingSectionHeader } from './SettingSectionHeader';
import type { AppointmentSettings } from '../hooks/useAppointmentSettings';

interface AppointmentSettingsSectionProps {
  settings: AppointmentSettings;
  setSettings: (settings: AppointmentSettings) => void;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  readOnly?: boolean;
}

export const AppointmentSettingsSection = ({
  settings,
  setSettings,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  readOnly = false
}: AppointmentSettingsSectionProps) => {
  const [showDurationWarning, setShowDurationWarning] = useState(false);

  // Ocultar advertencia cuando se deja de editar
  useEffect(() => {
    if (!isEditing) {
      setShowDurationWarning(false);
    }
  }, [isEditing]);

  const handleRoleToggle = (roleId: number) => {
    const roles = settings.allowedRolesForLongAppointments;
    const newRoles = roles.includes(roleId)
      ? roles.filter(r => r !== roleId)
      : [...roles, roleId];
    setSettings({ ...settings, allowedRolesForLongAppointments: newRoles });
  };

  const handleDefaultDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 15;

    // Si el nuevo valor es mayor al máximo permitido, mostrar advertencia y no actualizar
    if (newValue > settings.maxDurationForRegularUsers) {
      setShowDurationWarning(true);
      return;
    }

    setShowDurationWarning(false);
    setSettings({ ...settings, defaultDuration: newValue });
  };

  const handleMaxDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMaxValue = parseInt(e.target.value) || 15;

    // Si el nuevo máximo es menor que la duración predeterminada actual, ajustar ambos
    if (newMaxValue < settings.defaultDuration) {
      setSettings({
        ...settings,
        maxDurationForRegularUsers: newMaxValue,
        defaultDuration: newMaxValue
      });
    } else {
      setSettings({ ...settings, maxDurationForRegularUsers: newMaxValue });
    }

    setShowDurationWarning(false);
  };

  return (
    <div className="space-y-6">
      <SettingSectionHeader
        title="Configuración de Citas"
        isEditing={isEditing}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
        readOnly={readOnly}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duración Predeterminada (minutos)
          </label>
          <input
            type="number"
            value={settings.defaultDuration}
            onChange={handleDefaultDurationChange}
            disabled={!isEditing}
            min="15"
            max={settings.maxDurationForRegularUsers}
            step="15"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 ${
              showDurationWarning ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {showDurationWarning ? (
            <p className="text-xs text-red-600 mt-1 font-medium">
              No puede ser mayor a la Duración Máxima ({settings.maxDurationForRegularUsers} min)
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">Duración por defecto para nuevas citas</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duración Máxima para Usuarios Regulares (minutos)
          </label>
          <input
            type="number"
            value={settings.maxDurationForRegularUsers}
            onChange={handleMaxDurationChange}
            disabled={!isEditing}
            min="15"
            step="15"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">Duración máxima permitida para usuarios con roles restringidos</p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Roles Permitidos para Citas Largas
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.allowedRolesForLongAppointments.includes(1)}
                onChange={() => handleRoleToggle(1)}
                disabled={!isEditing}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Super Admin</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.allowedRolesForLongAppointments.includes(4)}
                onChange={() => handleRoleToggle(4)}
                disabled={!isEditing}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Recepcionista</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Los roles seleccionados pueden crear citas con duración mayor a la máxima establecida
          </p>
        </div>
      </div>
    </div>
  );
};

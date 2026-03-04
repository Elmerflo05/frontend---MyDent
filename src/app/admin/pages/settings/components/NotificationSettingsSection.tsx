import { SettingSectionHeader } from './SettingSectionHeader';
import type { NotificationSettings } from '../hooks/useOtherSettings';

interface NotificationSettingsSectionProps {
  settings: NotificationSettings;
  setSettings: (settings: NotificationSettings) => void;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  readOnly?: boolean;
}

export const NotificationSettingsSection = ({
  settings,
  setSettings,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  readOnly = false
}: NotificationSettingsSectionProps) => {
  return (
    <div className="space-y-6">
      <SettingSectionHeader
        title="Configuración de Notificaciones"
        isEditing={isEditing}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
        readOnly={readOnly}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-900">Notificaciones por Email</label>
            <p className="text-xs text-gray-500 mt-1">Recibir notificaciones vía correo electrónico</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
              disabled={!isEditing}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
          </label>
        </div>

        {/* Appointment Reminders */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-900">Recordatorios de Citas</label>
            <p className="text-xs text-gray-500 mt-1">Enviar recordatorios automáticos de citas</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.appointmentReminders}
              onChange={(e) => setSettings({ ...settings, appointmentReminders: e.target.checked })}
              disabled={!isEditing}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
          </label>
        </div>

        {/* System Alerts */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-900">Alertas del Sistema</label>
            <p className="text-xs text-gray-500 mt-1">Recibir alertas importantes del sistema</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.systemAlerts}
              onChange={(e) => setSettings({ ...settings, systemAlerts: e.target.checked })}
              disabled={!isEditing}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
          </label>
        </div>

        {/* Reminder Time */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tiempo de Recordatorio (horas antes de la cita)
          </label>
          <input
            type="number"
            value={settings.reminderTime}
            onChange={(e) => setSettings({ ...settings, reminderTime: parseInt(e.target.value) || 24 })}
            disabled={!isEditing}
            min="1"
            max="168"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            Cuántas horas antes de la cita se enviará el recordatorio (1-168 horas)
          </p>
        </div>
      </div>
    </div>
  );
};

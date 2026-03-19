import { SettingSectionHeader } from './SettingSectionHeader';
import type { ContactSettings } from '../hooks/useContactSettings';

interface ContactSettingsSectionProps {
  settings: ContactSettings;
  setSettings: (settings: ContactSettings) => void;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  readOnly?: boolean;
}

export const ContactSettingsSection = ({
  settings,
  setSettings,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  readOnly = false
}: ContactSettingsSectionProps) => {
  return (
    <div className="space-y-6">
      <SettingSectionHeader
        title="Información de Contacto"
        isEditing={isEditing}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
        readOnly={readOnly}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WhatsApp Clínica */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Clínica My Dent</label>
          <p className="text-xs text-gray-500 mb-1">Número sin + ni espacios. Se usa para enlaces wa.me/ en solicitudes de laboratorio y citas.</p>
          <input
            type="text"
            value={settings.whatsappNumber}
            onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
            disabled={!isEditing}
            placeholder="51987654321"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>

        {/* WhatsApp Imagenología / PanoCef */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Centro de Imágenes - PANOCEF</label>
          <p className="text-xs text-gray-500 mb-1">Número sin + ni espacios. Se usa para consultar promociones de estudios radiológicos.</p>
          <input
            type="text"
            value={settings.whatsappImaging}
            onChange={(e) => setSettings({ ...settings, whatsappImaging: e.target.value })}
            disabled={!isEditing}
            placeholder="51987654322"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>

        {/* Emails */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Informativo</label>
          <input
            type="email"
            value={settings.emailInfo}
            onChange={(e) => setSettings({ ...settings, emailInfo: e.target.value })}
            disabled={!isEditing}
            placeholder="info@clinicadental.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email de Citas</label>
          <input
            type="email"
            value={settings.emailAppointments}
            onChange={(e) => setSettings({ ...settings, emailAppointments: e.target.value })}
            disabled={!isEditing}
            placeholder="citas@clinicadental.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email de Soporte</label>
          <input
            type="email"
            value={settings.emailSupport}
            onChange={(e) => setSettings({ ...settings, emailSupport: e.target.value })}
            disabled={!isEditing}
            placeholder="soporte@clinicadental.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>

        {/* Dirección */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Dirección Principal</label>
          <input
            type="text"
            value={settings.addressMain}
            onChange={(e) => setSettings({ ...settings, addressMain: e.target.value })}
            disabled={!isEditing}
            placeholder="Av. Larco 345, Miraflores, Lima"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>

        {/* Redes Sociales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
          <input
            type="url"
            value={settings.facebook}
            onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
            disabled={!isEditing}
            placeholder="https://facebook.com/clinicadental"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
          <input
            type="url"
            value={settings.instagram}
            onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
            disabled={!isEditing}
            placeholder="https://instagram.com/clinicadental"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
          <input
            type="url"
            value={settings.twitter}
            onChange={(e) => setSettings({ ...settings, twitter: e.target.value })}
            disabled={!isEditing}
            placeholder="https://twitter.com/clinicadental"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
};

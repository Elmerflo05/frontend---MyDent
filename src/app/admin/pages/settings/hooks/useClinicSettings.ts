import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAppSettingsStore } from '@/store/appSettingsStore';

export interface ClinicSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  timezone: string;
  currency: string;
  language: string;
}

export const useClinicSettings = () => {
  const { settings, updateSettings } = useAppSettingsStore();
  const [isEditing, setIsEditing] = useState(false);

  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>({
    name: settings?.clinicName || 'Centro Odontológico Dr. Elmer',
    address: settings?.clinicAddress || 'Av. Principal 123, Ciudad, País',
    phone: settings?.clinicPhone || '+1 234 567 8900',
    email: settings?.clinicEmail || 'info@centroodontologico.com',
    website: settings?.clinicWebsite || 'www.centroodontologico.com',
    logo: settings?.clinicLogo || '',
    timezone: settings?.timezone || 'America/Lima',
    currency: settings?.currency || 'PEN',
    language: settings?.language || 'es'
  });

  useEffect(() => {
    if (settings) {
      setClinicSettings({
        name: settings.clinicName,
        address: settings.clinicAddress,
        phone: settings.clinicPhone,
        email: settings.clinicEmail,
        website: settings.clinicWebsite,
        logo: settings.clinicLogo || '',
        timezone: settings.timezone,
        currency: settings.currency,
        language: settings.language
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings({
        clinicName: clinicSettings.name,
        clinicAddress: clinicSettings.address,
        clinicPhone: clinicSettings.phone,
        clinicEmail: clinicSettings.email,
        clinicWebsite: clinicSettings.website,
        clinicLogo: clinicSettings.logo || undefined,
        timezone: clinicSettings.timezone,
        currency: clinicSettings.currency,
        language: clinicSettings.language
      });
      toast.success('Configuración de clínica guardada exitosamente');
      setIsEditing(false);
    } catch (error) {
      toast.error('Error al guardar la configuración de clínica');
    }
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    // Revertir a los valores del store
    if (settings) {
      setClinicSettings({
        name: settings.clinicName,
        address: settings.clinicAddress,
        phone: settings.clinicPhone,
        email: settings.clinicEmail,
        website: settings.clinicWebsite,
        logo: settings.clinicLogo || '',
        timezone: settings.timezone,
        currency: settings.currency,
        language: settings.language
      });
    }
    setIsEditing(false);
  };

  return {
    clinicSettings,
    setClinicSettings,
    isEditing,
    handleSave,
    handleEdit,
    handleCancel
  };
};

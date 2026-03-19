import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAppSettingsStore } from '@/store/appSettingsStore';

export interface ContactSettings {
  whatsappNumber: string;
  whatsappImaging: string;
  emailInfo: string;
  emailAppointments: string;
  emailSupport: string;
  addressMain: string;
  facebook: string;
  instagram: string;
  twitter: string;
}

export const useContactSettings = () => {
  const { settings, updateSettings } = useAppSettingsStore();
  const [isEditing, setIsEditing] = useState(false);

  const [contactSettings, setContactSettings] = useState<ContactSettings>({
    whatsappNumber: settings?.whatsappNumber || '51987654321',
    whatsappImaging: settings?.whatsappImaging || '51987654322',
    emailInfo: settings?.emailInfo || 'info@clinicadental.com',
    emailAppointments: settings?.emailAppointments || 'citas@clinicadental.com',
    emailSupport: settings?.emailSupport || 'soporte@clinicadental.com',
    addressMain: settings?.addressMain || 'Av. Larco 345, Miraflores, Lima',
    facebook: settings?.facebook || 'https://facebook.com/clinicadental',
    instagram: settings?.instagram || 'https://instagram.com/clinicadental',
    twitter: settings?.twitter || 'https://twitter.com/clinicadental'
  });

  useEffect(() => {
    if (settings) {
      setContactSettings({
        whatsappNumber: settings.whatsappNumber,
        whatsappImaging: settings.whatsappImaging || '51987654322',
        emailInfo: settings.emailInfo,
        emailAppointments: settings.emailAppointments,
        emailSupport: settings.emailSupport,
        addressMain: settings.addressMain,
        facebook: settings.facebook || '',
        instagram: settings.instagram || '',
        twitter: settings.twitter || ''
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings({
        whatsappNumber: contactSettings.whatsappNumber,
        whatsappImaging: contactSettings.whatsappImaging,
        emailInfo: contactSettings.emailInfo,
        emailAppointments: contactSettings.emailAppointments,
        emailSupport: contactSettings.emailSupport,
        addressMain: contactSettings.addressMain,
        facebook: contactSettings.facebook || undefined,
        instagram: contactSettings.instagram || undefined,
        twitter: contactSettings.twitter || undefined
      });
      toast.success('Configuración de contacto guardada exitosamente');
      setIsEditing(false);
    } catch (error) {
      toast.error('Error al guardar la configuración de contacto');
    }
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    // Revertir a los valores del store
    if (settings) {
      setContactSettings({
        whatsappNumber: settings.whatsappNumber,
        whatsappImaging: settings.whatsappImaging || '51987654322',
        emailInfo: settings.emailInfo,
        emailAppointments: settings.emailAppointments,
        emailSupport: settings.emailSupport,
        addressMain: settings.addressMain,
        facebook: settings.facebook || '',
        instagram: settings.instagram || '',
        twitter: settings.twitter || ''
      });
    }
    setIsEditing(false);
  };

  return {
    contactSettings,
    setContactSettings,
    isEditing,
    handleSave,
    handleEdit,
    handleCancel
  };
};

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAppSettingsStore } from '@/store/appSettingsStore';

export interface ContactSettings {
  whatsappNumber: string;
  whatsappDisplay: string;
  whatsappImaging: string;
  whatsappImagingDisplay: string;
  phoneMain: string;
  phoneEmergency: string;
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
    whatsappDisplay: settings?.whatsappDisplay || '+51 987 654 321',
    whatsappImaging: settings?.whatsappImaging || '51987654322',
    whatsappImagingDisplay: settings?.whatsappImagingDisplay || '+51 987 654 322',
    phoneMain: settings?.phoneMain || '+51 01 234 5678',
    phoneEmergency: settings?.phoneEmergency || '+51 987 654 321',
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
        whatsappDisplay: settings.whatsappDisplay,
        whatsappImaging: settings.whatsappImaging || '51987654322',
        whatsappImagingDisplay: settings.whatsappImagingDisplay || '+51 987 654 322',
        phoneMain: settings.phoneMain,
        phoneEmergency: settings.phoneEmergency,
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
        whatsappDisplay: contactSettings.whatsappDisplay,
        whatsappImaging: contactSettings.whatsappImaging,
        whatsappImagingDisplay: contactSettings.whatsappImagingDisplay,
        phoneMain: contactSettings.phoneMain,
        phoneEmergency: contactSettings.phoneEmergency,
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
        whatsappDisplay: settings.whatsappDisplay,
        whatsappImaging: settings.whatsappImaging || '51987654322',
        whatsappImagingDisplay: settings.whatsappImagingDisplay || '+51 987 654 322',
        phoneMain: settings.phoneMain,
        phoneEmergency: settings.phoneEmergency,
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

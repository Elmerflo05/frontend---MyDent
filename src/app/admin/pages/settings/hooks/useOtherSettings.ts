import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAppSettingsStore } from '@/store/appSettingsStore';

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  reminderTime: number;
  systemAlerts: boolean;
}

export interface SecuritySettings {
  sessionTimeout: number;
  passwordExpiry: number;
  maxLoginAttempts: number;
  auditLog: boolean;
}

export const useNotificationSettings = () => {
  const { settings, updateSettings } = useAppSettingsStore();
  const [isEditing, setIsEditing] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: settings?.emailNotifications ?? true,
    smsNotifications: settings?.smsNotifications ?? false,
    appointmentReminders: settings?.appointmentReminders ?? true,
    reminderTime: settings?.reminderTime || 24,
    systemAlerts: settings?.systemAlerts ?? true
  });

  useEffect(() => {
    if (settings) {
      setNotificationSettings({
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
        appointmentReminders: settings.appointmentReminders,
        reminderTime: settings.reminderTime,
        systemAlerts: settings.systemAlerts
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings({
        emailNotifications: notificationSettings.emailNotifications,
        smsNotifications: notificationSettings.smsNotifications,
        appointmentReminders: notificationSettings.appointmentReminders,
        reminderTime: notificationSettings.reminderTime,
        systemAlerts: notificationSettings.systemAlerts
      });
      toast.success('Configuración de notificaciones guardada exitosamente');
      setIsEditing(false);
    } catch (error) {
      toast.error('Error al guardar la configuración de notificaciones');
    }
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    // Revertir a los valores del store
    if (settings) {
      setNotificationSettings({
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
        appointmentReminders: settings.appointmentReminders,
        reminderTime: settings.reminderTime,
        systemAlerts: settings.systemAlerts
      });
    }
    setIsEditing(false);
  };

  return {
    notificationSettings,
    setNotificationSettings,
    isEditing,
    handleSave,
    handleEdit,
    handleCancel
  };
};

export const useSecuritySettings = () => {
  const { settings, updateSettings } = useAppSettingsStore();
  const [isEditing, setIsEditing] = useState(false);

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    sessionTimeout: settings?.sessionTimeout || 30,
    passwordExpiry: settings?.passwordExpiry || 90,
    maxLoginAttempts: settings?.maxLoginAttempts || 3,
    auditLog: settings?.auditLog ?? true
  });

  useEffect(() => {
    if (settings) {
      setSecuritySettings({
        sessionTimeout: settings.sessionTimeout,
        passwordExpiry: settings.passwordExpiry,
        maxLoginAttempts: settings.maxLoginAttempts,
        auditLog: settings.auditLog
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings({
        sessionTimeout: securitySettings.sessionTimeout,
        passwordExpiry: securitySettings.passwordExpiry,
        maxLoginAttempts: securitySettings.maxLoginAttempts,
        auditLog: securitySettings.auditLog
      });
      toast.success('Configuración de seguridad guardada exitosamente');
      setIsEditing(false);
    } catch (error) {
      toast.error('Error al guardar la configuración de seguridad');
    }
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    // Revertir a los valores del store
    if (settings) {
      setSecuritySettings({
        sessionTimeout: settings.sessionTimeout,
        passwordExpiry: settings.passwordExpiry,
        maxLoginAttempts: settings.maxLoginAttempts,
        auditLog: settings.auditLog
      });
    }
    setIsEditing(false);
  };

  return {
    securitySettings,
    setSecuritySettings,
    isEditing,
    handleSave,
    handleEdit,
    handleCancel
  };
};

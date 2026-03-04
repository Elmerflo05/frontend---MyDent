import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getAppointmentConfig, updateAppointmentConfig } from '@/services/appointmentConfigService';

export interface AppointmentSettings {
  maxDurationForRegularUsers: number;
  defaultDuration: number;
  allowedRolesForLongAppointments: number[];
}

export const useAppointmentSettings = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [appointmentSettings, setAppointmentSettings] = useState<AppointmentSettings>({
    maxDurationForRegularUsers: 30,
    defaultDuration: 30,
    allowedRolesForLongAppointments: [] // Restrictivo por defecto: nadie tiene permiso hasta que cargue la config real
  });

  // Cargar configuración desde el backend al montar
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Verificar que haya token antes de intentar cargar
        const token = localStorage.getItem('dental_clinic_token');
        if (!token) {
          console.warn('No hay token de autenticación. No se puede cargar configuración.');
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        const config = await getAppointmentConfig();
        setAppointmentSettings(config);
      } catch (error) {
        console.error('Error al cargar configuración de citas:', error);
        toast.error('Error al cargar la configuración de citas');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      // Verificar que haya token antes de intentar guardar
      const token = localStorage.getItem('dental_clinic_token');
      if (!token) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
        return;
      }

      // Validar que la duración predeterminada no sea mayor a la duración máxima para usuarios regulares
      if (appointmentSettings.defaultDuration > appointmentSettings.maxDurationForRegularUsers) {
        toast.error('La Duración Predeterminada no puede ser mayor a la Duración Máxima para Usuarios Regulares');
        return;
      }

      await updateAppointmentConfig(appointmentSettings);
      toast.success('Configuración de citas guardada exitosamente');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error al guardar configuración:', error);

      // Manejo específico de errores
      if (error.message && error.message.includes('token')) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
      } else if (error.message && error.message.includes('permisos')) {
        toast.error('No tiene permisos para modificar la configuración. Solo super_admin puede realizar esta acción.');
      } else {
        const errorMessage = error.message || 'Error al guardar la configuración de citas';
        toast.error(errorMessage);
      }
    }
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    // Recargar configuración para deshacer cambios
    getAppointmentConfig().then(setAppointmentSettings).catch(console.error);
  };

  return {
    appointmentSettings,
    setAppointmentSettings,
    isEditing,
    isLoading,
    handleSave,
    handleEdit,
    handleCancel
  };
};

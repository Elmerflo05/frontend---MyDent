import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import type { AppointmentSettings } from '@/types';
import { getAppointmentConfig } from '@/services/appointmentConfigService';

/**
 * Hook para gestionar la duración de citas con validación de roles
 *
 * Solo RECEPCIONISTA y super_admin pueden crear citas con duración mayor
 * a la configurada en maxDurationForRegularUsers
 *
 * Implementa Single Responsibility Principle (SRP) - Solo maneja lógica de duración de citas
 *
 * MIGRADO: Ahora obtiene la configuración desde el backend vía API
 */
// Mapeo de role slug del frontend a role_id de la BD
const ROLE_NAME_TO_ID: Record<string, number> = {
  'super_admin': 1, 'admin': 2, 'doctor': 3, 'receptionist': 4,
  'imaging_technician': 5, 'patient': 6, 'external_client': 7
};

export const useAppointmentDuration = () => {
  const { user } = useAuth();
  const [appointmentSettings, setAppointmentSettings] = useState<AppointmentSettings>({
    maxDurationForRegularUsers: 30,
    defaultDuration: 30,
    allowedRolesForLongAppointments: [] // Restrictivo por defecto: nadie tiene permiso hasta que cargue la config real
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar configuración desde el backend
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Verificar que haya token antes de intentar cargar
        const token = localStorage.getItem('dental_clinic_token');
        if (!token) {
          console.warn('No hay token de autenticación. Usando configuración por defecto.');
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        const config = await getAppointmentConfig();
        setAppointmentSettings(config);
        setError(null);
      } catch (err) {
        console.error('Error al cargar configuración de citas:', err);
        setError('Error al cargar configuración');
        // Mantener valores por defecto en caso de error
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadConfig();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const {
    maxDurationForRegularUsers,
    defaultDuration,
    allowedRolesForLongAppointments
  } = appointmentSettings;

  // Verificar si el usuario actual puede crear citas largas
  const canCreateLongAppointments = (): boolean => {
    if (!user) return false;
    const userRoleId = ROLE_NAME_TO_ID[user.role];
    if (!userRoleId) return false;
    return allowedRolesForLongAppointments.includes(userRoleId);
  };

  // Validar si una duración específica es permitida para el usuario actual
  const isDurationAllowed = (durationInMinutes: number): boolean => {
    if (durationInMinutes <= 0) return false;

    // Si puede crear citas largas, puede ir hasta maxDurationForRegularUsers
    if (canCreateLongAppointments()) {
      return durationInMinutes <= maxDurationForRegularUsers;
    }

    // Si no puede crear citas largas, solo puede usar duraciones <= defaultDuration
    return durationInMinutes <= defaultDuration;
  };

  // Obtener la duración máxima permitida para el usuario actual
  const getMaxAllowedDuration = (): number => {
    if (canCreateLongAppointments()) {
      return maxDurationForRegularUsers;
    }
    return defaultDuration;
  };

  // Obtener mensaje de error si la duración no es permitida
  const getValidationMessage = (durationInMinutes: number): string | null => {
    if (!isDurationAllowed(durationInMinutes)) {
      const maxAllowed = getMaxAllowedDuration();
      if (canCreateLongAppointments()) {
        return `La duración máxima permitida es ${maxDurationForRegularUsers} minutos. Duración solicitada: ${durationInMinutes} minutos.`;
      }
      return `La duración máxima para su rol es ${defaultDuration} minutos. Solicite permisos para crear citas más largas. Duración solicitada: ${durationInMinutes} minutos.`;
    }
    return null;
  };

  // Obtener opciones de duración disponibles para el usuario
  const getAvailableDurations = (): { value: number; label: string }[] => {
    const baseDurations = [
      { value: 15, label: '15 minutos' },
      { value: 30, label: '30 minutos' },
      { value: 45, label: '45 minutos' },
      { value: 60, label: '1 hora' },
      { value: 90, label: '1.5 horas' },
      { value: 120, label: '2 horas' },
      { value: 150, label: '2.5 horas' },
      { value: 180, label: '3 horas' }
    ];

    // Roles con permiso de citas largas: hasta maxDurationForRegularUsers
    if (canCreateLongAppointments()) {
      return baseDurations.filter(d => d.value <= maxDurationForRegularUsers);
    }

    // Usuarios regulares: hasta defaultDuration
    return baseDurations.filter(d => d.value <= defaultDuration);
  };

  return {
    // Estado
    canCreateLongAppointments: canCreateLongAppointments(),
    maxAllowedDuration: getMaxAllowedDuration(),
    defaultDuration,
    maxDurationForRegularUsers,

    // Métodos de validación
    isDurationAllowed,
    getValidationMessage,
    getAvailableDurations,

    // Configuración completa (para debugging o uso avanzado)
    appointmentSettings,

    // Estado de carga
    isLoading,
    error
  };
};

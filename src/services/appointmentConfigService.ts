/**
 * Servicio para Configuración de Citas (Frontend)
 * Conecta con el backend para gestionar la configuración de duración de citas
 *
 * @module services/appointmentConfigService
 */

import type { AppointmentSettings } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4015/api';

/**
 * Helper para obtener el token de autenticación
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('dental_clinic_token');
};

/**
 * Helper para hacer peticiones autenticadas
 */
const fetchAuth = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Manejo específico de códigos de error HTTP
    if (response.status === 401) {
      throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
    }

    if (response.status === 403) {
      throw new Error(errorData.message || 'No tiene permisos para realizar esta acción.');
    }

    throw new Error(errorData.message || `Error HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export interface AppointmentConfigResponse {
  success: boolean;
  data: AppointmentSettings;
  message?: string;
}

export interface ValidationResponse {
  success: boolean;
  data: {
    isValid: boolean;
    message?: string;
    maxAllowed?: number;
  };
}

export interface CanOverrideResponse {
  success: boolean;
  data: {
    canOverride: boolean;
    userRole: number;
  };
}

/**
 * Obtiene la configuración GLOBAL de duración de citas
 * Esta configuración aplica a TODAS las sedes del sistema
 * @returns Configuración de citas
 */
export const getAppointmentConfig = async (): Promise<AppointmentSettings> => {
  try {
    const response: AppointmentConfigResponse = await fetchAuth('/appointment-config');

    if (!response.success) {
      throw new Error(response.message || 'Error al obtener configuración');
    }

    return response.data;
  } catch (error) {
    console.error('Error al obtener configuración de citas:', error);
    throw error;
  }
};

/**
 * Actualiza la configuración GLOBAL de duración de citas
 * Esta configuración aplica a TODAS las sedes del sistema
 * Solo SUPER_ADMIN puede ejecutar esta acción
 *
 * @param config - Nueva configuración
 * @returns Configuración actualizada
 */
export const updateAppointmentConfig = async (
  config: AppointmentSettings
): Promise<AppointmentSettings> => {
  try {
    const response: AppointmentConfigResponse = await fetchAuth('/appointment-config', {
      method: 'PUT',
      body: JSON.stringify(config)
    });

    if (!response.success) {
      throw new Error(response.message || 'Error al actualizar configuración');
    }

    return response.data;
  } catch (error: any) {
    console.error('Error al actualizar configuración de citas:', error);
    throw error;
  }
};

/**
 * Valida si una duración específica es permitida para el usuario actual
 *
 * @param durationMinutes - Duración en minutos a validar
 * @returns Resultado de la validación
 */
export const validateDuration = async (
  durationMinutes: number
): Promise<{ isValid: boolean; message?: string; maxAllowed?: number }> => {
  try {
    const response: ValidationResponse = await fetchAuth('/appointment-config/validate-duration', {
      method: 'POST',
      body: JSON.stringify({ durationMinutes })
    });

    if (!response.success) {
      throw new Error('Error al validar duración');
    }

    return response.data;
  } catch (error) {
    console.error('Error al validar duración:', error);
    throw error;
  }
};

/**
 * Verifica si el usuario actual puede crear citas con duración extendida
 *
 * @returns True si puede crear citas largas
 */
export const canUserOverrideDuration = async (): Promise<boolean> => {
  try {
    const response: CanOverrideResponse = await fetchAuth('/appointment-config/can-override');

    if (!response.success) {
      throw new Error('Error al verificar permisos');
    }

    return response.data.canOverride;
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    return false;
  }
};

/**
 * Hook personalizado para usar la configuración de citas con React Query
 * Proporciona caché automático y revalidación
 */
export const useAppointmentConfigQuery = () => {
  // Este hook se implementará con React Query en el siguiente paso
  // Por ahora, dejamos la estructura preparada
  return {
    data: null,
    isLoading: true,
    error: null,
    refetch: () => {}
  };
};

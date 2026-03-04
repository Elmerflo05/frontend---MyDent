// ============================================================================
// HEALTH PLAN SETTINGS SERVICE - Gestión de Configuración Global
// ============================================================================

import httpClient from '@/services/api/httpClient';
import type { HealthPlanSettings } from '@/types/healthPlans';

/**
 * Servicio para gestión de configuración global del sistema de planes de salud
 * SRP: Solo maneja las configuraciones del sistema (días de gracia, recordatorios, etc)
 *
 * Integrado con el backend real a través de /api/health-plan-settings
 */
export class HealthPlanSettingsService {
  private readonly API_ENDPOINT = '/health-plan-settings';

  /**
   * Obtener la configuración actual desde el backend
   */
  async getSettings(): Promise<HealthPlanSettings> {
    try {
      const response = await httpClient.get<HealthPlanSettings>(this.API_ENDPOINT);

      if (!response.success || !response.data) {
        throw new Error('Error al obtener la configuración de planes de salud');
      }

      // Convertir updatedAt a objeto Date si es string
      if (typeof response.data.updatedAt === 'string') {
        response.data.updatedAt = new Date(response.data.updatedAt);
      }

      return response.data;
    } catch (error) {
      console.error('Error al obtener configuración de planes de salud:', error);
      throw error;
    }
  }

  /**
   * Actualizar configuración (SuperAdmin)
   */
  async updateSettings(
    updates: Partial<Omit<HealthPlanSettings, 'id'>>,
    updatedBy: string
  ): Promise<HealthPlanSettings> {
    try {
      const response = await httpClient.put<HealthPlanSettings>(
        this.API_ENDPOINT,
        updates
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Error al actualizar la configuración');
      }

      // Convertir updatedAt a objeto Date si es string
      if (typeof response.data.updatedAt === 'string') {
        response.data.updatedAt = new Date(response.data.updatedAt);
      }

      return response.data;
    } catch (error) {
      console.error('Error al actualizar configuración de planes de salud:', error);
      throw error;
    }
  }

  /**
   * Actualizar días de gracia
   */
  async setGraceDays(days: number, updatedBy: string): Promise<void> {
    if (days < 0 || days > 30) {
      throw new Error('Los días de gracia deben estar entre 0 y 30');
    }

    await this.updateSettings({ graceDays: days }, updatedBy);
  }

  /**
   * Actualizar días de recordatorio
   */
  async setReminderDays(days: number[], updatedBy: string): Promise<void> {
    if (!days.every(d => d > 0 && d <= 30)) {
      throw new Error('Los días de recordatorio deben estar entre 1 y 30');
    }

    // Ordenar de mayor a menor
    const sortedDays = days.sort((a, b) => b - a);

    await this.updateSettings({ reminderDaysBefore: sortedDays }, updatedBy);
  }

  /**
   * Activar/desactivar notificaciones por email
   */
  async setEmailNotifications(enabled: boolean, updatedBy: string): Promise<void> {
    await this.updateSettings({ enableEmailNotifications: enabled }, updatedBy);
  }

  /**
   * Activar/desactivar notificaciones in-app
   */
  async setInAppNotifications(enabled: boolean, updatedBy: string): Promise<void> {
    await this.updateSettings({ enableInAppNotifications: enabled }, updatedBy);
  }

  /**
   * Requerir voucher para todos los pagos
   */
  async setVoucherRequired(required: boolean, updatedBy: string): Promise<void> {
    await this.updateSettings({ voucherRequired: required }, updatedBy);
  }

  /**
   * Obtener días de gracia actuales
   */
  async getGraceDays(): Promise<number> {
    const settings = await this.getSettings();
    return settings.graceDays;
  }

  /**
   * Obtener días de recordatorio actuales
   */
  async getReminderDays(): Promise<number[]> {
    const settings = await this.getSettings();
    return settings.reminderDaysBefore;
  }
}

// Exportar instancia singleton
export const healthPlanSettingsService = new HealthPlanSettingsService();

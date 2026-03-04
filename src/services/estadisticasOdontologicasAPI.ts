/**
 * Servicio de Estadísticas Odontológicas usando API REAL (PostgreSQL)
 * Usa el endpoint /api/statistics del backend
 */

import type { SedeEstadisticas } from '@/types';
import httpClient from '@/services/api/httpClient';

export interface RecentActivity {
  type: 'new_patient' | 'appointment' | 'payment';
  id: number;
  description: string;
  createdAt: string;
}

/**
 * Servicio para obtener estadísticas odontológicas REALES desde PostgreSQL
 */
export class EstadisticasOdontologicasAPIService {

  /**
   * Calcula estadísticas globales usando el endpoint del backend
   */
  static async calcularEstadisticasGlobales(): Promise<SedeEstadisticas & { totalSedes: number }> {
    try {
      console.log('[EstadisticasAPI] Obteniendo estadísticas globales...');
      const response = await httpClient.get('/statistics/global');
      console.log('[EstadisticasAPI] Respuesta:', response);

      if (response.success && response.data) {
        const data = response.data;
        return {
          totalSedes: data.totalBranches || 0,
          totalPacientes: data.totalPatients || 0,
          totalDoctores: data.totalDoctors || 0,
          totalPersonal: data.totalStaff || 0,
          citasDelDia: data.appointmentsToday || 0,
          ingresosMes: data.monthlyRevenue || 0
        };
      }

      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      console.error('[EstadisticasAPI] Error al obtener estadísticas globales:', error);
      return {
        totalSedes: 0,
        totalPacientes: 0,
        totalDoctores: 0,
        totalPersonal: 0,
        citasDelDia: 0,
        ingresosMes: 0
      };
    }
  }

  /**
   * Calcula estadísticas para una sede específica
   */
  static async calcularEstadisticasSede(sedeId: string | null): Promise<SedeEstadisticas> {
    try {
      // Si no hay sedeId, retornar estadísticas globales
      if (!sedeId) {
        const globales = await this.calcularEstadisticasGlobales();
        return {
          totalPacientes: globales.totalPacientes,
          totalDoctores: globales.totalDoctores,
          totalPersonal: globales.totalPersonal,
          citasDelDia: globales.citasDelDia,
          ingresosMes: globales.ingresosMes
        };
      }

      console.log(`[EstadisticasAPI] Obteniendo estadísticas de sede ${sedeId}...`);
      const response = await httpClient.get(`/statistics/branch/${sedeId}`);
      console.log('[EstadisticasAPI] Respuesta sede:', response);

      if (response.success && response.data) {
        const data = response.data;
        return {
          totalPacientes: data.totalPatients || 0,
          totalDoctores: data.totalDoctors || 0,
          totalPersonal: data.totalStaff || 0,
          citasDelDia: data.appointmentsToday || 0,
          ingresosMes: data.monthlyRevenue || 0
        };
      }

      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      console.error('[EstadisticasAPI] Error al obtener estadísticas de sede:', error);
      return {
        totalPacientes: 0,
        totalDoctores: 0,
        totalPersonal: 0,
        citasDelDia: 0,
        ingresosMes: 0
      };
    }
  }

  /**
   * Obtiene la actividad reciente del sistema
   */
  static async obtenerActividadReciente(limit: number = 10): Promise<RecentActivity[]> {
    try {
      console.log('[EstadisticasAPI] Obteniendo actividad reciente...');
      const response = await httpClient.get(`/statistics/activity?limit=${limit}`);
      console.log('[EstadisticasAPI] Actividad:', response);

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('[EstadisticasAPI] Error al obtener actividad reciente:', error);
      return [];
    }
  }
}

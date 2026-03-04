/**
 * API Service para Estadísticas
 * Obtiene estadísticas agregadas del sistema desde el backend
 */

import httpClient from './httpClient';

export interface GlobalStatistics {
  totalBranches: number;
  totalPatients: number;
  totalDoctors: number;
  totalStaff: number;
  appointmentsToday: number;
  monthlyRevenue: number;
}

export interface BranchStatistics {
  branch_id: number;
  totalPatients: number;
  totalDoctors: number;
  totalStaff: number;
  appointmentsToday: number;
  monthlyRevenue: number;
}

interface StatisticsResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class StatisticsApiService {
  /**
   * Obtiene estadísticas globales del sistema
   */
  async getGlobalStatistics(): Promise<GlobalStatistics> {
    try {
      const response = await httpClient.get<StatisticsResponse<GlobalStatistics>>('/statistics/global');

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Error al obtener estadísticas globales');
    } catch (error) {

      // Retornar valores por defecto en caso de error
      return {
        totalBranches: 0,
        totalPatients: 0,
        totalDoctors: 0,
        totalStaff: 0,
        appointmentsToday: 0,
        monthlyRevenue: 0
      };
    }
  }

  /**
   * Obtiene estadísticas de una sede específica
   */
  async getBranchStatistics(branchId: number): Promise<BranchStatistics> {
    try {
      const response = await httpClient.get<StatisticsResponse<BranchStatistics>>(`/statistics/branch/${branchId}`);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Error al obtener estadísticas de sede');
    } catch (error) {

      // Retornar valores por defecto en caso de error
      return {
        branch_id: branchId,
        totalPatients: 0,
        totalDoctors: 0,
        totalStaff: 0,
        appointmentsToday: 0,
        monthlyRevenue: 0
      };
    }
  }

  /**
   * Obtiene estadísticas de todas las sedes
   */
  async getAllBranchesStatistics(): Promise<Record<number, BranchStatistics>> {
    try {
      const response = await httpClient.get<StatisticsResponse<Record<number, BranchStatistics>>>('/statistics/branches');

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Error al obtener estadísticas de sedes');
    } catch (error) {

      // Retornar objeto vacío en caso de error
      return {};
    }
  }
}

// Exportar instancia singleton
export const statisticsApi = new StatisticsApiService();
export default statisticsApi;

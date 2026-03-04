// ============================================================================
// ESTADISTICAS CONSULTORIOS SERVICE - Estadísticas de consultorios
// ============================================================================
// Conectado con el backend: /api/reports/consultorios/*

import httpClient from './api/httpClient';

export interface EstadisticasConsultorio {
  consultorioId: string;
  nombre: string;
  totalCitas: number;
  citasCompletadas: number;
  citasCanceladas: number;
  citasPendientes: number;
  ocupacionPorcentaje: number;
  citasPorMes: { mes: string; cantidad: number }[];
  estadoCitas: { estado: string; cantidad: number }[];
}

export interface ResumenConsultorios {
  totalConsultorios: number;
  totalCitas: number;
  totalCompletadas: number;
  totalCanceladas: number;
  ocupacionPromedio: number;
  consultorioMasOcupado: string;
}

interface ReportsApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Servicio de estadísticas de consultorios
 * Conectado con el backend real
 */
export class EstadisticasConsultoriosService {
  /**
   * Calcula estadísticas completas de todos los consultorios
   */
  static async calcularEstadisticasConsultorios(
    sedeId: string | null = null,
    fechaInicio?: Date,
    fechaFin?: Date
  ): Promise<EstadisticasConsultorio[]> {
    try {
      const params = new URLSearchParams();
      if (sedeId && sedeId !== 'all') {
        params.append('branchId', sedeId);
      } else {
        params.append('branchId', 'all');
      }
      if (fechaInicio) {
        params.append('fechaInicio', fechaInicio.toISOString());
      }
      if (fechaFin) {
        params.append('fechaFin', fechaFin.toISOString());
      }

      const response = await httpClient.get<ReportsApiResponse<EstadisticasConsultorio[]>>(
        `/reports/consultorios/estadisticas?${params.toString()}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Error en calcularEstadisticasConsultorios:', error);
      return [];
    }
  }

  /**
   * Obtiene el consultorio más ocupado
   */
  static async getConsultorioMasOcupado(
    sedeId: string | null = null
  ): Promise<EstadisticasConsultorio | null> {
    try {
      const estadisticas = await this.calcularEstadisticasConsultorios(sedeId);

      if (estadisticas.length === 0) {
        return null;
      }

      // Encontrar el consultorio con mayor ocupación
      return estadisticas.reduce((max, current) =>
        current.ocupacionPorcentaje > max.ocupacionPorcentaje ? current : max
      );
    } catch (error) {
      console.error('Error en getConsultorioMasOcupado:', error);
      return null;
    }
  }

  /**
   * Obtiene estadísticas resumidas de todos los consultorios
   */
  static async getResumenConsultorios(sedeId: string | null = null): Promise<ResumenConsultorios> {
    try {
      const params = new URLSearchParams();
      if (sedeId && sedeId !== 'all') {
        params.append('branchId', sedeId);
      } else {
        params.append('branchId', 'all');
      }

      const response = await httpClient.get<ReportsApiResponse<ResumenConsultorios>>(
        `/reports/consultorios/resumen?${params.toString()}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return {
        totalConsultorios: 0,
        totalCitas: 0,
        totalCompletadas: 0,
        totalCanceladas: 0,
        ocupacionPromedio: 0,
        consultorioMasOcupado: 'N/A'
      };
    } catch (error) {
      console.error('Error en getResumenConsultorios:', error);
      return {
        totalConsultorios: 0,
        totalCitas: 0,
        totalCompletadas: 0,
        totalCanceladas: 0,
        ocupacionPromedio: 0,
        consultorioMasOcupado: 'N/A'
      };
    }
  }
}

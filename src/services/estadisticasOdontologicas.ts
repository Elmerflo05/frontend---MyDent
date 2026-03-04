// ============================================================================
// ESTADISTICAS ODONTOLOGICAS SERVICE - Estadísticas de servicios odontológicos
// ============================================================================
// Conectado con el backend: /api/reports/*

import httpClient from './api/httpClient';
import type { SedeEstadisticas } from '@/types';

// Interfaces para los reportes
export interface ReportePorConsultorio {
  consultorio: string;
  totalCitas: number;
  citasCompletadas: number;
  citasCanceladas: number;
  ingresosBruto: number;
  duracionPromedio: number;
  tasaOcupacion: number;
}

export interface ReportePorEspecialidad {
  especialidad: string;
  totalCitas: number;
  citasCompletadas: number;
  ingresosBruto: number;
  doctores: number;
  precioPromedio: number;
}

export interface ReportePorDoctor {
  doctorId: string;
  nombreCompleto: string;
  especialidades: string[];
  totalCitas: number;
  citasCompletadas: number;
  citasCanceladas: number;
  ingresosBruto: number;
  promedioIngresoPorCita: number;
  tasaCompletacion: number;
}

interface ReportsApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Servicio para calcular estadísticas odontológicas
 * Conectado con el backend real
 */
export class EstadisticasOdontologicasService {

  /**
   * Calcula estadísticas odontológicas para una sede específica
   */
  static async calcularEstadisticasSede(sedeId: string | null): Promise<SedeEstadisticas> {
    try {
      const endpoint = sedeId
        ? `/statistics/branch/${sedeId}`
        : '/statistics/global';

      const response = await httpClient.get<ReportsApiResponse<any>>(endpoint);

      if (response.success && response.data) {
        return {
          totalPacientes: response.data.totalPatients || 0,
          totalDoctores: response.data.totalDoctors || 0,
          totalPersonal: response.data.totalStaff || 0,
          citasDelDia: response.data.appointmentsToday || 0,
          ingresosMes: response.data.monthlyRevenue || 0
        };
      }

      return {
        totalPacientes: 0,
        totalDoctores: 0,
        totalPersonal: 0,
        citasDelDia: 0,
        ingresosMes: 0
      };
    } catch (error) {
      console.error('Error en calcularEstadisticasSede:', error);
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
   * Calcula estadísticas globales sumando todas las sedes activas
   */
  static async calcularEstadisticasGlobales(): Promise<SedeEstadisticas & { totalSedes: number }> {
    try {
      const response = await httpClient.get<ReportsApiResponse<any>>('/statistics/global');

      if (response.success && response.data) {
        return {
          totalSedes: response.data.totalBranches || 0,
          totalPacientes: response.data.totalPatients || 0,
          totalDoctores: response.data.totalDoctors || 0,
          totalPersonal: response.data.totalStaff || 0,
          citasDelDia: response.data.appointmentsToday || 0,
          ingresosMes: response.data.monthlyRevenue || 0
        };
      }

      return {
        totalSedes: 0,
        totalPacientes: 0,
        totalDoctores: 0,
        totalPersonal: 0,
        citasDelDia: 0,
        ingresosMes: 0
      };
    } catch (error) {
      console.error('Error en calcularEstadisticasGlobales:', error);
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
   * Genera reporte por consultorio
   */
  static async generarReportePorConsultorio(
    sedeId: string | null,
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<ReportePorConsultorio[]> {
    try {
      const params = new URLSearchParams();
      if (sedeId && sedeId !== 'all') {
        params.append('branchId', sedeId);
      } else {
        params.append('branchId', 'all');
      }
      params.append('fechaInicio', fechaInicio.toISOString());
      params.append('fechaFin', fechaFin.toISOString());

      const response = await httpClient.get<ReportsApiResponse<ReportePorConsultorio[]>>(
        `/reports/consultorio?${params.toString()}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Error en generarReportePorConsultorio:', error);
      return [];
    }
  }

  /**
   * Genera reporte por especialidad médica
   */
  static async generarReportePorEspecialidad(
    sedeId: string | null,
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<ReportePorEspecialidad[]> {
    try {
      const params = new URLSearchParams();
      if (sedeId && sedeId !== 'all') {
        params.append('branchId', sedeId);
      } else {
        params.append('branchId', 'all');
      }
      params.append('fechaInicio', fechaInicio.toISOString());
      params.append('fechaFin', fechaFin.toISOString());

      const response = await httpClient.get<ReportsApiResponse<ReportePorEspecialidad[]>>(
        `/reports/especialidad?${params.toString()}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Error en generarReportePorEspecialidad:', error);
      return [];
    }
  }

  /**
   * Genera reporte por doctor (citas y bruto generado)
   */
  static async generarReportePorDoctor(
    sedeId: string | null,
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<ReportePorDoctor[]> {
    try {
      const params = new URLSearchParams();
      if (sedeId && sedeId !== 'all') {
        params.append('branchId', sedeId);
      } else {
        params.append('branchId', 'all');
      }
      params.append('fechaInicio', fechaInicio.toISOString());
      params.append('fechaFin', fechaFin.toISOString());

      const response = await httpClient.get<ReportsApiResponse<ReportePorDoctor[]>>(
        `/reports/doctor?${params.toString()}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Error en generarReportePorDoctor:', error);
      return [];
    }
  }

  /**
   * Actualiza las estadísticas de una sede en la base de datos
   * @deprecated No se requiere actualización manual, los datos se calculan en tiempo real
   */
  static async actualizarEstadisticasSede(_sedeId: string): Promise<void> {
    // Las estadísticas se calculan en tiempo real desde el backend
  }

  /**
   * Actualiza las estadísticas de todas las sedes activas
   * @deprecated No se requiere actualización manual, los datos se calculan en tiempo real
   */
  static async actualizarTodasLasEstadisticas(): Promise<void> {
    // Las estadísticas se calculan en tiempo real desde el backend
  }
}

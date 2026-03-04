/**
 * API Service para Reportes
 * Obtiene reportes del sistema desde el backend
 */

import httpClient from './httpClient';

export interface ReportData {
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    monthlyData: { month: string; count: number }[];
  };
  patients: {
    total: number;
    new: number;
    continuing: number;
    ageGroups: { range: string; count: number }[];
  };
  revenue: {
    total: number;
    monthly: number;
    services: { name: string; amount: number }[];
  };
}

export interface ServicesReportData {
  clinic: { name: string; count: number }[];
  laboratory: { name: string; count: number }[];
}

export interface PatientsReportData {
  total: number;
  new: number;
  continuing: number;
  ageGroups: { range: string; count: number }[];
}

interface ReportsApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ReportsApiService {
  /**
   * Obtiene el reporte Overview (estadísticas generales)
   */
  async getOverviewReport(
    branchId: string | null,
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<ReportData> {
    try {
      const params = new URLSearchParams();
      if (branchId && branchId !== 'all') {
        params.append('branchId', branchId);
      } else {
        params.append('branchId', 'all');
      }
      params.append('fechaInicio', fechaInicio.toISOString());
      params.append('fechaFin', fechaFin.toISOString());

      const response = await httpClient.get<ReportsApiResponse<ReportData>>(
        `/reports/overview?${params.toString()}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return this.getDefaultReportData();
    } catch (error) {
      console.error('Error en getOverviewReport:', error);
      return this.getDefaultReportData();
    }
  }

  /**
   * Obtiene el reporte de Servicios
   */
  async getServicesReport(
    branchId: string | null,
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<ServicesReportData> {
    try {
      const params = new URLSearchParams();
      if (branchId && branchId !== 'all') {
        params.append('branchId', branchId);
      } else {
        params.append('branchId', 'all');
      }
      params.append('fechaInicio', fechaInicio.toISOString());
      params.append('fechaFin', fechaFin.toISOString());

      const response = await httpClient.get<ReportsApiResponse<ServicesReportData>>(
        `/reports/services?${params.toString()}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return { clinic: [], laboratory: [] };
    } catch (error) {
      console.error('Error en getServicesReport:', error);
      return { clinic: [], laboratory: [] };
    }
  }

  /**
   * Obtiene el reporte de Pacientes
   */
  async getPatientsReport(
    branchId: string | null,
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<PatientsReportData> {
    try {
      const params = new URLSearchParams();
      if (branchId && branchId !== 'all') {
        params.append('branchId', branchId);
      } else {
        params.append('branchId', 'all');
      }
      params.append('fechaInicio', fechaInicio.toISOString());
      params.append('fechaFin', fechaFin.toISOString());

      const response = await httpClient.get<ReportsApiResponse<PatientsReportData>>(
        `/reports/patients?${params.toString()}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return { total: 0, new: 0, continuing: 0, ageGroups: [] };
    } catch (error) {
      console.error('Error en getPatientsReport:', error);
      return { total: 0, new: 0, continuing: 0, ageGroups: [] };
    }
  }

  /**
   * Datos por defecto cuando hay error
   */
  private getDefaultReportData(): ReportData {
    return {
      appointments: {
        total: 0,
        completed: 0,
        cancelled: 0,
        pending: 0,
        monthlyData: []
      },
      patients: {
        total: 0,
        new: 0,
        continuing: 0,
        ageGroups: []
      },
      revenue: {
        total: 0,
        monthly: 0,
        services: []
      }
    };
  }
}

export const reportsApi = new ReportsApiService();
export default reportsApi;

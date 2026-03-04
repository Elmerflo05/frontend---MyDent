/**
 * Servicio de integración con API real para Empresas (Companies)
 * Reemplaza el uso de IndexedDB por llamadas al backend
 *
 * IMPORTANTE: Este servicio NO debe ser reutilizado en otros módulos.
 * Es específico para el módulo de Empresas del admin.
 */

import { companiesApi, type CompanyData } from '@/services/api/companiesApi';
import type { Company } from '@/types';
import { mapBackendCompanyToFrontend, mapFrontendCompanyToBackend } from '@/utils/companyMappers';

export const CompanyApiService = {
  /**
   * Carga todas las empresas desde el backend
   */
  async loadCompanies(filters?: { branchId?: number }): Promise<Company[]> {
    try {
      const response = await companiesApi.getCompanies({
        branch_id: filters?.branchId,
        limit: 1000
      });

      return response.data.map(mapBackendCompanyToFrontend);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene una empresa por su ID
   */
  async getCompanyById(companyId: string): Promise<Company> {
    try {
      const response = await companiesApi.getCompanyById(parseInt(companyId));
      return mapBackendCompanyToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crea una nueva empresa
   */
  async createCompany(company: Partial<Company>): Promise<Company> {
    try {
      const companyData = mapFrontendCompanyToBackend(company) as CompanyData;

      // Validar campos requeridos
      if (!companyData.company_name || !companyData.ruc) {
        throw new Error('Faltan campos requeridos para crear la empresa');
      }

      const response = await companiesApi.createCompany(companyData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendCompanyToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualiza una empresa existente
   */
  async updateCompany(companyId: string, companyData: Partial<Company>): Promise<Company> {
    try {
      const backendData = mapFrontendCompanyToBackend(companyData);
      const response = await companiesApi.updateCompany(parseInt(companyId), backendData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendCompanyToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Elimina una empresa
   */
  async deleteCompany(companyId: string): Promise<void> {
    try {
      await companiesApi.deleteCompany(parseInt(companyId));
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene los contratos de una empresa
   */
  async getCompanyContracts(companyId: string): Promise<any[]> {
    try {
      const contracts = await companiesApi.getCompanyContracts(parseInt(companyId));
      return contracts;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene el número de empleados de una empresa
   * Nota: Este endpoint necesitaría existir en el backend o calcularse de otra manera
   */
  async getCompanyEmployeeCount(companyId: string): Promise<number> {
    try {
      // TODO: Implementar endpoint en backend para obtener empleados por empresa
      // Por ahora retornamos 0
      return 0;
    } catch (error) {
      return 0;
    }
  },

  /**
   * Obtiene estadísticas de empresas
   */
  async getCompanyStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    try {
      const companies = await this.loadCompanies();

      return {
        total: companies.length,
        active: companies.filter(c => c.estado === 'activa').length,
        inactive: companies.filter(c => c.estado === 'inactiva').length
      };
    } catch (error) {
      throw error;
    }
  }
};

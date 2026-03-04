/**
 * API Service para Empresas (Companies)
 * Maneja todas las operaciones CRUD de empresas y contratos con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface CompanyFilters {
  branch_id?: number;
  page?: number;
  limit?: number;
}

export interface CompanyContractData {
  contract_id?: number;
  company_id: number;
  contract_number: string;
  contract_type: string;
  start_date: string;
  end_date?: string;
  status: string;
  terms_and_conditions?: string;
  discount_percentage?: number;
  special_rates?: any;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyData {
  company_id?: number;
  company_name: string;
  ruc: string;
  address?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_cargo?: string;
  vigencia_inicio?: string;
  vigencia_fin?: string;
  industry?: string;
  company_size?: string;
  payment_terms?: string;
  status?: string;
  notes?: string;
  user_id_registration?: number;
  date_time_registration?: string;
  user_id_modification?: number;
  date_time_modification?: string;

  // Datos calculados (subqueries)
  employee_count?: number;

  // Datos relacionados (joins)
  contracts?: CompanyContractData[];
}

export interface CompaniesListResponse {
  success: boolean;
  data: CompanyData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CompanyResponse {
  success: boolean;
  data: CompanyData;
  message?: string;
}

export interface ContractResponse {
  success: boolean;
  data: CompanyContractData;
  message?: string;
}

class CompaniesApiService {
  /**
   * Obtiene todas las empresas con filtros y paginación
   */
  async getCompanies(filters?: CompanyFilters): Promise<CompaniesListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/companies${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<CompaniesListResponse>(endpoint);

      return {
        success: response.success || true,
        data: response.data || [],
        pagination: response.pagination || {
          total: 0,
          page: filters?.page || 1,
          limit: filters?.limit || 20,
          totalPages: 0
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene una empresa por su ID
   */
  async getCompanyById(companyId: number): Promise<CompanyResponse> {
    try {
      const response = await httpClient.get<CompanyResponse>(`/companies/${companyId}`);

      if (!response.success || !response.data) {
        throw new Error('Empresa no encontrada');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea una nueva empresa
   */
  async createCompany(companyData: CompanyData): Promise<CompanyResponse> {
    try {
      const response = await httpClient.post<CompanyResponse>('/companies', companyData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear empresa');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza una empresa existente
   */
  async updateCompany(companyId: number, companyData: Partial<CompanyData>): Promise<CompanyResponse> {
    try {
      const response = await httpClient.put<CompanyResponse>(`/companies/${companyId}`, companyData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar empresa');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina una empresa
   */
  async deleteCompany(companyId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/companies/${companyId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar empresa');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene los contratos de una empresa
   */
  async getCompanyContracts(companyId: number): Promise<CompanyContractData[]> {
    try {
      const response = await httpClient.get<{ success: boolean; data: CompanyContractData[] }>(`/companies/${companyId}/contracts`);
      return response.data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo contrato para una empresa
   */
  async createContract(contractData: CompanyContractData): Promise<ContractResponse> {
    try {
      const response = await httpClient.post<ContractResponse>('/companies/contracts', contractData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear contrato');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un contrato existente
   */
  async updateContract(contractId: number, contractData: Partial<CompanyContractData>): Promise<ContractResponse> {
    try {
      const response = await httpClient.put<ContractResponse>(`/companies/contracts/${contractId}`, contractData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar contrato');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un contrato
   */
  async deleteContract(contractId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/companies/contracts/${contractId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar contrato');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  // ========================================================================
  // PRECIOS CORPORATIVOS
  // ========================================================================

  /**
   * Buscar empresa por RUC (ruta publica, sin auth)
   */
  async getCompanyByRuc(ruc: string): Promise<{ success: boolean; data: any }> {
    try {
      const response = await httpClient.get<{ success: boolean; data: any }>(`/companies/by-ruc/${ruc}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene precios corporativos de una empresa
   */
  async getCompanyProcedurePrices(companyId: number, filters?: { procedure_type?: string; search?: string }): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (filters?.procedure_type) params.append('procedure_type', filters.procedure_type);
      if (filters?.search) params.append('search', filters.search);

      const queryString = params.toString();
      const endpoint = `/company-pricing/${companyId}/prices${queryString ? `?${queryString}` : ''}`;

      return await httpClient.get(endpoint);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crear o actualizar precio corporativo individual
   */
  async upsertCompanyProcedurePrice(companyId: number, data: {
    procedure_type: string;
    procedure_id: number;
    corporate_price: number;
  }): Promise<any> {
    try {
      return await httpClient.post(`/company-pricing/${companyId}/prices`, data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crear o actualizar multiples precios corporativos
   */
  async bulkUpsertPrices(companyId: number, prices: Array<{
    procedure_type: string;
    procedure_id: number;
    corporate_price: number;
  }>): Promise<any> {
    try {
      return await httpClient.post(`/company-pricing/${companyId}/prices/bulk`, { prices });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar precio corporativo
   */
  async deleteCompanyProcedurePrice(companyId: number, priceId: number): Promise<any> {
    try {
      return await httpClient.delete(`/company-pricing/${companyId}/prices/${priceId}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Descargar plantilla Excel de precios corporativos
   */
  async downloadPriceTemplate(companyId: number): Promise<Blob> {
    const token = localStorage.getItem('dental_clinic_token');
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4015/api';

    const response = await fetch(`${baseURL}/company-pricing/${companyId}/template`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al descargar plantilla');
    }

    return await response.blob();
  }

  /**
   * Importar precios desde archivo Excel
   */
  async importPricesFromExcel(companyId: number, file: File): Promise<any> {
    const token = localStorage.getItem('dental_clinic_token');
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4015/api';

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${baseURL}/company-pricing/${companyId}/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al importar precios');
    }

    return data;
  }

  /**
   * Extender vigencia de una empresa
   */
  async extendCompanyValidity(companyId: number, data: {
    new_vigencia_fin: string;
    extension_reason: string;
  }): Promise<any> {
    try {
      return await httpClient.post(`/company-pricing/${companyId}/extend-validity`, data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener historial de extensiones de vigencia
   */
  async getCompanyValidityHistory(companyId: number): Promise<any> {
    try {
      return await httpClient.get(`/company-pricing/${companyId}/validity-history`);
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const companiesApi = new CompaniesApiService();
export default companiesApi;

/**
 * API Service para Sedes (Branches)
 * Maneja todas las operaciones CRUD de sedes con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface BranchFilters {
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BranchData {
  branch_id?: number;
  branch_name: string;
  branch_code?: string;
  address?: string;
  city?: string;
  state?: string;
  department?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  manager_name?: string;
  manager_phone?: string;
  opening_hours?: string;
  is_main_office?: boolean;
  status?: 'active' | 'inactive';
  administrator_id?: number | null;
  latitude?: number;
  longitude?: number;
  notes?: string;
  configuration?: any;
  created_at?: string;
  updated_at?: string;
  company_id?: number;
  company_name?: string;
  user_id_registration?: number | null;
  date_time_registration?: string;
  user_id_modification?: number | null;
  date_time_modification?: string | null;
}

export interface BranchesListResponse {
  success: boolean;
  data: BranchData[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BranchResponse {
  success: boolean;
  data: BranchData;
  message?: string;
}

class BranchesApiService {
  /**
   * Obtiene todas las sedes con filtros y paginación
   */
  async getBranches(filters?: BranchFilters): Promise<BranchesListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.is_active !== undefined) {
        // Convertir boolean a status string
        params.append('status', filters.is_active ? 'active' : 'inactive');
      }
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/branches${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<BranchesListResponse>(endpoint);

      return {
        success: response.success !== false,
        data: Array.isArray(response.data) ? response.data : (response.data || []),
        pagination: response.pagination
      };
    } catch (error) {
      console.error('❌ [branchesApi] Error:', error);
      throw error;
    }
  }

  /**
   * Obtiene una sede por su ID
   */
  async getBranchById(branchId: number): Promise<BranchResponse> {
    try {
      const response = await httpClient.get<BranchResponse>(`/branches/${branchId}`);

      if (!response.success || !response.data) {
        throw new Error('Sede no encontrada');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea una nueva sede
   */
  async createBranch(branchData: BranchData): Promise<BranchResponse> {
    try {
      const response = await httpClient.post<BranchResponse>('/branches', branchData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear sede');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza una sede existente
   */
  async updateBranch(branchId: number, branchData: Partial<BranchData>): Promise<BranchResponse> {
    try {
      const response = await httpClient.put<BranchResponse>(`/branches/${branchId}`, branchData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar sede');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina una sede
   */
  async deleteBranch(branchId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/branches/${branchId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar sede');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene sedes activas desde endpoint público
   * Este método NO requiere autenticación y permite a pacientes consultar sedes disponibles
   */
  async getPublicActiveBranches(): Promise<BranchData[]> {
    try {
      // Usar endpoint público que no requiere autenticación
      const response = await httpClient.get<BranchesListResponse>(
        '/public/branches/active',
        { requiresAuth: false } // Sin autenticación requerida
      );

      return response.data || [];
    } catch (error) {
      console.error('❌ [branchesApi] Error obteniendo sedes públicas:', error);
      throw error;
    }
  }

  /**
   * Obtiene sedes activas (método original para usuarios autenticados con permisos)
   */
  async getActiveBranches(): Promise<BranchData[]> {
    try {
      const response = await this.getBranches({ is_active: true, limit: 100 });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca sedes por nombre o código
   */
  async searchBranches(searchTerm: string): Promise<BranchData[]> {
    try {
      const response = await this.getBranches({ search: searchTerm, limit: 50 });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const branchesApi = new BranchesApiService();
export default branchesApi;

/**
 * API Service para Presupuestos
 * Maneja todas las operaciones CRUD de presupuestos con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface BudgetFilters {
  patient_id?: number;
  dentist_id?: number;
  branch_id?: number;
  budget_status_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface BudgetDetailData {
  budget_detail_id?: number;
  budget_id: number;
  dental_procedure_id: number;
  quantity: number;
  unit_price: number;
  discount?: number;
  discount_type?: string;
  subtotal: number;
  notes?: string;
  tooth_number?: string;
  tooth_surface?: string;
  created_at?: string;

  // Datos relacionados (joins)
  procedure_name?: string;
  procedure_code?: string;
}

export interface BudgetData {
  budget_id?: number;
  patient_id: number;
  dentist_id: number;
  branch_id: number;
  budget_date: string;
  budget_status_id: number;
  total_amount: number;
  discount?: number;
  discount_type?: string;
  final_amount: number;
  validity_days?: number;
  valid_until?: string;
  notes?: string;
  acceptance_date?: string;
  user_id_registration?: number;
  created_at?: string;
  updated_at?: string;

  // Datos relacionados (joins)
  patient_first_name?: string;
  patient_last_name?: string;
  patient_mobile?: string;
  dentist_first_name?: string;
  dentist_last_name?: string;
  status_name?: string;
  status_color?: string;
  branch_name?: string;
  details?: BudgetDetailData[];
}

export interface BudgetsListResponse {
  success: boolean;
  data: BudgetData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BudgetResponse {
  success: boolean;
  data: BudgetData;
  message?: string;
}

export interface BudgetDetailResponse {
  success: boolean;
  data: BudgetDetailData;
  message?: string;
}

class BudgetsApiService {
  /**
   * Obtiene todos los presupuestos con filtros y paginación
   */
  async getBudgets(filters?: BudgetFilters): Promise<BudgetsListResponse> {
    try {
      // Construir query params
      const params = new URLSearchParams();

      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.dentist_id) params.append('dentist_id', filters.dentist_id.toString());
      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.budget_status_id) params.append('budget_status_id', filters.budget_status_id.toString());
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/budgets${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<BudgetsListResponse>(endpoint);

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
   * Obtiene un presupuesto por su ID
   */
  async getBudgetById(budgetId: number): Promise<BudgetResponse> {
    try {
      const response = await httpClient.get<BudgetResponse>(`/budgets/${budgetId}`);

      if (!response.success || !response.data) {
        throw new Error('Presupuesto no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo presupuesto
   */
  async createBudget(budgetData: BudgetData): Promise<BudgetResponse> {
    try {
      const response = await httpClient.post<BudgetResponse>('/budgets', budgetData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear presupuesto');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un presupuesto existente
   */
  async updateBudget(budgetId: number, budgetData: Partial<BudgetData>): Promise<BudgetResponse> {
    try {
      const response = await httpClient.put<BudgetResponse>(`/budgets/${budgetId}`, budgetData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar presupuesto');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Acepta un presupuesto
   */
  async acceptBudget(budgetId: number): Promise<BudgetResponse> {
    try {
      const response = await httpClient.put<BudgetResponse>(`/budgets/${budgetId}/accept`);

      if (!response.success) {
        throw new Error(response.message || 'Error al aceptar presupuesto');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un presupuesto
   */
  async deleteBudget(budgetId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/budgets/${budgetId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar presupuesto');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Agrega un detalle a un presupuesto
   */
  async addDetail(budgetId: number, detailData: BudgetDetailData): Promise<BudgetDetailResponse> {
    try {
      const response = await httpClient.post<BudgetDetailResponse>(`/budgets/${budgetId}/details`, detailData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al agregar detalle');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un detalle de un presupuesto
   */
  async deleteDetail(detailId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/budgets/details/${detailId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar detalle');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene presupuestos de un paciente específico
   */
  async getPatientBudgets(patientId: number, branchId?: number): Promise<BudgetData[]> {
    try {
      const filters: BudgetFilters = {
        patient_id: patientId,
        limit: 100
      };

      if (branchId) filters.branch_id = branchId;

      const response = await this.getBudgets(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene presupuestos por estado
   */
  async getBudgetsByStatus(statusId: number, branchId?: number): Promise<BudgetData[]> {
    try {
      const filters: BudgetFilters = {
        budget_status_id: statusId,
        limit: 100
      };

      if (branchId) filters.branch_id = branchId;

      const response = await this.getBudgets(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const budgetsApi = new BudgetsApiService();
export default budgetsApi;

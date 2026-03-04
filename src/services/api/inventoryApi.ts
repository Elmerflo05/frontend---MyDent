/**
 * API Service para Inventario
 * Maneja todas las operaciones CRUD de inventario (items y categorías) con el backend
 */

import httpClient, { ApiResponse } from './httpClient';
import type {
  InventoryCategoryApiResponse,
  CreateInventoryCategoryDto,
  UpdateInventoryCategoryDto
} from '@/types/api/inventoryCategory';

export interface InventoryFilters {
  inventory_category_id?: number;
  branch_id?: number;
  low_stock?: boolean;
  page?: number;
  limit?: number;
}

export interface InventoryCategoryData {
  category_id?: number;
  category_name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryItemData {
  // Primary key
  inventory_item_id?: number;

  // Foreign keys
  branch_id: number;
  inventory_category_id?: number;

  // Campos principales
  item_code: string;
  item_name: string;
  description?: string;
  unit_of_measure?: string;

  // Cantidades
  current_quantity: number;
  minimum_quantity?: number;
  maximum_quantity?: number;

  // Precios y proveedores
  unit_cost?: number;
  supplier_name?: string;
  supplier_contact?: string;

  // Ubicación y lotes
  location?: string;
  expiry_date?: string;
  batch_number?: string;
  notes?: string;

  // Auditoría
  status?: string;
  user_id_registration?: number;
  date_time_registration?: string;
  user_id_modification?: number;
  date_time_modification?: string;

  // Datos relacionados (joins) - SOLO lectura
  category_name?: string;
  category_code?: string;
  branch_name?: string;
}

export interface InventoryItemsListResponse {
  success: boolean;
  data: InventoryItemData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InventoryItemResponse {
  success: boolean;
  data: InventoryItemData;
  message?: string;
}

export interface InventoryCategoriesListResponse {
  success: boolean;
  data: InventoryCategoryApiResponse[];
}

export interface InventoryCategoryResponse {
  success: boolean;
  data: InventoryCategoryApiResponse;
  message?: string;
}

class InventoryApiService {
  /**
   * Obtiene todos los items de inventario con filtros y paginación
   */
  async getInventoryItems(filters?: InventoryFilters): Promise<InventoryItemsListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.inventory_category_id) params.append('inventory_category_id', filters.inventory_category_id.toString());
      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.low_stock !== undefined) params.append('low_stock', filters.low_stock.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/inventory/items${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<InventoryItemsListResponse>(endpoint);

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
   * Obtiene un item de inventario por su ID
   */
  async getInventoryItemById(itemId: number): Promise<InventoryItemResponse> {
    try {
      const response = await httpClient.get<InventoryItemResponse>(`/inventory/items/${itemId}`);

      if (!response.success || !response.data) {
        throw new Error('Item de inventario no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo item de inventario
   */
  async createInventoryItem(itemData: InventoryItemData): Promise<InventoryItemResponse> {
    try {
      const response = await httpClient.post<InventoryItemResponse>('/inventory/items', itemData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear item de inventario');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un item de inventario existente
   */
  async updateInventoryItem(itemId: number, itemData: Partial<InventoryItemData>): Promise<InventoryItemResponse> {
    try {
      const response = await httpClient.put<InventoryItemResponse>(`/inventory/items/${itemId}`, itemData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar item de inventario');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Ajusta la cantidad de un item de inventario
   */
  async adjustItemQuantity(itemId: number, adjustment: {
    adjustment_type: 'add' | 'subtract' | 'set';
    quantity: number;
    reason?: string;
  }): Promise<InventoryItemResponse> {
    try {
      const response = await httpClient.put<InventoryItemResponse>(`/inventory/items/${itemId}/adjust`, adjustment);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al ajustar cantidad');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un item de inventario
   */
  async deleteInventoryItem(itemId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/inventory/items/${itemId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar item de inventario');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene todas las categorías de inventario
   */
  async getInventoryCategories(): Promise<InventoryCategoriesListResponse> {
    try {
      const response = await httpClient.get<InventoryCategoriesListResponse>('/inventory/categories');

      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error al obtener categorías de inventario:', error);
      throw error;
    }
  }

  /**
   * Obtiene una categoría de inventario por su ID
   */
  async getInventoryCategoryById(categoryId: number): Promise<InventoryCategoryApiResponse> {
    try {
      const response = await httpClient.get<InventoryCategoryResponse>(`/inventory/categories/${categoryId}`);

      if (!response.success || !response.data) {
        throw new Error('Categoría no encontrada');
      }

      return response.data;
    } catch (error) {
      console.error(`Error al obtener categoría ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Crea una nueva categoría de inventario
   */
  async createInventoryCategory(categoryData: CreateInventoryCategoryDto): Promise<InventoryCategoryApiResponse> {
    try {
      const payload = {
        category_name: categoryData.name,
        description: categoryData.description || null,
        color: categoryData.color || '#3b82f6',
        status: categoryData.isActive !== false ? 'active' : 'inactive'
      };

      const response = await httpClient.post<InventoryCategoryResponse>('/inventory/categories', payload);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear categoría');
      }

      return response.data;
    } catch (error) {
      console.error('Error al crear categoría de inventario:', error);
      throw error;
    }
  }

  /**
   * Actualiza una categoría existente
   */
  async updateInventoryCategory(
    categoryId: number,
    updates: UpdateInventoryCategoryDto
  ): Promise<InventoryCategoryApiResponse> {
    try {
      const payload: Record<string, any> = {};

      if (updates.name !== undefined) {
        payload.category_name = updates.name;
      }

      if (updates.description !== undefined) {
        payload.description = updates.description;
      }

      if (updates.color !== undefined) {
        payload.color = updates.color;
      }

      if (updates.isActive !== undefined) {
        payload.status = updates.isActive ? 'active' : 'inactive';
      }

      const response = await httpClient.put<InventoryCategoryResponse>(
        `/inventory/categories/${categoryId}`,
        payload
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar categoría');
      }

      return response.data;
    } catch (error) {
      console.error(`Error al actualizar categoría ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Elimina una categoría
   */
  async deleteInventoryCategory(categoryId: number): Promise<void> {
    try {
      const response = await httpClient.delete<{ success: boolean; message?: string }>(
        `/inventory/categories/${categoryId}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar categoría');
      }
    } catch (error) {
      console.error(`Error al eliminar categoría ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Cambia el estado de una categoría (activa/inactiva)
   */
  async toggleInventoryCategoryStatus(categoryId: number): Promise<InventoryCategoryApiResponse> {
    try {
      // Primero obtenemos la categoría actual
      const currentCategory = await this.getInventoryCategoryById(categoryId);

      // Invertimos su estado
      const newStatus = currentCategory.status === 'active' ? 'inactive' : 'active';

      // Actualizamos solo el estado
      return await this.updateInventoryCategory(categoryId, {
        isActive: newStatus === 'active'
      });
    } catch (error) {
      console.error(`Error al cambiar estado de categoría ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene items con stock bajo
   */
  async getLowStockItems(branchId?: number): Promise<InventoryItemData[]> {
    try {
      const response = await this.getInventoryItems({
        branch_id: branchId,
        low_stock: true,
        limit: 1000
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de inventario
   */
  async getInventoryStats(branchId?: number): Promise<{
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalValue: number;
  }> {
    try {
      const response = await this.getInventoryItems({
        branch_id: branchId,
        limit: 10000
      });

      const items = response.data;

      return {
        totalItems: items.length,
        lowStockItems: items.filter(item =>
          item.minimum_stock_level &&
          item.quantity_in_stock <= item.minimum_stock_level
        ).length,
        outOfStockItems: items.filter(item => item.quantity_in_stock === 0).length,
        totalValue: items.reduce((sum, item) =>
          sum + (item.quantity_in_stock * (item.unit_price || 0)), 0
        )
      };
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const inventoryApi = new InventoryApiService();
export default inventoryApi;

/**
 * Treatment Packs API Service
 * Maneja todas las operaciones CRUD para Packs de Tratamientos
 *
 * Este servicio integra:
 * - Condiciones del odontograma (odontogram_dental_conditions)
 * - Items personalizados de texto libre
 * - Calculo automatico de precios
 */

import httpClient, { ApiResponse } from './httpClient';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Item de condicion del odontograma asociado a un pack
 */
export interface TreatmentConditionItem {
  item_id?: number;
  treatment_id?: number;
  odontogram_condition_id: number;
  condition_procedure_id?: number | null;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  discount_amount?: number;
  subtotal?: number;
  notes?: string | null;
  display_order?: number;

  // Datos relacionados (joins)
  condition_code?: string;
  condition_name?: string;
  condition_category?: string;
  condition_default_price?: number;
  procedure_name?: string | null;
  procedure_code?: string | null;
  procedure_price_base?: number;
}

/**
 * Item personalizado de texto libre
 */
export interface TreatmentCustomItem {
  custom_item_id?: number;
  treatment_id?: number;
  item_name: string;
  item_description?: string | null;
  item_category?: string | null;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  discount_amount?: number;
  subtotal?: number;
  notes?: string | null;
  display_order?: number;
}

/**
 * Item de sub-procedimiento asociado a un tratamiento
 */
export interface TreatmentSubProcedureItem {
  item_id?: number;
  treatment_id?: number;
  sub_procedure_id: number;
  sub_procedure_code?: string | null;
  sub_procedure_name: string;
  specialty?: string | null;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  discount_amount?: number;
  subtotal?: number;
  notes?: string | null;
  display_order?: number;
}

/**
 * Pack de tratamiento completo
 */
export interface TreatmentPack {
  treatment_id?: number;
  treatment_code?: string;
  treatment_name: string;
  treatment_category?: string;
  description?: string | null;
  base_price?: number;
  total_price?: number;
  pack_type?: 'simple' | 'pack' | 'combo';
  is_pack?: boolean;
  estimated_duration?: number | null;
  is_active?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
  user_id_registration?: number;
  user_id_modification?: number;

  // Items del pack
  condition_items?: TreatmentConditionItem[];
  custom_items?: TreatmentCustomItem[];
  sub_procedure_items?: TreatmentSubProcedureItem[];

  // Conteos
  condition_items_count?: number;
  custom_items_count?: number;
  sub_procedure_items_count?: number;
}

/**
 * Filtros para busqueda de packs
 */
export interface TreatmentPackFilters {
  category?: string;
  is_active?: boolean;
  pack_type?: 'simple' | 'pack' | 'combo';
  only_packs?: boolean;
  search?: string;
  order_by?: string;
  order_dir?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

/**
 * Respuesta paginada de packs
 */
export interface TreatmentPacksListResponse {
  success: boolean;
  data: TreatmentPack[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Respuesta de un solo pack
 */
export interface TreatmentPackResponse {
  success: boolean;
  data: TreatmentPack;
  message?: string;
}

/**
 * Condicion disponible para agregar a packs
 */
export interface AvailableCondition {
  condition_id: number;
  condition_code: string;
  condition_name: string;
  category: string;
  default_price?: number;
  price_base?: number;
  description?: string;
}

/**
 * Procedimiento de una condicion
 */
export interface ConditionProcedure {
  condition_procedure_id: number;
  odontogram_condition_id: number;
  procedure_name: string;
  procedure_code?: string;
  price_base?: number;
  estimated_duration?: number;
  observations?: string;
}

/**
 * Categoria de packs
 */
export interface PackCategory {
  category: string;
  pack_count: number;
}

// =============================================================================
// API SERVICE
// =============================================================================

class TreatmentPacksApiService {
  private readonly basePath = '/treatment-packs';

  // ===========================================================================
  // CRUD PRINCIPAL
  // ===========================================================================

  /**
   * Obtiene todos los packs con filtros y paginacion
   */
  async getTreatmentPacks(filters?: TreatmentPackFilters): Promise<TreatmentPacksListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.category) params.append('category', filters.category);
      if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
      if (filters?.pack_type) params.append('pack_type', filters.pack_type);
      if (filters?.only_packs) params.append('only_packs', 'true');
      if (filters?.search) params.append('search', filters.search);
      if (filters?.order_by) params.append('order_by', filters.order_by);
      if (filters?.order_dir) params.append('order_dir', filters.order_dir);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const queryString = params.toString();
      const endpoint = `${this.basePath}${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<TreatmentPacksListResponse>(endpoint);

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
   * Obtiene un pack por ID con todos sus items
   */
  async getTreatmentPackById(packId: number): Promise<TreatmentPackResponse> {
    try {
      const response = await httpClient.get<TreatmentPackResponse>(`${this.basePath}/${packId}`);

      if (!response.success || !response.data) {
        throw new Error('Pack de tratamiento no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo pack de tratamiento
   */
  async createTreatmentPack(packData: Partial<TreatmentPack>): Promise<TreatmentPackResponse> {
    try {
      const response = await httpClient.post<TreatmentPackResponse>(this.basePath, packData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear pack de tratamiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un pack existente
   */
  async updateTreatmentPack(
    packId: number,
    packData: Partial<TreatmentPack>
  ): Promise<TreatmentPackResponse> {
    try {
      const response = await httpClient.put<TreatmentPackResponse>(
        `${this.basePath}/${packId}`,
        packData
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar pack de tratamiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un pack (soft delete)
   */
  async deleteTreatmentPack(packId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`${this.basePath}/${packId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar pack de tratamiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  // ===========================================================================
  // ITEMS DE CONDICIONES
  // ===========================================================================

  /**
   * Agrega un item de condicion a un pack
   */
  async addConditionItem(
    packId: number,
    itemData: Partial<TreatmentConditionItem>
  ): Promise<TreatmentPackResponse> {
    try {
      const response = await httpClient.post<TreatmentPackResponse>(
        `${this.basePath}/${packId}/condition-items`,
        itemData
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al agregar item de condicion');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un item de condicion de un pack
   */
  async removeConditionItem(packId: number, itemId: number): Promise<TreatmentPackResponse> {
    try {
      const response = await httpClient.delete<TreatmentPackResponse>(
        `${this.basePath}/${packId}/condition-items/${itemId}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar item de condicion');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  // ===========================================================================
  // ITEMS PERSONALIZADOS
  // ===========================================================================

  /**
   * Agrega un item personalizado a un pack
   */
  async addCustomItem(
    packId: number,
    itemData: Partial<TreatmentCustomItem>
  ): Promise<TreatmentPackResponse> {
    try {
      const response = await httpClient.post<TreatmentPackResponse>(
        `${this.basePath}/${packId}/custom-items`,
        itemData
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al agregar item personalizado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un item personalizado de un pack
   */
  async removeCustomItem(packId: number, itemId: number): Promise<TreatmentPackResponse> {
    try {
      const response = await httpClient.delete<TreatmentPackResponse>(
        `${this.basePath}/${packId}/custom-items/${itemId}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar item personalizado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  // ===========================================================================
  // OPERACIONES AUXILIARES
  // ===========================================================================

  /**
   * Obtiene las categorias de packs disponibles
   */
  async getPackCategories(): Promise<PackCategory[]> {
    try {
      const response = await httpClient.get<{ success: boolean; data: PackCategory[] }>(
        `${this.basePath}/categories`
      );

      return response.data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene condiciones disponibles para agregar a packs
   */
  async getAvailableConditions(category?: string): Promise<AvailableCondition[]> {
    try {
      const params = category ? `?category=${encodeURIComponent(category)}` : '';
      const response = await httpClient.get<{ success: boolean; data: AvailableCondition[] }>(
        `${this.basePath}/available-conditions${params}`
      );

      return response.data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene procedimientos de una condicion especifica
   */
  async getConditionProcedures(conditionId: number): Promise<ConditionProcedure[]> {
    try {
      const response = await httpClient.get<{ success: boolean; data: ConditionProcedure[] }>(
        `${this.basePath}/conditions/${conditionId}/procedures`
      );

      return response.data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Recalcula el precio total de un pack
   */
  async recalculateTotal(packId: number): Promise<{ treatment_id: number; total_price: number }> {
    try {
      const response = await httpClient.post<{
        success: boolean;
        data: { treatment_id: number; total_price: number };
      }>(`${this.basePath}/${packId}/recalculate`);

      if (!response.success || !response.data) {
        throw new Error('Error al recalcular total');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Duplica un pack existente
   */
  async duplicatePack(packId: number, newName?: string): Promise<TreatmentPackResponse> {
    try {
      const response = await httpClient.post<TreatmentPackResponse>(
        `${this.basePath}/${packId}/duplicate`,
        { new_name: newName }
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al duplicar pack');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  /**
   * Busca packs por termino
   */
  async searchPacks(searchTerm: string): Promise<TreatmentPack[]> {
    try {
      const response = await this.getTreatmentPacks({
        search: searchTerm,
        only_packs: true,
        is_active: true,
        limit: 50
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene packs activos
   */
  async getActivePacks(): Promise<TreatmentPack[]> {
    try {
      const response = await this.getTreatmentPacks({
        is_active: true,
        only_packs: true,
        limit: 100
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene packs por categoria
   */
  async getPacksByCategory(category: string): Promise<TreatmentPack[]> {
    try {
      const response = await this.getTreatmentPacks({
        category,
        only_packs: true,
        is_active: true,
        limit: 100
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calcula el subtotal de un item
   */
  calculateItemSubtotal(
    quantity: number,
    unitPrice: number,
    discountPercentage: number = 0,
    discountAmount: number = 0
  ): number {
    const grossTotal = quantity * unitPrice;

    // Usar discount_amount si existe, sino calcular por porcentaje
    const discount =
      discountAmount > 0 ? discountAmount : grossTotal * (discountPercentage / 100);

    return Math.max(grossTotal - discount, 0);
  }

  /**
   * Calcula el total de un pack localmente (sin llamar al API)
   */
  calculatePackTotal(pack: Partial<TreatmentPack>): number {
    let total = 0;

    // Sumar items de condiciones
    if (pack.condition_items && pack.condition_items.length > 0) {
      total += pack.condition_items.reduce((sum, item) => {
        return (
          sum +
          this.calculateItemSubtotal(
            item.quantity || 1,
            item.unit_price || 0,
            item.discount_percentage || 0,
            item.discount_amount || 0
          )
        );
      }, 0);
    }

    // Sumar items personalizados
    if (pack.custom_items && pack.custom_items.length > 0) {
      total += pack.custom_items.reduce((sum, item) => {
        return (
          sum +
          this.calculateItemSubtotal(
            item.quantity || 1,
            item.unit_price || 0,
            item.discount_percentage || 0,
            item.discount_amount || 0
          )
        );
      }, 0);
    }

    return total;
  }
}

// Exportar instancia singleton
export const treatmentPacksApi = new TreatmentPacksApiService();
export default treatmentPacksApi;

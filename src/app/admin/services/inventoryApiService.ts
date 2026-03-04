/**
 * Servicio de integración con API real para Inventario
 * Reemplaza el uso de IndexedDB por llamadas al backend
 *
 * IMPORTANTE: Este servicio NO debe ser reutilizado en otros módulos.
 * Es específico para el módulo de Inventario del admin.
 */

import { inventoryApi, type InventoryItemData, type InventoryCategoryData } from '@/services/api/inventoryApi';
import { branchesApi } from '@/services/api/branchesApi';
import type { InventoryItem, InventoryCategory, Sede } from '@/types';
import { formatDateToYMD, parseLocalDate } from '@/utils/dateUtils';

/**
 * Mapea un item de inventario del backend al formato del frontend
 */
const mapBackendItemToFrontend = (backendItem: InventoryItemData): InventoryItem => {
  // Convertir a número (pg devuelve Decimal como string)
  const quantity = Number(backendItem.current_quantity ?? 0);
  const minQuantity = Number(backendItem.minimum_quantity ?? 0);

  // Calcular status basado en cantidad y cantidad mínima
  let status: 'active' | 'low_stock' | 'out_of_stock' = 'active';
  if (quantity === 0) {
    status = 'out_of_stock';
  } else if (minQuantity > 0 && quantity <= minQuantity) {
    status = 'low_stock';
  }

  return {
    id: backendItem.inventory_item_id?.toString() || '',
    nombre: backendItem.item_name || '',
    descripcion: backendItem.description || '',
    categoryId: backendItem.inventory_category_id?.toString() || '',
    cantidad: quantity,
    fechaVencimiento: backendItem.expiry_date ? parseLocalDate(backendItem.expiry_date) : new Date(),
    sedeId: backendItem.branch_id?.toString() || '',
    status,
    createdBy: backendItem.user_id_registration?.toString(),
    updatedBy: backendItem.user_id_modification?.toString(),
    createdAt: new Date(backendItem.date_time_registration || new Date()),
    updatedAt: new Date(backendItem.date_time_modification || new Date())
  };
};

/**
 * Mapea un item del frontend al formato del backend
 */
const mapFrontendItemToBackend = (frontendItem: Partial<InventoryItem>, branchId: number = 1): Partial<InventoryItemData> => {
  const data: Partial<InventoryItemData> = {};

  if (frontendItem.nombre) data.item_name = frontendItem.nombre;
  if (frontendItem.descripcion) data.description = frontendItem.descripcion;
  if (frontendItem.categoryId) data.inventory_category_id = parseInt(frontendItem.categoryId);
  if (frontendItem.cantidad !== undefined) data.current_quantity = frontendItem.cantidad;
  if (frontendItem.fechaVencimiento) {
    data.expiry_date = formatDateToYMD(frontendItem.fechaVencimiento);
  }
  if (frontendItem.sedeId) data.branch_id = parseInt(frontendItem.sedeId);
  else data.branch_id = branchId;

  // Generar item_code si no existe (requerido por la BD)
  if (!data.item_code && frontendItem.nombre) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    data.item_code = `ITEM-${timestamp}-${random}`;
  }

  // Campos con valores por defecto
  data.unit_of_measure = data.unit_of_measure || 'unidad';
  data.minimum_quantity = data.minimum_quantity || 10;

  return data;
};

/**
 * Mapea una categoría del backend al frontend
 * Usa el transformador correcto de inventoryCategory
 */
const mapBackendCategoryToFrontend = (backendCategory: any): InventoryCategory => {
  return {
    id: backendCategory.inventory_category_id?.toString() || '',
    nombre: backendCategory.category_name || '',
    descripcion: backendCategory.description || '',
    color: backendCategory.color || '#3B82F6',
    icon: 'Package',
    activo: backendCategory.status === 'active',
    createdAt: new Date(backendCategory.date_time_registration || new Date()),
    updatedAt: new Date(backendCategory.date_time_modification || new Date()),
    createdBy: backendCategory.user_id_registration?.toString(),
    updatedBy: backendCategory.user_id_modification?.toString()
  };
};

/**
 * Mapea una categoría del frontend al backend
 */
const mapFrontendCategoryToBackend = (frontendCategory: Partial<InventoryCategory>): any => {
  const data: any = {};

  if (frontendCategory.nombre !== undefined) {
    data.category_name = frontendCategory.nombre;
  }

  if (frontendCategory.descripcion !== undefined) {
    data.description = frontendCategory.descripcion;
  }

  if (frontendCategory.color !== undefined) {
    data.color = frontendCategory.color;
  }

  if (frontendCategory.activo !== undefined) {
    data.status = frontendCategory.activo ? 'active' : 'inactive';
  }

  return data;
};

/**
 * Mapea una sede del backend al frontend
 */
const mapBackendSedeToFrontend = (backendBranch: any): Sede => {
  return {
    id: backendBranch.branch_id?.toString() || '',
    nombre: backendBranch.branch_name || '',
    direccion: backendBranch.address || '',
    telefono: backendBranch.phone || '',
    email: backendBranch.email || '',
    estado: backendBranch.status === 'active' ? 'activa' : 'inactiva',
    horarioAtencion: backendBranch.operating_hours || '',
    administradorId: backendBranch.manager_user_id?.toString(),
    capacidadConsultorios: 0,
    serviciosDisponibles: [],
    fechaApertura: new Date(backendBranch.created_at || new Date()),
    configuracion: {
      permitirCitasOnline: true,
      notificacionesSMS: false,
      horariosEspeciales: []
    }
  };
};

export const InventoryApiService = {
  /**
   * Carga todos los items de inventario
   */
  async loadInventoryItems(filters?: { branchId?: number; categoryId?: number }): Promise<InventoryItem[]> {
    try {
      const response = await inventoryApi.getInventoryItems({
        branch_id: filters?.branchId,
        inventory_category_id: filters?.categoryId,
        limit: 1000
      });

      return response.data.map(mapBackendItemToFrontend);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Carga todas las categorías de inventario
   */
  async loadCategories(): Promise<InventoryCategory[]> {
    try {
      const response = await inventoryApi.getInventoryCategories();
      return response.data.map(mapBackendCategoryToFrontend);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Carga todas las sedes
   */
  async loadSedes(): Promise<Sede[]> {
    try {
      const response = await branchesApi.getBranches({ limit: 100 });
      return response.data.map(mapBackendSedeToFrontend);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crea un nuevo item de inventario
   */
  async createInventoryItem(item: Partial<InventoryItem>, branchId: number = 1): Promise<InventoryItem> {
    try {
      const backendData = mapFrontendItemToBackend(item, branchId) as InventoryItemData;

      // Validar campos requeridos según el esquema PostgreSQL
      if (!backendData.item_name || !backendData.item_code || !backendData.branch_id) {
        throw new Error('Faltan campos requeridos: nombre, código y sede');
      }

      const response = await inventoryApi.createInventoryItem(backendData);
      return mapBackendItemToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualiza un item de inventario
   */
  async updateInventoryItem(itemId: string, itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const backendData = mapFrontendItemToBackend(itemData);
      const response = await inventoryApi.updateInventoryItem(parseInt(itemId), backendData);
      return mapBackendItemToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Elimina un item de inventario
   */
  async deleteInventoryItem(itemId: string): Promise<void> {
    try {
      await inventoryApi.deleteInventoryItem(parseInt(itemId));
    } catch (error) {
      throw error;
    }
  },

  /**
   * Ajusta la cantidad de un item
   */
  async adjustQuantity(itemId: string, adjustment: { type: 'add' | 'subtract' | 'set'; quantity: number; reason?: string }): Promise<InventoryItem> {
    try {
      const response = await inventoryApi.adjustItemQuantity(parseInt(itemId), {
        adjustment_type: adjustment.type,
        quantity: adjustment.quantity,
        reason: adjustment.reason
      });
      return mapBackendItemToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crea una nueva categoría
   */
  async createCategory(category: Partial<InventoryCategory>): Promise<InventoryCategory> {
    try {
      const backendData = mapFrontendCategoryToBackend(category) as InventoryCategoryData;
      const response = await inventoryApi.createInventoryCategory(backendData);
      return mapBackendCategoryToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualiza una categoría
   */
  async updateCategory(categoryId: string, categoryData: Partial<InventoryCategory>): Promise<InventoryCategory> {
    try {
      const backendData = mapFrontendCategoryToBackend(categoryData);
      const response = await inventoryApi.updateInventoryCategory(parseInt(categoryId), backendData);
      return mapBackendCategoryToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Elimina una categoría
   */
  async deleteCategory(categoryId: string): Promise<void> {
    try {
      await inventoryApi.deleteInventoryCategory(parseInt(categoryId));
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene items con stock bajo
   */
  async getLowStockItems(branchId?: number): Promise<InventoryItem[]> {
    try {
      const items = await inventoryApi.getLowStockItems(branchId);
      return items.map(mapBackendItemToFrontend);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene estadísticas de inventario
   */
  async getInventoryStats(branchId?: number) {
    try {
      return await inventoryApi.getInventoryStats(branchId);
    } catch (error) {
      throw error;
    }
  }
};

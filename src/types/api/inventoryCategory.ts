/**
 * Tipos y transformadores para el módulo de Categorías de Inventario
 * Maneja la conversión entre el formato de la API (backend) y el formato del Frontend
 */

// Tipo de la API (Backend - PostgreSQL)
export interface InventoryCategoryApiResponse {
  inventory_category_id: number;
  category_name: string;
  category_code?: string | null;
  parent_category_id?: number | null;
  description?: string | null;
  color?: string | null;
  status: string; // 'active' | 'inactive'
}

// Tipo del Frontend (UI)
export interface InventoryCategoryFrontend {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Tipo para crear una categoría (sin ID)
export interface CreateInventoryCategoryDto {
  name: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

// Tipo para actualizar una categoría
export interface UpdateInventoryCategoryDto {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

/**
 * Transforma una categoría de inventario de la API al formato del Frontend
 */
export function transformInventoryCategoryFromApi(
  apiCategory: InventoryCategoryApiResponse
): InventoryCategoryFrontend {
  return {
    id: apiCategory.inventory_category_id.toString(),
    name: apiCategory.category_name,
    description: apiCategory.description || undefined,
    color: apiCategory.color || '#3b82f6',
    isActive: apiCategory.status === 'active',
    createdAt: undefined, // El backend no devuelve estas fechas actualmente
    updatedAt: undefined
  };
}

/**
 * Transforma un array de categorías de la API al formato del Frontend
 */
export function transformInventoryCategoriesFromApi(
  apiCategories: InventoryCategoryApiResponse[]
): InventoryCategoryFrontend[] {
  return apiCategories.map(transformInventoryCategoryFromApi);
}

/**
 * Transforma datos del Frontend al formato de la API para crear
 */
export function transformInventoryCategoryToApiCreate(category: CreateInventoryCategoryDto): {
  category_name: string;
  description?: string;
  color?: string;
  status: string;
} {
  return {
    category_name: category.name,
    description: category.description || undefined,
    color: category.color || '#3b82f6',
    status: category.isActive !== false ? 'active' : 'inactive'
  };
}

/**
 * Transforma datos del Frontend al formato de la API para actualizar
 */
export function transformInventoryCategoryToApiUpdate(updates: UpdateInventoryCategoryDto): {
  category_name?: string;
  description?: string;
  color?: string;
  status?: string;
} {
  const apiUpdates: {
    category_name?: string;
    description?: string;
    color?: string;
    status?: string;
  } = {};

  if (updates.name !== undefined) {
    apiUpdates.category_name = updates.name;
  }

  if (updates.description !== undefined) {
    apiUpdates.description = updates.description;
  }

  if (updates.color !== undefined) {
    apiUpdates.color = updates.color;
  }

  if (updates.isActive !== undefined) {
    apiUpdates.status = updates.isActive ? 'active' : 'inactive';
  }

  return apiUpdates;
}

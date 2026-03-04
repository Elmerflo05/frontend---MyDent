import { create } from 'zustand';
import { inventoryApi } from '@/services/api/inventoryApi';
import {
  transformInventoryCategoriesFromApi,
  transformInventoryCategoryFromApi,
  type InventoryCategoryFrontend,
  type CreateInventoryCategoryDto,
  type UpdateInventoryCategoryDto
} from '@/types/api/inventoryCategory';

interface InventoryCategoryState {
  categories: InventoryCategoryFrontend[];
  loading: boolean;
  error: string | null;

  // Actions
  loadCategories: () => Promise<void>;
  addCategory: (category: CreateInventoryCategoryDto) => Promise<void>;
  updateCategory: (id: string, updates: UpdateInventoryCategoryDto) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  toggleCategoryStatus: (id: string) => Promise<void>;

  // Queries
  getActiveCategories: () => InventoryCategoryFrontend[];
  getCategoryById: (id: string) => InventoryCategoryFrontend | undefined;
}

export const useInventoryCategoryStore = create<InventoryCategoryState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  loadCategories: async () => {
    set({ loading: true, error: null });
    try {
      const response = await inventoryApi.getInventoryCategories();
      const categories = transformInventoryCategoriesFromApi(response.data);
      set({ categories, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar categorías';
      set({ error: errorMessage, loading: false });
      console.error('Error en loadCategories:', error);
    }
  },

  addCategory: async (categoryData) => {
    set({ loading: true, error: null });
    try {
      const apiResponse = await inventoryApi.createInventoryCategory(categoryData);
      const newCategory = transformInventoryCategoryFromApi(apiResponse);

      set(state => ({
        categories: [...state.categories, newCategory],
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al agregar categoría';
      set({ error: errorMessage, loading: false });
      console.error('Error en addCategory:', error);
      throw error;
    }
  },

  updateCategory: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const categoryId = parseInt(id, 10);
      if (isNaN(categoryId)) {
        throw new Error('ID de categoría inválido');
      }

      const apiResponse = await inventoryApi.updateInventoryCategory(categoryId, updates);
      const updatedCategory = transformInventoryCategoryFromApi(apiResponse);

      set(state => ({
        categories: state.categories.map(c =>
          c.id === id ? updatedCategory : c
        ),
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar categoría';
      set({ error: errorMessage, loading: false });
      console.error('Error en updateCategory:', error);
      throw error;
    }
  },

  deleteCategory: async (id) => {
    set({ loading: true, error: null });
    try {
      const categoryId = parseInt(id, 10);
      if (isNaN(categoryId)) {
        throw new Error('ID de categoría inválido');
      }

      await inventoryApi.deleteInventoryCategory(categoryId);

      set(state => ({
        categories: state.categories.filter(c => c.id !== id),
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar categoría';
      set({ error: errorMessage, loading: false });
      console.error('Error en deleteCategory:', error);
      throw error;
    }
  },

  toggleCategoryStatus: async (id) => {
    const category = get().categories.find(c => c.id === id);
    if (!category) {
      throw new Error('Categoría no encontrada');
    }

    set({ loading: true, error: null });
    try {
      const categoryId = parseInt(id, 10);
      if (isNaN(categoryId)) {
        throw new Error('ID de categoría inválido');
      }

      const apiResponse = await inventoryApi.toggleInventoryCategoryStatus(categoryId);
      const updatedCategory = transformInventoryCategoryFromApi(apiResponse);

      set(state => ({
        categories: state.categories.map(c =>
          c.id === id ? updatedCategory : c
        ),
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar estado de categoría';
      set({ error: errorMessage, loading: false });
      console.error('Error en toggleCategoryStatus:', error);
      throw error;
    }
  },

  // Queries
  getActiveCategories: () => {
    return get().categories.filter(c => c.isActive);
  },

  getCategoryById: (id) => {
    return get().categories.find(c => c.id === id);
  }
}));

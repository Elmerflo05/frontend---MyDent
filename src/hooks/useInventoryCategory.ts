import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useInventoryCategoryStore } from '@/store/inventoryCategoryStore';

export const useInventoryCategory = () => {
  const {
    categories,
    loading,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
  } = useInventoryCategoryStore();

  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleAddCategory = async (categoryData?: { name: string; description: string; color?: string; isActive?: boolean }) => {
    const dataToAdd = categoryData || newCategory;

    if (!dataToAdd.name.trim()) {
      toast.error('El nombre de la categoría es requerido');
      return;
    }

    try {
      await addCategory({
        name: dataToAdd.name.trim(),
        description: dataToAdd.description.trim(),
        color: categoryData?.color,
        isActive: categoryData?.isActive ?? true
      });

      if (!categoryData) {
        setNewCategory({ name: '', description: '' });
      }

      toast.success('Categoría agregada exitosamente');
    } catch (error) {
      toast.error('Error al agregar categoría');
      throw error;
    }
  };

  const handleUpdateCategory = async (id: string, updates: { name?: string; description?: string; color?: string; isActive?: boolean }) => {
    try {
      await updateCategory(id, updates);
      toast.success('Categoría actualizada exitosamente');
    } catch (error) {
      toast.error('Error al actualizar categoría');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      return;
    }

    try {
      await deleteCategory(id);
      toast.success('Categoría eliminada exitosamente');
    } catch (error) {
      toast.error('Error al eliminar categoría');
    }
  };

  const handleToggleCategory = async (id: string) => {
    try {
      await toggleCategoryStatus(id);
      toast.success('Estado de categoría actualizado');
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  return {
    categories,
    loading,
    newCategory,
    setNewCategory,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleToggleCategory
  };
};

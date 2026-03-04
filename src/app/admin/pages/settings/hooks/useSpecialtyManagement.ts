import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSpecialtyStore } from '@/store/specialtyStore';

export const useSpecialtyManagement = () => {
  const {
    specialties,
    loading,
    loadSpecialties,
    addSpecialty,
    updateSpecialty,
    deleteSpecialty,
    toggleSpecialtyStatus
  } = useSpecialtyStore();

  const [newSpecialty, setNewSpecialty] = useState({ name: '', description: '' });

  useEffect(() => {
    loadSpecialties();
  }, [loadSpecialties]);

  const handleAddSpecialty = async () => {
    if (!newSpecialty.name.trim()) {
      toast.error('El nombre de la especialidad es requerido');
      return;
    }

    try {
      await addSpecialty({
        name: newSpecialty.name.trim(),
        description: newSpecialty.description.trim(),
        isActive: true
      });
      setNewSpecialty({ name: '', description: '' });
      toast.success('Especialidad agregada exitosamente');
    } catch (error) {
      toast.error('Error al agregar especialidad');
    }
  };

  const handleDeleteSpecialty = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta especialidad?')) {
      return;
    }

    try {
      await deleteSpecialty(id);
      toast.success('Especialidad eliminada exitosamente');
    } catch (error) {
      toast.error('Error al eliminar especialidad');
    }
  };

  const handleToggleSpecialty = async (id: string) => {
    try {
      await toggleSpecialtyStatus(id);
      toast.success('Estado de especialidad actualizado');
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  return {
    specialties,
    loading,
    newSpecialty,
    setNewSpecialty,
    handleAddSpecialty,
    handleDeleteSpecialty,
    handleToggleSpecialty,
    updateSpecialty
  };
};

import { create } from 'zustand';
import { specialtiesApi } from '@/services/api/specialtiesApi';
import {
  transformSpecialtiesFromApi,
  transformSpecialtyFromApi,
  type SpecialtyFrontend,
  type CreateSpecialtyDto,
  type UpdateSpecialtyDto
} from '@/types/api/specialty';

interface SpecialtyState {
  specialties: SpecialtyFrontend[];
  loading: boolean;
  error: string | null;

  // Actions
  loadSpecialties: (includeInactive?: boolean) => Promise<void>;
  addSpecialty: (specialty: CreateSpecialtyDto) => Promise<void>;
  updateSpecialty: (id: string, updates: UpdateSpecialtyDto) => Promise<void>;
  deleteSpecialty: (id: string) => Promise<void>;
  toggleSpecialtyStatus: (id: string) => Promise<void>;

  // Queries
  getActiveSpecialties: () => SpecialtyFrontend[];
  getSpecialtyById: (id: string) => SpecialtyFrontend | undefined;
}

export const useSpecialtyStore = create<SpecialtyState>((set, get) => ({
  specialties: [],
  loading: false,
  error: null,

  loadSpecialties: async (includeInactive: boolean = true) => {
    set({ loading: true, error: null });
    try {
      // Por defecto incluir inactivas para la gestión en configuración del sistema
      const response = await specialtiesApi.getSpecialties(includeInactive);
      const specialties = transformSpecialtiesFromApi(response.data);
      set({ specialties, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar especialidades';
      set({ error: errorMessage, loading: false });
      console.error('Error en loadSpecialties:', error);
    }
  },

  addSpecialty: async (specialtyData) => {
    set({ loading: true, error: null });
    try {
      const apiResponse = await specialtiesApi.createSpecialty(specialtyData);
      const newSpecialty = transformSpecialtyFromApi(apiResponse);

      set(state => ({
        specialties: [...state.specialties, newSpecialty],
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al agregar especialidad';
      set({ error: errorMessage, loading: false });
      console.error('Error en addSpecialty:', error);
      throw error;
    }
  },

  updateSpecialty: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const specialtyId = parseInt(id, 10);
      if (isNaN(specialtyId)) {
        throw new Error('ID de especialidad inválido');
      }

      const apiResponse = await specialtiesApi.updateSpecialty(specialtyId, updates);
      const updatedSpecialty = transformSpecialtyFromApi(apiResponse);

      set(state => ({
        specialties: state.specialties.map(s =>
          s.id === id ? updatedSpecialty : s
        ),
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar especialidad';
      set({ error: errorMessage, loading: false });
      console.error('Error en updateSpecialty:', error);
      throw error;
    }
  },

  deleteSpecialty: async (id) => {
    set({ loading: true, error: null });
    try {
      const specialtyId = parseInt(id, 10);
      if (isNaN(specialtyId)) {
        throw new Error('ID de especialidad inválido');
      }

      await specialtiesApi.deleteSpecialty(specialtyId);

      set(state => ({
        specialties: state.specialties.filter(s => s.id !== id),
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar especialidad';
      set({ error: errorMessage, loading: false });
      console.error('Error en deleteSpecialty:', error);
      throw error;
    }
  },

  toggleSpecialtyStatus: async (id) => {
    const specialty = get().specialties.find(s => s.id === id);
    if (!specialty) {
      throw new Error('Especialidad no encontrada');
    }

    set({ loading: true, error: null });
    try {
      const specialtyId = parseInt(id, 10);
      if (isNaN(specialtyId)) {
        throw new Error('ID de especialidad inválido');
      }

      const apiResponse = await specialtiesApi.toggleSpecialtyStatus(specialtyId);
      const updatedSpecialty = transformSpecialtyFromApi(apiResponse);

      set(state => ({
        specialties: state.specialties.map(s =>
          s.id === id ? updatedSpecialty : s
        ),
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar estado de especialidad';
      set({ error: errorMessage, loading: false });
      console.error('Error en toggleSpecialtyStatus:', error);
      throw error;
    }
  },

  // Queries
  getActiveSpecialties: () => {
    return get().specialties.filter(s => s.isActive);
  },

  getSpecialtyById: (id) => {
    return get().specialties.find(s => s.id === id);
  }
}));

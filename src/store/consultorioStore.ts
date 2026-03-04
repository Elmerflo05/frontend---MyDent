import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { consultationsApi, ConsultationRoomData } from '@/services/api/consultationsApi';
import type { Consultorio } from '@/types';

// ============================================================================
// MAPPERS: Conversión entre formato frontend (Consultorio) y backend (ConsultationRoomData)
// ============================================================================

/**
 * Convierte datos del backend (ConsultationRoomData) al formato del frontend (Consultorio)
 */
const mapBackendToFrontend = (room: ConsultationRoomData): Consultorio => {
  // El backend devuelve equipment_description, no equipment
  const equipmentStr = room.equipment_description || room.equipment || '';

  return {
    id: room.consultation_room_id?.toString() || room.room_id?.toString() || '',
    nombre: room.room_name || '',
    numero: room.room_code || room.room_number || '',
    sedeId: room.branch_id?.toString() || '',
    piso: room.floor || '',
    capacidad: room.capacity || 1,
    equipamiento: equipmentStr ? equipmentStr.split(',').map(e => e.trim()) : [],
    estado: room.is_active ? 'disponible' : 'inactivo',
    especialidades: [], // No existe en BD, se mantiene vacío
    horaApertura: '08:00', // Default - no existe en BD
    horaCierre: '20:00', // Default - no existe en BD
    color: '#3B82F6', // Default azul - no existe en BD
    observaciones: room.notes || '',
    isActive: room.is_active ?? true,
    createdAt: room.created_at ? new Date(room.created_at) : new Date(),
    updatedAt: room.updated_at ? new Date(room.updated_at) : new Date()
  };
};

/**
 * Convierte datos del frontend (Consultorio) al formato del backend (ConsultationRoomData)
 */
const mapFrontendToBackend = (consultorio: Partial<Consultorio>): Partial<ConsultationRoomData> => {
  const data: Partial<ConsultationRoomData> = {};

  if (consultorio.nombre !== undefined) data.room_name = consultorio.nombre;
  if (consultorio.numero !== undefined) data.room_code = consultorio.numero;
  if (consultorio.sedeId !== undefined) data.branch_id = parseInt(consultorio.sedeId);
  if (consultorio.piso !== undefined) data.floor = consultorio.piso;
  if (consultorio.capacidad !== undefined) data.capacity = consultorio.capacidad;
  // El backend espera equipment_description, no equipment
  if (consultorio.equipamiento !== undefined) data.equipment_description = consultorio.equipamiento.join(', ');
  if (consultorio.isActive !== undefined) data.is_active = consultorio.isActive;
  if (consultorio.observaciones !== undefined) data.notes = consultorio.observaciones;

  return data;
};

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface ConsultorioStore {
  consultorios: Consultorio[];
  loading: boolean;
  error: string | null;

  // Actions
  loadConsultorios: () => Promise<void>;
  addConsultorio: (consultorio: Omit<Consultorio, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateConsultorio: (id: string, updates: Partial<Consultorio>) => Promise<void>;
  deleteConsultorio: (id: string) => Promise<void>;
  toggleConsultorioStatus: (id: string) => Promise<void>;
  updateConsultorioEstado: (id: string, estado: Consultorio['estado']) => Promise<void>;

  // Queries
  getConsultorioById: (id: string) => Consultorio | undefined;
  getConsultoriosBySede: (sedeId: string) => Consultorio[];
  getActiveConsultorios: () => Consultorio[];
  getConsultoriosByEspecialidad: (especialidadId: string) => Consultorio[];
  getDisponibleConsultorios: () => Consultorio[];
}

// ============================================================================
// STORE IMPLEMENTATION - MIGRADO A API REAL
// ============================================================================

export const useConsultorioStore = create<ConsultorioStore>()(
  persist(
    (set, get) => ({
      consultorios: [],
      loading: false,
      error: null,

      /**
       * Carga todos los consultorios desde la API
       * 🔧 MIGRADO: Usa consultationsApi.getRooms() en lugar de IndexedDB
       */
      loadConsultorios: async () => {
        set({ loading: true, error: null });
        try {
          const response = await consultationsApi.getRooms();

          if (!response.success) {
            throw new Error('Error al cargar consultorios desde el servidor');
          }

          // Mapear datos del backend al formato del frontend
          const consultorios = (response.data || []).map(mapBackendToFrontend);

          set({ consultorios, loading: false });
        } catch (error) {
          console.error('Error al cargar consultorios:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al cargar consultorios',
            loading: false
          });
        }
      },

      /**
       * Agrega un nuevo consultorio
       * 🔧 MIGRADO: Usa consultationsApi.createRoom() en lugar de IndexedDB
       */
      addConsultorio: async (consultorioData) => {
        set({ loading: true, error: null });
        try {
          // Convertir al formato del backend
          const backendData = mapFrontendToBackend(consultorioData) as ConsultationRoomData;

          // Validar campos requeridos
          if (!backendData.branch_id || !backendData.room_name) {
            throw new Error('Sede y nombre del consultorio son requeridos');
          }

          const response = await consultationsApi.createRoom(backendData);

          if (!response.success || !response.data) {
            throw new Error(response.message || 'Error al crear consultorio');
          }

          // Convertir respuesta al formato frontend y agregar al estado
          const newConsultorio = mapBackendToFrontend(response.data);

          set(state => ({
            consultorios: [...state.consultorios, newConsultorio],
            loading: false
          }));
        } catch (error) {
          console.error('Error al agregar consultorio:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al agregar consultorio',
            loading: false
          });
          throw error;
        }
      },

      /**
       * Actualiza un consultorio existente
       * 🔧 MIGRADO: Usa consultationsApi.updateRoom() en lugar de IndexedDB
       */
      updateConsultorio: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          // Convertir al formato del backend
          const backendData = mapFrontendToBackend(updates);

          const response = await consultationsApi.updateRoom(parseInt(id), backendData);

          if (!response.success || !response.data) {
            throw new Error(response.message || 'Error al actualizar consultorio');
          }

          // Convertir respuesta y actualizar estado local
          const updatedConsultorio = mapBackendToFrontend(response.data);

          set(state => ({
            consultorios: state.consultorios.map(c =>
              c.id === id ? updatedConsultorio : c
            ),
            loading: false
          }));
        } catch (error) {
          console.error('Error al actualizar consultorio:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al actualizar consultorio',
            loading: false
          });
          throw error;
        }
      },

      /**
       * Elimina un consultorio (soft delete en backend)
       * 🔧 MIGRADO: Usa consultationsApi.deleteRoom() en lugar de IndexedDB
       */
      deleteConsultorio: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await consultationsApi.deleteRoom(parseInt(id));

          if (!response.success) {
            throw new Error(response.message || 'Error al eliminar consultorio');
          }

          set(state => ({
            consultorios: state.consultorios.filter(c => c.id !== id),
            loading: false
          }));
        } catch (error) {
          console.error('Error al eliminar consultorio:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al eliminar consultorio',
            loading: false
          });
          throw error;
        }
      },

      /**
       * Activa/desactiva un consultorio
       */
      toggleConsultorioStatus: async (id) => {
        const consultorio = get().getConsultorioById(id);
        if (!consultorio) return;

        await get().updateConsultorio(id, {
          isActive: !consultorio.isActive,
          estado: !consultorio.isActive ? 'disponible' : 'inactivo'
        });
      },

      /**
       * Actualiza el estado de disponibilidad de un consultorio
       */
      updateConsultorioEstado: async (id, estado) => {
        await get().updateConsultorio(id, { estado });
      },

      // ========================================================================
      // QUERIES (sin cambios - trabajan con datos locales del store)
      // ========================================================================

      getConsultorioById: (id) => {
        return get().consultorios.find(c => c.id === id);
      },

      getConsultoriosBySede: (sedeId) => {
        return get().consultorios.filter(c => c.sedeId === sedeId);
      },

      getActiveConsultorios: () => {
        return get().consultorios.filter(c => c.isActive);
      },

      getConsultoriosByEspecialidad: (especialidadId) => {
        return get().consultorios.filter(c =>
          c.especialidades?.includes(especialidadId) && c.isActive
        );
      },

      getDisponibleConsultorios: () => {
        return get().consultorios.filter(c =>
          c.isActive && c.estado === 'disponible'
        );
      }
    }),
    {
      name: 'consultorio-storage',
      partialize: (state) => ({ consultorios: state.consultorios })
    }
  )
);

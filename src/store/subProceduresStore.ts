/**
 * Sub-Procedures Store - Zustand
 * Store para sub-procedimientos con precios por plan de salud
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { subProceduresApi, SubProcedureData, SubProcedureWithPrice } from '@/services/api/subProceduresApi';

interface SubProceduresState {
  // Estado
  subProcedures: SubProcedureData[];
  specialties: string[];
  selectedSubProcedure: SubProcedureData | null;
  loading: boolean;
  error: string | null;

  // Acciones de lectura
  loadSubProcedures: (filters?: {
    specialty?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  loadSpecialties: () => Promise<void>;
  loadSubProceduresBySpecialty: (specialty: string, planCode?: string) => Promise<void>;
  getSubProcedureById: (id: number) => Promise<SubProcedureData | null>;
  getSubProcedureByCode: (code: string) => Promise<SubProcedureData | null>;

  // Acciones de precios
  getPriceForPatient: (subProcedureId: number, patientId: number) => Promise<SubProcedureWithPrice | null>;
  getPriceByCodeForPatient: (code: string, patientId: number) => Promise<SubProcedureWithPrice | null>;

  // Acciones de escritura (Admin)
  createSubProcedure: (data: Partial<SubProcedureData>) => Promise<SubProcedureData>;
  updateSubProcedure: (id: number, data: Partial<SubProcedureData>) => Promise<SubProcedureData>;
  deleteSubProcedure: (id: number) => Promise<void>;

  // Utilidades
  selectSubProcedure: (subProcedure: SubProcedureData | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  subProcedures: [],
  specialties: [],
  selectedSubProcedure: null,
  loading: false,
  error: null
};

export const useSubProceduresStore = create<SubProceduresState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ========================================================================
      // ACCIONES DE LECTURA
      // ========================================================================

      loadSubProcedures: async (filters) => {
        set({ loading: true, error: null });
        try {
          const response = await subProceduresApi.getSubProcedures(filters);
          set({
            subProcedures: response.data || [],
            loading: false
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando sub-procedimientos',
            loading: false
          });
        }
      },

      loadSpecialties: async () => {
        set({ loading: true, error: null });
        try {
          const response = await subProceduresApi.getSpecialties();
          set({
            specialties: response.data || [],
            loading: false
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando especialidades',
            loading: false
          });
        }
      },

      loadSubProceduresBySpecialty: async (specialty, planCode) => {
        set({ loading: true, error: null });
        try {
          const response = await subProceduresApi.getSubProceduresBySpecialtyWithPrices(specialty, planCode);
          set({
            subProcedures: response.data || [],
            loading: false
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error cargando sub-procedimientos',
            loading: false
          });
        }
      },

      getSubProcedureById: async (id) => {
        try {
          const response = await subProceduresApi.getSubProcedureById(id);
          return response.data || null;
        } catch (error) {
          return null;
        }
      },

      getSubProcedureByCode: async (code) => {
        try {
          const response = await subProceduresApi.getSubProcedureByCode(code);
          return response.data || null;
        } catch (error) {
          return null;
        }
      },

      // ========================================================================
      // ACCIONES DE PRECIOS
      // ========================================================================

      getPriceForPatient: async (subProcedureId, patientId) => {
        try {
          const response = await subProceduresApi.getPriceForPatient(subProcedureId, patientId);
          return response.data || null;
        } catch (error) {
          return null;
        }
      },

      getPriceByCodeForPatient: async (code, patientId) => {
        try {
          const response = await subProceduresApi.getPriceByCodeForPatient(code, patientId);
          return response.data || null;
        } catch (error) {
          return null;
        }
      },

      // ========================================================================
      // ACCIONES DE ESCRITURA (Admin)
      // ========================================================================

      createSubProcedure: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await subProceduresApi.createSubProcedure(data);
          if (!response.success || !response.data) {
            throw new Error('Error al crear sub-procedimiento');
          }
          set(state => ({
            subProcedures: [...state.subProcedures, response.data],
            loading: false
          }));
          return response.data;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al crear',
            loading: false
          });
          throw error;
        }
      },

      updateSubProcedure: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const response = await subProceduresApi.updateSubProcedure(id, data);
          if (!response.success || !response.data) {
            throw new Error('Error al actualizar sub-procedimiento');
          }
          set(state => ({
            subProcedures: state.subProcedures.map(sp =>
              sp.sub_procedure_id === id ? response.data : sp
            ),
            selectedSubProcedure: state.selectedSubProcedure?.sub_procedure_id === id
              ? response.data
              : state.selectedSubProcedure,
            loading: false
          }));
          return response.data;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al actualizar',
            loading: false
          });
          throw error;
        }
      },

      deleteSubProcedure: async (id) => {
        set({ loading: true, error: null });
        try {
          await subProceduresApi.deleteSubProcedure(id);
          set(state => ({
            subProcedures: state.subProcedures.filter(sp => sp.sub_procedure_id !== id),
            selectedSubProcedure: state.selectedSubProcedure?.sub_procedure_id === id
              ? null
              : state.selectedSubProcedure,
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al eliminar',
            loading: false
          });
          throw error;
        }
      },

      // ========================================================================
      // UTILIDADES
      // ========================================================================

      selectSubProcedure: (subProcedure) => {
        set({ selectedSubProcedure: subProcedure });
      },

      clearError: () => set({ error: null }),

      reset: () => set(initialState)
    }),
    { name: 'SubProceduresStore' }
  )
);

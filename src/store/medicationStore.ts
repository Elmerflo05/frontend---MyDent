import { create } from 'zustand';
import { toast } from 'sonner';
import medicationsApi from '@/services/api/medicationsApi';
import type {
  MedicationFrontend,
  CreateMedicationDto,
  UpdateMedicationDto
} from '@/types/api/medication';

interface MedicationStore {
  // Estado
  medications: MedicationFrontend[];
  loading: boolean;
  error: string | null;

  // Acciones
  loadMedications: (params?: {
    medication_type?: string;
    search?: string;
  }) => Promise<void>;
  getMedicationById: (id: string) => Promise<MedicationFrontend | null>;
  addMedication: (medication: CreateMedicationDto) => Promise<MedicationFrontend | null>;
  updateMedication: (id: string, medication: UpdateMedicationDto) => Promise<MedicationFrontend | null>;
  deleteMedication: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export const useMedicationStore = create<MedicationStore>((set, get) => ({
  // Estado inicial
  medications: [],
  loading: false,
  error: null,

  // Cargar todos los medicamentos
  loadMedications: async (params) => {
    set({ loading: true, error: null });
    try {
      const medications = await medicationsApi.getMedications(params);
      set({ medications, loading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Error al cargar medicamentos';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  // Obtener medicamento por ID
  getMedicationById: async (id) => {
    set({ loading: true, error: null });
    try {
      const medication = await medicationsApi.getMedicationById(parseInt(id));
      set({ loading: false });
      return medication;
    } catch (error: any) {
      const errorMessage = error.message || 'Error al obtener medicamento';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return null;
    }
  },

  // Crear medicamento
  addMedication: async (medicationData) => {
    set({ loading: true, error: null });
    try {
      const newMedication = await medicationsApi.createMedication(medicationData);

      // Actualizar lista local
      set((state) => ({
        medications: [...state.medications, newMedication],
        loading: false
      }));

      toast.success('Medicamento creado exitosamente');
      return newMedication;
    } catch (error: any) {
      const errorMessage = error.message || 'Error al crear medicamento';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return null;
    }
  },

  // Actualizar medicamento
  updateMedication: async (id, medicationData) => {
    set({ loading: true, error: null });
    try {
      const updatedMedication = await medicationsApi.updateMedication(parseInt(id), medicationData);

      // Actualizar en lista local
      set((state) => ({
        medications: state.medications.map((med) =>
          med.id === id ? updatedMedication : med
        ),
        loading: false
      }));

      toast.success('Medicamento actualizado exitosamente');
      return updatedMedication;
    } catch (error: any) {
      const errorMessage = error.message || 'Error al actualizar medicamento';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return null;
    }
  },

  // Eliminar medicamento
  deleteMedication: async (id) => {
    set({ loading: true, error: null });
    try {
      await medicationsApi.deleteMedication(parseInt(id));

      // Remover de lista local
      set((state) => ({
        medications: state.medications.filter((med) => med.id !== id),
        loading: false
      }));

      toast.success('Medicamento eliminado exitosamente');
      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Error al eliminar medicamento';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return false;
    }
  },

  // Limpiar error
  clearError: () => set({ error: null })
}));

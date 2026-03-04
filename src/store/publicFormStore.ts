import { create } from 'zustand';
import { publicFormsApi } from '@/services/api/publicFormsApi';
import type { PublicForm, PublicFormSubmission } from '@/types';

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface PublicFormStore {
  forms: PublicForm[];
  submissions: PublicFormSubmission[];
  selectedForm: PublicForm | null;
  selectedSubmission: PublicFormSubmission | null;
  loading: boolean;
  error: string | null;

  // Forms management
  loadForms: () => Promise<void>;
  loadActiveForms: () => Promise<void>;
  getFormByCode: (code: string) => Promise<PublicForm | undefined>;
  createForm: (data: Omit<PublicForm, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PublicForm>;
  updateForm: (id: string, data: Partial<PublicForm>) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;
  toggleFormStatus: (id: string) => Promise<void>;
  setSelectedForm: (form: PublicForm | null) => void;

  // Submissions management
  loadSubmissions: () => Promise<void>;
  loadSubmissionsByForm: (formId: string) => Promise<void>;
  loadSubmissionsByStatus: (status: PublicFormSubmission['status']) => Promise<void>;
  createSubmission: (data: Omit<PublicFormSubmission, 'id' | 'submittedAt'>) => Promise<PublicFormSubmission>;
  updateSubmissionStatus: (id: string, status: PublicFormSubmission['status'], notes?: string) => Promise<void>;
  markAsContacted: (id: string, userId: string, notes?: string) => Promise<void>;
  setSelectedSubmission: (submission: PublicFormSubmission | null) => void;

  // Utilities
  generateUniqueCode: () => Promise<string>;
}

// ============================================================================
// STORE IMPLEMENTATION - MIGRADO A API REAL
// ============================================================================

export const usePublicFormStore = create<PublicFormStore>((set, get) => ({
  forms: [],
  submissions: [],
  selectedForm: null,
  selectedSubmission: null,
  loading: false,
  error: null,

  // ==================== FORMS (Plantillas) ====================

  /**
   * Carga todos los formularios desde la API
   * 🔧 MIGRADO: Usa publicFormsApi.getForms() en lugar de IndexedDB
   */
  loadForms: async () => {
    set({ loading: true, error: null });
    try {
      const forms = await publicFormsApi.getForms();
      set({ forms, loading: false });
    } catch (error) {
      console.error('Error al cargar formularios:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  /**
   * Carga solo formularios activos
   * 🔧 MIGRADO: Usa publicFormsApi.getActiveForms()
   */
  loadActiveForms: async () => {
    set({ loading: true, error: null });
    try {
      const forms = await publicFormsApi.getActiveForms();
      set({ forms, loading: false });
    } catch (error) {
      console.error('Error al cargar formularios activos:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  /**
   * Obtiene un formulario por su codigo
   * 🔧 MIGRADO: Usa publicFormsApi.getFormByCode()
   */
  getFormByCode: async (code: string) => {
    try {
      return await publicFormsApi.getFormByCode(code);
    } catch (error) {
      set({ error: (error as Error).message });
      return undefined;
    }
  },

  /**
   * Crea un nuevo formulario
   * 🔧 MIGRADO: Usa publicFormsApi.createForm()
   */
  createForm: async (data) => {
    set({ loading: true, error: null });
    try {
      const newForm = await publicFormsApi.createForm(data);

      // Recargar formularios para mantener sincronizado
      await get().loadForms();
      set({ loading: false });

      return newForm;
    } catch (error) {
      console.error('Error al crear formulario:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  /**
   * Actualiza un formulario existente
   * 🔧 MIGRADO: Usa publicFormsApi.updateForm()
   */
  updateForm: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await publicFormsApi.updateForm(parseInt(id), data);

      // Recargar formularios
      await get().loadForms();
      set({ loading: false });
    } catch (error) {
      console.error('Error al actualizar formulario:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  /**
   * Elimina un formulario
   * 🔧 MIGRADO: Usa publicFormsApi.deleteForm()
   */
  deleteForm: async (id) => {
    set({ loading: true, error: null });
    try {
      await publicFormsApi.deleteForm(parseInt(id));

      // Recargar formularios
      await get().loadForms();
      set({ loading: false });
    } catch (error) {
      console.error('Error al eliminar formulario:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  /**
   * Activa/desactiva un formulario
   * 🔧 MIGRADO: Usa publicFormsApi.toggleFormStatus()
   */
  toggleFormStatus: async (id) => {
    set({ loading: true, error: null });
    try {
      const form = get().forms.find(f => f.id === id);
      if (!form) throw new Error('Formulario no encontrado');

      await publicFormsApi.toggleFormStatus(parseInt(id), form.active);

      // Recargar formularios
      await get().loadForms();
      set({ loading: false });
    } catch (error) {
      console.error('Error al cambiar estado del formulario:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  /**
   * Establece el formulario seleccionado
   */
  setSelectedForm: (form) => {
    set({ selectedForm: form });
  },

  // ==================== SUBMISSIONS (Envios) ====================

  /**
   * Carga todos los envios
   * 🔧 MIGRADO: Usa publicFormsApi.getAllSubmissions()
   */
  loadSubmissions: async () => {
    set({ loading: true, error: null });
    try {
      const submissions = await publicFormsApi.getAllSubmissions();
      set({ submissions, loading: false });
    } catch (error) {
      console.error('Error al cargar envios:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  /**
   * Carga envios por formulario
   * 🔧 MIGRADO: Usa publicFormsApi.getSubmissionsByForm()
   */
  loadSubmissionsByForm: async (formId) => {
    set({ loading: true, error: null });
    try {
      const submissions = await publicFormsApi.getSubmissionsByForm(formId);
      set({ submissions, loading: false });
    } catch (error) {
      console.error('Error al cargar envios por formulario:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  /**
   * Carga envios por estado
   * 🔧 MIGRADO: Usa publicFormsApi.getSubmissionsByStatus()
   */
  loadSubmissionsByStatus: async (status) => {
    set({ loading: true, error: null });
    try {
      const submissions = await publicFormsApi.getSubmissionsByStatus(status);
      set({ submissions, loading: false });
    } catch (error) {
      console.error('Error al cargar envios por estado:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  /**
   * Crea un nuevo envio
   * 🔧 MIGRADO: Usa publicFormsApi.createSubmission()
   */
  createSubmission: async (data) => {
    set({ loading: true, error: null });
    try {
      const newSubmission = await publicFormsApi.createSubmission(data);
      set({ loading: false });
      return newSubmission;
    } catch (error) {
      console.error('Error al crear envio:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  /**
   * Actualiza el estado de un envio
   * 🔧 MIGRADO: Usa publicFormsApi.updateSubmissionStatus()
   */
  updateSubmissionStatus: async (id, status, notes) => {
    set({ loading: true, error: null });
    try {
      await publicFormsApi.updateSubmissionStatus(parseInt(id), status, notes);

      // Recargar envios
      await get().loadSubmissions();
      set({ loading: false });
    } catch (error) {
      console.error('Error al actualizar estado del envio:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  /**
   * Marca un envio como contactado
   * 🔧 MIGRADO: Usa publicFormsApi.markAsContacted()
   */
  markAsContacted: async (id, userId, notes) => {
    set({ loading: true, error: null });
    try {
      await publicFormsApi.markAsContacted(parseInt(id), userId, notes);

      // Recargar envios
      await get().loadSubmissions();
      set({ loading: false });
    } catch (error) {
      console.error('Error al marcar como contactado:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  /**
   * Establece el envio seleccionado
   */
  setSelectedSubmission: (submission) => {
    set({ selectedSubmission: submission });
  },

  // ==================== UTILIDADES ====================

  /**
   * Genera un codigo unico para formulario
   * 🔧 MIGRADO: Usa publicFormsApi.generateUniqueCode()
   */
  generateUniqueCode: async () => {
    return await publicFormsApi.generateUniqueCode(8);
  }
}));

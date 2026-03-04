import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { prosthesisOrdersApi } from '@/services/api/prosthesisOrdersApi';
import { ProsthesisRequest } from '@/types';
import { toast } from 'sonner';
import { useNotificationStore } from './notificationStore';

// ============================================================================
// INTERFACES
// ============================================================================

interface ProsthesisFilters {
  status: 'all' | 'pending' | 'sent' | 'in_progress' | 'received' | 'cancelled';
  dateFrom: Date | null;
  dateTo: Date | null;
  searchTerm: string;
  doctorId: string;
  patientId: string;
  sedeId: string;
}

interface ProsthesisStatistics {
  total: number;
  pending: number;
  sent: number;
  in_progress: number;
  received: number;
  cancelled: number;
  overdue: number;
  thisMonth: number;
  avgProcessingTime: number;
}

interface ProsthesisStore {
  // Estado principal
  requests: ProsthesisRequest[];
  selectedRequest: ProsthesisRequest | null;
  loading: boolean;
  error: string | null;

  // Filtros y busqueda
  filters: ProsthesisFilters;
  searchResults: ProsthesisRequest[];

  // Estadisticas
  statistics: ProsthesisStatistics | null;

  // Acciones principales
  fetchRequests: (sedeId?: string) => Promise<void>;
  createRequest: (request: Omit<ProsthesisRequest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateRequest: (id: string, updates: Partial<ProsthesisRequest>) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;

  // Acciones especificas de protesis
  markAsReceived: (id: string, receptionDate: Date, notes?: string) => Promise<void>;
  updateStatus: (id: string, status: ProsthesisRequest['status'], notes?: string) => Promise<void>;

  // Gestion de filtros
  setFilter: <K extends keyof ProsthesisFilters>(key: K, value: ProsthesisFilters[K]) => void;
  clearFilters: () => void;
  applyFilters: () => void;

  // Busqueda
  searchRequests: (query: string) => void;

  // Seleccion
  setSelectedRequest: (request: ProsthesisRequest | null) => void;

  // Estadisticas
  refreshStatistics: (sedeId?: string) => Promise<void>;

  // Utilidades
  getRequestsByPatient: (patientId: string) => ProsthesisRequest[];
  getRequestsByDoctor: (doctorId: string) => ProsthesisRequest[];
  getOverdueRequests: () => ProsthesisRequest[];
  getRequestsByDateRange: (from: Date, to: Date) => ProsthesisRequest[];
  checkAndNotifyOverdue: () => void;

  // Estado UI
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const defaultFilters: ProsthesisFilters = {
  status: 'all',
  dateFrom: null,
  dateTo: null,
  searchTerm: '',
  doctorId: '',
  patientId: '',
  sedeId: ''
};

const defaultStatistics: ProsthesisStatistics = {
  total: 0,
  pending: 0,
  sent: 0,
  in_progress: 0,
  received: 0,
  cancelled: 0,
  overdue: 0,
  thisMonth: 0,
  avgProcessingTime: 0
};

// ============================================================================
// STORE IMPLEMENTATION - MIGRADO A API REAL
// ============================================================================

export const useProsthesisStore = create<ProsthesisStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      requests: [],
      selectedRequest: null,
      loading: false,
      error: null,
      filters: defaultFilters,
      searchResults: [],
      statistics: null,

      // ==================== ACCIONES PRINCIPALES ====================

      /**
       * Carga las solicitudes de protesis desde la API
       * MIGRADO: Usa prosthesisOrdersApi.getOrders() en lugar de IndexedDB
       */
      fetchRequests: async (sedeId?: string) => {
        set({ loading: true, error: null });

        try {
          let requests: ProsthesisRequest[];

          if (sedeId) {
            requests = await prosthesisOrdersApi.getOrdersBySede(sedeId);
          } else {
            requests = await prosthesisOrdersApi.getAllOrders();
          }

          // Ordenar por fecha de creacion descendente
          requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          set({ requests, loading: false });

          // Actualizar estadisticas
          get().refreshStatistics(sedeId);

        } catch (error) {
          console.error('Error al cargar solicitudes de protesis:', error);
          set({ error: 'Error al cargar las solicitudes de protesis', loading: false });
          toast.error('Error al cargar las solicitudes de protesis');
        }
      },

      /**
       * Crea una nueva solicitud de protesis
       * MIGRADO: Usa prosthesisOrdersApi.createOrder()
       */
      createRequest: async (requestData) => {
        set({ loading: true, error: null });

        try {
          const newRequest = await prosthesisOrdersApi.createOrder(requestData);

          // Actualizar el estado local
          const currentRequests = get().requests;
          set({
            requests: [newRequest, ...currentRequests],
            loading: false
          });

          // Actualizar estadisticas
          get().refreshStatistics(newRequest.sedeId);

          toast.success('Solicitud de protesis creada exitosamente');
          return newRequest.id;

        } catch (error) {
          console.error('Error al crear solicitud:', error);
          set({ error: 'Error al crear la solicitud de protesis', loading: false });
          toast.error('Error al crear la solicitud de protesis');
          throw error;
        }
      },

      /**
       * Actualiza una solicitud existente
       * MIGRADO: Usa prosthesisOrdersApi.updateOrder()
       */
      updateRequest: async (id, updates) => {
        set({ loading: true, error: null });

        try {
          const updatedRequest = await prosthesisOrdersApi.updateOrder(parseInt(id), updates);

          // Actualizar el estado local
          const currentRequests = get().requests;
          const updatedRequests = currentRequests.map(req =>
            req.id === id ? updatedRequest : req
          );

          set({
            requests: updatedRequests,
            loading: false
          });

          // Si es la solicitud seleccionada, actualizarla tambien
          const selectedRequest = get().selectedRequest;
          if (selectedRequest && selectedRequest.id === id) {
            set({ selectedRequest: updatedRequest });
          }

          toast.success('Solicitud de protesis actualizada exitosamente');

        } catch (error) {
          console.error('Error al actualizar solicitud:', error);
          set({ error: 'Error al actualizar la solicitud de protesis', loading: false });
          toast.error('Error al actualizar la solicitud de protesis');
          throw error;
        }
      },

      /**
       * Elimina una solicitud
       * MIGRADO: Usa prosthesisOrdersApi.deleteOrder()
       */
      deleteRequest: async (id) => {
        set({ loading: true, error: null });

        try {
          await prosthesisOrdersApi.deleteOrder(parseInt(id));

          // Actualizar el estado local
          const currentRequests = get().requests;
          const filteredRequests = currentRequests.filter(req => req.id !== id);

          set({
            requests: filteredRequests,
            loading: false
          });

          // Si era la solicitud seleccionada, limpiar seleccion
          const selectedRequest = get().selectedRequest;
          if (selectedRequest && selectedRequest.id === id) {
            set({ selectedRequest: null });
          }

          toast.success('Solicitud de protesis eliminada exitosamente');

        } catch (error) {
          console.error('Error al eliminar solicitud:', error);
          set({ error: 'Error al eliminar la solicitud de protesis', loading: false });
          toast.error('Error al eliminar la solicitud de protesis');
          throw error;
        }
      },

      // ==================== ACCIONES ESPECIFICAS ====================

      /**
       * Marca una solicitud como recibida
       * MIGRADO: Usa prosthesisOrdersApi.markAsReceived()
       */
      markAsReceived: async (id, receptionDate, notes = '') => {
        try {
          const currentRequest = get().requests.find(req => req.id === id);

          await prosthesisOrdersApi.markAsReceived(parseInt(id), receptionDate, notes);

          // Recargar la solicitud actualizada
          await get().fetchRequests(get().filters.sedeId || undefined);

          // Crear notificacion de protesis recibida
          if (currentRequest) {
            const notificationStore = useNotificationStore.getState();
            notificationStore.createProsthesisNotification('received', {
              ...currentRequest,
              receptionDate,
              status: 'received',
              notes: notes || undefined
            });
          }

          toast.success('Protesis marcada como recibida');

        } catch (error) {
          console.error('Error al marcar como recibida:', error);
          toast.error('Error al marcar como recibida');
          throw error;
        }
      },

      /**
       * Actualiza el estado de una solicitud
       * MIGRADO: Usa prosthesisOrdersApi.updateStatus()
       */
      updateStatus: async (id, status, notes = '') => {
        try {
          // Obtener el request actual para comparar estados
          const currentRequest = get().requests.find(req => req.id === id);
          const oldStatus = currentRequest?.status;

          await prosthesisOrdersApi.updateStatus(parseInt(id), status, notes);

          // Recargar la solicitud actualizada
          await get().fetchRequests(get().filters.sedeId || undefined);

          // Crear notificacion de cambio de estado
          if (currentRequest && oldStatus !== status) {
            const notificationStore = useNotificationStore.getState();
            notificationStore.createProsthesisNotification('status_change', {
              ...currentRequest,
              status
            });
          }

          const statusMessages = {
            pending: 'Estado cambiado a Pendiente',
            sent: 'Estado cambiado a Enviado',
            in_progress: 'Estado cambiado a En Proceso',
            received: 'Estado cambiado a Recibido',
            cancelled: 'Estado cambiado a Cancelado'
          };

          toast.success(statusMessages[status]);

        } catch (error) {
          console.error('Error al actualizar estado:', error);
          toast.error('Error al actualizar el estado');
          throw error;
        }
      },

      // ==================== GESTION DE FILTROS ====================

      setFilter: (key, value) => {
        set(state => ({
          filters: {
            ...state.filters,
            [key]: value
          }
        }));

        // Aplicar filtros automaticamente
        get().applyFilters();
      },

      clearFilters: () => {
        set({ filters: defaultFilters });
        get().applyFilters();
      },

      applyFilters: () => {
        const { requests, filters } = get();

        let filtered = [...requests];

        // Filtrar por estado
        if (filters.status !== 'all') {
          filtered = filtered.filter(req => req.status === filters.status);
        }

        // Filtrar por rango de fechas
        if (filters.dateFrom) {
          filtered = filtered.filter(req =>
            new Date(req.deliveryDate) >= filters.dateFrom!
          );
        }

        if (filters.dateTo) {
          filtered = filtered.filter(req =>
            new Date(req.deliveryDate) <= filters.dateTo!
          );
        }

        // Filtrar por doctor
        if (filters.doctorId) {
          filtered = filtered.filter(req => req.doctorId === filters.doctorId);
        }

        // Filtrar por paciente
        if (filters.patientId) {
          filtered = filtered.filter(req => req.patientId === filters.patientId);
        }

        // Filtrar por sede
        if (filters.sedeId) {
          filtered = filtered.filter(req => req.sedeId === filters.sedeId);
        }

        // Filtrar por termino de busqueda
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          filtered = filtered.filter(req =>
            req.description.toLowerCase().includes(searchLower) ||
            req.prosthesisName.toLowerCase().includes(searchLower) ||
            req.color?.toLowerCase().includes(searchLower) ||
            req.specifications?.toLowerCase().includes(searchLower) ||
            req.notes?.toLowerCase().includes(searchLower)
          );
        }

        set({ searchResults: filtered });
      },

      // ==================== BUSQUEDA ====================

      searchRequests: (query) => {
        set(state => ({
          filters: {
            ...state.filters,
            searchTerm: query
          }
        }));

        get().applyFilters();
      },

      // ==================== SELECCION ====================

      setSelectedRequest: (request) => {
        set({ selectedRequest: request });
      },

      // ==================== ESTADISTICAS ====================

      /**
       * Actualiza las estadisticas
       * MIGRADO: Calcula estadisticas desde datos cargados de la API
       */
      refreshStatistics: async (sedeId?: string) => {
        try {
          let requests = get().requests;

          // Si hay sedeId y los requests actuales no estan filtrados, filtrar
          if (sedeId) {
            requests = requests.filter(req => req.sedeId === sedeId);
          }

          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

          const stats: ProsthesisStatistics = {
            total: requests.length,
            pending: requests.filter(req => req.status === 'pending').length,
            sent: requests.filter(req => req.status === 'sent').length,
            in_progress: requests.filter(req => req.status === 'in_progress').length,
            received: requests.filter(req => req.status === 'received').length,
            cancelled: requests.filter(req => req.status === 'cancelled').length,
            overdue: requests.filter(req =>
              req.status !== 'received' &&
              req.status !== 'cancelled' &&
              new Date(req.tentativeDate) < now
            ).length,
            thisMonth: requests.filter(req =>
              new Date(req.createdAt) >= startOfMonth
            ).length,
            avgProcessingTime: 0
          };

          // Calcular tiempo promedio de procesamiento
          const completedRequests = requests.filter(req =>
            req.status === 'received' && req.receptionDate
          );

          if (completedRequests.length > 0) {
            const totalDays = completedRequests.reduce((sum, req) => {
              const deliveryTime = new Date(req.deliveryDate).getTime();
              const receptionTime = new Date(req.receptionDate!).getTime();
              const diffDays = Math.abs(receptionTime - deliveryTime) / (1000 * 60 * 60 * 24);
              return sum + diffDays;
            }, 0);

            stats.avgProcessingTime = Math.round(totalDays / completedRequests.length);
          }

          set({ statistics: stats });

        } catch (error) {
          console.error('Error al calcular estadisticas:', error);
          set({ statistics: defaultStatistics });
        }
      },

      // ==================== UTILIDADES ====================

      getRequestsByPatient: (patientId) => {
        return get().requests.filter(req => req.patientId === patientId);
      },

      getRequestsByDoctor: (doctorId) => {
        return get().requests.filter(req => req.doctorId === doctorId);
      },

      getOverdueRequests: () => {
        const now = new Date();
        return get().requests.filter(req =>
          req.status !== 'received' &&
          req.status !== 'cancelled' &&
          new Date(req.tentativeDate) < now
        );
      },

      getRequestsByDateRange: (from, to) => {
        return get().requests.filter(req => {
          const deliveryDate = new Date(req.deliveryDate);
          return deliveryDate >= from && deliveryDate <= to;
        });
      },

      checkAndNotifyOverdue: () => {
        const overdueRequests = get().getOverdueRequests();
        const notificationStore = useNotificationStore.getState();

        overdueRequests.forEach(request => {
          // Verificar si ya se notifico sobre este retraso
          const existingNotification = notificationStore.notifications.find(
            n => n.type === 'prosthesis_overdue' &&
                 n.relatedId === request.id &&
                 !n.read
          );

          // Solo notificar si no existe una notificacion pendiente
          if (!existingNotification) {
            notificationStore.createProsthesisNotification('overdue', request);
          }
        });
      },

      // ==================== ESTADO UI ====================

      setLoading: (loading) => {
        set({ loading });
      },

      setError: (error) => {
        set({ error });
      }
    }),
    {
      name: 'prosthesis-store',
      partialize: (state) => ({
        filters: state.filters,
        selectedRequest: state.selectedRequest
      })
    }
  )
);

export default useProsthesisStore;

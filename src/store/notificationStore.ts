import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: 'prosthesis_status_change' | 'prosthesis_overdue' | 'prosthesis_received' | 'system' | 'warning' | 'info';
  title: string;
  message: string;
  userId?: string; // Si es para un usuario específico
  roles?: string[]; // Si es para roles específicos
  sedeId?: string; // Si es para una sede específica
  relatedId?: string; // ID relacionado (ej: prosthesis request ID)
  relatedType?: 'prosthesis_request' | 'appointment' | 'patient';
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  actionRequired: boolean;
  actionUrl?: string; // URL para navegación directa
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date; // Para notificaciones temporales
}

export interface NotificationFilters {
  type?: string;
  priority?: string;
  read?: boolean;
  actionRequired?: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  filters: NotificationFilters;
  loading: boolean;

  // Acciones principales
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearExpired: () => void;

  // Filtros
  setFilter: (key: keyof NotificationFilters, value: any) => void;
  clearFilters: () => void;

  // Utilidades
  getNotificationsForUser: (userId: string, role: string, sedeId?: string) => Notification[];
  getUnreadCount: (userId: string, role: string, sedeId?: string) => number;
  createProsthesisNotification: (type: 'status_change' | 'overdue' | 'received', prosthesisData: any) => void;

  // Estado
  setLoading: (loading: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      filters: {},
      loading: false,

      // Acciones principales
      addNotification: (notificationData) => {
        const notification: Notification = {
          ...notificationData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          read: false
        };

        set(state => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }));
      },

      markAsRead: (notificationId) => {
        set(state => ({
          notifications: state.notifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true, readAt: new Date() }
              : notification
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));
      },

      markAllAsRead: () => {
        const now = new Date();
        set(state => ({
          notifications: state.notifications.map(notification => ({
            ...notification,
            read: true,
            readAt: notification.readAt || now
          })),
          unreadCount: 0
        }));
      },

      deleteNotification: (notificationId) => {
        set(state => {
          const notification = state.notifications.find(n => n.id === notificationId);
          const wasUnread = notification && !notification.read;

          return {
            notifications: state.notifications.filter(n => n.id !== notificationId),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
          };
        });
      },

      clearExpired: () => {
        const now = new Date();
        set(state => {
          const expiredNotifications = state.notifications.filter(n =>
            n.expiresAt && new Date(n.expiresAt) < now
          );
          const unreadExpired = expiredNotifications.filter(n => !n.read).length;

          return {
            notifications: state.notifications.filter(n =>
              !n.expiresAt || new Date(n.expiresAt) >= now
            ),
            unreadCount: Math.max(0, state.unreadCount - unreadExpired)
          };
        });
      },

      // Filtros
      setFilter: (key, value) => {
        set(state => ({
          filters: {
            ...state.filters,
            [key]: value
          }
        }));
      },

      clearFilters: () => {
        set({ filters: {} });
      },

      // Utilidades
      getNotificationsForUser: (userId, role, sedeId) => {
        const { notifications } = get();

        return notifications.filter(notification => {
          // Notificación específica para el usuario
          if (notification.userId && notification.userId !== userId) {
            return false;
          }

          // Notificación para roles específicos
          if (notification.roles && !notification.roles.includes(role)) {
            return false;
          }

          // Notificación para sede específica
          if (notification.sedeId && notification.sedeId !== sedeId) {
            return false;
          }

          return true;
        });
      },

      getUnreadCount: (userId, role, sedeId) => {
        const userNotifications = get().getNotificationsForUser(userId, role, sedeId);
        return userNotifications.filter(n => !n.read).length;
      },

      createProsthesisNotification: (type, prosthesisData) => {
        const { addNotification } = get();

        let notification: Omit<Notification, 'id' | 'createdAt' | 'read'>;

        switch (type) {
          case 'status_change':
            notification = {
              type: 'prosthesis_status_change',
              title: 'Cambio de Estado - Prótesis',
              message: `La prótesis "${prosthesisData.prosthesisName}" ha cambiado a estado: ${prosthesisData.status}`,
              relatedId: prosthesisData.id,
              relatedType: 'prosthesis_request',
              priority: 'medium',
              actionRequired: prosthesisData.status === 'received',
              actionUrl: `/prosthesis-lab/requests?id=${prosthesisData.id}`,
              roles: ['doctor', 'receptionist', 'prosthesis_technician'],
              sedeId: prosthesisData.sedeId
            };
            break;

          case 'overdue':
            notification = {
              type: 'prosthesis_overdue',
              title: 'Prótesis Atrasada',
              message: `La prótesis "${prosthesisData.prosthesisName}" está atrasada. Fecha esperada: ${new Date(prosthesisData.tentativeDate).toLocaleDateString('es-ES')}`,
              relatedId: prosthesisData.id,
              relatedType: 'prosthesis_request',
              priority: 'high',
              actionRequired: true,
              actionUrl: `/prosthesis-lab/requests?id=${prosthesisData.id}`,
              roles: ['admin', 'receptionist', 'prosthesis_technician'],
              sedeId: prosthesisData.sedeId
            };
            break;

          case 'received':
            notification = {
              type: 'prosthesis_received',
              title: 'Prótesis Recibida',
              message: `La prótesis "${prosthesisData.prosthesisName}" ha sido recibida y está lista para entrega al paciente`,
              relatedId: prosthesisData.id,
              relatedType: 'prosthesis_request',
              priority: 'medium',
              actionRequired: true,
              actionUrl: `/prosthesis-lab/reception?id=${prosthesisData.id}`,
              roles: ['doctor', 'receptionist'],
              sedeId: prosthesisData.sedeId,
              userId: prosthesisData.doctorId // Notificar al doctor específico
            };
            break;

          default:
            return;
        }

        addNotification(notification);
      },

      // Estado
      setLoading: (loading) => {
        set({ loading });
      }
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        notifications: state.notifications.filter(n =>
          !n.expiresAt || new Date(n.expiresAt) > new Date()
        )
      })
    }
  )
);

// Hook para integrar notificaciones con el store de prótesis
export const useProsthesisNotifications = () => {
  const { createProsthesisNotification } = useNotificationStore();

  const notifyStatusChange = (prosthesisRequest: any, oldStatus: string, newStatus: string) => {
    if (oldStatus !== newStatus) {
      createProsthesisNotification('status_change', {
        ...prosthesisRequest,
        status: newStatus
      });
    }
  };

  const notifyOverdue = (prosthesisRequest: any) => {
    createProsthesisNotification('overdue', prosthesisRequest);
  };

  const notifyReceived = (prosthesisRequest: any) => {
    createProsthesisNotification('received', prosthesisRequest);
  };

  return {
    notifyStatusChange,
    notifyOverdue,
    notifyReceived
  };
};

export default useNotificationStore;
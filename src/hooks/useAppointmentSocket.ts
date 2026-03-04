import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// URL del servidor WebSocket (mismo servidor del backend)
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4015';

interface AppointmentUpdateEvent {
  type: 'created' | 'updated' | 'cancelled' | 'status_changed' | 'approved' | 'rejected' | 'rescheduled' | 'reschedule_approved' | 'reschedule_rejected' | 'voucher_resubmitted';
  appointment: any;
  timestamp: string;
}

interface UseAppointmentSocketOptions {
  onAppointmentUpdate?: (event: AppointmentUpdateEvent) => void;
  showNotifications?: boolean;
  enabled?: boolean;
}

/**
 * Hook para manejar conexión WebSocket y recibir actualizaciones de citas en tiempo real
 */
export const useAppointmentSocket = (options: UseAppointmentSocketOptions = {}) => {
  const {
    onAppointmentUpdate,
    showNotifications = true,
    enabled = true
  } = options;

  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Mensajes de notificación por tipo de evento
  const getNotificationMessage = useCallback((event: AppointmentUpdateEvent): string | null => {
    const { type, appointment } = event;
    const patientName = appointment?.patient_name || 'Paciente';

    switch (type) {
      case 'created':
        return `Nueva cita creada para ${patientName}`;
      case 'updated':
        return `Cita actualizada para ${patientName}`;
      case 'cancelled':
        return `Cita cancelada para ${patientName}`;
      case 'approved':
        return `Cita aprobada para ${patientName}`;
      case 'rejected':
        return `Cita rechazada para ${patientName}`;
      case 'status_changed':
        return `Estado de cita actualizado para ${patientName}`;
      case 'rescheduled':
        return `Propuesta de reprogramación para ${patientName}`;
      case 'reschedule_approved':
        return `Reprogramación aprobada para ${patientName}`;
      case 'reschedule_rejected':
        return `Reprogramación rechazada para ${patientName}`;
      case 'voucher_resubmitted':
        return `Voucher reenviado para ${patientName}`;
      default:
        return null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !user) return;

    // Crear conexión Socket.IO
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
    });

    socketRef.current = socket;

    // Eventos de conexión
    socket.on('connect', () => {
      reconnectAttempts.current = 0;

      // Unirse a la sala correspondiente según el rol del usuario
      const isSuperAdmin = user.role === 'super_admin';
      const isPatient = user.role === 'patient';

      if (isSuperAdmin) {
        // Super admin ve todas las sedes
        socket.emit('join-global');
      }

      if (isPatient) {
        // Paciente se une a su sala específica
        // El user.id del paciente corresponde al patient_id en el backend
        socket.emit('join-patient', user.id);
      }

      // También unirse a la sala de la sede del usuario (si tiene una)
      const branchId = user.branch_id || user.sedeId;
      if (branchId) {
        socket.emit('join-branch', branchId);
      }
    });

    socket.on('disconnect', () => {
      // WebSocket desconectado
    });

    socket.on('connect_error', (error) => {
      reconnectAttempts.current++;
      console.error('❌ Error de conexión WebSocket:', error.message);

      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.warn('⚠️ Máximo de intentos de reconexión alcanzado');
      }
    });

    // Escuchar eventos de actualización de citas
    socket.on('appointment-update', (event: AppointmentUpdateEvent) => {
      // Llamar al callback si está definido
      if (onAppointmentUpdate) {
        onAppointmentUpdate(event);
      }

      // Mostrar notificación toast si está habilitado
      if (showNotifications) {
        const message = getNotificationMessage(event);
        if (message) {
          // Determinar el tipo de toast según el evento
          switch (event.type) {
            case 'created':
            case 'approved':
            case 'reschedule_approved':
              toast.success(message, { duration: 4000 });
              break;
            case 'cancelled':
            case 'rejected':
            case 'reschedule_rejected':
              toast.error(message, { duration: 4000 });
              break;
            default:
              toast.info(message, { duration: 4000 });
          }
        }
      }
    });

    // Cleanup al desmontar
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, user, onAppointmentUpdate, showNotifications, getNotificationMessage]);

  // Función para emitir eventos manualmente (si es necesario)
  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // Estado de conexión
  const isConnected = socketRef.current?.connected ?? false;

  return {
    socket: socketRef.current,
    isConnected,
    emit,
  };
};

export default useAppointmentSocket;

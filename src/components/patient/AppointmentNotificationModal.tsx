import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTimestampToLima } from '@/utils/dateUtils';
import { CheckCircle, Calendar, Clock, MapPin, User, X, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { Modal } from '@/components/common/Modal';

export interface AppointmentNotification {
  notification_id: number;
  notification_type: string;
  notification_title: string;
  notification_message: string;
  notification_data?: {
    appointment_id?: number;
    appointment_date?: string;
    appointment_time?: string;
    dentist_name?: string;
    reason?: string;
  };
  date_time_registration: string;
}

interface AppointmentNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppointmentNotification[];
  onMarkAsRead: (notificationId: number) => void;
}

const AppointmentNotificationModal: React.FC<AppointmentNotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const currentNotification = notifications[currentIndex];

  if (!currentNotification) return null;

  const getNotificationConfig = (type: string) => {
    switch (type) {
      case 'appointment_confirmed':
        return {
          icon: CheckCircle,
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          headerBg: 'from-green-500 to-green-600',
          title: '¡Cita Aprobada!',
          subtitle: 'Tu solicitud de cita ha sido confirmada'
        };
      case 'appointment_rescheduled':
        return {
          icon: RefreshCw,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          headerBg: 'from-blue-500 to-blue-600',
          title: 'Cita Reprogramada',
          subtitle: 'Tu cita ha sido reprogramada a una nueva fecha'
        };
      case 'appointment_cancelled':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          headerBg: 'from-red-500 to-red-600',
          title: 'Cita Cancelada',
          subtitle: 'Lamentamos informarte que tu cita fue cancelada'
        };
            case 'appointment_rejected':
        return {
          icon: XCircle,
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          headerBg: 'from-orange-500 to-orange-600',
          title: 'Solicitud Rechazada',
          subtitle: 'Tu solicitud de cita no pudo ser aprobada'
        };
      default:
        return {
          icon: Calendar,
          iconBg: 'bg-teal-100',
          iconColor: 'text-teal-600',
          headerBg: 'from-teal-500 to-teal-600',
          title: 'Actualización de Cita',
          subtitle: 'Tienes una actualización sobre tu cita'
        };
    }
  };

  const config = getNotificationConfig(currentNotification.notification_type);
  const IconComponent = config.icon;
  const data = currentNotification.notification_data || {};

  const handleNext = () => {
    // Marcar como leída la notificación actual
    onMarkAsRead(currentNotification.notification_id);

    if (currentIndex < notifications.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handleClose = () => {
    // Marcar todas como leídas al cerrar
    notifications.forEach(n => onMarkAsRead(n.notification_id));
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      closeOnBackdropClick={false}
      closeOnEscape={true}
      showCloseButton={false}
    >
      {/* Header con gradiente */}
      <div className={`bg-gradient-to-r ${config.headerBg} px-6 py-8 text-center relative`}>
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className={`w-20 h-20 ${config.iconBg} rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg`}
        >
          <IconComponent className={`w-10 h-10 ${config.iconColor}`} />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-white mb-1"
        >
          {config.title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white/90 text-sm"
        >
          {config.subtitle}
        </motion.p>

        {/* Indicador de múltiples notificaciones */}
        {notifications.length > 1 && (
          <div className="mt-4 flex justify-center gap-1.5">
            {notifications.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Contenido */}
      <Modal.Body className="p-6">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          {/* Mensaje principal */}
          <p className="text-gray-700 text-center">
            {currentNotification.notification_message}
          </p>

          {/* Detalles de la cita */}
          {(data.appointment_date || data.appointment_time || data.dentist_name) && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              {data.appointment_date && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fecha</p>
                    <p className="font-semibold text-gray-900">{data.appointment_date}</p>
                  </div>
                </div>
              )}

              {data.appointment_time && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hora</p>
                    <p className="font-semibold text-gray-900">{data.appointment_time}</p>
                  </div>
                </div>
              )}

              {data.dentist_name && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Doctor</p>
                    <p className="font-semibold text-gray-900">{data.dentist_name}</p>
                  </div>
                </div>
              )}

              {data.reason && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Motivo</p>
                  <p className="text-sm text-gray-700">{data.reason}</p>
                </div>
              )}
            </div>
          )}

          {/* Fecha de notificación */}
          <p className="text-xs text-gray-400 text-center">
            Recibido: {formatTimestampToLima(currentNotification.date_time_registration, 'datetime')}
          </p>
        </motion.div>
      </Modal.Body>

      {/* Footer */}
      <Modal.Footer>
        <button
          onClick={handleNext}
          className={`w-full px-4 py-3 bg-gradient-to-r ${config.headerBg} text-white rounded-lg hover:opacity-90 transition-opacity font-medium`}
        >
          {currentIndex < notifications.length - 1
            ? `Siguiente (${currentIndex + 1}/${notifications.length})`
            : 'Entendido'
          }
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default AppointmentNotificationModal;

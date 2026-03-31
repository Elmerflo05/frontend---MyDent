import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatTimestampToLima } from '@/utils/dateUtils';
import { Receipt, X, DollarSign, FileText } from 'lucide-react';
import { Modal } from '@/components/common/Modal';

export interface BudgetNotification {
  notification_id: number;
  notification_type: string;
  notification_title: string;
  notification_message: string;
  notification_data?: {
    consultation_id?: number;
    consultation_budget_id?: number;
    grand_total?: number;
    status?: string;
  };
  date_time_registration: string;
}

interface BudgetNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: BudgetNotification[];
  onMarkAsRead: (notificationId: number) => void;
}

const BudgetNotificationModal: React.FC<BudgetNotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const currentNotification = notifications[currentIndex];

  if (!currentNotification) return null;

  const isUpdate = currentNotification.notification_type === 'budget_updated';
  const data = currentNotification.notification_data || {};
  const grandTotal = Number(data.grand_total || 0);

  const headerBg = isUpdate ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-600';
  const iconBg = isUpdate ? 'bg-amber-100' : 'bg-emerald-100';
  const iconColor = isUpdate ? 'text-amber-600' : 'text-emerald-600';

  const markAllAndClose = () => {
    notifications.forEach(n => onMarkAsRead(n.notification_id));
    onClose();
  };

  const handleViewBudget = () => {
    notifications.forEach(n => onMarkAsRead(n.notification_id));
    navigate('/patient/medical-history');
    onClose();
  };

  const handleNext = () => {
    onMarkAsRead(currentNotification.notification_id);
    if (currentIndex < notifications.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={markAllAndClose}
      size="md"
      closeOnBackdropClick={false}
      closeOnEscape={true}
      showCloseButton={false}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${headerBg} px-6 py-8 text-center relative`}>
        <button
          onClick={markAllAndClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className={`w-20 h-20 ${iconBg} rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg`}
        >
          <Receipt className={`w-10 h-10 ${iconColor}`} />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-white mb-1"
        >
          {isUpdate ? 'Presupuesto Actualizado' : 'Nuevo Presupuesto'}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white/90 text-sm"
        >
          {isUpdate ? 'Tu presupuesto ha sido modificado' : 'Se ha registrado un presupuesto para tu tratamiento'}
        </motion.p>

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
          className="space-y-4"
        >
          <p className="text-gray-700 text-center">
            {currentNotification.notification_message}
          </p>

          {grandTotal > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Monto Total</p>
                  <p className="font-bold text-gray-900 text-lg">S/ {grandTotal.toFixed(2)}</p>
                </div>
              </div>

              {data.status && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estado</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {data.status === 'draft' ? 'Borrador' : data.status === 'approved' ? 'Aprobado' : data.status}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">
            Recibido: {formatTimestampToLima(currentNotification.date_time_registration, 'datetime')}
          </p>
        </motion.div>
      </Modal.Body>

      {/* Footer */}
      <Modal.Footer>
        <div className="flex gap-3 w-full">
          {notifications.length > 1 && currentIndex < notifications.length - 1 ? (
            <button
              onClick={handleNext}
              className={`flex-1 px-4 py-3 bg-gradient-to-r ${headerBg} text-white rounded-lg hover:opacity-90 transition-opacity font-medium`}
            >
              Siguiente ({currentIndex + 1}/{notifications.length})
            </button>
          ) : (
            <>
              <button
                onClick={markAllAndClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cerrar
              </button>
              <button
                onClick={handleViewBudget}
                className={`flex-1 px-4 py-3 bg-gradient-to-r ${headerBg} text-white rounded-lg hover:opacity-90 transition-opacity font-medium`}
              >
                Ver Presupuesto
              </button>
            </>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default BudgetNotificationModal;

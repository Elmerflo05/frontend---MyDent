import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';
import { Modal } from './Modal';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
}

/**
 * Modal de alerta reutilizable
 *
 * Variante especializada del Modal base para mostrar alertas simples
 *
 * @example
 * <AlertModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Operación exitosa"
 *   message="El paciente ha sido registrado correctamente"
 *   type="success"
 * />
 */
export const AlertModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'Aceptar',
}: AlertModalProps) => {
  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-500',
          bg: 'bg-green-50',
          border: 'border-green-200',
          button: 'bg-green-600 hover:bg-green-700',
        };
      case 'error':
        return {
          icon: XCircle,
          iconColor: 'text-red-500',
          bg: 'bg-red-50',
          border: 'border-red-200',
          button: 'bg-red-600 hover:bg-red-700',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconColor: 'text-yellow-500',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          button: 'bg-yellow-600 hover:bg-yellow-700',
        };
      case 'info':
      default:
        return {
          icon: Info,
          iconColor: 'text-blue-500',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          button: 'bg-blue-600 hover:bg-blue-700',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <Modal.Header>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </Modal.Header>

      <Modal.Body>
        <div className={`${config.bg} border ${config.border} rounded-lg p-6 mb-6`}>
          <div className="flex flex-col items-center text-center">
            <Icon className={`w-16 h-16 ${config.iconColor}`} />
            <p className="mt-4 text-gray-700 text-base leading-relaxed">{message}</p>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button
          onClick={onClose}
          className={`w-full px-4 py-3 ${config.button} text-white rounded-lg font-semibold transition-colors`}
        >
          {confirmText}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

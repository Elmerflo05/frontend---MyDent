import { ReactNode } from 'react';
import { AlertCircle, CheckCircle, XCircle, Info, Trash2 } from 'lucide-react';
import { Modal } from './Modal';

export type ConfirmType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

/**
 * Modal de confirmación reutilizable
 *
 * Variante especializada del Modal base para confirmaciones y alertas
 *
 * @example
 * <ConfirmModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   onConfirm={handleDelete}
 *   title="Eliminar paciente"
 *   message="¿Está seguro de eliminar este paciente?"
 *   type="danger"
 *   confirmText="Eliminar"
 * />
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
}: ConfirmModalProps) => {
  const getConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: Trash2,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          button: 'bg-yellow-600 hover:bg-yellow-700',
        };
      case 'success':
        return {
          icon: CheckCircle,
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          button: 'bg-green-600 hover:bg-green-700',
        };
      case 'info':
      default:
        return {
          icon: Info,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <Modal.Body className="pt-6">
        {/* Icon and Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 ${config.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600">Esta acción requiere confirmación</p>
          </div>
        </div>

        {/* Message */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          {typeof message === 'string' ? (
            <p className="text-sm text-gray-700">{message}</p>
          ) : (
            message
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 ${config.button} text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Icon className="w-4 h-4" />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

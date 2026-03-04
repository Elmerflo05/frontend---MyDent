// ============================================================================
// ALERT MODAL - Modal reutilizable para alertas y confirmaciones
// ============================================================================
// MIGRADO AL NUEVO SISTEMA: Ahora usa el componente base Modal profesional
// Importar desde: @/components/common/Modal
// ============================================================================

import { AlertModal as NewAlertModal, ConfirmModal, AlertType } from '@/components/common/Modal';

export type { AlertType };

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: AlertType | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

/**
 * @deprecated Este componente es legacy. Usa directamente AlertModal o ConfirmModal desde @/components/common/Modal
 *
 * Modal de alerta con compatibilidad hacia atrás
 * Se mantiene para no romper código existente, pero internamente usa el nuevo sistema
 */
export default function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm
}: AlertModalProps) {
  // Si es tipo 'confirm', usar ConfirmModal
  if (type === 'confirm') {
    return (
      <ConfirmModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={onConfirm || onClose}
        title={title}
        message={message}
        type="warning"
        confirmText={confirmText}
        cancelText={cancelText}
      />
    );
  }

  // Para otros tipos, usar AlertModal
  return (
    <NewAlertModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      message={message}
      type={type as AlertType}
      confirmText={confirmText}
    />
  );
}

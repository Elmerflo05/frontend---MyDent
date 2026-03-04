/**
 * DeleteConfirmationModal Component
 *
 * Modal de confirmación para eliminar una condición del diagnóstico definitivo
 */

import { ConfirmModal } from '@/components/common/Modal';

interface DeleteConfirmationModalProps {
  show: boolean;
  conditionLabel: string;
  toothNumber: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal = ({
  show,
  conditionLabel,
  toothNumber,
  onConfirm,
  onCancel
}: DeleteConfirmationModalProps) => {
  const message = (
    <div>
      <p className="text-sm text-gray-700 mb-2">
        ¿Está seguro de eliminar la siguiente condición del diagnóstico definitivo?
      </p>
      <div className="flex items-center gap-3 mt-3">
        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center font-bold text-white">
          {toothNumber}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{conditionLabel}</p>
          <p className="text-xs text-gray-500">Diente {toothNumber}</p>
        </div>
      </div>
    </div>
  );

  return (
    <ConfirmModal
      isOpen={show}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="Confirmar Eliminación"
      message={message}
      type="danger"
      confirmText="Eliminar"
      cancelText="Cancelar"
    />
  );
};

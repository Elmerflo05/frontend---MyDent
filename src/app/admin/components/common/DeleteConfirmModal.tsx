import { ReactNode, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from '@/components/common/Modal';

const CONFIRMATION_KEYWORD = 'ELIMINAR';

interface DeleteConfirmModalProps {
  title: string;
  entityName: string;
  entityMeta?: string;
  requireTypedConfirmation: boolean;
  warningTitle?: string;
  warningDescription?: ReactNode;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export const DeleteConfirmModal = ({
  title,
  entityName,
  entityMeta,
  requireTypedConfirmation,
  warningTitle,
  warningDescription,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) => {
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmEnabled = requireTypedConfirmation
    ? typedConfirmation === CONFIRMATION_KEYWORD
    : true;

  const handleConfirm = async () => {
    if (!isConfirmEnabled || isDeleting) return;
    try {
      setIsDeleting(true);
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen onClose={onCancel} size="sm" showCloseButton={false}>
      <Modal.Body className="pt-6">
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              requireTypedConfirmation ? 'bg-red-100' : 'bg-yellow-100'
            }`}
          >
            {requireTypedConfirmation ? (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            ) : (
              <Trash2 className="w-6 h-6 text-yellow-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600">
              La eliminación es lógica y quedará registrada en auditoría.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-gray-900 mb-1">{entityName}</p>
          {entityMeta && (
            <p className="text-xs text-gray-600 capitalize">{entityMeta}</p>
          )}
        </div>

        {requireTypedConfirmation ? (
          <div className="border border-red-200 bg-red-50 rounded-lg p-4 mb-4">
            {warningTitle && (
              <p className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {warningTitle}
              </p>
            )}
            {warningDescription && (
              <div className="text-xs text-red-700 mb-3">
                {warningDescription}
              </div>
            )}
            <p className="text-xs text-red-700 mb-3">
              Para confirmar la eliminación, escribe{' '}
              <strong className="font-mono">{CONFIRMATION_KEYWORD}</strong> en
              el siguiente campo:
            </p>
            <input
              type="text"
              value={typedConfirmation}
              onChange={(e) => setTypedConfirmation(e.target.value)}
              placeholder={CONFIRMATION_KEYWORD}
              disabled={isDeleting}
              autoFocus
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm font-mono"
              aria-label={`Escribe ${CONFIRMATION_KEYWORD} para confirmar`}
            />
          </div>
        ) : (
          <p className="text-sm text-gray-700 mb-2">
            ¿Confirmas la eliminación?
          </p>
        )}
      </Modal.Body>

      <Modal.Footer>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmEnabled || isDeleting}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Eliminar
              </>
            )}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

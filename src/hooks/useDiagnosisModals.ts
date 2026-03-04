/**
 * useDiagnosisModals Hook
 *
 * Maneja el estado de los modales del componente de diagnóstico
 * (Modal de eliminación y modal de copiar del presuntivo)
 */

import { useState } from 'react';

interface DeleteModalState {
  show: boolean;
  conditionId: string | null;
  conditionLabel: string;
  toothNumber: string;
}

interface UseDiagnosisModalsReturn {
  // Delete modal
  deleteModal: DeleteModalState;
  showDeleteModal: (condition: any) => void;
  hideDeleteModal: () => void;
  confirmDelete: (onDelete: (id: string) => void) => void;

  // Copy modal
  showCopyModal: boolean;
  openCopyModal: () => void;
  closeCopyModal: () => void;
  confirmCopy: (onCopy: () => void) => void;
}

/**
 * Hook para manejar los modales de diagnóstico
 */
export const useDiagnosisModals = (): UseDiagnosisModalsReturn => {
  // Estado del modal de eliminación
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    show: false,
    conditionId: null,
    conditionLabel: '',
    toothNumber: ''
  });

  // Estado del modal de copiar
  const [showCopyModal, setShowCopyModal] = useState(false);

  /**
   * Muestra el modal de eliminación con los datos de la condición
   */
  const showDeleteModal = (condition: any) => {
    setDeleteModal({
      show: true,
      conditionId: condition.id,
      conditionLabel: condition.definitive.conditionLabel,
      toothNumber: condition.toothNumber
    });
  };

  /**
   * Oculta el modal de eliminación
   */
  const hideDeleteModal = () => {
    setDeleteModal({
      show: false,
      conditionId: null,
      conditionLabel: '',
      toothNumber: ''
    });
  };

  /**
   * Confirma la eliminación y ejecuta el callback
   */
  const confirmDelete = (onDelete: (id: string) => void) => {
    if (!deleteModal.conditionId) return;

    onDelete(deleteModal.conditionId);
    hideDeleteModal();
  };

  /**
   * Abre el modal de copiar del presuntivo
   */
  const openCopyModal = () => {
    setShowCopyModal(true);
  };

  /**
   * Cierra el modal de copiar
   */
  const closeCopyModal = () => {
    setShowCopyModal(false);
  };

  /**
   * Confirma la copia y ejecuta el callback
   */
  const confirmCopy = (onCopy: () => void) => {
    onCopy();
    closeCopyModal();
  };

  return {
    // Delete modal
    deleteModal,
    showDeleteModal,
    hideDeleteModal,
    confirmDelete,

    // Copy modal
    showCopyModal,
    openCopyModal,
    closeCopyModal,
    confirmCopy
  };
};

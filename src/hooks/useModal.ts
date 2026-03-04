import { useState, useCallback } from 'react';

/**
 * Custom hook para gestionar el estado de un modal
 *
 * @param initialState - Estado inicial del modal (abierto/cerrado)
 * @returns Objeto con estado y funciones para controlar el modal
 *
 * @example
 * const modal = useModal();
 *
 * <button onClick={modal.open}>Abrir</button>
 * <Modal isOpen={modal.isOpen} onClose={modal.close}>
 *   Contenido
 * </Modal>
 */
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
};

import { useEffect, useRef } from 'react';

interface UseModalAccessibilityOptions {
  isOpen: boolean;
  onClose: () => void;
  closeOnEscape?: boolean;
  lockBodyScroll?: boolean;
  restoreFocus?: boolean;
}

/**
 * Custom hook que maneja accesibilidad en modales
 *
 * Características:
 * - Bloquea el scroll del body cuando el modal está abierto
 * - Cierra el modal con la tecla Escape
 * - Gestiona el foco: enfoca el modal al abrir y restaura el foco al cerrar
 * - Previene layout shift al bloquear scroll (agrega padding por scrollbar)
 *
 * @param options - Configuración del hook
 * @returns Ref que debe asignarse al contenedor del modal
 *
 * @example
 * const { modalRef } = useModalAccessibility({
 *   isOpen,
 *   onClose,
 *   closeOnEscape: true,
 *   lockBodyScroll: true,
 *   restoreFocus: true
 * });
 *
 * return <div ref={modalRef}>Modal content</div>
 */
export const useModalAccessibility = ({
  isOpen,
  onClose,
  closeOnEscape = true,
  lockBodyScroll = true,
  restoreFocus = true,
}: UseModalAccessibilityOptions) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Handle Escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Lock body scroll
  useEffect(() => {
    if (!lockBodyScroll || !isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Prevent layout shift by adding padding for scrollbar
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen, lockBodyScroll]);

  // Focus management
  useEffect(() => {
    if (!isOpen) return;

    // Store currently focused element
    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element in modal
    const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    firstFocusable?.focus();

    // Restore focus on unmount
    return () => {
      if (restoreFocus && previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [isOpen, restoreFocus]);

  return { modalRef };
};

import { ReactNode, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

/**
 * Componente Modal profesional con soporte completo de accesibilidad
 *
 * Características:
 * - Portal rendering (renderiza fuera del árbol DOM)
 * - Animaciones suaves con Framer Motion
 * - Accesibilidad completa (ARIA, focus management, keyboard)
 * - Body scroll lock
 * - Cierre con Escape o click en backdrop
 * - Compound Components Pattern (Modal.Header, Modal.Body, Modal.Footer)
 *
 * @example
 * <Modal isOpen={isOpen} onClose={onClose} size="lg">
 *   <Modal.Header>
 *     <h2>Título</h2>
 *   </Modal.Header>
 *   <Modal.Body>
 *     Contenido
 *   </Modal.Body>
 *   <Modal.Footer>
 *     <button onClick={onClose}>Cerrar</button>
 *   </Modal.Footer>
 * </Modal>
 */
export const Modal = ({
  isOpen,
  onClose,
  children,
  size = 'lg',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
}: ModalProps) => {
  const { modalRef } = useModalAccessibility({
    isOpen,
    onClose,
    closeOnEscape,
    lockBodyScroll: true,
    restoreFocus: true,
  });

  const modalId = useId();
  const titleId = `${modalId}-title`;
  const descriptionId = `${modalId}-description`;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50"
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`
              relative bg-white rounded-xl shadow-2xl
              w-full ${sizeClasses[size]}
              max-h-[90vh] flex flex-col
              ${className}
            `}
          >
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-6 h-6" />
              </button>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

// Subcomponentes con Compound Components Pattern

interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
}

Modal.Header = ({ children, className = '' }: ModalHeaderProps) => (
  <div className={`flex-shrink-0 border-b border-gray-200 px-6 py-4 rounded-t-xl ${className}`}>
    {children}
  </div>
);

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

Modal.Body = ({ children, className = '' }: ModalBodyProps) => (
  <div className={`flex-1 overflow-y-auto px-6 py-6 ${className}`}>
    {children}
  </div>
);

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

Modal.Footer = ({ children, className = '' }: ModalFooterProps) => (
  <div className={`flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl ${className}`}>
    {children}
  </div>
);

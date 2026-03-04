/**
 * Componente de Overlay para Modales
 *
 * Proporciona un fondo oscuro semitransparente detrás de los modales
 * con animación de entrada/salida usando Framer Motion
 */

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ModalOverlayProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  /** Nivel de opacidad del overlay (0-100) */
  opacity?: number;
  /** z-index del modal */
  zIndex?: number;
  /** Permitir cerrar al hacer clic fuera del modal */
  closeOnClickOutside?: boolean;
}

export const ModalOverlay = ({
  isOpen,
  onClose,
  children,
  opacity = 50,
  zIndex = 9999,
  closeOnClickOutside = true
}: ModalOverlayProps) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnClickOutside && onClose && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex }}
      onClick={handleOverlayClick}
    >
      {/* Fondo oscuro animado */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: opacity / 100 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black"
        style={{ zIndex: -1 }}
      />

      {/* Contenido del modal */}
      {children}
    </div>
  );
};

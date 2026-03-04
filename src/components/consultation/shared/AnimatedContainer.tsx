/**
 * AnimatedContainer - Componente wrapper para animaciones comunes
 *
 * Simplifica el uso de Framer Motion con animaciones predefinidas.
 */

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

type AnimationType = 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'fadeIn' | 'none';

interface AnimatedContainerProps extends Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'transition'> {
  /** Tipo de animación */
  animation?: AnimationType;

  /** Delay de la animación en segundos */
  delay?: number;

  /** Duración de la animación en segundos */
  duration?: number;

  /** Contenido del contenedor */
  children: ReactNode;

  /** Clases adicionales */
  className?: string;
}

/**
 * Variantes de animación predefinidas
 */
const animationVariants = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
  },
  fadeInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  none: {
    initial: {},
    animate: {},
  },
};

export const AnimatedContainer = ({
  animation = 'fadeInUp',
  delay = 0,
  duration = 0.3,
  children,
  className = '',
  ...motionProps
}: AnimatedContainerProps) => {
  const variant = animationVariants[animation];

  return (
    <motion.div
      initial={variant.initial}
      animate={variant.animate}
      transition={{ delay, duration }}
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

/**
 * Hook para obtener variantes de animación
 * Útil cuando necesitas más control sobre las animaciones
 */
export const useMotionVariants = () => {
  return {
    fadeInUp: animationVariants.fadeInUp,
    fadeInLeft: animationVariants.fadeInLeft,
    fadeInRight: animationVariants.fadeInRight,
    fadeIn: animationVariants.fadeIn,

    // Variantes adicionales para hover/tap
    button: {
      hover: { scale: 1.02 },
      tap: { scale: 0.98 },
    },
    iconButton: {
      hover: { scale: 1.05 },
      tap: { scale: 0.95 },
    },
  };
};

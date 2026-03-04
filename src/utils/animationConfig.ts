/**
 * Configuración optimizada de animaciones para Framer Motion
 * Reduce el uso de memoria y mejora el rendimiento
 */

import type { Transition, Variant } from 'framer-motion';

/**
 * Detecta si el dispositivo tiene capacidad reducida
 * (prefer-reduced-motion o dispositivos de bajo rendimiento)
 */
export const shouldReduceMotion = (): boolean => {
  if (typeof window === 'undefined') return true;

  // Respetar preferencia del usuario
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mediaQuery.matches) return true;

  // Detectar dispositivos de bajo rendimiento
  const connection = (navigator as any).connection;
  if (connection && (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
    return true;
  }

  return false;
};

/**
 * Transición optimizada para animaciones ligeras
 */
export const lightTransition: Transition = {
  duration: 0.15,
  ease: 'easeOut'
};

/**
 * Transición estándar optimizada
 */
export const standardTransition: Transition = {
  duration: 0.2,
  ease: 'easeInOut'
};

/**
 * Variantes de fade in/out optimizadas
 */
export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

/**
 * Variantes de slide optimizadas (sin transform excesivos)
 */
export const slideUpVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

/**
 * Hook para obtener props de animación según el rendimiento
 */
export const getOptimizedAnimationProps = (enabled: boolean = true) => {
  const reduced = shouldReduceMotion();

  if (!enabled || reduced) {
    return {
      initial: false,
      animate: false,
      exit: false,
      transition: { duration: 0 }
    };
  }

  return {
    initial: 'hidden',
    animate: 'visible',
    exit: 'hidden',
    transition: lightTransition
  };
};

/**
 * Configuración global optimizada para MotionConfig
 */
export const optimizedMotionConfig = {
  // Reducir el número de elementos que usan will-change simultáneamente
  reducedMotion: shouldReduceMotion() ? 'always' : 'user',

  // Transición por defecto más ligera
  transition: lightTransition,

  // Desactivar layout animations que consumen mucha memoria
  layout: false
};

/**
 * HOOK: useOdontogramFullscreen
 *
 * Gestiona el modo fullscreen del odontograma con soporte multi-browser
 * y fallback a CSS si la API no está disponible
 *
 * Características:
 * - Fullscreen nativo (Fullscreen API)
 * - Soporte Safari, Firefox, IE11
 * - Fallback a CSS si la API falla
 * - Detección automática de ESC para salir
 */

import { useState, useEffect, RefObject } from 'react';
import { logger } from '@/lib/logger';

export interface UseOdontogramFullscreenReturn {
  isFullscreen: boolean;
  toggleFullscreen: () => Promise<void>;
  setIsFullscreen: (value: boolean) => void;
}

/**
 * Hook para gestión de fullscreen del odontograma
 *
 * @param containerRef - Ref del elemento que se pondrá en fullscreen
 * @returns Estado de fullscreen y función para toggle
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { isFullscreen, toggleFullscreen } = useOdontogramFullscreen(containerRef);
 *
 * return (
 *   <div
 *     ref={containerRef}
 *     className={isFullscreen ? 'fixed inset-0 z-[99999]' : 'rounded-xl'}
 *   >
 *     <button onClick={toggleFullscreen}>
 *       {isFullscreen ? 'Salir' : 'Pantalla Completa'}
 *     </button>
 *   </div>
 * );
 * ```
 */
export const useOdontogramFullscreen = (
  containerRef: RefObject<HTMLElement>
): UseOdontogramFullscreenReturn => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  /**
   * Toggle entre fullscreen y modo normal
   * Intenta usar la Fullscreen API nativa, con fallback a CSS
   */
  const toggleFullscreen = async (): Promise<void> => {
    if (!containerRef.current) {
      logger.warn('Container ref no disponible para fullscreen', {});
      return;
    }

    try {
      // Si ya está en fullscreen, salir
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
        logger.db('Saliendo de fullscreen', 'ui', {});
        return;
      }

      // Intentar entrar en fullscreen real
      const element = containerRef.current;

      if (element.requestFullscreen) {
        // API estándar
        await element.requestFullscreen();
        logger.db('Fullscreen activado (API estándar)', 'ui', {});
      } else if ((element as any).webkitRequestFullscreen) {
        // Safari
        await (element as any).webkitRequestFullscreen();
        logger.db('Fullscreen activado (Safari)', 'ui', {});
      } else if ((element as any).msRequestFullscreen) {
        // IE11
        await (element as any).msRequestFullscreen();
        logger.db('Fullscreen activado (IE11)', 'ui', {});
      } else {
        // Fallback: usar CSS si la API no está disponible
        logger.warn('API Fullscreen no disponible, usando CSS fallback', {});
        setIsFullscreen(true);
      }
    } catch (error) {
      // Si hay error (usuario cancela, permisos, etc), usar CSS fallback
      logger.warn('Fullscreen bloqueado, usando CSS fallback', { error });
      setIsFullscreen(true);
    }
  };

  /**
   * Effect para detectar cambios en fullscreen (ESC, F11, etc.)
   * Sincroniza el estado cuando el usuario sale de fullscreen manualmente
   */
  useEffect(() => {
    const handleFullscreenChange = (): void => {
      // Si no hay elemento en fullscreen, actualizar el estado
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        logger.db('Fullscreen desactivado (cambio detectado)', 'ui', {});
      } else {
        setIsFullscreen(true);
        logger.db('Fullscreen activado (cambio detectado)', 'ui', {});
      }
    };

    // Escuchar cambios en fullscreen (funciona con ESC, F11, etc.)
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Safari
    document.addEventListener('mozfullscreenchange', handleFullscreenChange); // Firefox
    document.addEventListener('MSFullscreenChange', handleFullscreenChange); // IE11

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  return {
    isFullscreen,
    toggleFullscreen,
    setIsFullscreen
  };
};

/**
 * HOOK: useOdontogramZoom
 *
 * Gestiona el nivel de zoom del odontograma con persistencia en localStorage
 *
 * Características:
 * - Zoom entre 0.5x y 1.5x
 * - Persistencia automática en localStorage
 * - Funciones para incrementar, decrementar y resetear
 */

import { useState } from 'react';

export interface UseOdontogramZoomReturn {
  zoomLevel: number;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleZoomReset: () => void;
  handleZoomChange: (newZoom: number) => void;
}

/**
 * Hook para gestión del zoom del odontograma
 *
 * @param initialZoom - Nivel de zoom inicial (default: 1.0)
 * @returns Objeto con zoomLevel y handlers
 *
 * @example
 * ```tsx
 * const { zoomLevel, handleZoomIn, handleZoomOut, handleZoomReset } = useOdontogramZoom();
 *
 * return (
 *   <div style={{ transform: `scale(${zoomLevel})` }}>
 *     <button onClick={handleZoomIn}>+</button>
 *     <span>{Math.round(zoomLevel * 100)}%</span>
 *     <button onClick={handleZoomOut}>-</button>
 *   </div>
 * );
 * ```
 */
export const useOdontogramZoom = (initialZoom: number = 1.0): UseOdontogramZoomReturn => {
  const [zoomLevel, setZoomLevel] = useState<number>(initialZoom);

  /**
   * Cambia el nivel de zoom con validación y persistencia
   *
   * @param newZoom - Nuevo nivel de zoom
   */
  const handleZoomChange = (newZoom: number): void => {
    // Limitar entre 0.5 y 1.5
    const clampedZoom = Math.max(0.5, Math.min(1.5, newZoom));
    setZoomLevel(clampedZoom);

    // Guardar en localStorage para persistencia
    localStorage.setItem('odontogram-zoom-level', clampedZoom.toString());
  };

  /**
   * Incrementa el zoom en 0.1 (10%)
   */
  const handleZoomIn = (): void => {
    handleZoomChange(zoomLevel + 0.1);
  };

  /**
   * Decrementa el zoom en 0.1 (10%)
   */
  const handleZoomOut = (): void => {
    handleZoomChange(zoomLevel - 0.1);
  };

  /**
   * Resetea el zoom a 100% (1.0)
   */
  const handleZoomReset = (): void => {
    handleZoomChange(1.0);
  };

  return {
    zoomLevel,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleZoomChange
  };
};

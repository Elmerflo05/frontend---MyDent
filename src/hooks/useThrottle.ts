import { useCallback, useRef } from 'react';

/**
 * Hook para throttle de callbacks
 * Limita la ejecución de una función a una vez cada X milisegundos
 * Útil para eventos como scroll, resize, mousemove, etc.
 *
 * @param callback - Función a ejecutar
 * @param delay - Delay en milisegundos (default: 100ms)
 * @returns Callback throttled
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): (...args: Parameters<T>) => void {
  const lastRun = useRef(Date.now());
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        // Si ya pasó el delay, ejecutar inmediatamente
        callback(...args);
        lastRun.current = now;
      } else {
        // Si no, programar para ejecutar después del delay
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
        }

        timeoutId.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay]
  );
}

/**
 * Hook para throttle leading (ejecuta inmediatamente la primera vez)
 * Útil para scroll events donde quieres feedback inmediato
 *
 * @param callback - Función a ejecutar
 * @param delay - Delay en milisegundos (default: 100ms)
 * @returns Callback throttled
 */
export function useThrottleLeading<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): (...args: Parameters<T>) => void {
  const lastRun = useRef(0);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        // Ejecutar inmediatamente
        callback(...args);
        lastRun.current = now;

        // Limpiar timeout pendiente
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
          timeoutId.current = null;
        }
      } else if (!timeoutId.current) {
        // Programar ejecución al final del delay
        timeoutId.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
          timeoutId.current = null;
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay]
  );
}

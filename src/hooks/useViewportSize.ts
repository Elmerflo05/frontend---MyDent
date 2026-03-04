/**
 * Hook para detectar el tamaño del viewport y tipo de dispositivo
 */

import { useState, useEffect } from 'react';

export type ViewportMode = 'mobile' | 'tablet' | 'desktop';

interface ViewportSize {
  width: number;
  height: number;
  mode: ViewportMode;
}

const getViewportMode = (width: number): ViewportMode => {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

export const useViewportSize = (): ViewportSize => {
  const [viewportSize, setViewportSize] = useState<ViewportSize>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    return {
      width,
      height,
      mode: getViewportMode(width)
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewportSize({
        width,
        height,
        mode: getViewportMode(width)
      });
    };

    // Debounce para optimizar rendimiento
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
    };
  }, []);

  return viewportSize;
};

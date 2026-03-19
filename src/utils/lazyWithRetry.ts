import { lazy, ComponentType } from 'react';

type LazyImportFn = () => Promise<{ default: ComponentType<any> }>;

const RELOAD_KEY = 'chunk_reload_ts';
const RELOAD_COOLDOWN_MS = 10_000; // no recargar más de 1 vez cada 10s

function isChunkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('loading chunk') ||
    msg.includes('loading css chunk') ||
    error.name === 'ChunkLoadError'
  );
}

/**
 * Wrapper de React.lazy que maneja ChunkLoadError tras un deploy.
 * 1. Intenta importar normalmente.
 * 2. Si falla por chunk stale, reintenta UNA vez con cache-bust.
 * 3. Si sigue fallando, fuerza recarga completa de la página
 *    (con protección anti-loop de 10 s).
 */
export function lazyWithRetry(importFn: LazyImportFn) {
  return lazy(() =>
    importFn().catch((error: unknown) => {
      if (!isChunkError(error)) throw error;

      // Reintento con cache-bust (fuerza nueva petición al servidor)
      return importFn().catch((retryError: unknown) => {
        if (!isChunkError(retryError)) throw retryError;

        // Protección anti-loop: si ya recargamos hace menos de 10s, no volver a recargar
        const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) || '0');
        if (Date.now() - lastReload < RELOAD_COOLDOWN_MS) {
          throw retryError; // Deja que el ErrorBoundary lo muestre
        }

        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        window.location.reload();

        // Nunca llega aquí, pero TypeScript lo necesita
        return { default: (() => null) as unknown as ComponentType<any> };
      });
    })
  );
}

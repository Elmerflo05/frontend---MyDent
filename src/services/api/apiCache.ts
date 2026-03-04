/**
 * Sistema de caché simple para APIs
 * Evita llamadas duplicadas a endpoints que ya fueron consultados
 * El caché se limpia automáticamente después de un tiempo o manualmente
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 60000; // 1 minuto por defecto
  private pendingRequests: Map<string, Promise<any>> = new Map();

  /**
   * Obtiene datos del caché si existen y no han expirado
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Guarda datos en el caché
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    });
  }

  /**
   * Ejecuta una función con caché
   * Si hay una solicitud pendiente para la misma key, espera esa solicitud
   * Si hay datos en caché válidos, los retorna inmediatamente
   */
  async withCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // Verificar caché primero
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Si ya hay una solicitud pendiente para esta key, esperar esa
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Crear nueva solicitud
    const request = fetchFn()
      .then((data) => {
        this.set(key, data, ttl);
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, request);
    return request;
  }

  /**
   * Invalida una entrada específica del caché
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.pendingRequests.delete(key);
  }

  /**
   * Invalida todas las entradas que coincidan con un patrón
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
    for (const key of this.pendingRequests.keys()) {
      if (regex.test(key)) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Invalida todo el caché de una consulta específica
   */
  invalidateConsultation(consultationId: number): void {
    this.invalidatePattern(`consultation:${consultationId}`);
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Limpia entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Instancia singleton
export const apiCache = new ApiCache();

// Limpiar caché expirado cada 2 minutos
setInterval(() => {
  apiCache.cleanup();
}, 120000);

export default apiCache;

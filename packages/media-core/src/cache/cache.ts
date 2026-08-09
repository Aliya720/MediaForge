/**
 * In-Memory TTL Cache for MediaForge
 */

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class InMemoryCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (ttlMs <= 0) {
      return;
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

/**
 * Deterministic Cache Key Generator
 */
export function generateCacheKey(namespace: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) {
    return namespace;
  }

  const sortedKeys = Object.keys(params).sort();
  const serialized = sortedKeys
    .map((key) => {
      const val = params[key];
      if (val === undefined || val === null) return null;
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`;
    })
    .filter(Boolean)
    .join('&');

  return serialized ? `${namespace}:${serialized}` : namespace;
}

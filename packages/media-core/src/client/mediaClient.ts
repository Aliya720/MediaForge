/**
 * MediaForge Main Client & Factory
 */

import { MediaClientConfig } from '../types/client.js';
import { HttpTransport } from '../transport/http.js';
import { InMemoryCache } from '../cache/cache.js';
import { RequestDeduplicator } from '../cache/dedup.js';
import { MediaEventEmitter, attachDefaultConsoleListener } from '../events/emitter.js';
import { PhotosApi } from './photosApi.js';
import { VideosApi } from './videosApi.js';
import { UnsubscribeFunction } from '../types/events.js';

export class MediaForgeClient {
  public readonly photos: PhotosApi;
  public readonly videos: VideosApi;
  public readonly events: MediaEventEmitter;
  private readonly rawCache: InMemoryCache;
  private readonly detachConsoleListener?: UnsubscribeFunction;

  constructor(config: MediaClientConfig) {
    const transport = new HttpTransport({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      timeoutMs: config.timeoutMs,
      fetchFn: config.fetchFn,
    });

    this.rawCache = new InMemoryCache();
    const dedup = new RequestDeduplicator();
    this.events = new MediaEventEmitter();

    const cacheEnabled = config.cache?.enabled ?? true;
    const defaultTtlMs = config.cache?.ttlMs ?? 5 * 60 * 1000; // 5 minutes default TTL

    this.photos = new PhotosApi(transport, this.rawCache, dedup, defaultTtlMs, cacheEnabled);
    this.videos = new VideosApi(transport, this.rawCache, dedup, defaultTtlMs, cacheEnabled);

    if (config.enableConsoleEvents !== false) {
      this.detachConsoleListener = attachDefaultConsoleListener(this.events);
    }
  }

  public get cache() {
    const rawCache = this.rawCache;
    return {
      clear: () => rawCache.clear(),
      delete: (key: string) => rawCache.delete(key),
      get size() {
        return rawCache.size;
      },
    };
  }

  public destroy(): void {
    if (this.detachConsoleListener) {
      this.detachConsoleListener();
    }
    this.events.removeAllListeners();
    this.rawCache.clear();
  }
}

export function createMediaClient(config: MediaClientConfig): MediaForgeClient {
  return new MediaForgeClient(config);
}

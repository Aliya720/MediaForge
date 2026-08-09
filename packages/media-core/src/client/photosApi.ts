/**
 * Photos API module for Pexels integration
 */

import { HttpTransport } from '../transport/http.js';
import { InMemoryCache, generateCacheKey } from '../cache/cache.js';
import { RequestDeduplicator } from '../cache/dedup.js';
import { mapPexelsPhotoToDomain } from '../adapters/photoAdapter.js';
import { PhotoMedia, PaginatedResult } from '../types/domain.js';
import { PexelsPhoto, PexelsPhotosResponse } from '../types/pexels.js';
import { PhotosSearchOptions, PhotosCuratedOptions, GetMediaOptions } from '../types/client.js';

export class PhotosApi {
  constructor(
    private readonly transport: HttpTransport,
    private readonly cache: InMemoryCache,
    private readonly dedup: RequestDeduplicator,
    private readonly defaultTtlMs: number,
    private readonly cacheEnabled: boolean
  ) {}

  async search(options: PhotosSearchOptions): Promise<PaginatedResult<PhotoMedia>> {
    const page = options.page ?? 1;
    const perPage = options.perPage ?? 15;
    const cacheKey = generateCacheKey('photos.search', {
      query: options.query,
      page,
      perPage,
      orientation: options.orientation,
      size: options.size,
      color: options.color,
    });

    if (this.cacheEnabled) {
      const cached = this.cache.get<PaginatedResult<PhotoMedia>>(cacheKey);
      if (cached) return cached;
    }

    return this.dedup.execute(cacheKey, async () => {
      const dto = await this.transport.get<PexelsPhotosResponse>({
        path: 'v1/search',
        params: {
          query: options.query,
          page,
          per_page: perPage,
          orientation: options.orientation,
          size: options.size,
          color: options.color,
        },
        signal: options.signal,
      });

      const items = (dto.photos || []).map(mapPexelsPhotoToDomain);
      const totalResults = dto.total_results ?? 0;
      const hasNextPage = Boolean(dto.next_page) || (totalResults > 0 && page * perPage < totalResults);

      const result: PaginatedResult<PhotoMedia> = {
        items,
        page,
        perPage,
        totalResults,
        hasNextPage,
      };

      if (this.cacheEnabled) {
        this.cache.set(cacheKey, result, this.defaultTtlMs);
      }

      return result;
    });
  }

  async curated(options: PhotosCuratedOptions = {}): Promise<PaginatedResult<PhotoMedia>> {
    const page = options.page ?? 1;
    const perPage = options.perPage ?? 15;
    const cacheKey = generateCacheKey('photos.curated', { page, perPage });

    if (this.cacheEnabled) {
      const cached = this.cache.get<PaginatedResult<PhotoMedia>>(cacheKey);
      if (cached) return cached;
    }

    return this.dedup.execute(cacheKey, async () => {
      const dto = await this.transport.get<PexelsPhotosResponse>({
        path: 'v1/curated',
        params: {
          page,
          per_page: perPage,
        },
        signal: options.signal,
      });

      const items = (dto.photos || []).map(mapPexelsPhotoToDomain);
      const totalResults = dto.total_results ?? 0;
      const hasNextPage = Boolean(dto.next_page) || (totalResults > 0 && page * perPage < totalResults);

      const result: PaginatedResult<PhotoMedia> = {
        items,
        page,
        perPage,
        totalResults,
        hasNextPage,
      };

      if (this.cacheEnabled) {
        this.cache.set(cacheKey, result, this.defaultTtlMs);
      }

      return result;
    });
  }

  async get(options: GetMediaOptions): Promise<PhotoMedia> {
    const cacheKey = generateCacheKey('photos.get', { id: options.id });

    if (this.cacheEnabled) {
      const cached = this.cache.get<PhotoMedia>(cacheKey);
      if (cached) return cached;
    }

    return this.dedup.execute(cacheKey, async () => {
      const dto = await this.transport.get<PexelsPhoto>({
        path: `v1/photos/${options.id}`,
        signal: options.signal,
      });

      const result = mapPexelsPhotoToDomain(dto);

      if (this.cacheEnabled) {
        this.cache.set(cacheKey, result, this.defaultTtlMs);
      }

      return result;
    });
  }
}

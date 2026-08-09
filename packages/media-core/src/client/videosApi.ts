/**
 * Videos API module for Pexels integration
 */

import { HttpTransport } from '../transport/http.js';
import { InMemoryCache, generateCacheKey } from '../cache/cache.js';
import { RequestDeduplicator } from '../cache/dedup.js';
import { mapPexelsVideoToDomain } from '../adapters/videoAdapter.js';
import { VideoMedia, PaginatedResult } from '../types/domain.js';
import { PexelsVideo, PexelsVideosResponse } from '../types/pexels.js';
import { VideosSearchOptions, VideosPopularOptions, GetMediaOptions } from '../types/client.js';

export class VideosApi {
  constructor(
    private readonly transport: HttpTransport,
    private readonly cache: InMemoryCache,
    private readonly dedup: RequestDeduplicator,
    private readonly defaultTtlMs: number,
    private readonly cacheEnabled: boolean
  ) {}

  async search(options: VideosSearchOptions): Promise<PaginatedResult<VideoMedia>> {
    const page = options.page ?? 1;
    const perPage = options.perPage ?? 15;
    const cacheKey = generateCacheKey('videos.search', {
      query: options.query,
      page,
      perPage,
      orientation: options.orientation,
      size: options.size,
    });

    if (this.cacheEnabled) {
      const cached = this.cache.get<PaginatedResult<VideoMedia>>(cacheKey);
      if (cached) return cached;
    }

    return this.dedup.execute(cacheKey, async () => {
      const dto = await this.transport.get<PexelsVideosResponse>({
        path: 'videos/search',
        params: {
          query: options.query,
          page,
          per_page: perPage,
          orientation: options.orientation,
          size: options.size,
        },
        signal: options.signal,
      });

      const items = (dto.videos || []).map(mapPexelsVideoToDomain);
      const totalResults = dto.total_results ?? 0;
      const hasNextPage = Boolean(dto.next_page) || (totalResults > 0 && page * perPage < totalResults);

      const result: PaginatedResult<VideoMedia> = {
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

  async popular(options: VideosPopularOptions = {}): Promise<PaginatedResult<VideoMedia>> {
    const page = options.page ?? 1;
    const perPage = options.perPage ?? 15;
    const cacheKey = generateCacheKey('videos.popular', {
      page,
      perPage,
      minWidth: options.minWidth,
      minHeight: options.minHeight,
      minDuration: options.minDuration,
      maxDuration: options.maxDuration,
    });

    if (this.cacheEnabled) {
      const cached = this.cache.get<PaginatedResult<VideoMedia>>(cacheKey);
      if (cached) return cached;
    }

    return this.dedup.execute(cacheKey, async () => {
      const dto = await this.transport.get<PexelsVideosResponse>({
        path: 'videos/popular',
        params: {
          page,
          per_page: perPage,
          min_width: options.minWidth,
          min_height: options.minHeight,
          min_duration: options.minDuration,
          max_duration: options.maxDuration,
        },
        signal: options.signal,
      });

      const items = (dto.videos || []).map(mapPexelsVideoToDomain);
      const totalResults = dto.total_results ?? 0;
      const hasNextPage = Boolean(dto.next_page) || (totalResults > 0 && page * perPage < totalResults);

      const result: PaginatedResult<VideoMedia> = {
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

  async get(options: GetMediaOptions): Promise<VideoMedia> {
    const cacheKey = generateCacheKey('videos.get', { id: options.id });

    if (this.cacheEnabled) {
      const cached = this.cache.get<VideoMedia>(cacheKey);
      if (cached) return cached;
    }

    return this.dedup.execute(cacheKey, async () => {
      const dto = await this.transport.get<PexelsVideo>({
        path: `videos/videos/${options.id}`,
        signal: options.signal,
      });

      const result = mapPexelsVideoToDomain(dto);

      if (this.cacheEnabled) {
        this.cache.set(cacheKey, result, this.defaultTtlMs);
      }

      return result;
    });
  }
}

/**
 * MediaForge Client Configuration & Parameter Options
 */

export interface CacheConfig {
  enabled?: boolean;
  ttlMs?: number;
}

export interface MediaClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  cache?: CacheConfig;
  enableConsoleEvents?: boolean;
  fetchFn?: typeof fetch;
}

export interface RequestOptions {
  signal?: AbortSignal;
}

export interface PhotosSearchOptions extends RequestOptions {
  query: string;
  page?: number;
  perPage?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'large' | 'medium' | 'small';
  color?: string;
}

export interface PhotosCuratedOptions extends RequestOptions {
  page?: number;
  perPage?: number;
}

export interface VideosSearchOptions extends RequestOptions {
  query: string;
  page?: number;
  perPage?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'large' | 'medium' | 'small';
}

export interface VideosPopularOptions extends RequestOptions {
  page?: number;
  perPage?: number;
  minWidth?: number;
  minHeight?: number;
  minDuration?: number;
  maxDuration?: number;
}

export interface GetMediaOptions extends RequestOptions {
  id: string | number;
}

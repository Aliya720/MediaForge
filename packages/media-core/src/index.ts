/**
 * @mediaforge/media-core
 * Framework-agnostic SDK core for Pexels media integration.
 *
 * INVARIANT: MUST NOT import React, React Native, or DOM APIs.
 */

// Public Factory & Client Class
export { createMediaClient, MediaForgeClient } from './client/mediaClient.js';

// Public Typed Error Hierarchy
export {
  MediaError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  NetworkError,
  ApiError,
  InvalidResponseError,
  ConfigurationError,
} from './types/errors.js';

// Public Domain Models & Contracts
export type {
  MediaType,
  AuthorInfo,
  BaseMedia,
  PhotoSizeMap,
  PhotoMedia,
  VideoQuality,
  VideoFile,
  VideoPicture,
  VideoMedia,
  Media,
  PaginatedResult,
} from './types/domain.js';

// Public Event System Types & Emitter
export { MediaEventEmitter, attachDefaultConsoleListener } from './events/emitter.js';
export type {
  ViewEvent,
  DownloadEvent,
  MediaEventMap,
  MediaEventType,
  EventListener,
  UnsubscribeFunction,
} from './types/events.js';

// Public Configuration & Request Options
export type {
  MediaClientConfig,
  CacheConfig,
  RequestOptions,
  PhotosSearchOptions,
  PhotosCuratedOptions,
  VideosSearchOptions,
  VideosPopularOptions,
  GetMediaOptions,
} from './types/client.js';

export const MEDIA_CORE_VERSION = '0.1.0';

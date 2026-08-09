/**
 * @mediaforge/media-native
 * React Native lifecycle and state adapter for @mediaforge/media-core.
 *
 * This package is a THIN platform adapter. It does not:
 * - Call Pexels directly
 * - Duplicate HTTP/cache/dedup logic
 * - Contain UI components
 * - Import react-native (hooks are pure React)
 * - Depend on media-react
 *
 * Architecture:
 *   media-core  →  media-native  →  React Native app
 *
 * INVARIANT: MUST adapt media-core, MUST NOT duplicate Pexels business logic.
 */

// Provider & Client Access
export { MediaProvider, useMediaClient } from './MediaProvider.js';
export type { MediaProviderProps } from './MediaProvider.js';

// Search Hook
export { useMediaSearch } from './useMediaSearch.js';
export type { UseMediaSearchOptions, UseMediaSearchResult } from './useMediaSearch.js';

// Item Retrieval Hook
export { useMediaItem } from './useMediaItem.js';
export type { UseMediaItemOptions, UseMediaItemResult } from './useMediaItem.js';

// Event Subscription Hook
export { useMediaEvents } from './useMediaEvents.js';

// Re-export core types for consumer convenience
// Consumers can import domain models, errors, and client factory from either package
export {
  createMediaClient,
  MediaForgeClient,
  MediaError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  NetworkError,
  ApiError,
  InvalidResponseError,
  ConfigurationError,
  MediaEventEmitter,
  attachDefaultConsoleListener,
  MEDIA_CORE_VERSION,
} from '@mediaforge/media-core';

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
  MediaClientConfig,
  CacheConfig,
  RequestOptions,
  PhotosSearchOptions,
  PhotosCuratedOptions,
  VideosSearchOptions,
  VideosPopularOptions,
  GetMediaOptions,
  ViewEvent,
  DownloadEvent,
  MediaEventMap,
  MediaEventType,
  EventListener,
  UnsubscribeFunction,
} from '@mediaforge/media-core';

export const MEDIA_NATIVE_VERSION = '0.1.0';

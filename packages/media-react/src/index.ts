/**
 * @mediaforge/media-react
 * React context, provider, and hooks adapting @mediaforge/media-core for React applications.
 * 
 * INVARIANT: MUST adapt media-core, MUST NOT duplicate Pexels business logic.
 */

export { MediaProvider, useMediaClient, MediaContext } from './MediaProvider.js';
export type { MediaProviderProps } from './MediaProvider.js';

export { useMediaSearch } from './useMediaSearch.js';
export type { UseMediaSearchOptions, UseMediaSearchResult } from './useMediaSearch.js';

export { useMediaItem } from './useMediaItem.js';
export type { UseMediaItemOptions, UseMediaItemResult } from './useMediaItem.js';

export { useMediaEvents } from './useMediaEvents.js';

export * from '@mediaforge/media-core';

export const MEDIA_REACT_VERSION = '0.1.0';

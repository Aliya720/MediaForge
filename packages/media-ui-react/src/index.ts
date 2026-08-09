/**
 * @mediaforge/media-ui-react
 * Headless UI behavior, accessibility, prop getters, and keyboard interaction primitives for React.
 *
 * This package is a STYLING-AGNOSTIC behavior library. It does NOT:
 * - Import media-core, media-react, media-native, or external media API clients
 * - Contain CSS, colors, typography, or visual card layouts
 * - Perform HTTP requests or data fetching
 *
 * Architecture:
 *   Application Data  →  media-ui-react (headless behavior)  →  Consumer Markup + CSS
 *
 * INVARIANT: MUST NOT import media-core or media-react.
 * INVARIANT: MUST NOT know about external APIs, HTTP, or SDK state.
 */

export { useMediaGrid } from './useMediaGrid.js';
export type {
  UseMediaGridOptions,
  UseMediaGridResult,
  ComponentProps,
} from './useMediaGrid.js';

export { useLightbox } from './useLightbox.js';
export type {
  UseLightboxOptions,
  UseLightboxResult,
} from './useLightbox.js';

export { useReelSwiper } from './useReelSwiper.js';
export type {
  UseReelSwiperOptions,
  UseReelSwiperResult,
} from './useReelSwiper.js';

export const MEDIA_UI_REACT_VERSION = '0.1.0';

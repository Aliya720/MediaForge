/**
 * @mediaforge/media-ui-native
 * Headless UI primitives adapted to React Native gestures, paging, snap behavior, and accessibility.
 *
 * This package is a STYLING-AGNOSTIC behavior library for React Native. It does NOT:
 * - Import media-core, media-native, media-ui-react, or web DOM APIs
 * - Contain StyleSheet, colors, typography, or visual component layouts
 * - Perform HTTP requests or data fetching
 *
 * Architecture:
 *   Application Data  →  media-ui-native (headless behavior)  →  Consumer RN Components
 *
 * INVARIANT: MUST NOT import media-core or media-native.
 * INVARIANT: MUST NOT know about external APIs, HTTP, or SDK state.
 */

export { useMediaGrid } from './useMediaGrid.js';
export type {
  UseMediaGridOptions,
  UseMediaGridResult,
  NativeComponentProps,
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
  ViewToken,
  ViewableItemsChangedInfo,
} from './useReelSwiper.js';

export const MEDIA_UI_NATIVE_VERSION = '0.1.0';

/**
 * useReelSwiper — Headless behavior hook for React Native vertical video reels / FlatLists.
 *
 * Manages active video index, FlatList viewabilityConfig / onViewableItemsChanged integration,
 * vertical paging configuration, and slide accessibility roles.
 *
 * INVARIANT: MUST NOT import media-core, media-native, media-ui-react, or DOM APIs.
 * INVARIANT: Does NOT render Video/Image elements, StyleSheet, or manage video playback.
 */

import React from 'react';

export interface ViewToken<T> {
  item: T;
  key: string;
  index: number | null;
  isViewable: boolean;
}

export interface ViewableItemsChangedInfo<T> {
  viewableItems: ViewToken<T>[];
  changed: ViewToken<T>[];
}

export interface UseReelSwiperOptions<T> {
  /** Array of arbitrary application video/media items */
  items: T[];

  /** Controlled active item index */
  index?: number;

  /** Default active item index (default: 0) */
  defaultIndex?: number;

  /** Callback fired when active item index changes */
  onActiveChange?: (index: number, item: T) => void;

  /** Visible percentage threshold for FlatList viewabilityConfig (default: 60) */
  viewabilityThreshold?: number;

  /** Accessible label for the video reel region */
  accessibilityLabel?: string;
}

export interface UseReelSwiperResult<T> {
  /** Currently active item index */
  activeIndex: number;

  /** Currently active item object, or null if items array is empty */
  activeItem: T | null;

  /** True if previous item exists */
  hasPrevious: boolean;

  /** True if next item exists */
  hasNext: boolean;

  /** Navigate to next item index */
  next: () => void;

  /** Navigate to previous item index */
  previous: () => void;

  /** Programmatically navigate to specific item index */
  goTo: (index: number) => void;

  /** Callback for FlatList onViewableItemsChanged */
  onViewableItemsChanged: (info: ViewableItemsChangedInfo<T>) => void;

  /** Prop getter for React Native FlatList / ScrollView component */
  getListProps: <P extends Record<string, unknown> = Record<string, unknown>>(userProps?: P) => P & {
    data: T[];
    pagingEnabled: boolean;
    horizontal: false;
    viewabilityConfig: { itemVisiblePercentThreshold: number };
    onViewableItemsChanged: (info: ViewableItemsChangedInfo<T>) => void;
    accessible: boolean;
    accessibilityLabel: string;
  };

  /** Prop getter for individual item render components */
  getItemProps: <P extends Record<string, unknown> = Record<string, unknown>>(
    index: number,
    userProps?: P,
  ) => P & {
    accessible: boolean;
    accessibilityRole: 'header';
    'aria-current': boolean | undefined;
    'data-active': boolean;
    'data-index': number;
  };
}

export function useReelSwiper<T>(options: UseReelSwiperOptions<T>): UseReelSwiperResult<T> {
  const {
    items,
    index: controlledIndex,
    defaultIndex = 0,
    onActiveChange,
    viewabilityThreshold = 60,
    accessibilityLabel = 'Video Reel Feed',
  } = options;

  // Controlled vs Uncontrolled state
  const isControlledIndex = controlledIndex !== undefined;
  const [uncontrolledIndex, setUncontrolledIndex] = React.useState<number>(defaultIndex);
  const activeIndex = isControlledIndex ? controlledIndex : uncontrolledIndex;

  const activeItem = items.length > 0 && activeIndex >= 0 && activeIndex < items.length ? items[activeIndex] : null;

  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < items.length - 1;

  const setActiveIndexState = React.useCallback(
    (nextIdx: number) => {
      if (items.length === 0) return;
      let targetIdx = nextIdx;
      if (targetIdx < 0) targetIdx = 0;
      if (targetIdx >= items.length) targetIdx = items.length - 1;

      if (!isControlledIndex) {
        setUncontrolledIndex(targetIdx);
      }

      if (targetIdx >= 0 && targetIdx < items.length) {
        onActiveChange?.(targetIdx, items[targetIdx]);
      }
    },
    [isControlledIndex, items, onActiveChange],
  );

  const next = React.useCallback(() => {
    setActiveIndexState(activeIndex + 1);
  }, [activeIndex, setActiveIndexState]);

  const previous = React.useCallback(() => {
    setActiveIndexState(activeIndex - 1);
  }, [activeIndex, setActiveIndexState]);

  const goTo = React.useCallback(
    (targetIndex: number) => {
      setActiveIndexState(targetIndex);
    },
    [setActiveIndexState],
  );

  // FlatList onViewableItemsChanged Callback
  const onViewableItemsChanged = React.useCallback(
    (info: ViewableItemsChangedInfo<T>) => {
      if (!info.viewableItems || info.viewableItems.length === 0) return;
      const primaryViewable = info.viewableItems[0];
      if (primaryViewable.index !== null && primaryViewable.index !== undefined) {
        setActiveIndexState(primaryViewable.index);
      }
    },
    [setActiveIndexState],
  );

  // Prop Getters
  const getListProps = React.useCallback(
    <P extends Record<string, unknown> = Record<string, unknown>>(userProps?: P) => {
      return {
        data: items,
        pagingEnabled: true,
        horizontal: false as const,
        viewabilityConfig: {
          itemVisiblePercentThreshold: viewabilityThreshold,
        },
        onViewableItemsChanged,
        accessible: true,
        accessibilityLabel,
        ...userProps,
      } as unknown as P & {
        data: T[];
        pagingEnabled: boolean;
        horizontal: false;
        viewabilityConfig: { itemVisiblePercentThreshold: number };
        onViewableItemsChanged: (info: ViewableItemsChangedInfo<T>) => void;
        accessible: boolean;
        accessibilityLabel: string;
      };
    },
    [accessibilityLabel, items, onViewableItemsChanged, viewabilityThreshold],
  );

  const getItemProps = React.useCallback(
    <P extends Record<string, unknown> = Record<string, unknown>>(index: number, userProps?: P) => {
      const isActive = index === activeIndex;

      return {
        accessible: true,
        accessibilityRole: 'header' as const,
        'aria-current': isActive ? true : undefined,
        'data-active': isActive,
        'data-index': index,
        ...userProps,
      } as unknown as P & {
        accessible: boolean;
        accessibilityRole: 'header';
        'aria-current': boolean | undefined;
        'data-active': boolean;
        'data-index': number;
      };
    },
    [activeIndex],
  );

  return {
    activeIndex,
    activeItem,
    hasPrevious,
    hasNext,
    next,
    previous,
    goTo,
    onViewableItemsChanged,
    getListProps,
    getItemProps,
  };
}

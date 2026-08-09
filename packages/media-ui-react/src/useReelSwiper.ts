/**
 * useReelSwiper — Headless behavior hook for vertical video reels / carousels.
 *
 * Manages active video index, vertical paging, IntersectionObserver active-item detection,
 * keyboard navigation (ArrowUp/Down), and ARIA carousel region attributes.
 *
 * INVARIANT: MUST NOT import media-core, media-react, media-native, or DOM styles.
 * INVARIANT: Does NOT render video elements, CSS styles, or handle video playback.
 */

import React from 'react';

export interface UseReelSwiperOptions<T> {
  /** Array of arbitrary application video/media items */
  items: T[];

  /** Controlled active item index */
  index?: number;

  /** Default active item index (default: 0) */
  defaultIndex?: number;

  /** Callback fired when active item index changes */
  onActiveChange?: (index: number, item: T) => void;

  /** IntersectionObserver visibility threshold for active detection (default: 0.6) */
  threshold?: number;

  /** Accessible label for the reel region */
  ariaLabel?: string;

  /** Optional custom ID for container */
  id?: string;
}

export interface ComponentProps extends Record<string, unknown> {
  onKeyDown?: (event: React.KeyboardEvent) => void;
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

  /** Navigate to next item */
  next: () => void;

  /** Navigate to previous item */
  previous: () => void;

  /** Programmatically navigate to specific item index */
  goTo: (index: number) => void;

  /** Prop getter for reel container element */
  getContainerProps: <P extends ComponentProps = ComponentProps>(userProps?: P) => P & {
    id: string;
    role: string;
    'aria-label': string;
    'aria-roledescription': string;
    tabIndex: number;
    onKeyDown: (event: React.KeyboardEvent) => void;
  };

  /** Prop getter for individual item slides */
  getItemProps: <P extends ComponentProps = ComponentProps>(
    index: number,
    userProps?: P,
  ) => P & {
    ref: (node: HTMLElement | null) => void;
    role: string;
    'aria-label': string;
    'aria-roledescription': string;
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
    threshold = 0.6,
    ariaLabel = 'Video Reel',
    id: customId,
  } = options;

  const generatedId = React.useId ? React.useId() : 'reel-container';
  const containerId = customId || generatedId;

  // Map of registered DOM nodes for IntersectionObserver tracking
  const itemNodesMapRef = React.useRef<Map<number, HTMLElement>>(new Map());

  // Controlled vs Uncontrolled state
  const isControlledIndex = controlledIndex !== undefined;
  const [uncontrolledIndex, setUncontrolledIndex] = React.useState<number>(defaultIndex);
  const activeIndex = isControlledIndex ? controlledIndex : uncontrolledIndex;

  const activeItem = items.length > 0 && activeIndex >= 0 && activeIndex < items.length ? items[activeIndex] : null;

  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < items.length - 1;

  // Change active index helper
  const setActiveIndexState = React.useCallback(
    (nextIndex: number) => {
      if (items.length === 0) return;
      let targetIdx = nextIndex;
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

  // IntersectionObserver Active Item Detection
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const indexAttr = entry.target.getAttribute('data-index');
            if (indexAttr !== null) {
              const idx = parseInt(indexAttr, 10);
              if (!isNaN(idx) && idx !== activeIndex) {
                setActiveIndexState(idx);
              }
            }
          }
        });
      },
      { threshold },
    );

    const nodes = itemNodesMapRef.current;
    nodes.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => {
      observer.disconnect();
    };
  }, [activeIndex, setActiveIndexState, threshold]);

  // Keyboard Handler (ArrowUp / ArrowDown)
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (items.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          if (hasNext) {
            event.preventDefault();
            next();
          }
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          if (hasPrevious) {
            event.preventDefault();
            previous();
          }
          break;
        case 'Home':
          event.preventDefault();
          goTo(0);
          break;
        case 'End':
          event.preventDefault();
          goTo(items.length - 1);
          break;
      }
    },
    [hasNext, next, hasPrevious, previous, goTo, items.length],
  );

  // Prop Getters
  const getContainerProps = React.useCallback(
    <P extends ComponentProps = ComponentProps>(userProps?: P) => {
      return {
        id: containerId,
        role: 'region',
        'aria-label': ariaLabel,
        'aria-roledescription': 'carousel',
        tabIndex: 0,
        ...userProps,
        onKeyDown: (event: React.KeyboardEvent) => {
          userProps?.onKeyDown?.(event);
          handleKeyDown(event);
        },
      } as unknown as P & {
        id: string;
        role: string;
        'aria-label': string;
        'aria-roledescription': string;
        tabIndex: number;
        onKeyDown: (event: React.KeyboardEvent) => void;
      };
    },
    [ariaLabel, containerId, handleKeyDown],
  );

  const getItemProps = React.useCallback(
    <P extends ComponentProps = ComponentProps>(index: number, userProps?: P) => {
      const isActive = index === activeIndex;

      return {
        ref: (node: HTMLElement | null) => {
          if (node) {
            itemNodesMapRef.current.set(index, node);
          } else {
            itemNodesMapRef.current.delete(index);
          }
        },
        role: 'group',
        'aria-label': `Slide ${index + 1} of ${items.length}`,
        'aria-roledescription': 'slide',
        'aria-current': isActive ? true : undefined,
        'data-active': isActive,
        'data-index': index,
        ...userProps,
      } as unknown as P & {
        ref: (node: HTMLElement | null) => void;
        role: string;
        'aria-label': string;
        'aria-roledescription': string;
        'aria-current': boolean | undefined;
        'data-active': boolean;
        'data-index': number;
      };
    },
    [activeIndex, items.length],
  );

  return {
    activeIndex,
    activeItem,
    hasPrevious,
    hasNext,
    next,
    previous,
    goTo,
    getContainerProps,
    getItemProps,
  };
}

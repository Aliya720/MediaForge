import { describe, it, expect, vi } from 'vitest';
import { useReelSwiper, UseReelSwiperOptions } from '../src/index.js';
import { createHookHarness } from './testUtils.js';

interface SampleNativeVideo {
  id: string;
  url: string;
}

const VIDEOS: SampleNativeVideo[] = [
  { id: 'v1', url: 'https://video1.mp4' },
  { id: 'v2', url: 'https://video2.mp4' },
  { id: 'v3', url: 'https://video3.mp4' },
];

describe('useReelSwiper (Native)', () => {
  it('initializes default state and generates proper React Native FlatList prop getters', () => {
    const harness = createHookHarness(
      (opts: UseReelSwiperOptions<SampleNativeVideo>) => useReelSwiper(opts),
      { items: VIDEOS },
    );

    expect(harness.current.activeIndex).toBe(0);
    expect(harness.current.activeItem).toEqual(VIDEOS[0]);
    expect(harness.current.hasPrevious).toBe(false);
    expect(harness.current.hasNext).toBe(true);

    const listProps = harness.current.getListProps();
    expect(listProps.data).toEqual(VIDEOS);
    expect(listProps.pagingEnabled).toBe(true);
    expect(listProps.horizontal).toBe(false);
    expect(listProps.viewabilityConfig.itemVisiblePercentThreshold).toBe(60);
    expect(listProps.accessible).toBe(true);
    expect(listProps.accessibilityLabel).toBe('Video Reel Feed');

    const itemProps0 = harness.current.getItemProps(0);
    expect(itemProps0.accessible).toBe(true);
    expect(itemProps0.accessibilityRole).toBe('header');
    expect(itemProps0['aria-current']).toBe(true);
    expect(itemProps0['data-active']).toBe(true);
    expect(itemProps0['data-index']).toBe(0);

    const itemProps1 = harness.current.getItemProps(1);
    expect(itemProps1['aria-current']).toBeUndefined();
    expect(itemProps1['data-active']).toBe(false);
    expect(itemProps1['data-index']).toBe(1);
  });

  it('navigates next, previous, and goTo with boundary protection', () => {
    const onActiveChange = vi.fn();
    const harness = createHookHarness(
      (opts: UseReelSwiperOptions<SampleNativeVideo>) => useReelSwiper(opts),
      { items: VIDEOS, onActiveChange },
    );

    harness.current.next();
    expect(harness.current.activeIndex).toBe(1);
    expect(harness.current.activeItem).toEqual(VIDEOS[1]);
    expect(onActiveChange).toHaveBeenCalledWith(1, VIDEOS[1]);

    harness.current.next();
    expect(harness.current.activeIndex).toBe(2);
    expect(harness.current.hasNext).toBe(false);

    // End boundary limit
    harness.current.next();
    expect(harness.current.activeIndex).toBe(2);

    harness.current.previous();
    expect(harness.current.activeIndex).toBe(1);

    harness.current.goTo(0);
    expect(harness.current.activeIndex).toBe(0);
    expect(harness.current.hasPrevious).toBe(false);
  });

  it('updates active index when onViewableItemsChanged fires from FlatList', () => {
    const onActiveChange = vi.fn();
    const harness = createHookHarness(
      (opts: UseReelSwiperOptions<SampleNativeVideo>) => useReelSwiper(opts),
      { items: VIDEOS, onActiveChange },
    );

    const listProps = harness.current.getListProps();

    // Simulate FlatList viewability callback
    listProps.onViewableItemsChanged({
      viewableItems: [
        { item: VIDEOS[1], key: 'v2', index: 1, isViewable: true },
      ],
      changed: [],
    });

    expect(harness.current.activeIndex).toBe(1);
    expect(harness.current.activeItem).toEqual(VIDEOS[1]);
    expect(onActiveChange).toHaveBeenCalledWith(1, VIDEOS[1]);
  });

  it('safely handles empty items array', () => {
    const harness = createHookHarness(
      (opts: UseReelSwiperOptions<SampleNativeVideo>) => useReelSwiper(opts),
      { items: [] },
    );

    expect(harness.current.activeIndex).toBe(0);
    expect(harness.current.activeItem).toBeNull();
    expect(harness.current.hasPrevious).toBe(false);
    expect(harness.current.hasNext).toBe(false);

    harness.current.next();
    expect(harness.current.activeIndex).toBe(0);
  });
});

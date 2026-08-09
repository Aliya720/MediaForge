import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { useReelSwiper, UseReelSwiperOptions } from '../src/index.js';
import { createHookHarness } from './testUtils.js';

interface TestVideoItem {
  id: string;
  url: string;
}

const VIDEOS: TestVideoItem[] = [
  { id: 'v1', url: 'https://video1.mp4' },
  { id: 'v2', url: 'https://video2.mp4' },
  { id: 'v3', url: 'https://video3.mp4' },
];

describe('useReelSwiper', () => {
  let originalDocument: typeof globalThis.document;

  beforeEach(() => {
    originalDocument = globalThis.document;
    if (typeof globalThis.document === 'undefined') {
      globalThis.document = {
        createElement: (tag: string) => ({
          tagName: tag.toUpperCase(),
          focus: vi.fn(),
          style: {},
        }),
      } as unknown as typeof globalThis.document;
    }
  });

  afterEach(() => {
    globalThis.document = originalDocument;
  });

  it('initializes with default state and generates proper prop getters', () => {
    const harness = createHookHarness(
      (opts: UseReelSwiperOptions<TestVideoItem>) => useReelSwiper(opts),
      { items: VIDEOS },
    );

    expect(harness.current.activeIndex).toBe(0);
    expect(harness.current.activeItem).toEqual(VIDEOS[0]);
    expect(harness.current.hasPrevious).toBe(false);
    expect(harness.current.hasNext).toBe(true);

    const containerProps = harness.current.getContainerProps();
    expect(containerProps.role).toBe('region');
    expect(containerProps['aria-roledescription']).toBe('carousel');
    expect(containerProps['aria-label']).toBe('Video Reel');

    const itemProps0 = harness.current.getItemProps(0);
    expect(itemProps0.role).toBe('group');
    expect(itemProps0['aria-roledescription']).toBe('slide');
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
      (opts: UseReelSwiperOptions<TestVideoItem>) => useReelSwiper(opts),
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

  it('handles keyboard navigation (ArrowDown, ArrowUp, Home, End)', () => {
    const harness = createHookHarness(
      (opts: UseReelSwiperOptions<TestVideoItem>) => useReelSwiper(opts),
      { items: VIDEOS, defaultIndex: 0 },
    );

    // ArrowDown (Next)
    const preventDown = vi.fn();
    harness.current.getContainerProps().onKeyDown({ key: 'ArrowDown', preventDefault: preventDown } as any);
    expect(preventDown).toHaveBeenCalled();
    expect(harness.current.activeIndex).toBe(1);

    // ArrowUp (Previous)
    harness.current.getContainerProps().onKeyDown({ key: 'ArrowUp', preventDefault: vi.fn() } as any);
    expect(harness.current.activeIndex).toBe(0);

    // End (Last slide)
    harness.current.getContainerProps().onKeyDown({ key: 'End', preventDefault: vi.fn() } as any);
    expect(harness.current.activeIndex).toBe(2);

    // Home (First slide)
    harness.current.getContainerProps().onKeyDown({ key: 'Home', preventDefault: vi.fn() } as any);
    expect(harness.current.activeIndex).toBe(0);
  });

  it('safely handles empty items array', () => {
    const harness = createHookHarness(
      (opts: UseReelSwiperOptions<TestVideoItem>) => useReelSwiper(opts),
      { items: [] },
    );

    expect(harness.current.activeIndex).toBe(0);
    expect(harness.current.activeItem).toBeNull();
    expect(harness.current.hasPrevious).toBe(false);
    expect(harness.current.hasNext).toBe(false);

    harness.current.next();
    expect(harness.current.activeIndex).toBe(0);
  });

  it('registers item node refs gracefully via getItemProps', () => {
    const harness = createHookHarness(
      (opts: UseReelSwiperOptions<TestVideoItem>) => useReelSwiper(opts),
      { items: VIDEOS },
    );

    const dummyNode = { setAttribute: vi.fn() } as any;
    const itemProps = harness.current.getItemProps(0);

    // Ref assignment
    expect(() => {
      itemProps.ref(dummyNode);
      itemProps.ref(null);
    }).not.toThrow();
  });
});

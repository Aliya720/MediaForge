import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { useMediaGrid, UseMediaGridOptions } from '../src/index.js';
import { createHookHarness } from './testUtils.js';

interface TestMediaItem {
  id: string;
  title: string;
}

const ITEMS: TestMediaItem[] = [
  { id: 'm1', title: 'Mountain Sunset' },
  { id: 'm2', title: 'Ocean Waves' },
  { id: 'm3', title: 'Forest Trail' },
];

describe('useMediaGrid', () => {
  it('initializes with default state and generates proper prop getters', () => {
    const harness = createHookHarness(
      (opts: UseMediaGridOptions<TestMediaItem>) => useMediaGrid(opts),
      { items: ITEMS },
    );

    expect(harness.current.selectedItem).toBeNull();
    expect(harness.current.focusedIndex).toBe(-1);
    expect(harness.current.isSelected(ITEMS[0])).toBe(false);

    const gridProps = harness.current.getGridProps();
    expect(gridProps.role).toBe('region');
    expect(gridProps['aria-label']).toBe('Media Grid');

    const itemProps0 = harness.current.getItemProps(ITEMS[0], 0);
    expect(itemProps0.key).toBe('m1');
    expect(itemProps0.role).toBe('button');
    expect(itemProps0.tabIndex).toBe(0); // initial focus default fallback
    expect(itemProps0['aria-selected']).toBe(false);
    expect(itemProps0['data-selected']).toBe(false);
    expect(itemProps0['data-focused']).toBe(false);

    const itemProps1 = harness.current.getItemProps(ITEMS[1], 1);
    expect(itemProps1.tabIndex).toBe(-1);
  });

  it('selects item on click and triggers onItemSelect callback', () => {
    const onItemSelect = vi.fn();
    const onSelectedItemChange = vi.fn();

    const harness = createHookHarness(
      (opts: UseMediaGridOptions<TestMediaItem>) => useMediaGrid(opts),
      { items: ITEMS, onItemSelect, onSelectedItemChange },
    );

    const itemProps1 = harness.current.getItemProps(ITEMS[1], 1);
    itemProps1.onClick({ preventDefault: vi.fn() } as any);

    expect(harness.current.selectedItem).toEqual(ITEMS[1]);
    expect(harness.current.focusedIndex).toBe(1);
    expect(harness.current.isSelected(ITEMS[1])).toBe(true);
    expect(harness.current.isSelected(ITEMS[0])).toBe(false);
    expect(onItemSelect).toHaveBeenCalledWith(ITEMS[1], 1);
    expect(onSelectedItemChange).toHaveBeenCalledWith(ITEMS[1]);
  });

  it('supports controlled selection mode', () => {
    const onSelectedItemChange = vi.fn();

    const harness = createHookHarness(
      (opts: UseMediaGridOptions<TestMediaItem>) => useMediaGrid(opts),
      { items: ITEMS, selectedItem: ITEMS[2], onSelectedItemChange },
    );

    expect(harness.current.selectedItem).toEqual(ITEMS[2]);
    expect(harness.current.isSelected(ITEMS[2])).toBe(true);

    const itemProps0 = harness.current.getItemProps(ITEMS[0], 0);
    itemProps0.onClick({ preventDefault: vi.fn() } as any);

    expect(onSelectedItemChange).toHaveBeenCalledWith(ITEMS[0]);
    // Controlled value remains ITEMS[2] until parent prop updates
    expect(harness.current.selectedItem).toEqual(ITEMS[2]);

    // Parent updates prop
    harness.rerender({ items: ITEMS, selectedItem: ITEMS[0], onSelectedItemChange });
    expect(harness.current.selectedItem).toEqual(ITEMS[0]);
  });

  it('handles keyboard navigation (ArrowRight, ArrowLeft, Home, End, Enter)', () => {
    const onItemSelect = vi.fn();

    const harness = createHookHarness(
      (opts: UseMediaGridOptions<TestMediaItem>) => useMediaGrid(opts),
      { items: ITEMS, onItemSelect, defaultFocusedIndex: 0 },
    );

    // Move Right (Index 0 -> 1)
    const preventDefault1 = vi.fn();
    harness.current.getGridProps().onKeyDown({ key: 'ArrowRight', preventDefault: preventDefault1 } as any);
    expect(preventDefault1).toHaveBeenCalled();
    expect(harness.current.focusedIndex).toBe(1);

    // Move Right (Index 1 -> 2)
    harness.current.getGridProps().onKeyDown({ key: 'ArrowRight', preventDefault: vi.fn() } as any);
    expect(harness.current.focusedIndex).toBe(2);

    // Move Right Wraps (Index 2 -> 0)
    harness.current.getGridProps().onKeyDown({ key: 'ArrowRight', preventDefault: vi.fn() } as any);
    expect(harness.current.focusedIndex).toBe(0);

    // Move Left Wraps (Index 0 -> 2)
    harness.current.getGridProps().onKeyDown({ key: 'ArrowLeft', preventDefault: vi.fn() } as any);
    expect(harness.current.focusedIndex).toBe(2);

    // Press Home (Index 2 -> 0)
    harness.current.getGridProps().onKeyDown({ key: 'Home', preventDefault: vi.fn() } as any);
    expect(harness.current.focusedIndex).toBe(0);

    // Press End (Index 0 -> 2)
    harness.current.getGridProps().onKeyDown({ key: 'End', preventDefault: vi.fn() } as any);
    expect(harness.current.focusedIndex).toBe(2);

    // Press Enter to select focused item (Index 2)
    harness.current.getGridProps().onKeyDown({ key: 'Enter', preventDefault: vi.fn() } as any);
    expect(harness.current.selectedItem).toEqual(ITEMS[2]);
    expect(onItemSelect).toHaveBeenCalledWith(ITEMS[2], 2);
  });

  it('uses custom getItemKey function when provided', () => {
    interface CustomItem {
      uuid: string;
      label: string;
    }
    const customItems: CustomItem[] = [
      { uuid: 'u1', label: 'Item 1' },
      { uuid: 'u2', label: 'Item 2' },
    ];

    const harness = createHookHarness(
      (opts: UseMediaGridOptions<CustomItem>) => useMediaGrid(opts),
      {
        items: customItems,
        getItemKey: (item) => item.uuid,
      },
    );

    const props0 = harness.current.getItemProps(customItems[0], 0);
    const props1 = harness.current.getItemProps(customItems[1], 1);

    expect(props0.key).toBe('u1');
    expect(props1.key).toBe('u2');
  });

  it('merges user props (onClick, onKeyDown, onFocus) without clobbering', () => {
    const userOnClick = vi.fn();
    const userOnKeyDown = vi.fn();
    const userOnFocus = vi.fn();

    const harness = createHookHarness(
      (opts: UseMediaGridOptions<TestMediaItem>) => useMediaGrid(opts),
      { items: ITEMS },
    );

    const itemProps = harness.current.getItemProps(ITEMS[0], 0, {
      onClick: userOnClick,
      onKeyDown: userOnKeyDown,
      onFocus: userOnFocus,
      'data-custom': 'custom-val',
    });

    itemProps.onClick({ preventDefault: vi.fn() } as any);
    expect(userOnClick).toHaveBeenCalled();
    expect(harness.current.selectedItem).toEqual(ITEMS[0]);

    itemProps.onFocus({} as any);
    expect(userOnFocus).toHaveBeenCalled();

    itemProps.onKeyDown({ key: 'Enter', preventDefault: vi.fn() } as any);
    expect(userOnKeyDown).toHaveBeenCalled();

    expect((itemProps as any)['data-custom']).toBe('custom-val');
  });
});

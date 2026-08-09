import { describe, it, expect, vi } from 'vitest';
import { useMediaGrid, UseMediaGridOptions } from '../src/index.js';
import { createHookHarness } from './testUtils.js';

interface SampleNativeMedia {
  id: string;
  title: string;
}

const ITEMS: SampleNativeMedia[] = [
  { id: 'p1', title: 'Mountain' },
  { id: 'p2', title: 'Ocean' },
  { id: 'p3', title: 'Forest' },
];

describe('useMediaGrid (Native)', () => {
  it('initializes default state and generates React Native Pressable props', () => {
    const harness = createHookHarness(
      (opts: UseMediaGridOptions<SampleNativeMedia>) => useMediaGrid(opts),
      { items: ITEMS },
    );

    expect(harness.current.selectedItem).toBeNull();
    expect(harness.current.isSelected(ITEMS[0])).toBe(false);

    const itemProps0 = harness.current.getItemProps(ITEMS[0], 0);
    expect(itemProps0.key).toBe('p1');
    expect(itemProps0.accessible).toBe(true);
    expect(itemProps0.accessibilityRole).toBe('button');
    expect(itemProps0.accessibilityState.selected).toBe(false);
    expect(itemProps0['data-selected']).toBe(false);
  });

  it('selects item on press and triggers onItemSelect callback', () => {
    const onItemSelect = vi.fn();
    const onSelectedItemChange = vi.fn();

    const harness = createHookHarness(
      (opts: UseMediaGridOptions<SampleNativeMedia>) => useMediaGrid(opts),
      { items: ITEMS, onItemSelect, onSelectedItemChange },
    );

    const itemProps1 = harness.current.getItemProps(ITEMS[1], 1);
    itemProps1.onPress({});

    expect(harness.current.selectedItem).toEqual(ITEMS[1]);
    expect(harness.current.isSelected(ITEMS[1])).toBe(true);
    expect(onItemSelect).toHaveBeenCalledWith(ITEMS[1], 1);
    expect(onSelectedItemChange).toHaveBeenCalledWith(ITEMS[1]);
  });

  it('supports controlled selection mode', () => {
    const onSelectedItemChange = vi.fn();

    const harness = createHookHarness(
      (opts: UseMediaGridOptions<SampleNativeMedia>) => useMediaGrid(opts),
      { items: ITEMS, selectedItem: ITEMS[2], onSelectedItemChange },
    );

    expect(harness.current.selectedItem).toEqual(ITEMS[2]);
    expect(harness.current.isSelected(ITEMS[2])).toBe(true);

    const itemProps0 = harness.current.getItemProps(ITEMS[0], 0);
    itemProps0.onPress({});

    expect(onSelectedItemChange).toHaveBeenCalledWith(ITEMS[0]);
    // Controlled state remains ITEMS[2] until parent prop updates
    expect(harness.current.selectedItem).toEqual(ITEMS[2]);

    harness.rerender({ items: ITEMS, selectedItem: ITEMS[0], onSelectedItemChange });
    expect(harness.current.selectedItem).toEqual(ITEMS[0]);
  });

  it('uses custom accessibility label generator when provided', () => {
    const harness = createHookHarness(
      (opts: UseMediaGridOptions<SampleNativeMedia>) => useMediaGrid(opts),
      {
        items: ITEMS,
        getItemAccessibilityLabel: (item, idx) => `Photo ${idx + 1}: ${item.title}`,
      },
    );

    const itemProps0 = harness.current.getItemProps(ITEMS[0], 0);
    expect(itemProps0.accessibilityLabel).toBe('Photo 1: Mountain');
  });

  it('merges user props (onPress) without clobbering', () => {
    const userOnPress = vi.fn();

    const harness = createHookHarness(
      (opts: UseMediaGridOptions<SampleNativeMedia>) => useMediaGrid(opts),
      { items: ITEMS },
    );

    const itemProps = harness.current.getItemProps(ITEMS[0], 0, {
      onPress: userOnPress,
      testID: 'custom-pressable',
    });

    itemProps.onPress({});
    expect(userOnPress).toHaveBeenCalled();
    expect(harness.current.selectedItem).toEqual(ITEMS[0]);
    expect((itemProps as any).testID).toBe('custom-pressable');
  });
});

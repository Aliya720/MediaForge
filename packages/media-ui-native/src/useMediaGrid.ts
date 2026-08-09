/**
 * useMediaGrid — Headless behavior and accessibility hook for React Native media grids.
 *
 * Provides selection state management, key extraction, and React Native Pressable/Touch prop getters.
 *
 * INVARIANT: MUST NOT import media-core, media-native, media-ui-react, or DOM APIs.
 * INVARIANT: Does NOT own styling, StyleSheet, layout dimensions, or visual rendering.
 */

import React from 'react';

export interface UseMediaGridOptions<T> {
  /** Array of arbitrary application media items */
  items: T[];

  /** Stable key generator function for media items */
  getItemKey?: (item: T, index: number) => string;

  /** Controlled selected item */
  selectedItem?: T | null;

  /** Default selected item for uncontrolled usage */
  defaultSelectedItem?: T | null;

  /** Callback fired when an item is pressed/selected */
  onItemSelect?: (item: T, index: number) => void;

  /** Callback fired when selection state changes */
  onSelectedItemChange?: (item: T | null) => void;

  /** Accessibility label generator for grid items */
  getItemAccessibilityLabel?: (item: T, index: number) => string;
}

export interface NativeComponentProps extends Record<string, unknown> {
  onPress?: (event: unknown) => void;
  onLongPress?: (event: unknown) => void;
}

export interface UseMediaGridResult<T> {
  /** Currently selected item */
  selectedItem: T | null;

  /** Select an item programmatically */
  selectItem: (item: T | null) => void;

  /** Returns true if the given item is currently selected */
  isSelected: (item: T) => boolean;

  /** Extract key for item */
  getItemKey: (item: T, index: number) => string;

  /** Prop getter for individual React Native grid item components (Pressable / Touchable) */
  getItemProps: <P extends NativeComponentProps = NativeComponentProps>(
    item: T,
    index: number,
    userProps?: P,
  ) => P & {
    key: string;
    accessible: boolean;
    accessibilityRole: 'button';
    accessibilityState: { selected: boolean };
    accessibilityLabel: string;
    'data-selected': boolean;
    onPress: (event: unknown) => void;
  };
}

function defaultGetItemKey<T>(item: T, index: number): string {
  if (item && typeof item === 'object') {
    if ('id' in item && item.id !== undefined && item.id !== null) {
      return String((item as { id: unknown }).id);
    }
    if ('key' in item && item.key !== undefined && item.key !== null) {
      return String((item as { key: unknown }).key);
    }
  }
  return String(index);
}

export function useMediaGrid<T>(options: UseMediaGridOptions<T>): UseMediaGridResult<T> {
  const {
    items,
    getItemKey = defaultGetItemKey,
    selectedItem: controlledSelectedItem,
    defaultSelectedItem = null,
    onItemSelect,
    onSelectedItemChange,
    getItemAccessibilityLabel,
  } = options;

  const isControlled = controlledSelectedItem !== undefined;
  const [uncontrolledSelectedItem, setUncontrolledSelectedItem] = React.useState<T | null>(defaultSelectedItem);

  const selectedItem = isControlled ? controlledSelectedItem : uncontrolledSelectedItem;

  const selectItem = React.useCallback(
    (item: T | null) => {
      if (!isControlled) {
        setUncontrolledSelectedItem(item);
      }
      onSelectedItemChange?.(item);

      if (item !== null) {
        const index = items.indexOf(item);
        onItemSelect?.(item, index >= 0 ? index : 0);
      }
    },
    [isControlled, items, onItemSelect, onSelectedItemChange],
  );

  const isSelected = React.useCallback(
    (item: T): boolean => {
      if (!selectedItem) return false;
      const keyFn = getItemKey;
      const targetKey = keyFn(item, items.indexOf(item));
      const selectedKey = keyFn(selectedItem, items.indexOf(selectedItem));
      return targetKey === selectedKey;
    },
    [getItemKey, items, selectedItem],
  );

  const getItemProps = React.useCallback(
    <P extends NativeComponentProps = NativeComponentProps>(item: T, index: number, userProps?: P) => {
      const selected = isSelected(item);
      const key = getItemKey(item, index);

      const label = getItemAccessibilityLabel
        ? getItemAccessibilityLabel(item, index)
        : (item as any)?.alt || (item as any)?.title || `Media item ${index + 1}`;

      return {
        key,
        accessible: true,
        accessibilityRole: 'button' as const,
        accessibilityState: { selected },
        accessibilityLabel: label,
        'data-selected': selected,
        ...userProps,
        onPress: (event: unknown) => {
          userProps?.onPress?.(event);
          selectItem(item);
        },
      } as unknown as P & {
        key: string;
        accessible: boolean;
        accessibilityRole: 'button';
        accessibilityState: { selected: boolean };
        accessibilityLabel: string;
        'data-selected': boolean;
        onPress: (event: unknown) => void;
      };
    },
    [getItemAccessibilityLabel, getItemKey, isSelected, selectItem],
  );

  return {
    selectedItem,
    selectItem,
    isSelected,
    getItemKey,
    getItemProps,
  };
}

/**
 * useMediaGrid — Headless behavior and accessibility hook for media grids.
 *
 * Provides generic selection, focus management, keyboard navigation, and ARIA prop getters.
 *
 * INVARIANT: MUST NOT import media-core, media-react, media-native, or DOM styles.
 * INVARIANT: Does NOT own CSS, markup, colors, spacing, or SDK business logic.
 */

import React from 'react';

// ─── Public API Options & Return Types ─────────────────────────────────────

export interface UseMediaGridOptions<T> {
  /** Array of arbitrary application media items */
  items: T[];

  /** Stable key generator function for media items */
  getItemKey?: (item: T, index: number) => string;

  /** Controlled selected item */
  selectedItem?: T | null;

  /** Default selected item for uncontrolled usage */
  defaultSelectedItem?: T | null;

  /** Callback fired when an item is selected via click or keyboard */
  onItemSelect?: (item: T, index: number) => void;

  /** Callback fired when selection changes */
  onSelectedItemChange?: (item: T | null) => void;

  /** Optional accessible label for the grid container */
  ariaLabel?: string;

  /** Initially focused item index (default: -1) */
  defaultFocusedIndex?: number;

  /** Optional container ID override */
  id?: string;
}

export interface ComponentProps extends Record<string, unknown> {
  onClick?: (event: React.MouseEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onFocus?: (event: React.FocusEvent) => void;
}

export interface UseMediaGridResult<T> {
  /** Currently selected item */
  selectedItem: T | null;

  /** Index of currently focused item (-1 if none) */
  focusedIndex: number;

  /** Select an item programmatically */
  selectItem: (item: T | null) => void;

  /** Move focus to a specific item index */
  setFocusedIndex: (index: number) => void;

  /** Returns true if the given item is currently selected */
  isSelected: (item: T) => boolean;

  /** Returns true if the given item index is currently focused */
  isFocused: (index: number) => boolean;

  /** Prop getter for the grid container element */
  getGridProps: <P extends ComponentProps = ComponentProps>(userProps?: P) => P & {
    role: string;
    'aria-label': string;
    onKeyDown: (event: React.KeyboardEvent) => void;
  };

  /** Prop getter for individual grid item elements */
  getItemProps: <P extends ComponentProps = ComponentProps>(
    item: T,
    index: number,
    userProps?: P,
  ) => P & {
    key: string;
    role: string;
    tabIndex: number;
    'aria-selected': boolean;
    'data-selected': boolean;
    'data-focused': boolean;
    onClick: (event: React.MouseEvent) => void;
    onKeyDown: (event: React.KeyboardEvent) => void;
    onFocus: (event: React.FocusEvent) => void;
  };
}

// ─── Default Key Extractor ──────────────────────────────────────────────────

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

// ─── Hook Implementation ────────────────────────────────────────────────────

export function useMediaGrid<T>(options: UseMediaGridOptions<T>): UseMediaGridResult<T> {
  const {
    items,
    getItemKey = defaultGetItemKey,
    selectedItem: controlledSelectedItem,
    defaultSelectedItem = null,
    onItemSelect,
    onSelectedItemChange,
    ariaLabel = 'Media Grid',
    defaultFocusedIndex = -1,
    id: customId,
  } = options;

  const generatedId = React.useId ? React.useId() : 'media-grid';
  const gridId = customId || generatedId;

  // Controlled vs Uncontrolled selection state
  const isControlled = controlledSelectedItem !== undefined;
  const [uncontrolledSelectedItem, setUncontrolledSelectedItem] = React.useState<T | null>(defaultSelectedItem);

  const selectedItem = isControlled ? controlledSelectedItem : uncontrolledSelectedItem;

  const [focusedIndex, setFocusedIndex] = React.useState<number>(defaultFocusedIndex);

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

  const isFocused = React.useCallback(
    (index: number): boolean => {
      return focusedIndex === index;
    },
    [focusedIndex],
  );

  // ─── Keyboard Navigation Handler ──────────────────────────────────────────

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (items.length === 0) return;

      let nextIndex = focusedIndex;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          nextIndex = focusedIndex < items.length - 1 ? focusedIndex + 1 : 0;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          nextIndex = focusedIndex > 0 ? focusedIndex - 1 : items.length - 1;
          break;
        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          nextIndex = items.length - 1;
          break;
        case 'Enter':
        case ' ':
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            event.preventDefault();
            selectItem(items[focusedIndex]);
          }
          return;
        default:
          return;
      }

      if (nextIndex !== focusedIndex) {
        setFocusedIndex(nextIndex);
      }
    },
    [focusedIndex, items, selectItem],
  );

  // ─── Prop Getters ──────────────────────────────────────────────────────────

  const getGridProps = React.useCallback(
    <P extends ComponentProps = ComponentProps>(userProps?: P) => {
      return {
        id: gridId,
        role: 'region',
        'aria-label': ariaLabel,
        ...userProps,
        onKeyDown: (event: React.KeyboardEvent) => {
          userProps?.onKeyDown?.(event);
          handleKeyDown(event);
        },
      } as unknown as P & {
        role: string;
        'aria-label': string;
        onKeyDown: (event: React.KeyboardEvent) => void;
      };
    },
    [ariaLabel, gridId, handleKeyDown],
  );

  const getItemProps = React.useCallback(
    <P extends ComponentProps = ComponentProps>(item: T, index: number, userProps?: P) => {
      const selected = isSelected(item);
      const focused = isFocused(index);
      const key = getItemKey(item, index);

      return {
        key,
        role: 'button',
        tabIndex: focused || (focusedIndex === -1 && index === 0) ? 0 : -1,
        'aria-selected': selected,
        'aria-label': (item as any)?.alt || (item as any)?.title || `Media item ${index + 1}`,
        'data-selected': selected,
        'data-focused': focused,
        ...userProps,
        onClick: (event: React.MouseEvent) => {
          userProps?.onClick?.(event);
          setFocusedIndex(index);
          selectItem(item);
        },
        onFocus: (event: React.FocusEvent) => {
          userProps?.onFocus?.(event);
          setFocusedIndex(index);
        },
        onKeyDown: (event: React.KeyboardEvent) => {
          userProps?.onKeyDown?.(event);
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectItem(item);
          }
        },
      } as unknown as P & {
        key: string;
        role: string;
        tabIndex: number;
        'aria-selected': boolean;
        'data-selected': boolean;
        'data-focused': boolean;
        onClick: (event: React.MouseEvent) => void;
        onKeyDown: (event: React.KeyboardEvent) => void;
        onFocus: (event: React.FocusEvent) => void;
      };
    },
    [getItemKey, isFocused, isSelected, focusedIndex, selectItem],
  );

  return {
    selectedItem,
    focusedIndex,
    selectItem,
    setFocusedIndex,
    isSelected,
    isFocused,
    getGridProps,
    getItemProps,
  };
}

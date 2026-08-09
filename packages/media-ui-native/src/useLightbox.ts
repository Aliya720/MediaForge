/**
 * useLightbox — Headless behavior and accessibility hook for React Native Lightbox modals.
 *
 * Manages modal visibility, item navigation, Android hardware BackHandler dismiss,
 * and React Native modal accessibility attributes.
 *
 * INVARIANT: MUST NOT import media-core, media-native, media-ui-react, or DOM APIs.
 * INVARIANT: Does NOT render visual Modal/Image/Video components or styles.
 */

import React from 'react';
import { BackHandler } from 'react-native';

export interface UseLightboxOptions<T> {
  /** Array of arbitrary application media items */
  items: T[];

  /** Controlled open state */
  isOpen?: boolean;

  /** Default open state for uncontrolled usage */
  defaultIsOpen?: boolean;

  /** Callback fired when open state changes */
  onOpenChange?: (isOpen: boolean) => void;

  /** Controlled active item index */
  index?: number;

  /** Default active item index (default: 0) */
  defaultIndex?: number;

  /** Callback fired when active item index changes */
  onIndexChange?: (index: number, item: T) => void;

  /** Whether navigation wraps around at boundaries (default: true) */
  loop?: boolean;

  /** Accessible label for the modal */
  accessibilityLabel?: string;
}

export interface NativeComponentProps extends Record<string, unknown> {
  onPress?: (event: unknown) => void;
  onRequestClose?: () => void;
}

export interface UseLightboxResult<T> {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Index of currently displayed item */
  activeIndex: number;

  /** Currently displayed item object, or null if items array is empty */
  activeItem: T | null;

  /** True if previous navigation is possible */
  hasPrevious: boolean;

  /** True if next navigation is possible */
  hasNext: boolean;

  /** Open the Lightbox, optionally at a specific index */
  open: (index?: number) => void;

  /** Close the Lightbox */
  close: () => void;

  /** Navigate to next item */
  next: () => void;

  /** Navigate to previous item */
  previous: () => void;

  /** Navigate to specific item index */
  goTo: (index: number) => void;

  /** Prop getter for React Native Modal component */
  getModalProps: <P extends NativeComponentProps = NativeComponentProps>(userProps?: P) => P & {
    visible: boolean;
    transparent: boolean;
    animationType: 'none';
    accessibilityViewIsModal: boolean;
    accessibilityLabel: string;
    onRequestClose: () => void;
  };

  /** Prop getter for Close button */
  getCloseButtonProps: <P extends NativeComponentProps = NativeComponentProps>(userProps?: P) => P & {
    accessible: boolean;
    accessibilityRole: 'button';
    accessibilityLabel: string;
    onPress: (event: unknown) => void;
  };

  /** Prop getter for Previous button */
  getPreviousButtonProps: <P extends NativeComponentProps = NativeComponentProps>(userProps?: P) => P & {
    accessible: boolean;
    accessibilityRole: 'button';
    accessibilityLabel: string;
    disabled: boolean;
    onPress: (event: unknown) => void;
  };

  /** Prop getter for Next button */
  getNextButtonProps: <P extends NativeComponentProps = NativeComponentProps>(userProps?: P) => P & {
    accessible: boolean;
    accessibilityRole: 'button';
    accessibilityLabel: string;
    disabled: boolean;
    onPress: (event: unknown) => void;
  };
}

export function useLightbox<T>(options: UseLightboxOptions<T>): UseLightboxResult<T> {
  const {
    items,
    isOpen: controlledIsOpen,
    defaultIsOpen = false,
    onOpenChange,
    index: controlledIndex,
    defaultIndex = 0,
    onIndexChange,
    loop = true,
    accessibilityLabel = 'Media Lightbox Modal',
  } = options;

  // Controlled vs Uncontrolled state
  const isControlledOpen = controlledIsOpen !== undefined;
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = React.useState<boolean>(defaultIsOpen);
  const isOpen = isControlledOpen ? controlledIsOpen : uncontrolledIsOpen;

  const isControlledIndex = controlledIndex !== undefined;
  const [uncontrolledIndex, setUncontrolledIndex] = React.useState<number>(defaultIndex);
  const activeIndex = isControlledIndex ? controlledIndex : uncontrolledIndex;

  const activeItem = items.length > 0 && activeIndex >= 0 && activeIndex < items.length ? items[activeIndex] : null;

  const hasPrevious = items.length > 1 && (loop || activeIndex > 0);
  const hasNext = items.length > 1 && (loop || activeIndex < items.length - 1);

  const setOpenState = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlledOpen) {
        setUncontrolledIsOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlledOpen, onOpenChange],
  );

  const setIndexState = React.useCallback(
    (nextIdx: number) => {
      if (items.length === 0) return;
      let targetIndex = nextIdx;
      if (loop) {
        if (targetIndex < 0) targetIndex = items.length - 1;
        if (targetIndex >= items.length) targetIndex = 0;
      } else {
        if (targetIndex < 0) targetIndex = 0;
        if (targetIndex >= items.length) targetIndex = items.length - 1;
      }

      if (!isControlledIndex) {
        setUncontrolledIndex(targetIndex);
      }
      if (targetIndex >= 0 && targetIndex < items.length) {
        onIndexChange?.(targetIndex, items[targetIndex]);
      }
    },
    [isControlledIndex, items, loop, onIndexChange],
  );

  const open = React.useCallback(
    (targetIndex?: number) => {
      if (targetIndex !== undefined) {
        setIndexState(targetIndex);
      }
      setOpenState(true);
    },
    [setIndexState, setOpenState],
  );

  const close = React.useCallback(() => {
    setOpenState(false);
  }, [setOpenState]);

  const next = React.useCallback(() => {
    setIndexState(activeIndex + 1);
  }, [activeIndex, setIndexState]);

  const previous = React.useCallback(() => {
    setIndexState(activeIndex - 1);
  }, [activeIndex, setIndexState]);

  const goTo = React.useCallback(
    (targetIndex: number) => {
      setIndexState(targetIndex);
    },
    [setIndexState],
  );

  // Android Hardware Back Button Dismiss Lifecycle
  React.useEffect(() => {
    if (!isOpen || !BackHandler || typeof BackHandler.addEventListener !== 'function') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true; // Handled back press
    });

    return () => {
      subscription.remove();
    };
  }, [isOpen, close]);

  // Prop Getters
  const getModalProps = React.useCallback(
    <P extends NativeComponentProps = NativeComponentProps>(userProps?: P) => {
      return {
        visible: isOpen,
        transparent: true,
        animationType: 'none' as const,
        accessibilityViewIsModal: true,
        accessibilityLabel,
        ...userProps,
        onRequestClose: () => {
          userProps?.onRequestClose?.();
          close();
        },
      } as unknown as P & {
        visible: boolean;
        transparent: boolean;
        animationType: 'none';
        accessibilityViewIsModal: boolean;
        accessibilityLabel: string;
        onRequestClose: () => void;
      };
    },
    [accessibilityLabel, close, isOpen],
  );

  const getCloseButtonProps = React.useCallback(
    <P extends NativeComponentProps = NativeComponentProps>(userProps?: P) => {
      return {
        accessible: true,
        accessibilityRole: 'button' as const,
        accessibilityLabel: 'Close modal',
        ...userProps,
        onPress: (event: unknown) => {
          userProps?.onPress?.(event);
          close();
        },
      } as unknown as P & {
        accessible: boolean;
        accessibilityRole: 'button';
        accessibilityLabel: string;
        onPress: (event: unknown) => void;
      };
    },
    [close],
  );

  const getPreviousButtonProps = React.useCallback(
    <P extends NativeComponentProps = NativeComponentProps>(userProps?: P) => {
      return {
        accessible: true,
        accessibilityRole: 'button' as const,
        accessibilityLabel: 'Previous item',
        disabled: !hasPrevious,
        ...userProps,
        onPress: (event: unknown) => {
          userProps?.onPress?.(event);
          if (hasPrevious) previous();
        },
      } as unknown as P & {
        accessible: boolean;
        accessibilityRole: 'button';
        accessibilityLabel: string;
        disabled: boolean;
        onPress: (event: unknown) => void;
      };
    },
    [hasPrevious, previous],
  );

  const getNextButtonProps = React.useCallback(
    <P extends NativeComponentProps = NativeComponentProps>(userProps?: P) => {
      return {
        accessible: true,
        accessibilityRole: 'button' as const,
        accessibilityLabel: 'Next item',
        disabled: !hasNext,
        ...userProps,
        onPress: (event: unknown) => {
          userProps?.onPress?.(event);
          if (hasNext) next();
        },
      } as unknown as P & {
        accessible: boolean;
        accessibilityRole: 'button';
        accessibilityLabel: string;
        disabled: boolean;
        onPress: (event: unknown) => void;
      };
    },
    [hasNext, next],
  );

  return {
    isOpen,
    activeIndex,
    activeItem,
    hasPrevious,
    hasNext,
    open,
    close,
    next,
    previous,
    goTo,
    getModalProps,
    getCloseButtonProps,
    getPreviousButtonProps,
    getNextButtonProps,
  };
}

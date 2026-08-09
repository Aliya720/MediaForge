/**
 * useLightbox — Headless behavior and accessibility hook for Lightbox modals.
 *
 * Manages open/close state, item navigation, focus restoration, dialog ARIA attributes,
 * keyboard shortcuts (Escape, Left/Right arrows, Tab focus trap), and body scroll lock.
 *
 * INVARIANT: MUST NOT import media-core, media-react, media-native, or DOM styles.
 * INVARIANT: Does NOT render media elements, UI controls, colors, or CSS.
 */

import React from 'react';

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

  /** Whether to prevent background body scrolling when open (default: true) */
  preventScroll?: boolean;

  /** Optional accessible label for the modal dialog */
  ariaLabel?: string;

  /** Optional custom ID for the dialog */
  id?: string;
}

export interface ComponentProps extends Record<string, unknown> {
  onClick?: (event: React.MouseEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

export interface UseLightboxResult<T> {
  /** Whether the Lightbox modal is open */
  isOpen: boolean;

  /** Index of currently displayed item */
  activeIndex: number;

  /** Currently displayed item object, or null if items is empty */
  activeItem: T | null;

  /** True if previous navigation is possible */
  hasPrevious: boolean;

  /** True if next navigation is possible */
  hasNext: boolean;

  /** Open the Lightbox, optionally at a specific index */
  open: (index?: number) => void;

  /** Close the Lightbox and restore focus */
  close: () => void;

  /** Navigate to next item */
  next: () => void;

  /** Navigate to previous item */
  previous: () => void;

  /** Navigate to specific item index */
  goTo: (index: number) => void;

  /** Prop getter for the dialog overlay/modal container */
  getDialogProps: <P extends ComponentProps = ComponentProps>(userProps?: P) => P & {
    id: string;
    role: string;
    'aria-modal': boolean;
    'aria-label': string;
    tabIndex: number;
    onKeyDown: (event: React.KeyboardEvent) => void;
  };

  /** Prop getter for close button */
  getCloseButtonProps: <P extends ComponentProps = ComponentProps>(userProps?: P) => P & {
    role: string;
    'aria-label': string;
    onClick: (event: React.MouseEvent) => void;
  };

  /** Prop getter for previous button */
  getPreviousButtonProps: <P extends ComponentProps = ComponentProps>(userProps?: P) => P & {
    role: string;
    'aria-label': string;
    disabled: boolean;
    onClick: (event: React.MouseEvent) => void;
  };

  /** Prop getter for next button */
  getNextButtonProps: <P extends ComponentProps = ComponentProps>(userProps?: P) => P & {
    role: string;
    'aria-label': string;
    disabled: boolean;
    onClick: (event: React.MouseEvent) => void;
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
    preventScroll = true,
    ariaLabel = 'Media Lightbox',
    id: customId,
  } = options;

  const generatedId = React.useId ? React.useId() : 'lightbox-dialog';
  const dialogId = customId || generatedId;

  // Track triggering element for focus restoration on close
  const triggerRef = React.useRef<HTMLElement | null>(null);

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

  // Helper to change open state
  const setOpenState = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlledOpen) {
        setUncontrolledIsOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlledOpen, onOpenChange],
  );

  // Helper to change index state
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
      if (typeof document !== 'undefined' && document.activeElement && 'focus' in document.activeElement) {
        triggerRef.current = document.activeElement as HTMLElement;
      }
      if (targetIndex !== undefined) {
        setIndexState(targetIndex);
      }
      setOpenState(true);
    },
    [setIndexState, setOpenState],
  );

  const close = React.useCallback(() => {
    setOpenState(false);
    // Restore focus safely on close
    if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
      try {
        triggerRef.current.focus();
      } catch {
        // Ignore if element is unmounted or detached
      }
    }
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

  // Body Scroll Lock Lifecycle
  React.useEffect(() => {
    if (!preventScroll || !isOpen || typeof document === 'undefined') return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, preventScroll]);

  // Keyboard Handler (Escape & Left/Right Arrows)
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          close();
          break;
        case 'ArrowLeft':
          if (hasPrevious) {
            event.preventDefault();
            previous();
          }
          break;
        case 'ArrowRight':
          if (hasNext) {
            event.preventDefault();
            next();
          }
          break;
        case 'Tab': {
          // Focus trap inside dialog
          const dialogElement = event.currentTarget as HTMLElement;
          if (!dialogElement || typeof dialogElement.querySelectorAll !== 'function') return;
          const focusables = dialogElement.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          if (focusables.length === 0) return;

          const firstEl = focusables[0];
          const lastEl = focusables[focusables.length - 1];

          if (event.shiftKey) {
            if (document.activeElement === firstEl) {
              event.preventDefault();
              lastEl.focus();
            }
          } else {
            if (document.activeElement === lastEl) {
              event.preventDefault();
              firstEl.focus();
            }
          }
          break;
        }
      }
    },
    [isOpen, close, hasPrevious, previous, hasNext, next],
  );

  // Prop Getters
  const getDialogProps = React.useCallback(
    <P extends ComponentProps = ComponentProps>(userProps?: P) => {
      return {
        id: dialogId,
        role: 'dialog',
        'aria-modal': true,
        'aria-label': ariaLabel,
        tabIndex: -1,
        ...userProps,
        onKeyDown: (event: React.KeyboardEvent) => {
          userProps?.onKeyDown?.(event);
          handleKeyDown(event);
        },
      } as unknown as P & {
        id: string;
        role: string;
        'aria-modal': boolean;
        'aria-label': string;
        tabIndex: number;
        onKeyDown: (event: React.KeyboardEvent) => void;
      };
    },
    [ariaLabel, dialogId, handleKeyDown],
  );

  const getCloseButtonProps = React.useCallback(
    <P extends ComponentProps = ComponentProps>(userProps?: P) => {
      return {
        role: 'button',
        'aria-label': 'Close dialog',
        ...userProps,
        onClick: (event: React.MouseEvent) => {
          userProps?.onClick?.(event);
          close();
        },
      } as unknown as P & {
        role: string;
        'aria-label': string;
        onClick: (event: React.MouseEvent) => void;
      };
    },
    [close],
  );

  const getPreviousButtonProps = React.useCallback(
    <P extends ComponentProps = ComponentProps>(userProps?: P) => {
      return {
        role: 'button',
        'aria-label': 'Previous item',
        disabled: !hasPrevious,
        ...userProps,
        onClick: (event: React.MouseEvent) => {
          userProps?.onClick?.(event);
          if (hasPrevious) previous();
        },
      } as unknown as P & {
        role: string;
        'aria-label': string;
        disabled: boolean;
        onClick: (event: React.MouseEvent) => void;
      };
    },
    [hasPrevious, previous],
  );

  const getNextButtonProps = React.useCallback(
    <P extends ComponentProps = ComponentProps>(userProps?: P) => {
      return {
        role: 'button',
        'aria-label': 'Next item',
        disabled: !hasNext,
        ...userProps,
        onClick: (event: React.MouseEvent) => {
          userProps?.onClick?.(event);
          if (hasNext) next();
        },
      } as unknown as P & {
        role: string;
        'aria-label': string;
        disabled: boolean;
        onClick: (event: React.MouseEvent) => void;
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
    getDialogProps,
    getCloseButtonProps,
    getPreviousButtonProps,
    getNextButtonProps,
  };
}

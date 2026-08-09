import { describe, it, expect, vi } from 'vitest';
import { useLightbox, UseLightboxOptions } from '../src/index.js';
import { createHookHarness } from './testUtils.js';

interface SampleNativeItem {
  id: string;
  title: string;
}

const ITEMS: SampleNativeItem[] = [
  { id: '1', title: 'Item 1' },
  { id: '2', title: 'Item 2' },
  { id: '3', title: 'Item 3' },
];

describe('useLightbox (Native)', () => {
  it('initializes with default state and generates proper React Native Modal prop getters', () => {
    const harness = createHookHarness(
      (opts: UseLightboxOptions<SampleNativeItem>) => useLightbox(opts),
      { items: ITEMS },
    );

    expect(harness.current.isOpen).toBe(false);
    expect(harness.current.activeIndex).toBe(0);
    expect(harness.current.activeItem).toEqual(ITEMS[0]);
    expect(harness.current.hasPrevious).toBe(true); // loop defaults to true
    expect(harness.current.hasNext).toBe(true);

    const modalProps = harness.current.getModalProps();
    expect(modalProps.visible).toBe(false);
    expect(modalProps.transparent).toBe(true);
    expect(modalProps.animationType).toBe('none');
    expect(modalProps.accessibilityViewIsModal).toBe(true);
    expect(modalProps.accessibilityLabel).toBe('Media Lightbox Modal');

    const closeBtnProps = harness.current.getCloseButtonProps();
    expect(closeBtnProps.accessible).toBe(true);
    expect(closeBtnProps.accessibilityRole).toBe('button');
    expect(closeBtnProps.accessibilityLabel).toBe('Close modal');

    const prevBtnProps = harness.current.getPreviousButtonProps();
    expect(prevBtnProps.disabled).toBe(false);

    const nextBtnProps = harness.current.getNextButtonProps();
    expect(nextBtnProps.disabled).toBe(false);
  });

  it('opens and closes via open() and close() callbacks', () => {
    const onOpenChange = vi.fn();
    const harness = createHookHarness(
      (opts: UseLightboxOptions<SampleNativeItem>) => useLightbox(opts),
      { items: ITEMS, onOpenChange },
    );

    harness.current.open(1);

    expect(harness.current.isOpen).toBe(true);
    expect(harness.current.activeIndex).toBe(1);
    expect(harness.current.activeItem).toEqual(ITEMS[1]);
    expect(onOpenChange).toHaveBeenCalledWith(true);

    harness.current.close();

    expect(harness.current.isOpen).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('navigates next and previous with looping enabled', () => {
    const onIndexChange = vi.fn();
    const harness = createHookHarness(
      (opts: UseLightboxOptions<SampleNativeItem>) => useLightbox(opts),
      { items: ITEMS, defaultIndex: 0, loop: true, onIndexChange },
    );

    harness.current.next();
    expect(harness.current.activeIndex).toBe(1);
    expect(onIndexChange).toHaveBeenCalledWith(1, ITEMS[1]);

    harness.current.next();
    expect(harness.current.activeIndex).toBe(2);

    // Loop to start
    harness.current.next();
    expect(harness.current.activeIndex).toBe(0);

    // Loop backwards to end
    harness.current.previous();
    expect(harness.current.activeIndex).toBe(2);
  });

  it('respects non-looping boundary navigation and disables buttons', () => {
    const harness = createHookHarness(
      (opts: UseLightboxOptions<SampleNativeItem>) => useLightbox(opts),
      { items: ITEMS, defaultIndex: 0, loop: false },
    );

    expect(harness.current.hasPrevious).toBe(false);
    expect(harness.current.hasNext).toBe(true);
    expect(harness.current.getPreviousButtonProps().disabled).toBe(true);

    harness.current.goTo(2);

    expect(harness.current.hasPrevious).toBe(true);
    expect(harness.current.hasNext).toBe(false);
    expect(harness.current.getNextButtonProps().disabled).toBe(true);
  });

  it('handles onRequestClose via getModalProps', () => {
    const onRequestClose = vi.fn();
    const harness = createHookHarness(
      (opts: UseLightboxOptions<SampleNativeItem>) => useLightbox(opts),
      { items: ITEMS, defaultIsOpen: true },
    );

    const modalProps = harness.current.getModalProps({ onRequestClose });
    modalProps.onRequestClose();

    expect(onRequestClose).toHaveBeenCalled();
    expect(harness.current.isOpen).toBe(false);
  });
});

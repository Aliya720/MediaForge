import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { useLightbox, UseLightboxOptions } from '../src/index.js';
import { createHookHarness } from './testUtils.js';

interface SampleItem {
  id: string;
  title: string;
}

const ITEMS: SampleItem[] = [
  { id: '1', title: 'Item 1' },
  { id: '2', title: 'Item 2' },
  { id: '3', title: 'Item 3' },
];

describe('useLightbox', () => {
  let originalDocument: typeof globalThis.document;

  beforeEach(() => {
    originalDocument = globalThis.document;
    // Provide minimal mock document for Node test environment
    if (typeof globalThis.document === 'undefined') {
      const mockBody = { style: { overflow: '' } };
      const mockActiveElement = { focus: vi.fn() };
      globalThis.document = {
        body: mockBody,
        activeElement: mockActiveElement,
        createElement: (tag: string) => ({
          tagName: tag.toUpperCase(),
          focus: vi.fn(),
          style: {},
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        }),
      } as unknown as typeof globalThis.document;
    }
  });

  afterEach(() => {
    globalThis.document = originalDocument;
  });

  it('initializes with default closed state and generates proper prop getters', () => {
    const harness = createHookHarness(
      (opts: UseLightboxOptions<SampleItem>) => useLightbox(opts),
      { items: ITEMS },
    );

    expect(harness.current.isOpen).toBe(false);
    expect(harness.current.activeIndex).toBe(0);
    expect(harness.current.activeItem).toEqual(ITEMS[0]);
    expect(harness.current.hasPrevious).toBe(true); // loop defaults to true
    expect(harness.current.hasNext).toBe(true);

    const dialogProps = harness.current.getDialogProps();
    expect(dialogProps.role).toBe('dialog');
    expect(dialogProps['aria-modal']).toBe(true);
    expect(dialogProps['aria-label']).toBe('Media Lightbox');

    const closeBtnProps = harness.current.getCloseButtonProps();
    expect(closeBtnProps['aria-label']).toBe('Close dialog');

    const prevBtnProps = harness.current.getPreviousButtonProps();
    expect(prevBtnProps.disabled).toBe(false);

    const nextBtnProps = harness.current.getNextButtonProps();
    expect(nextBtnProps.disabled).toBe(false);
  });

  it('opens and closes via open() and close() callbacks', () => {
    const onOpenChange = vi.fn();
    const harness = createHookHarness(
      (opts: UseLightboxOptions<SampleItem>) => useLightbox(opts),
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
      (opts: UseLightboxOptions<SampleItem>) => useLightbox(opts),
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
      (opts: UseLightboxOptions<SampleItem>) => useLightbox(opts),
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

  it('handles keyboard navigation (Escape, ArrowLeft, ArrowRight)', () => {
    const harness = createHookHarness(
      (opts: UseLightboxOptions<SampleItem>) => useLightbox(opts),
      { items: ITEMS, defaultIsOpen: true, defaultIndex: 0 },
    );

    // Press Right
    const preventRight = vi.fn();
    harness.current.getDialogProps().onKeyDown({ key: 'ArrowRight', preventDefault: preventRight } as any);
    expect(preventRight).toHaveBeenCalled();
    expect(harness.current.activeIndex).toBe(1);

    // Press Left
    harness.current.getDialogProps().onKeyDown({ key: 'ArrowLeft', preventDefault: vi.fn() } as any);
    expect(harness.current.activeIndex).toBe(0);

    // Press Escape to close
    const preventEsc = vi.fn();
    harness.current.getDialogProps().onKeyDown({ key: 'Escape', preventDefault: preventEsc } as any);
    expect(preventEsc).toHaveBeenCalled();
    expect(harness.current.isOpen).toBe(false);
  });

  it('locks body scroll when open and restores overflow on close/unmount', () => {
    const harness = createHookHarness(
      (opts: UseLightboxOptions<SampleItem>) => useLightbox(opts),
      { items: ITEMS, defaultIsOpen: true, preventScroll: true },
    );

    expect(document.body.style.overflow).toBe('hidden');

    harness.current.close();
    expect(document.body.style.overflow).toBe('');

    harness.current.open();
    expect(document.body.style.overflow).toBe('hidden');

    harness.unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('restores focus to triggering element on close', () => {
    const focusSpy = vi.fn();
    (document as any).activeElement = { focus: focusSpy };

    const harness = createHookHarness(
      (opts: UseLightboxOptions<SampleItem>) => useLightbox(opts),
      { items: ITEMS },
    );

    harness.current.open();
    expect(harness.current.isOpen).toBe(true);

    harness.current.close();
    expect(focusSpy).toHaveBeenCalled();
  });
});

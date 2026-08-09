import { describe, it, expect, vi } from 'vitest';
import { createMediaClient, ViewEvent } from '@mediaforge/media-core';
import { useMediaEvents } from '../src/index.js';
import { createHookHarness } from './testUtils.js';

describe('useMediaEvents', () => {
  it('subscribes to SDK events on mount and unsubscribes on unmount', () => {
    const mockClient = createMediaClient({ apiKey: 'test-key', fetchFn: vi.fn(), enableConsoleEvents: false });
    const listener = vi.fn();

    const harness = createHookHarness(mockClient, () => {
      useMediaEvents('view', listener);
    }, undefined);

    expect(mockClient.events.listenerCount('view')).toBe(1);

    const testPayload: ViewEvent = {
      type: 'view',
      mediaId: '123',
      mediaType: 'photo',
      timestamp: Date.now(),
    };

    mockClient.events.emit('view', testPayload);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(testPayload);

    // Unmount and verify cleanup
    harness.unmount();

    expect(mockClient.events.listenerCount('view')).toBe(0);
  });

  it('keeps listener reference stable across rerenders', () => {
    const mockClient = createMediaClient({ apiKey: 'test-key', fetchFn: vi.fn(), enableConsoleEvents: false });
    let listenerCallCount = 0;

    const harness = createHookHarness(mockClient, (cb: any) => {
      useMediaEvents('view', cb);
    }, () => { listenerCallCount++; });

    expect(mockClient.events.listenerCount('view')).toBe(1);

    // Rerender with a new function reference
    harness.rerender(() => { listenerCallCount++; });

    expect(mockClient.events.listenerCount('view')).toBe(1);

    mockClient.events.emit('view', {
      type: 'view',
      mediaId: '999',
      mediaType: 'video',
      timestamp: Date.now(),
    });

    expect(listenerCallCount).toBe(1);
    harness.unmount();
  });
});

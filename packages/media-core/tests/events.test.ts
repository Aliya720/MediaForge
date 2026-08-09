import { describe, it, expect, vi } from 'vitest';
import { createMediaClient, MediaEventEmitter, attachDefaultConsoleListener } from '../src/index.js';

describe('SDK Event System', () => {
  it('subscribes, receives typed payloads, and unsubscribes correctly', () => {
    const emitter = new MediaEventEmitter();
    const viewListener = vi.fn();

    const unsubscribe = emitter.subscribe('view', viewListener);
    expect(emitter.listenerCount('view')).toBe(1);

    const now = Date.now();
    emitter.emit('view', {
      type: 'view',
      mediaId: '123',
      mediaType: 'photo',
      timestamp: now,
    });

    expect(viewListener).toHaveBeenCalledTimes(1);
    expect(viewListener).toHaveBeenCalledWith({
      type: 'view',
      mediaId: '123',
      mediaType: 'photo',
      timestamp: now,
    });

    unsubscribe();
    expect(emitter.listenerCount('view')).toBe(0);

    emitter.emit('view', {
      type: 'view',
      mediaId: '456',
      mediaType: 'photo',
      timestamp: Date.now(),
    });

    expect(viewListener).toHaveBeenCalledTimes(1);
  });

  it('supports multiple listeners on the same event type', () => {
    const emitter = new MediaEventEmitter();
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    emitter.subscribe('view', listener1);
    emitter.subscribe('view', listener2);

    emitter.emit('view', {
      type: 'view',
      mediaId: '100',
      mediaType: 'photo',
      timestamp: Date.now(),
    });

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it('supports independent event types', () => {
    const emitter = new MediaEventEmitter();
    const viewListener = vi.fn();
    const downloadListener = vi.fn();

    emitter.subscribe('view', viewListener);
    emitter.subscribe('download', downloadListener);

    emitter.emit('view', {
      type: 'view',
      mediaId: '100',
      mediaType: 'photo',
      timestamp: Date.now(),
    });

    expect(viewListener).toHaveBeenCalledTimes(1);
    expect(downloadListener).toHaveBeenCalledTimes(0);
  });

  it('double unsubscribe is harmless', () => {
    const emitter = new MediaEventEmitter();
    const listener = vi.fn();

    const unsub = emitter.subscribe('view', listener);
    unsub();
    unsub(); // second call should be harmless

    expect(emitter.listenerCount('view')).toBe(0);
  });

  it('removeAllListeners clears all event listeners', () => {
    const emitter = new MediaEventEmitter();
    emitter.subscribe('view', vi.fn());
    emitter.subscribe('download', vi.fn());

    emitter.removeAllListeners();

    expect(emitter.listenerCount('view')).toBe(0);
    expect(emitter.listenerCount('download')).toBe(0);
  });

  it('removeAllListeners(event) clears only specified event', () => {
    const emitter = new MediaEventEmitter();
    emitter.subscribe('view', vi.fn());
    emitter.subscribe('download', vi.fn());

    emitter.removeAllListeners('view');

    expect(emitter.listenerCount('view')).toBe(0);
    expect(emitter.listenerCount('download')).toBe(1);
  });

  it('isolates listener exceptions — one bad listener does not prevent others', () => {
    const emitter = new MediaEventEmitter();
    const badListener = vi.fn().mockImplementation(() => {
      throw new Error('listener crash');
    });
    const goodListener = vi.fn();

    // Suppress console.error during test
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    emitter.subscribe('view', badListener);
    emitter.subscribe('view', goodListener);

    emitter.emit('view', {
      type: 'view',
      mediaId: '100',
      mediaType: 'photo',
      timestamp: Date.now(),
    });

    expect(badListener).toHaveBeenCalledTimes(1);
    expect(goodListener).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('integrates default console listener on client creation', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const mockFetch = vi.fn();

    const client = createMediaClient({ apiKey: 'key', fetchFn: mockFetch, enableConsoleEvents: true });

    client.events.emit('view', {
      type: 'view',
      mediaId: '777',
      mediaType: 'video',
      timestamp: Date.now(),
    });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[MediaForge SDK Event: view] Media #777 (video)'));

    client.destroy();
    consoleSpy.mockRestore();
  });

  it('does NOT attach console listener when enableConsoleEvents is false', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const mockFetch = vi.fn();

    const client = createMediaClient({ apiKey: 'key', fetchFn: mockFetch, enableConsoleEvents: false });

    client.events.emit('view', {
      type: 'view',
      mediaId: '777',
      mediaType: 'video',
      timestamp: Date.now(),
    });

    expect(consoleSpy).not.toHaveBeenCalled();

    client.destroy();
    consoleSpy.mockRestore();
  });

  it('console listener does not include API key', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const mockFetch = vi.fn();

    const client = createMediaClient({ apiKey: 'secret-api-key-xyz', fetchFn: mockFetch, enableConsoleEvents: true });

    client.events.emit('download', {
      type: 'download',
      mediaId: '100',
      mediaType: 'photo',
      downloadUrl: 'https://example.com/photo.jpg',
      timestamp: Date.now(),
    });

    const loggedString = consoleSpy.mock.calls[0][0] as string;
    expect(loggedString).not.toContain('secret-api-key-xyz');

    client.destroy();
    consoleSpy.mockRestore();
  });
});

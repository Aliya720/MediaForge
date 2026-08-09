import { describe, it, expect, vi } from 'vitest';
import { createMediaClient, PhotoMedia, NotFoundError } from '@mediaforge/media-core';
import { useMediaItem, UseMediaItemOptions } from '../src/index.js';
import { createHookHarness } from './testUtils.js';

describe('useMediaItem', () => {
  it('retrieves single photo item by ID', async () => {
    const mockClient = createMediaClient({
      apiKey: 'test-key',
      enableConsoleEvents: false,
      fetchFn: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 500,
          width: 800,
          height: 600,
          url: 'https://pexels.com/500',
          photographer: 'Jane Photo',
          photographer_url: 'u',
          photographer_id: 5,
          alt: 'Single Photo',
          src: { original: 'orig', large2x: '', large: '', medium: '', small: '', portrait: '', landscape: '', tiny: '' }
        })
      })
    });

    const harness = createHookHarness(mockClient, (opts: UseMediaItemOptions) => {
      return useMediaItem<PhotoMedia>(opts);
    }, { type: 'photo', id: 500 });

    await new Promise((r) => setTimeout(r, 20));

    expect(harness.current.loading).toBe(false);
    expect(harness.current.item).not.toBeNull();
    expect(harness.current.item!.id).toBe('500');
    expect(harness.current.item!.author.name).toBe('Jane Photo');
  });

  it('handles NotFoundError when item does not exist', async () => {
    const mockClient = createMediaClient({
      apiKey: 'test-key',
      enableConsoleEvents: false,
      fetchFn: vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Not Found'
      })
    });

    const harness = createHookHarness(mockClient, (opts: UseMediaItemOptions) => {
      return useMediaItem<PhotoMedia>(opts);
    }, { type: 'photo', id: 999999 });

    await new Promise((r) => setTimeout(r, 20));

    expect(harness.current.loading).toBe(false);
    expect(harness.current.item).toBeNull();
    expect(harness.current.error).toBeInstanceOf(NotFoundError);
  });
});

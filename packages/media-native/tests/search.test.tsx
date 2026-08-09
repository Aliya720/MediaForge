import { describe, it, expect, vi } from 'vitest';
import { createMediaClient, PhotoMedia, RateLimitError } from '@mediaforge/media-core';
import { useMediaSearch, UseMediaSearchOptions } from '../src/index.js';
import { createHookHarness } from './testUtils.js';

describe('useMediaSearch', () => {
  it('executes search request and accumulates results', async () => {
    const mockClient = createMediaClient({
      apiKey: 'test-key',
      enableConsoleEvents: false,
      fetchFn: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          page: 1,
          per_page: 15,
          total_results: 100,
          next_page: 'https://api.pexels.com/v1/search?page=2',
          photos: [
            {
              id: 1,
              width: 100,
              height: 100,
              url: 'https://pexels.com/1',
              photographer: 'Author 1',
              photographer_url: 'url',
              photographer_id: 1,
              alt: 'Photo 1',
              src: { original: 'o1', large2x: '', large: '', medium: '', small: '', portrait: '', landscape: '', tiny: '' }
            }
          ]
        })
      })
    });

    const harness = createHookHarness(mockClient, (opts: UseMediaSearchOptions) => {
      return useMediaSearch<PhotoMedia>(opts);
    }, { type: 'photo', query: 'nature' });

    // Wait for async fetch resolution
    await new Promise((r) => setTimeout(r, 20));

    expect(harness.current.items).toHaveLength(1);
    expect(harness.current.items[0].id).toBe('1');
    expect(harness.current.hasNextPage).toBe(true);
    expect(harness.current.loading).toBe(false);
  });

  it('handles pagination with loadMore() appending items', async () => {
    let fetchCount = 0;

    const mockClient = createMediaClient({
      apiKey: 'test-key',
      enableConsoleEvents: false,
      cache: { enabled: false },
      fetchFn: vi.fn().mockImplementation(async (url: string) => {
        fetchCount++;
        const isPage2 = url.includes('page=2');
        return {
          ok: true,
          status: 200,
          json: async () => ({
            page: isPage2 ? 2 : 1,
            per_page: 15,
            total_results: 30,
            next_page: isPage2 ? undefined : 'https://api.pexels.com/v1/search?page=2',
            photos: isPage2
              ? [{ id: 2, width: 100, height: 100, url: 'u2', photographer: 'a2', photographer_url: 'u', photographer_id: 2, alt: 'Photo 2', src: { original: 'o2', large2x: '', large: '', medium: '', small: '', portrait: '', landscape: '', tiny: '' } }]
              : [{ id: 1, width: 100, height: 100, url: 'u1', photographer: 'a1', photographer_url: 'u', photographer_id: 1, alt: 'Photo 1', src: { original: 'o1', large2x: '', large: '', medium: '', small: '', portrait: '', landscape: '', tiny: '' } }]
          })
        };
      })
    });

    const harness = createHookHarness(mockClient, (opts: UseMediaSearchOptions) => {
      return useMediaSearch<PhotoMedia>(opts);
    }, { type: 'photo', query: 'ocean' });

    await new Promise((r) => setTimeout(r, 20));
    expect(harness.current.items).toHaveLength(1);

    // Call loadMore
    harness.current.loadMore();
    await new Promise((r) => setTimeout(r, 20));

    expect(fetchCount).toBe(2);
    expect(harness.current.items).toHaveLength(2);
    expect(harness.current.items[0].id).toBe('1');
    expect(harness.current.items[1].id).toBe('2');
    expect(harness.current.hasNextPage).toBe(false);
  });

  it('captures typed errors from media-core', async () => {
    const mockClient = createMediaClient({
      apiKey: 'test-key',
      enableConsoleEvents: false,
      fetchFn: vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit exceeded'
      })
    });

    const harness = createHookHarness(mockClient, (opts: UseMediaSearchOptions) => {
      return useMediaSearch<PhotoMedia>(opts);
    }, { type: 'photo', query: 'forest' });

    await new Promise((r) => setTimeout(r, 20));

    expect(harness.current.loading).toBe(false);
    expect(harness.current.error).toBeInstanceOf(RateLimitError);
    expect(harness.current.items).toHaveLength(0);
  });

  it('prevents stale requests from overwriting newer search results (race condition protection)', async () => {
    let resolveRequestA!: (val: any) => void;
    let resolveRequestB!: (val: any) => void;

    const promiseA = new Promise((resolve) => { resolveRequestA = resolve; });
    const promiseB = new Promise((resolve) => { resolveRequestB = resolve; });

    let callCount = 0;
    const mockClient = createMediaClient({
      apiKey: 'test-key',
      enableConsoleEvents: false,
      cache: { enabled: false },
      fetchFn: vi.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? promiseA : promiseB;
      })
    });

    const harness = createHookHarness(mockClient, (opts: UseMediaSearchOptions) => {
      return useMediaSearch<PhotoMedia>(opts);
    }, { type: 'photo', query: 'cats' });

    // Rerender with query "dogs" before Request A finishes
    harness.rerender({ type: 'photo', query: 'dogs' });

    // Resolve Request B first (dogs)
    resolveRequestB({
      ok: true, status: 200, json: async () => ({
        page: 1, per_page: 15, total_results: 1, photos: [
          { id: 99, width: 10, height: 10, url: 'u', photographer: 'Dog Photographer', photographer_url: 'u', photographer_id: 1, alt: 'Dog', src: { original: 'o', large2x: '', large: '', medium: '', small: '', portrait: '', landscape: '', tiny: '' } }
        ]
      })
    });
    await new Promise((r) => setTimeout(r, 20));

    expect(harness.current.items[0].alt).toBe('Dog');

    // Resolve Request A later (cats) - it MUST be ignored by race condition check
    resolveRequestA({
      ok: true, status: 200, json: async () => ({
        page: 1, per_page: 15, total_results: 1, photos: [
          { id: 11, width: 10, height: 10, url: 'u', photographer: 'Cat Photographer', photographer_url: 'u', photographer_id: 1, alt: 'Cat', src: { original: 'o', large2x: '', large: '', medium: '', small: '', portrait: '', landscape: '', tiny: '' } }
        ]
      })
    });
    await new Promise((r) => setTimeout(r, 20));

    // Must still be Dog!
    expect(harness.current.items[0].alt).toBe('Dog');
  });

  it('refresh() resets pagination and restarts search from page 1', async () => {
    let fetchCount = 0;

    const mockClient = createMediaClient({
      apiKey: 'test-key',
      enableConsoleEvents: false,
      cache: { enabled: false }, // Disable cache so refresh forces a network call
      fetchFn: vi.fn().mockImplementation(async () => {
        fetchCount++;
        return {
          ok: true, status: 200, json: async () => ({
            page: 1, per_page: 15, total_results: 10, photos: []
          })
        };
      })
    });

    const harness = createHookHarness(mockClient, (opts: UseMediaSearchOptions) => {
      return useMediaSearch<PhotoMedia>(opts);
    }, { type: 'photo', query: 'mountains' });

    await new Promise((r) => setTimeout(r, 20));
    expect(fetchCount).toBe(1);

    harness.current.refresh();
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchCount).toBe(2);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMediaClient } from '../src/index.js';

describe('In-Memory Caching', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('serves second identical request from cache (no second network call)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        page: 1,
        per_page: 15,
        total_results: 1,
        photos: [{ id: 1, width: 100, height: 100, url: 'u', photographer: 'p', photographer_url: 'pu', photographer_id: 1, src: { original: 'o', large2x: '', large: '', medium: '', small: '', portrait: '', landscape: '', tiny: '' } }],
      }),
    });

    const client = createMediaClient({ apiKey: 'key', fetchFn: mockFetch, cache: { ttlMs: 60000 }, enableConsoleEvents: false });

    const res1 = await client.photos.search({ query: 'nature', page: 1 });
    const res2 = await client.photos.search({ query: 'nature', page: 1 });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(res1).toEqual(res2);
    expect(client.cache.size).toBe(1);
  });

  it('bypasses cache when cache is disabled in config', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        page: 1,
        per_page: 15,
        total_results: 0,
        photos: [],
      }),
    });

    const client = createMediaClient({ apiKey: 'key', fetchFn: mockFetch, cache: { enabled: false }, enableConsoleEvents: false });

    await client.photos.search({ query: 'nature', page: 1 });
    await client.photos.search({ query: 'nature', page: 1 });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(client.cache.size).toBe(0);
  });

  it('expires cache entries after TTL', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          page: 1,
          per_page: 15,
          total_results: callCount,
          photos: [],
        }),
      };
    });

    const client = createMediaClient({ apiKey: 'key', fetchFn: mockFetch, cache: { ttlMs: 5000 }, enableConsoleEvents: false });

    const res1 = await client.photos.search({ query: 'nature' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(res1.totalResults).toBe(1);

    // Advance time beyond TTL
    vi.advanceTimersByTime(6000);

    const res2 = await client.photos.search({ query: 'nature' });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(res2.totalResults).toBe(2);
  });

  it('uses different cache entries for different parameters', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        page: 1,
        per_page: 15,
        total_results: 0,
        photos: [],
      }),
    });

    const client = createMediaClient({ apiKey: 'key', fetchFn: mockFetch, cache: { ttlMs: 60000 }, enableConsoleEvents: false });

    await client.photos.search({ query: 'cats', page: 1 });
    await client.photos.search({ query: 'dogs', page: 1 });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(client.cache.size).toBe(2);
  });

  it('does NOT cache failed requests', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'Server Error',
    });

    const client = createMediaClient({ apiKey: 'key', fetchFn: mockFetch, cache: { ttlMs: 60000 }, enableConsoleEvents: false });

    await expect(client.photos.search({ query: 'nature' })).rejects.toThrow();
    expect(client.cache.size).toBe(0);

    // A subsequent request should make a fresh network call
    await expect(client.photos.search({ query: 'nature' })).rejects.toThrow();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('generates deterministic cache keys regardless of parameter order', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ page: 1, per_page: 10, total_results: 0, photos: [] }),
    });

    const client = createMediaClient({ apiKey: 'key', fetchFn: mockFetch, cache: { ttlMs: 60000 }, enableConsoleEvents: false });

    // Request with params in one order
    await client.photos.search({ query: 'cat', page: 1, perPage: 10, orientation: 'landscape' });
    // Same semantic request — should hit cache
    await client.photos.search({ orientation: 'landscape', perPage: 10, page: 1, query: 'cat' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('client.cache.clear() empties the entire cache', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ page: 1, per_page: 15, total_results: 0, photos: [] }),
    });

    const client = createMediaClient({ apiKey: 'key', fetchFn: mockFetch, enableConsoleEvents: false });
    await client.photos.search({ query: 'cats' });
    expect(client.cache.size).toBe(1);

    client.cache.clear();
    expect(client.cache.size).toBe(0);
  });
});

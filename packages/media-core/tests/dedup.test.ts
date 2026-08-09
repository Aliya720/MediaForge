import { describe, it, expect, vi } from 'vitest';
import { createMediaClient } from '../src/index.js';

describe('Request Deduplication', () => {
  it('collapses concurrent identical in-flight requests into a single network call', async () => {
    let resolveFetch!: () => void;
    const pendingPromise = new Promise<void>((resolve) => {
      resolveFetch = resolve;
    });

    const mockFetch = vi.fn().mockImplementation(() =>
      pendingPromise.then(() => ({
        ok: true,
        status: 200,
        json: async () => ({
          page: 1,
          per_page: 15,
          total_results: 1,
          photos: [{ id: 101, width: 500, height: 500, url: 'u', photographer: 'p', photographer_url: 'pu', photographer_id: 1, src: { original: 'o', large2x: '', large: '', medium: '', small: '', portrait: '', landscape: '', tiny: '' } }],
        }),
      }))
    );

    // Disable cache to isolate dedup
    const client = createMediaClient({ apiKey: 'key', fetchFn: mockFetch, cache: { enabled: false }, enableConsoleEvents: false });

    const req1 = client.photos.search({ query: 'mountains', page: 1 });
    const req2 = client.photos.search({ query: 'mountains', page: 1 });

    resolveFetch();

    const [res1, res2] = await Promise.all([req1, req2]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(res1).toEqual(res2);
    expect(res1.items[0].id).toBe('101');
  });

  it('does NOT deduplicate requests with different parameters', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ page: 1, per_page: 15, total_results: 0, photos: [] }),
    });

    const client = createMediaClient({ apiKey: 'key', fetchFn: mockFetch, cache: { enabled: false }, enableConsoleEvents: false });

    await Promise.all([
      client.photos.search({ query: 'cats', page: 1 }),
      client.photos.search({ query: 'dogs', page: 1 }),
    ]);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('cleans up in-flight entry after failure, allowing retry', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'Server Error',
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ page: 1, per_page: 15, total_results: 0, photos: [] }),
      };
    });

    const client = createMediaClient({ apiKey: 'key', fetchFn: mockFetch, cache: { enabled: false }, enableConsoleEvents: false });

    // First request fails
    await expect(client.photos.search({ query: 'nature' })).rejects.toThrow();

    // Second request should make a fresh network call (in-flight map should be clean)
    const result = await client.photos.search({ query: 'nature' });
    expect(result.items).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('both callers receive the same error when shared in-flight request fails', async () => {
    let rejectFetch!: (err: Error) => void;
    const pendingPromise = new Promise<never>((_resolve, reject) => {
      rejectFetch = reject;
    });

    const mockFetch = vi.fn().mockImplementation(() => pendingPromise);

    const client = createMediaClient({ apiKey: 'key', fetchFn: mockFetch, cache: { enabled: false }, enableConsoleEvents: false });

    const req1 = client.photos.search({ query: 'fail' });
    const req2 = client.photos.search({ query: 'fail' });

    rejectFetch(new TypeError('Network failure'));

    await expect(req1).rejects.toThrow();
    await expect(req2).rejects.toThrow();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { createMediaClient } from '../src/index.js';

describe('Pagination Behavior', () => {
  it('correctly calculates hasNextPage when next_page is provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        page: 1,
        per_page: 10,
        total_results: 25,
        next_page: 'https://api.pexels.com/v1/curated?page=2',
        photos: [],
      }),
    });

    const client = createMediaClient({ apiKey: 'test-key', fetchFn: mockFetch, enableConsoleEvents: false });
    const res = await client.photos.curated({ page: 1, perPage: 10 });

    expect(res.page).toBe(1);
    expect(res.perPage).toBe(10);
    expect(res.totalResults).toBe(25);
    expect(res.hasNextPage).toBe(true);
  });

  it('correctly sets hasNextPage to false when on the final page', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        page: 3,
        per_page: 10,
        total_results: 25,
        photos: [],
      }),
    });

    const client = createMediaClient({ apiKey: 'test-key', fetchFn: mockFetch, enableConsoleEvents: false });
    const res = await client.photos.curated({ page: 3, perPage: 10 });

    expect(res.page).toBe(3);
    expect(res.hasNextPage).toBe(false);
  });

  it('handles zero results correctly', async () => {
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

    const client = createMediaClient({ apiKey: 'test-key', fetchFn: mockFetch, enableConsoleEvents: false });
    const res = await client.photos.search({ query: 'xyznonexistent' });

    expect(res.items).toEqual([]);
    expect(res.totalResults).toBe(0);
    expect(res.hasNextPage).toBe(false);
  });

  it('uses default perPage of 15 when not specified', async () => {
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

    const client = createMediaClient({ apiKey: 'test-key', fetchFn: mockFetch, enableConsoleEvents: false });
    const res = await client.photos.search({ query: 'test' });

    expect(res.perPage).toBe(15);
  });

  it('works correctly for video pagination', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        page: 1,
        per_page: 10,
        total_results: 30,
        next_page: 'https://api.pexels.com/videos/search?page=2',
        videos: [],
      }),
    });

    const client = createMediaClient({ apiKey: 'test-key', fetchFn: mockFetch, enableConsoleEvents: false });
    const res = await client.videos.search({ query: 'ocean', perPage: 10 });

    expect(res.hasNextPage).toBe(true);
    expect(res.totalResults).toBe(30);
  });
});

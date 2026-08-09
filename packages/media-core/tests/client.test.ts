import { describe, it, expect, vi } from 'vitest';
import { createMediaClient } from '../src/index.js';

// Reusable mock fetch factory
function mockFetchOk(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => data,
  });
}

const PHOTO_DTO = {
  id: 123,
  width: 1000,
  height: 800,
  url: 'https://pexels.com/photo/123',
  photographer: 'Jane Doe',
  photographer_url: 'https://pexels.com/@janedoe',
  photographer_id: 456,
  avg_color: '#333333',
  alt: 'A beautiful forest',
  src: {
    original: 'https://images.pexels.com/123/original.jpg',
    large2x: 'https://images.pexels.com/123/large2x.jpg',
    large: 'https://images.pexels.com/123/large.jpg',
    medium: 'https://images.pexels.com/123/medium.jpg',
    small: 'https://images.pexels.com/123/small.jpg',
    portrait: 'https://images.pexels.com/123/portrait.jpg',
    landscape: 'https://images.pexels.com/123/landscape.jpg',
    tiny: 'https://images.pexels.com/123/tiny.jpg',
  },
};

const VIDEO_DTO = {
  id: 999,
  width: 1920,
  height: 1080,
  url: 'https://pexels.com/video/999',
  image: 'https://images.pexels.com/video/999/preview.jpg',
  duration: 15,
  user: {
    id: 789,
    name: 'Film Maker',
    url: 'https://pexels.com/@filmmaker',
  },
  video_files: [
    {
      id: 1,
      quality: 'hd',
      file_type: 'video/mp4',
      width: 1920,
      height: 1080,
      fps: 30,
      link: 'https://video.pexels.com/hd.mp4',
    },
    {
      id: 2,
      quality: 'uhd',
      file_type: 'video/mp4',
      width: 3840,
      height: 2160,
      fps: 24,
      link: 'https://video.pexels.com/uhd.mp4',
    },
  ],
  video_pictures: [
    {
      id: 1,
      picture: 'https://images.pexels.com/video/999/pic1.jpg',
      nr: 0,
    },
  ],
};

describe('MediaForgeClient API Methods', () => {
  it('searches photos and normalizes domain models', async () => {
    const mockFetch = mockFetchOk({
      page: 1,
      per_page: 15,
      total_results: 100,
      next_page: 'https://api.pexels.com/v1/search?page=2',
      photos: [PHOTO_DTO],
    });

    const client = createMediaClient({ apiKey: 'test-api-key', fetchFn: mockFetch, enableConsoleEvents: false });
    const result = await client.photos.search({ query: 'nature' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('123');
    expect(result.items[0].type).toBe('photo');
    expect(result.items[0].author.name).toBe('Jane Doe');
    expect(result.items[0].src.original).toBe('https://images.pexels.com/123/original.jpg');
    expect(result.hasNextPage).toBe(true);
  });

  it('fetches curated photos', async () => {
    const mockFetch = mockFetchOk({
      page: 1,
      per_page: 10,
      total_results: 50,
      next_page: 'https://api.pexels.com/v1/curated?page=2',
      photos: [PHOTO_DTO],
    });

    const client = createMediaClient({ apiKey: 'test-api-key', fetchFn: mockFetch, enableConsoleEvents: false });
    const result = await client.photos.curated({ page: 1, perPage: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe('photo');
    expect(result.page).toBe(1);

    // Verify endpoint path in URL
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/v1/curated');
  });

  it('gets a single photo by ID', async () => {
    const mockFetch = mockFetchOk(PHOTO_DTO);

    const client = createMediaClient({ apiKey: 'test-api-key', fetchFn: mockFetch, enableConsoleEvents: false });
    const photo = await client.photos.get({ id: 123 });

    expect(photo.id).toBe('123');
    expect(photo.type).toBe('photo');

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/v1/photos/123');
  });

  it('searches videos and normalizes video domain models', async () => {
    const mockFetch = mockFetchOk({
      page: 1,
      per_page: 10,
      total_results: 50,
      next_page: 'https://api.pexels.com/videos/search?page=2',
      videos: [VIDEO_DTO],
    });

    const client = createMediaClient({ apiKey: 'test-api-key', fetchFn: mockFetch, enableConsoleEvents: false });
    const result = await client.videos.search({ query: 'ocean' });

    expect(result.items[0].id).toBe('999');
    expect(result.items[0].type).toBe('video');
    expect(result.items[0].author.name).toBe('Film Maker');
    expect(result.items[0].duration).toBe(15);
    expect(result.items[0].videoFiles).toHaveLength(2);

    // Verify quality preservation (uhd not collapsed to sd)
    expect(result.items[0].videoFiles[1].quality).toBe('uhd');
  });

  it('fetches popular videos', async () => {
    const mockFetch = mockFetchOk({
      page: 1,
      per_page: 10,
      total_results: 20,
      next_page: 'https://api.pexels.com/videos/popular?page=2',
      videos: [VIDEO_DTO],
    });

    const client = createMediaClient({ apiKey: 'test-api-key', fetchFn: mockFetch, enableConsoleEvents: false });
    const result = await client.videos.popular({ page: 1, perPage: 10 });

    expect(result.items).toHaveLength(1);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/videos/popular');
  });

  it('gets a single video by ID', async () => {
    const mockFetch = mockFetchOk(VIDEO_DTO);

    const client = createMediaClient({ apiKey: 'test-api-key', fetchFn: mockFetch, enableConsoleEvents: false });
    const video = await client.videos.get({ id: 999 });

    expect(video.id).toBe('999');
    expect(video.type).toBe('video');

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/videos/videos/999');
  });

  it('sends Authorization header with API key', async () => {
    const mockFetch = mockFetchOk({ page: 1, per_page: 15, total_results: 0, photos: [] });

    const client = createMediaClient({ apiKey: 'my-secret-key', fetchFn: mockFetch, enableConsoleEvents: false });
    await client.photos.search({ query: 'cats' });

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['Authorization']).toBe('my-secret-key');
  });

  it('encodes query parameters correctly', async () => {
    const mockFetch = mockFetchOk({ page: 1, per_page: 10, total_results: 0, photos: [] });

    const client = createMediaClient({ apiKey: 'test-key', fetchFn: mockFetch, enableConsoleEvents: false });
    await client.photos.search({ query: 'hello world', orientation: 'landscape', page: 2, perPage: 10 });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('query=hello+world');
    expect(calledUrl).toContain('orientation=landscape');
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('per_page=10');
  });

  it('does not include API key in request URL', async () => {
    const mockFetch = mockFetchOk({ page: 1, per_page: 15, total_results: 0, photos: [] });

    const client = createMediaClient({ apiKey: 'super-secret-key-123', fetchFn: mockFetch, enableConsoleEvents: false });
    await client.photos.search({ query: 'cats' });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('super-secret-key-123');
  });

  it('destroy() cleans up listeners and cache', async () => {
    const mockFetch = mockFetchOk({ page: 1, per_page: 15, total_results: 1, photos: [PHOTO_DTO] });
    const client = createMediaClient({ apiKey: 'test-key', fetchFn: mockFetch, enableConsoleEvents: false });

    await client.photos.search({ query: 'cats' });
    expect(client.cache.size).toBe(1);

    client.destroy();
    expect(client.cache.size).toBe(0);
    expect(client.events.listenerCount('view')).toBe(0);
    expect(client.events.listenerCount('download')).toBe(0);
  });
});

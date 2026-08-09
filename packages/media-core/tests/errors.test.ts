import { describe, it, expect, vi } from 'vitest';
import {
  createMediaClient,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ApiError,
  NetworkError,
  ConfigurationError,
  InvalidResponseError,
  MediaError,
} from '../src/index.js';

describe('MediaForge Error Hierarchy', () => {
  it('throws ConfigurationError if apiKey is empty', () => {
    expect(() => createMediaClient({ apiKey: '' })).toThrow(ConfigurationError);
  });

  it('throws ConfigurationError if apiKey is whitespace only', () => {
    expect(() => createMediaClient({ apiKey: '   ' })).toThrow(ConfigurationError);
  });

  it('maps HTTP 401 to AuthenticationError', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Invalid Key',
    });

    const client = createMediaClient({ apiKey: 'bad-key', fetchFn: mockFetch, enableConsoleEvents: false });

    try {
      await client.photos.search({ query: 'cats' });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(AuthenticationError);
      expect(err).toBeInstanceOf(MediaError);
      expect((err as AuthenticationError).status).toBe(401);
      expect((err as AuthenticationError).code).toBe('AUTHENTICATION_FAILED');
    }
  });

  it('maps HTTP 404 to NotFoundError with correct properties', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Photo not found',
    });

    const client = createMediaClient({ apiKey: 'valid-key', fetchFn: mockFetch, enableConsoleEvents: false });

    try {
      await client.photos.get({ id: 999999 });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
      expect(err).toBeInstanceOf(MediaError);
      expect((err as NotFoundError).status).toBe(404);
      expect((err as NotFoundError).code).toBe('NOT_FOUND');
    }
  });

  it('maps HTTP 429 to RateLimitError', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: async () => 'Rate limit exceeded',
    });

    const client = createMediaClient({ apiKey: 'valid-key', fetchFn: mockFetch, enableConsoleEvents: false });
    await expect(client.photos.search({ query: 'dogs' })).rejects.toThrow(RateLimitError);
  });

  it('maps HTTP 500 to ApiError', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Error',
      text: async () => 'Server error',
    });

    const client = createMediaClient({ apiKey: 'valid-key', fetchFn: mockFetch, enableConsoleEvents: false });

    try {
      await client.photos.search({ query: 'dogs' });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err).toBeInstanceOf(MediaError);
      expect((err as ApiError).status).toBe(500);
    }
  });

  it('maps fetch network failure to NetworkError', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const client = createMediaClient({ apiKey: 'valid-key', fetchFn: mockFetch, enableConsoleEvents: false });

    try {
      await client.photos.search({ query: 'dogs' });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(NetworkError);
      expect(err).toBeInstanceOf(MediaError);
      expect((err as NetworkError).code).toBe('NETWORK_ERROR');
      expect((err as NetworkError).cause).toBeInstanceOf(TypeError);
    }
  });

  it('maps invalid JSON response to InvalidResponseError', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Unexpected token <'); },
    });

    const client = createMediaClient({ apiKey: 'valid-key', fetchFn: mockFetch, enableConsoleEvents: false });
    await expect(client.photos.search({ query: 'test' })).rejects.toThrow(InvalidResponseError);
  });

  it('all error subclasses inherit from MediaError', () => {
    expect(new AuthenticationError()).toBeInstanceOf(MediaError);
    expect(new RateLimitError()).toBeInstanceOf(MediaError);
    expect(new NotFoundError()).toBeInstanceOf(MediaError);
    expect(new NetworkError()).toBeInstanceOf(MediaError);
    expect(new ApiError('err')).toBeInstanceOf(MediaError);
    expect(new InvalidResponseError()).toBeInstanceOf(MediaError);
    expect(new ConfigurationError()).toBeInstanceOf(MediaError);
  });

  it('error messages do NOT contain the API key', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Invalid API Key',
    });

    const client = createMediaClient({ apiKey: 'super-secret-key', fetchFn: mockFetch, enableConsoleEvents: false });

    try {
      await client.photos.search({ query: 'test' });
    } catch (err) {
      const errMsg = (err as MediaError).message;
      expect(errMsg).not.toContain('super-secret-key');
    }
  });
});

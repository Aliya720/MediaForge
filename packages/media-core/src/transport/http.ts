/**
 * Framework-Agnostic HTTP Transport for Pexels API
 *
 * Security: API key is sent only via the Authorization header, never in URLs or logs.
 */

import {
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  NetworkError,
  ApiError,
  InvalidResponseError,
  ConfigurationError,
  MediaError,
} from '../types/errors.js';

export interface HttpTransportConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

export interface HttpRequestOptions {
  path: string;
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

export class HttpTransport {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;

  constructor(config: HttpTransportConfig) {
    if (!config.apiKey || typeof config.apiKey !== 'string' || !config.apiKey.trim()) {
      throw new ConfigurationError('A valid Pexels API key must be provided.');
    }

    this.apiKey = config.apiKey.trim();
    this.baseUrl = (config.baseUrl || 'https://api.pexels.com').replace(/\/+$/, '');
    this.timeoutMs = config.timeoutMs ?? 10000;

    const rawFetch = config.fetchFn || globalThis.fetch;
    this.fetchFn = typeof rawFetch === 'function' ? rawFetch.bind(globalThis) : rawFetch;

    if (!this.fetchFn) {
      throw new ConfigurationError('No fetch implementation found. Pass a custom fetchFn in MediaClientConfig.');
    }
  }

  async get<T>(options: HttpRequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.params);
    const controller = new AbortController();

    // Forward external abort signal to our internal controller
    const onExternalAbort = () => controller.abort();
    if (options.signal) {
      if (options.signal.aborted) {
        throw new NetworkError('Request aborted by caller.');
      }
      options.signal.addEventListener('abort', onExternalAbort, { once: true });
    }

    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(url, {
        method: 'GET',
        headers: {
          Authorization: this.apiKey,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        await this.handleHttpError(response);
      }

      try {
        const data = (await response.json()) as T;
        return data;
      } catch (err) {
        throw new InvalidResponseError('Failed to parse JSON response from Pexels API.', err);
      }
    } catch (err) {
      clearTimeout(timer);

      // Re-throw any MediaError subclass without double-wrapping
      if (err instanceof MediaError) {
        throw err;
      }

      throw new NetworkError(
        err instanceof Error ? err.message : 'Network request failed or timed out.',
        err
      );
    } finally {
      // Clean up: remove the abort listener to prevent memory leaks
      if (options.signal) {
        options.signal.removeEventListener('abort', onExternalAbort);
      }
    }
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const fullUrl = new URL(`${this.baseUrl}${normalizedPath}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          fullUrl.searchParams.append(key, String(value));
        }
      });
    }

    return fullUrl.toString();
  }

  private async handleHttpError(response: Response): Promise<never> {
    let errorText = '';
    try {
      errorText = await response.text();
    } catch {
      errorText = response.statusText;
    }

    switch (response.status) {
      case 401:
        throw new AuthenticationError(`Authentication failed (401): ${errorText}`);
      case 404:
        throw new NotFoundError(`Resource not found (404): ${errorText}`);
      case 429:
        throw new RateLimitError(`Rate limit exceeded (429): ${errorText}`);
      default:
        throw new ApiError(`Pexels API Error (${response.status}): ${errorText}`, response.status);
    }
  }
}

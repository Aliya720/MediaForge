/**
 * MediaForge Typed Error Hierarchy
 */

export class MediaError extends Error {
  readonly code: string;
  readonly status?: number;
  override readonly cause?: unknown;

  constructor(message: string, code = 'MEDIA_ERROR', status?: number, cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.cause = cause;

    // Restore prototype chain for custom Error subclassing
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationError extends MediaError {
  constructor(message = 'Invalid or missing Pexels API key.', cause?: unknown) {
    super(message, 'AUTHENTICATION_FAILED', 401, cause);
  }
}

export class RateLimitError extends MediaError {
  constructor(message = 'Pexels API rate limit exceeded.', cause?: unknown) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, cause);
  }
}

export class NotFoundError extends MediaError {
  constructor(message = 'Requested media resource was not found.', cause?: unknown) {
    super(message, 'NOT_FOUND', 404, cause);
  }
}

export class NetworkError extends MediaError {
  constructor(message = 'Network request failed or timed out.', cause?: unknown) {
    super(message, 'NETWORK_ERROR', undefined, cause);
  }
}

export class ApiError extends MediaError {
  constructor(message: string, status?: number, cause?: unknown) {
    super(message, 'API_ERROR', status, cause);
  }
}

export class InvalidResponseError extends MediaError {
  constructor(message = 'Received invalid or malformed response structure from Pexels API.', cause?: unknown) {
    super(message, 'INVALID_RESPONSE', undefined, cause);
  }
}

export class ConfigurationError extends MediaError {
  constructor(message = 'Invalid MediaForge client configuration.', cause?: unknown) {
    super(message, 'CONFIGURATION_ERROR', undefined, cause);
  }
}

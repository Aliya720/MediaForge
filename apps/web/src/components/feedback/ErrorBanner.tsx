import { MediaError } from '@mediaforge/media-core';

export interface ErrorBannerProps {
  error: Error | MediaError;
  onRetry?: () => void;
}

export function ErrorBanner({ error, onRetry }: ErrorBannerProps) {
  const errorMessage = error instanceof MediaError ? error.message : error.message || 'An unexpected error occurred.';

  return (
    <div
      role="alert"
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid var(--state-error)',
        borderRadius: '12px',
        padding: '1rem 1.5rem',
        margin: '1.5rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.25rem', color: 'var(--state-error)' }}>⚠️</span>
        <div>
          <strong style={{ display: 'block', color: 'var(--state-error)', fontSize: '0.95rem' }}>
            {error.name || 'Request Failed'}
          </strong>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {errorMessage}
          </span>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          className="mf-btn-primary"
          style={{ backgroundColor: 'var(--state-error)', color: '#fff', fontSize: '0.85rem', padding: '0.4rem 1rem' }}
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </div>
  );
}

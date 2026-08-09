export interface EmptyStateProps {
  query: string;
  onSuggestionClick: (suggestion: string) => void;
}

export function EmptyState({ query, onSuggestionClick }: EmptyStateProps) {
  const suggestions = ['nature', 'architecture', 'technology', 'ocean', 'city'];

  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-subdued)' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
        No media found for &quot;{query}&quot;
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Try adjusting your search terms or explore these suggested topics:
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {suggestions.map((topic) => (
          <button
            key={topic}
            type="button"
            className="mf-type-btn"
            style={{ backgroundColor: 'var(--bg-surface-raised)', border: '1px solid var(--border-subdued)', color: 'var(--color-terracotta)' }}
            onClick={() => onSuggestionClick(topic)}
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
}

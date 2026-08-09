export function SkeletonGrid({ count = 8, isVideo = false }: { count?: number; isVideo?: boolean }) {
  return (
    <div className="mf-media-grid" aria-label="Loading content placeholders">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="mf-card" style={{ opacity: 0.85 }}>
          <div
            className={`mf-card-media-wrapper mf-skeleton-box ${isVideo ? 'video' : ''}`}
          />
          <div className="mf-card-info">
            <div className="mf-skeleton-box" style={{ height: '1rem', width: '70%', marginBottom: '4px' }} />
            <div className="mf-skeleton-box" style={{ height: '0.8rem', width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

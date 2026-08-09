import React, { useRef } from 'react';
import { Media } from '@mediaforge/media-core';
import { useMediaClient } from '@mediaforge/media-react';

export interface DetailViewProps {
  item: Media;
  relatedItems: Media[];
  onBack: () => void;
  onSelectRelated: (item: Media, index: number) => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function DetailView({
  item,
  relatedItems,
  onBack,
  onSelectRelated,
  onNavigatePrev,
  onNavigateNext,
  hasPrev = false,
  hasNext = false,
}: DetailViewProps) {
  const client = useMediaClient();
  const scrollTrackRef = useRef<HTMLDivElement>(null);

  const isVideo = item.type === 'video';
  const downloadUrl = isVideo ? item.videoFiles[0]?.link || item.url : item.src.original;

  // Emit view event when detail page loads
  React.useEffect(() => {
    if (client?.events && item) {
      client.events.emit('view', {
        type: 'view',
        mediaId: String(item.id),
        mediaType: item.type,
        timestamp: Date.now(),
      });
    }
  }, [client, item]);

  // Handle keyboard navigation (ArrowLeft, ArrowRight, Escape)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'ArrowLeft' && hasPrev && onNavigatePrev) {
        e.preventDefault();
        onNavigatePrev();
      } else if (e.key === 'ArrowRight' && hasNext && onNavigateNext) {
        e.preventDefault();
        onNavigateNext();
      } else if (e.key === 'Escape' && onBack) {
        e.preventDefault();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasPrev, hasNext, onNavigatePrev, onNavigateNext, onBack]);

  const handleDownload = () => {
    if (client?.events && item) {
      client.events.emit('download', {
        type: 'download',
        mediaId: String(item.id),
        mediaType: item.type,
        downloadUrl,
        timestamp: Date.now(),
      });
    }
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.download = `mediaforge-${item.type}-${item.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleScrollLeft = () => {
    if (scrollTrackRef.current) {
      scrollTrackRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollTrackRef.current) {
      scrollTrackRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <article className="mf-detail-container mf-enter-vertical" aria-label="Media Item Detail View">
      {/* Header Bar */}
      <div className="mf-detail-header">
        <button
          type="button"
          className="mf-type-btn active"
          onClick={onBack}
          style={{ cursor: 'pointer' }}
        >
          ‹ Back to Results
        </button>

        <button
          type="button"
          className="mf-btn-primary"
          onClick={handleDownload}
        >
          ↓ Download Original
        </button>
      </div>

      {/* Hero Media Stage with Left/Right Navigation Scroll Buttons */}
      <div className="mf-detail-hero">
        {hasPrev && onNavigatePrev && (
          <button
            type="button"
            className="mf-hero-nav prev"
            onClick={onNavigatePrev}
            aria-label="View previous media item"
          >
            ‹
          </button>
        )}

        {isVideo ? (
          <video
            src={item.videoFiles[0]?.link}
            controls
            autoPlay
            muted
            playsInline
            className="mf-detail-media"
          />
        ) : (
          <img
            src={item.src.large2x || item.src.original}
            alt={item.alt || `${item.type} #${item.id}`}
            className="mf-detail-media"
          />
        )}

        {hasNext && onNavigateNext && (
          <button
            type="button"
            className="mf-hero-nav next"
            onClick={onNavigateNext}
            aria-label="View next media item"
          >
            ›
          </button>
        )}
      </div>

      {/* Technical Metadata & Attribution Grid */}
      <div className="mf-detail-info-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {item.alt || `${item.type.toUpperCase()} #${item.id}`}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Photographer:{' '}
            <a
              href={item.author.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-terracotta)', textDecoration: 'none', fontWeight: 500 }}
            >
              {item.author.name}
            </a>
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="mf-detail-meta-item">
            <span className="mf-detail-meta-label">Dimensions</span>
            <span className="mf-detail-meta-value">{item.width} × {item.height}</span>
          </div>

          <div className="mf-detail-meta-item">
            <span className="mf-detail-meta-label">Media Type</span>
            <span className="mf-detail-meta-value">{item.type.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Related Supporting Media Strip with Horizontal Scroll Controls */}
      {relatedItems.length > 0 && (
        <section className="mf-related-section">
          <div className="mf-related-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              More Related Media
            </h3>
            <div className="mf-scroll-actions">
              <button
                type="button"
                className="mf-scroll-btn"
                onClick={handleScrollLeft}
                aria-label="Scroll left related media"
              >
                ‹
              </button>
              <button
                type="button"
                className="mf-scroll-btn"
                onClick={handleScrollRight}
                aria-label="Scroll right related media"
              >
                ›
              </button>
            </div>
          </div>

          <div className="mf-scroll-track" ref={scrollTrackRef}>
            {relatedItems.map((relItem, idx) => (
              <div
                key={relItem.id}
                className="mf-card mf-scroll-card"
                onClick={() => onSelectRelated(relItem, idx)}
                style={{ cursor: 'pointer' }}
              >
                <div className="mf-card-media-wrapper">
                  <img
                    src={relItem.type === 'video' ? relItem.previewImage : relItem.src.medium}
                    alt={relItem.alt}
                    className="mf-card-img"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

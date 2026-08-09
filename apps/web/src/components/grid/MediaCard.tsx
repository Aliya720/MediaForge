import { Media } from '@mediaforge/media-core';

export interface MediaCardProps {
  item: Media;
  itemProps: Record<string, unknown>;
}

export function MediaCard({ item, itemProps }: MediaCardProps) {
  const isVideo = item.type === 'video';
  const imageUrl = isVideo ? item.previewImage : item.src.medium;

  return (
    <article {...(itemProps as any)} className="mf-card">
      <div className={`mf-card-media-wrapper ${isVideo ? 'video' : ''}`}>
        <img
          src={imageUrl}
          alt={item.alt || `${item.type} by ${item.author.name}`}
          className="mf-card-img"
          loading="lazy"
        />
        {isVideo && (
          <span className="mf-badge">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            {item.duration}s
          </span>
        )}
      </div>

      <div className="mf-card-info">
        <h3 className="mf-card-title">{item.alt || `${item.type} #${item.id}`}</h3>
        <p className="mf-card-author">By {item.author.name}</p>
      </div>
    </article>
  );
}

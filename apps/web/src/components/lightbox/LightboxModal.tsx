import React from 'react';
import { Media } from '@mediaforge/media-core';
import { useLightbox, useReelSwiper } from '@mediaforge/media-ui-react';
import { useMediaClient } from '@mediaforge/media-react';

export interface LightboxModalProps {
  items: Media[];
  selectedIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function LightboxModal({ items, selectedIndex, isOpen, onClose }: LightboxModalProps) {
  const client = useMediaClient();

  const {
    activeItem,
    activeIndex,
    getDialogProps,
    getCloseButtonProps,
    getPreviousButtonProps,
    getNextButtonProps,
  } = useLightbox<Media>({
    items,
    isOpen,
    index: selectedIndex,
    onOpenChange: (openState) => {
      if (!openState) onClose();
    },
    onIndexChange: (_idx, item) => {
      // Emit SDK telemetry view event when Lightbox active item changes
      if (item && client?.events) {
        client.events.emit('view', {
          type: 'view',
          mediaId: String(item.id),
          mediaType: item.type,
          timestamp: Date.now(),
        });
      }
    },
  });

  // Reel Swiper integration for video media items
  const { getItemProps: getReelItemProps } = useReelSwiper<Media>({
    items,
    index: activeIndex,
  });

  // Emit initial view event when opened
  React.useEffect(() => {
    if (isOpen && activeItem && client?.events) {
      client.events.emit('view', {
        type: 'view',
        mediaId: String(activeItem.id),
        mediaType: activeItem.type,
        timestamp: Date.now(),
      });
    }
  }, [isOpen, activeItem, client]);

  if (!isOpen || !activeItem) return null;

  const isVideo = activeItem.type === 'video';
  const downloadUrl = isVideo ? activeItem.videoFiles[0]?.link || activeItem.url : activeItem.src.original;

  const handleDownload = () => {
    if (client?.events) {
      client.events.emit('download', {
        type: 'download',
        mediaId: String(activeItem.id),
        mediaType: activeItem.type,
        downloadUrl,
        timestamp: Date.now(),
      });
    }
    // Direct browser download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.download = `mediaforge-${activeItem.type}-${activeItem.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div {...getDialogProps({ className: 'mf-lightbox-overlay' })}>
      <div className="mf-lightbox-container">
        {/* Header */}
        <div className="mf-lightbox-header">
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
              {activeItem.alt || `${activeItem.type} #${activeItem.id}`}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Photographer: {activeItem.author.name} ({activeIndex + 1} of {items.length})
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              className="mf-btn-primary"
              style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}
              onClick={handleDownload}
            >
              ↓ Download
            </button>
            <button {...getCloseButtonProps({ className: 'mf-lightbox-close' })}>✕</button>
          </div>
        </div>

        {/* Media Content */}
        <div className="mf-lightbox-content">
          <button {...getPreviousButtonProps({ className: 'mf-lightbox-nav prev' })}>‹</button>

          {isVideo ? (
            <div {...getReelItemProps(activeIndex)} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <video
                src={activeItem.videoFiles[0]?.link}
                controls
                autoPlay
                className="mf-lightbox-video"
              />
            </div>
          ) : (
            <img
              src={activeItem.src.large2x || activeItem.src.large}
              alt={activeItem.alt || activeItem.author.name}
              className="mf-lightbox-img"
            />
          )}

          <button {...getNextButtonProps({ className: 'mf-lightbox-nav next' })}>›</button>
        </div>
      </div>
    </div>
  );
}

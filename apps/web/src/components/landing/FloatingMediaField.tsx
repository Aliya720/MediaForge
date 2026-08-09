import { useEffect, useState } from 'react';
import { Media } from '@mediaforge/media-core';

export interface CassetteItem {
  id: string;
  src: string;
  alt: string;
  rotation: number;
  height: string;
}

const DEFAULT_LEFT_TRACK: CassetteItem[] = [
  {
    id: 'l1',
    src: 'https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=600',
    alt: 'Coastal Landscape Photography',
    rotation: -4,
    height: '210px',
  },
  {
    id: 'l2',
    src: 'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=400',
    alt: 'Mountain Fog Nature',
    rotation: 3,
    height: '190px',
  },
  {
    id: 'l3',
    src: 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=600',
    alt: 'Editorial Fashion Portrait',
    rotation: -2,
    height: '240px',
  },
  {
    id: 'l4',
    src: 'https://images.pexels.com/photos/3244513/pexels-photo-3244513.jpeg?auto=compress&cs=tinysrgb&w=400',
    alt: 'Abstract Architectural Geometry',
    rotation: 5,
    height: '195px',
  },
  {
    id: 'l5',
    src: 'https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg?auto=compress&cs=tinysrgb&w=400',
    alt: 'Deep Blue Ocean Waves',
    rotation: -3,
    height: '225px',
  },
  {
    id: 'l6',
    src: 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=600',
    alt: 'Autumn Forest Canopy',
    rotation: 4,
    height: '200px',
  },
];

const DEFAULT_RIGHT_TRACK: CassetteItem[] = [
  {
    id: 'r1',
    src: 'https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg?auto=compress&cs=tinysrgb&w=400',
    alt: 'Tranquil Lake Reflection',
    rotation: 4,
    height: '195px',
  },
  {
    id: 'r2',
    src: 'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=600',
    alt: 'Snow Peak Mountains',
    rotation: -5,
    height: '235px',
  },
  {
    id: 'r3',
    src: 'https://images.pexels.com/photos/167699/pexels-photo-167699.jpeg?auto=compress&cs=tinysrgb&w=400',
    alt: 'Sunset Horizon Silhouette',
    rotation: 3,
    height: '185px',
  },
  {
    id: 'r4',
    src: 'https://images.pexels.com/photos/268533/pexels-photo-268533.jpeg?auto=compress&cs=tinysrgb&w=400',
    alt: 'Starlit Night Sky Tree',
    rotation: -4,
    height: '215px',
  },
  {
    id: 'r5',
    src: 'https://images.pexels.com/photos/842711/pexels-photo-842711.jpeg?auto=compress&cs=tinysrgb&w=400',
    alt: 'Misty Alpine Valley',
    rotation: 6,
    height: '205px',
  },
  {
    id: 'r6',
    src: 'https://images.pexels.com/photos/15286/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400',
    alt: 'Sunlit Forest Path Walk',
    rotation: -2,
    height: '220px',
  },
];

export interface FloatingMediaFieldProps {
  mediaItems?: Media[];
}

export function FloatingMediaField({ mediaItems }: FloatingMediaFieldProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Map live SDK items onto tracks if available
  const leftTrack = DEFAULT_LEFT_TRACK.map((item, idx) => {
    const live = mediaItems && mediaItems[idx];
    if (live) {
      const src = live.type === 'video' ? live.previewImage : live.src.medium;
      return { ...item, src: src || item.src, alt: live.alt || item.alt };
    }
    return item;
  });

  const rightTrack = DEFAULT_RIGHT_TRACK.map((item, idx) => {
    const live = mediaItems && mediaItems[idx + 6];
    if (live) {
      const src = live.type === 'video' ? live.previewImage : live.src.medium;
      return { ...item, src: src || item.src, alt: live.alt || item.alt };
    }
    return item;
  });

  // Duplicate arrays for 100% continuous infinite loop
  const leftLoop = [...leftTrack, ...leftTrack];
  const rightLoop = [...rightTrack, ...rightTrack];

  return (
    <div className={`mf-cassette-viewport ${mounted ? 'is-entered' : ''}`} aria-hidden="true">
      {/* Left Continuous Camera Cassette Roll (Moving Upward) */}
      <div className="mf-cassette-column mf-column-left">
        <div className="mf-cassette-track mf-roll-up">
          {leftLoop.map((item, idx) => (
            <div
              key={`left-${item.id}-${idx}`}
              className="mf-cassette-card"
              style={{
                height: item.height,
                transform: `rotate(${item.rotation}deg)`,
              }}
            >
              <img src={item.src} alt={item.alt} loading="lazy" />
            </div>
          ))}
        </div>
      </div>

      {/* Right Continuous Camera Cassette Roll (Moving Downward) */}
      <div className="mf-cassette-column mf-column-right">
        <div className="mf-cassette-track mf-roll-down">
          {rightLoop.map((item, idx) => (
            <div
              key={`right-${item.id}-${idx}`}
              className="mf-cassette-card"
              style={{
                height: item.height,
                transform: `rotate(${item.rotation}deg)`,
              }}
            >
              <img src={item.src} alt={item.alt} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

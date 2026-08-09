import { useState, FormEvent } from 'react';
import { MediaType, Media } from '@mediaforge/media-core';
import { TypeToggle } from '../header/TypeToggle.js';
import { FloatingMediaField } from './FloatingMediaField.js';

export interface LandingViewProps {
  searchQuery: string;
  mediaType: MediaType;
  curatedMedia?: Media[];
  onSearchSubmit: (query: string) => void;
  onMediaTypeChange: (type: MediaType) => void;
}

export function LandingView({
  searchQuery,
  mediaType,
  curatedMedia,
  onSearchSubmit,
  onMediaTypeChange,
}: LandingViewProps) {
  const [inputVal, setInputVal] = useState(searchQuery);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearchSubmit(inputVal.trim());
  };

  return (
    <section className="mf-landing-container mf-enter-vertical" aria-label="MediaForge Landing Search">
      {/* Dynamic 12-Card Floating Media Field (BOTTOM -> TOP Entrance + Parallax) */}
      <FloatingMediaField mediaItems={curatedMedia} />

      {/* Centered Glassmorphic Hero Search Interface */}
      <div className="mf-landing-center">
        <h1 className="mf-landing-title">⚡ MediaForge</h1>
        <p className="mf-landing-subtitle">
          Discover. Explore. Inspire. High-resolution photography & stock videography powered by Pexels.
        </p>

        <form className="mf-landing-search-form" onSubmit={handleSubmit} role="search">
          {/* Glassmorphic Search Bar */}
          <div className="mf-glass-search-bar">
            <span className="mf-glass-search-icon" aria-hidden="true">🔍</span>
            <input
              type="search"
              className="mf-glass-search-input"
              placeholder="Search photos or videos..."
              aria-label="Search media items"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button type="submit" className="mf-glass-search-btn">
              Search
            </button>
          </div>

          <div className="mf-landing-controls">
            <TypeToggle currentType={mediaType} onTypeChange={onMediaTypeChange} />
            <button
              type="button"
              className="mf-btn-primary"
              onClick={() => onSearchSubmit(inputVal || 'nature')}
              style={{ fontSize: '0.875rem', padding: '0.4rem 1.25rem' }}
            >
              Explore Media →
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

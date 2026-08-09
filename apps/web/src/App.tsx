import React from 'react';
import { MediaType, Media } from '@mediaforge/media-core';
import { useMediaSearch } from '@mediaforge/media-react';

import { Header } from './components/header/Header.js';
import { LandingView } from './components/landing/LandingView.js';
import { MediaGrid } from './components/grid/MediaGrid.js';
import { DetailView } from './components/detail/DetailView.js';
import { LightboxModal } from './components/lightbox/LightboxModal.js';
import { SkeletonGrid } from './components/feedback/SkeletonGrid.js';
import { EmptyState } from './components/feedback/EmptyState.js';
import { ErrorBanner } from './components/feedback/ErrorBanner.js';
import { EventDebugger } from './components/telemetry/EventDebugger.js';

export function App() {
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [mediaType, setMediaType] = React.useState<MediaType>('photo');
  const [viewMode, setViewMode] = React.useState<'landing' | 'results' | 'detail'>('landing');

  // Selected media item state for Lightbox modal and Detail view
  const [selectedMediaIndex, setSelectedMediaIndex] = React.useState<number>(0);
  const [selectedMediaItem, setSelectedMediaItem] = React.useState<Media | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState<boolean>(false);

  // Consume SDK media search hook
  const {
    items,
    loading,
    loadingMore,
    error,
    hasNextPage,
    loadMore,
    refresh,
  } = useMediaSearch({
    type: mediaType,
    query: searchQuery,
    perPage: 15,
    enabled: viewMode !== 'landing',
  });

  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    setViewMode('results');
  };

  const handleMediaTypeChange = (newType: MediaType) => {
    if (newType !== mediaType) {
      setMediaType(newType);
      if (viewMode === 'landing' && searchQuery) {
        setViewMode('results');
      }
    }
  };

  const handleResetHome = () => {
    setSearchQuery('');
    setMediaType('photo');
    setViewMode('landing');
  };

  const handleItemSelect = (item: Media, index: number) => {
    setSelectedMediaIndex(index);
    setSelectedMediaItem(item);

    // If photo/video double click or selection: open Detail View or Lightbox
    if (window.innerWidth < 768) {
      setIsLightboxOpen(true);
    } else {
      setViewMode('detail');
    }
  };

  const handleNavigatePrev = () => {
    if (selectedMediaIndex > 0) {
      const prevIdx = selectedMediaIndex - 1;
      setSelectedMediaIndex(prevIdx);
      setSelectedMediaItem(items[prevIdx]);
    }
  };

  const handleNavigateNext = () => {
    if (selectedMediaIndex < items.length - 1) {
      const nextIdx = selectedMediaIndex + 1;
      setSelectedMediaIndex(nextIdx);
      setSelectedMediaItem(items[nextIdx]);
    }
  };

  return (
    <div className="mf-app-container">
      {/* Header bar visible in Results & Detail views */}
      {viewMode !== 'landing' && (
        <Header
          searchQuery={searchQuery}
          mediaType={mediaType}
          onSearchSubmit={handleSearchSubmit}
          onMediaTypeChange={handleMediaTypeChange}
          onLogoClick={handleResetHome}
        />
      )}

      {/* Landing View (Reference 1 Inspiration) */}
      {viewMode === 'landing' && (
        <LandingView
          searchQuery={searchQuery}
          mediaType={mediaType}
          onSearchSubmit={handleSearchSubmit}
          onMediaTypeChange={handleMediaTypeChange}
        />
      )}

      {/* Results View (Reference 2 Inspiration) */}
      {viewMode === 'results' && (
        <main className="mf-main mf-enter-vertical">
          <div className="mf-results-bar">
            <h1 className="mf-section-title">
              {searchQuery ? `Results for "${searchQuery}"` : `Trending Curated ${mediaType === 'photo' ? 'Photos' : 'Videos'}`}
            </h1>
            <span className="mf-results-count">
              Showing {items.length} items
            </span>
          </div>

          {/* Initial Loading Skeleton */}
          {loading && items.length === 0 && <SkeletonGrid count={8} isVideo={mediaType === 'video'} />}

          {/* Initial Load Error */}
          {error && items.length === 0 && <ErrorBanner error={error} onRetry={refresh} />}

          {/* Empty State */}
          {!loading && !error && items.length === 0 && (
            <EmptyState query={searchQuery} onSuggestionClick={handleSearchSubmit} />
          )}

          {/* Primary Media Grid */}
          {items.length > 0 && (
            <>
              <MediaGrid items={items} onItemSelect={handleItemSelect} />

              {/* Non-destructive Load-More Error Banner */}
              {error && items.length > 0 && (
                <ErrorBanner error={error} onRetry={loadMore} />
              )}

              {/* Load More Section */}
              <div className="mf-load-more-section">
                {hasNextPage ? (
                  <button
                    type="button"
                    className="mf-btn-primary"
                    onClick={() => loadMore()}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading More...' : 'Load More Media'}
                  </button>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    You've reached the end of the results.
                  </p>
                )}
              </div>
            </>
          )}
        </main>
      )}

      {/* Detail View (Reference 3 Inspiration) */}
      {viewMode === 'detail' && selectedMediaItem && (
        <DetailView
          item={selectedMediaItem}
          relatedItems={items.filter((i) => i.id !== selectedMediaItem.id)}
          onBack={() => setViewMode('results')}
          onSelectRelated={(relItem, idx) => {
            setSelectedMediaItem(relItem);
            setSelectedMediaIndex(idx);
          }}
          onNavigatePrev={handleNavigatePrev}
          onNavigateNext={handleNavigateNext}
          hasPrev={selectedMediaIndex > 0}
          hasNext={selectedMediaIndex < items.length - 1}
        />
      )}

      {/* Lightbox Modal Composition */}
      <LightboxModal
        items={items}
        selectedIndex={selectedMediaIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />

      {/* Telemetry Event Debugger Drawer */}
      <EventDebugger />

      {/* Footer Attribution */}
      {viewMode !== 'landing' && (
        <footer className="mf-footer">
          <p>
            MediaForge — Headless SDK & UI Ecosystem. Media provided by{' '}
            <a
              href="https://www.pexels.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Pexels API
            </a>
            .
          </p>
        </footer>
      )}
    </div>
  );
}

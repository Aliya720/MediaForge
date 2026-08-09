# MediaForge TypeScript API Design Guidelines & `media-core` Reference

## 1. Domain Model Architecture

`@mediaforge/media-core` maps raw Pexels wire DTOs into normalized MediaForge domain models. Consumers never deal directly with Pexels-specific response shapes.

### Discriminated Union (`Media`)

```typescript
export type MediaType = 'photo' | 'video';

export interface AuthorInfo {
  name: string;
  url: string;
  id?: number;
}

export interface BaseMedia {
  id: string;
  type: MediaType;
  width: number;
  height: number;
  url: string;
  alt: string;
  author: AuthorInfo;
}

export interface PhotoSizeMap {
  original: string;
  large2x: string;
  large: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
}

export interface PhotoMedia extends BaseMedia {
  type: 'photo';
  src: PhotoSizeMap;
  avgColor?: string;
}

export type VideoQuality = 'hd' | 'sd' | 'uhd' | 'hls';

export interface VideoFile {
  id: number;
  quality: string;
  fileType: string;
  width: number | null;
  height: number | null;
  fps: number | null;
  link: string;
}

export interface VideoPicture {
  id: number;
  picture: string;
  nr: number;
}

export interface VideoMedia extends BaseMedia {
  type: 'video';
  duration: number;
  previewImage: string;
  videoFiles: VideoFile[];
  videoPictures: VideoPicture[];
}

export type Media = PhotoMedia | VideoMedia;
```

---

## 2. Public Client SDK API

Creating a client instance:

```typescript
import { createMediaClient } from '@mediaforge/media-core';

const client = createMediaClient({
  apiKey: 'YOUR_PEXELS_API_KEY',
  timeoutMs: 10000,
  cache: {
    enabled: true,
    ttlMs: 300000, // 5 minutes
  },
  enableConsoleEvents: true,
});
```

### Photos API

```typescript
// Photo Search
const searchResult = await client.photos.search({
  query: 'nature',
  page: 1,
  perPage: 15,
  orientation: 'landscape',
});

// Curated Photos
const curatedResult = await client.photos.curated({ page: 1, perPage: 15 });

// Get Photo by ID
const photo = await client.photos.get({ id: '2014422' });
```

### Videos API

```typescript
// Video Search
const videoSearchResult = await client.videos.search({
  query: 'ocean',
  page: 1,
  perPage: 15,
});

// Popular Videos
const popularVideos = await client.videos.popular({ page: 1, perPage: 10 });

// Get Video by ID
const video = await client.videos.get({ id: '856973' });
```

---

## 3. Normalized Pagination Model

```typescript
export interface PaginatedResult<T> {
  items: T[];
  page: number;
  perPage: number;
  totalResults?: number;
  hasNextPage: boolean;
}
```

- **`hasNextPage` Calculation**: Evaluated automatically from Pexels `next_page` URL string presence or by comparing `page * perPage < totalResults`.
- **Stateless Pagination**: `media-core` is strictly page-oriented and stateless. Multi-page accumulators (`loadMore()`) belong in `@mediaforge/media-react` and `@mediaforge/media-native`.

---

## 4. Typed Error Hierarchy

```text
MediaError
 ├── AuthenticationError (HTTP 401)
 ├── RateLimitError (HTTP 429)
 ├── NotFoundError (HTTP 404)
 ├── NetworkError (Network failure / Timeout / Abort)
 ├── ApiError (HTTP 4xx / 5xx)
 ├── InvalidResponseError (Malformed JSON / Data mismatch)
 └── ConfigurationError (Missing API Key)
```

All errors inherit from `MediaError` and provide `code: string`, optional `status: number`, and optional `cause`.

---

## 5. In-Memory Cache & Request Deduplication

### Cache
- In-memory `Map<string, { value: T, expiresAt: number }>`
- Deterministic key hashing (e.g. `photos.search:page=1&perPage=15&query=nature`)
- TTL-based auto-invalidation (default 5 minutes).

### Request Deduplication
- Separate in-flight map: `Map<string, Promise<T>>`
- Concurrent identical requests made while a request is in-flight share the same underlying promise, collapsing redundant network calls.

---

## 6. Typed Event Emitter

```typescript
// Subscribing to view and download events
const unsubscribe = client.events.subscribe('view', (event) => {
  console.log(`Media viewed: ${event.mediaId} (${event.mediaType})`);
});

// Emit events (triggered by consumer application on user interaction)
client.events.emit('view', {
  type: 'view',
  mediaId: '2014422',
  mediaType: 'photo',
  timestamp: Date.now(),
});

// Unsubscribe
unsubscribe();
```

Default console logging can be enabled/disabled via `enableConsoleEvents` in `MediaClientConfig`.

---

## 7. `@mediaforge/media-native` React Native Adapter Reference

`@mediaforge/media-native` is a thin React Native adapter over `@mediaforge/media-core`. It manages React lifecycle, state accumulation for pagination, race condition prevention, and unmount safety.

### Provider Context

```tsx
import { createMediaClient } from '@mediaforge/media-core';
import { MediaProvider, useMediaClient } from '@mediaforge/media-native';

const client = createMediaClient({ apiKey: 'YOUR_KEY' });

function App() {
  return (
    <MediaProvider client={client}>
      <MediaSearchScreen />
    </MediaProvider>
  );
}
```

### `useMediaSearch` Hook

```tsx
import { useMediaSearch } from '@mediaforge/media-native';

function MediaSearchScreen() {
  const { items, loading, loadingMore, error, hasNextPage, loadMore, refresh } = useMediaSearch({
    type: 'photo',
    query: 'nature',
    perPage: 15,
  });

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MediaCard item={item} />}
      onEndReached={() => {
        if (hasNextPage && !loadingMore) loadMore();
      }}
      onEndReachedThreshold={0.5}
      refreshing={loading}
      onRefresh={refresh}
    />
  );
}
```

### `useMediaItem` Hook

```tsx
import { useMediaItem } from '@mediaforge/media-native';

function DetailScreen({ mediaId }: { mediaId: string }) {
  const { item, loading, error } = useMediaItem({
    type: 'photo',
    id: mediaId,
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!item) return null;

  return <ImageDetail item={item} />;
}
```

### `useMediaEvents` Hook

```tsx
import { useMediaEvents } from '@mediaforge/media-native';

function TelemetryLogger() {
  useMediaEvents('view', (event) => {
    analytics.track('Media Viewed', { id: event.mediaId, type: event.mediaType });
  });

  useMediaEvents('download', (event) => {
    analytics.track('Media Downloaded', { id: event.mediaId, url: event.downloadUrl });
  });

  return null;
}
```

---

## 8. `@mediaforge/media-ui-react` Headless Grid Reference

`@mediaforge/media-ui-react` provides styling-agnostic headless UI primitives and prop getters for React.

### `useMediaGrid<T>` Hook

```tsx
import { useMediaGrid } from '@mediaforge/media-ui-react';

interface PhotoItem {
  id: string;
  title: string;
  url: string;
}

function Gallery({ photos }: { photos: PhotoItem[] }) {
  const {
    selectedItem,
    getGridProps,
    getItemProps,
  } = useMediaGrid<PhotoItem>({
    items: photos,
    getItemKey: (item) => item.id,
    onItemSelect: (item, index) => {
      console.log('Selected item:', item);
    },
  });

  return (
    <div {...getGridProps({ className: 'media-grid-container' })}>
      {photos.map((photo, index) => (
        <article
          {...getItemProps(photo, index, {
            className: 'media-grid-card',
            onClick: () => console.log('Custom click'),
          })}
        >
          <img src={photo.url} alt={photo.title} />
        </article>
      ))}
    </div>
  );
}
```

---

## 9. `@mediaforge/media-ui-react` Headless Lightbox & Reel Swiper Reference

### `useLightbox<T>` Hook

```tsx
import { useLightbox } from '@mediaforge/media-ui-react';

function LightboxModal({ items, isOpen, onClose }: { items: MediaItem[]; isOpen: boolean; onClose: () => void }) {
  const {
    activeItem,
    hasPrevious,
    hasNext,
    previous,
    next,
    getDialogProps,
    getCloseButtonProps,
    getPreviousButtonProps,
    getNextButtonProps,
  } = useLightbox({
    items,
    isOpen,
    onOpenChange: (open) => {
      if (!open) onClose();
    },
  });

  if (!isOpen || !activeItem) return null;

  return (
    <div {...getDialogProps({ className: 'modal-backdrop' })}>
      <div className="modal-dialog">
        <button {...getCloseButtonProps({ className: 'close-btn' })}>Close</button>
        <button {...getPreviousButtonProps({ className: 'prev-btn' })}>Prev</button>
        
        <div className="media-container">
          <img src={activeItem.url} alt={activeItem.title} />
        </div>

        <button {...getNextButtonProps({ className: 'next-btn' })}>Next</button>
      </div>
    </div>
  );
}
```

### `useReelSwiper<T>` Hook

```tsx
import { useReelSwiper } from '@mediaforge/media-ui-react';

function VideoReel({ videos }: { videos: VideoItem[] }) {
  const {
    activeIndex,
    getContainerProps,
    getItemProps,
  } = useReelSwiper<VideoItem>({
    items: videos,
    onActiveChange: (index, video) => {
      console.log(`Video reel item #${index} active:`, video.id);
    },
  });

  return (
    <div {...getContainerProps({ className: 'reel-vertical-container' })}>
      {videos.map((video, index) => (
        <section
          {...getItemProps(index, {
            className: 'reel-slide-item',
          })}
        >
          <video
            src={video.videoUrl}
            autoPlay={index === activeIndex}
            muted
            loop
          />
        </section>
      ))}
    </div>
  );
}
```

---

## 10. `@mediaforge/media-ui-native` Native Headless Reference

`@mediaforge/media-ui-native` provides styling-agnostic headless UI primitives adapted for React Native Pressable, Modal, and FlatList components.

### `useMediaGrid<T>` Native Hook

```tsx
import React from 'react';
import { Pressable, Image, Text, FlatList } from 'react-native';
import { useMediaGrid } from '@mediaforge/media-ui-native';

function NativePhotoGrid({ photos }: { photos: MediaPhoto[] }) {
  const { getItemProps, isSelected } = useMediaGrid({
    items: photos,
    onItemSelect: (photo) => console.log('Selected photo:', photo.id),
  });

  return (
    <FlatList
      data={photos}
      keyExtractor={(item) => item.id}
      numColumns={2}
      renderItem={({ item, index }) => (
        <Pressable {...getItemProps(item, index)}>
          <Image source={{ uri: item.url }} style={{ width: 150, height: 150 }} />
          <Text>{item.title}</Text>
        </Pressable>
      )}
    />
  );
}
```

### `useLightbox<T>` Native Hook

```tsx
import React from 'react';
import { Modal, Pressable, View, Image, Text } from 'react-native';
import { useLightbox } from '@mediaforge/media-ui-native';

function NativeLightboxModal({ photos, isOpen, onClose }: { photos: MediaPhoto[]; isOpen: boolean; onClose: () => void }) {
  const {
    activeItem,
    getModalProps,
    getCloseButtonProps,
    getPreviousButtonProps,
    getNextButtonProps,
  } = useLightbox({
    items: photos,
    isOpen,
    onOpenChange: (open) => {
      if (!open) onClose();
    },
  });

  if (!activeItem) return null;

  return (
    <Modal {...getModalProps()}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' }}>
        <Pressable {...getCloseButtonProps()}>
          <Text style={{ color: 'white' }}>Close</Text>
        </Pressable>

        <Image source={{ uri: activeItem.url }} style={{ width: '100%', height: 300 }} />

        <Pressable {...getPreviousButtonProps()}>
          <Text style={{ color: 'white' }}>Previous</Text>
        </Pressable>
        <Pressable {...getNextButtonProps()}>
          <Text style={{ color: 'white' }}>Next</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
```

### `useReelSwiper<T>` Native Hook

```tsx
import React from 'react';
import { FlatList, View, Text } from 'react-native';
import { useReelSwiper } from '@mediaforge/media-ui-native';

function NativeVideoReelFeed({ videos }: { videos: MediaVideo[] }) {
  const { getListProps, getItemProps, activeIndex } = useReelSwiper({
    items: videos,
    onActiveChange: (index, video) => {
      console.log(`Native reel index #${index} viewable:`, video.id);
    },
  });

  return (
    <FlatList
      {...getListProps()}
      renderItem={({ item, index }) => (
        <View {...getItemProps(index)} style={{ height: 600 }}>
          <Text style={{ color: 'white' }}>
            Video Slide #{index} {index === activeIndex ? '(PLAYING)' : '(PAUSED)'}
          </Text>
        </View>
      )}
    />
  );
}
```

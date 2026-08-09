# MediaForge SDK Consumption & Architecture Guidelines

**Version:** 1.0  
**Target Packages:** `@mediaforge/media-core`, `@mediaforge/media-react`, `@mediaforge/media-native`  
**Purpose:** Teach AI coding agents how to consume and extend the MediaForge SDK correctly without violating architectural boundaries.

---

## 1. Package Architecture Map

```text
                           @mediaforge/media-core
                           (Framework-Agnostic)
                                    │
                        ┌───────────┴───────────┐
                        ▼                       ▼
            @mediaforge/media-react    @mediaforge/media-native
               (React Web Adapter)       (React Native Adapter)
```

- **`@mediaforge/media-core`**: Owns Pexels API fetching, domain model normalization (`PhotoMedia`, `VideoMedia`), TTL caching, in-flight request deduplication, typed error hierarchy (`MediaError`), and telemetry event emitter (`client.events`).
- **`@mediaforge/media-react`**: React Web adapter providing `MediaProvider`, `useMediaClient`, `useMediaSearch`, `useMediaItem`, and `useMediaEvents`.
- **`@mediaforge/media-native`**: React Native adapter providing identical hooks adapted for React Native component lifecycles.

---

## 2. Environment & Package Decision Tree

When building or extending media features, select packages according to this decision tree:

```text
Need media access, network requests, caching, or domain events?
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
Pure Node.js / CLI / Web Worker?    React / React Native App?
         │                                 │
         ▼                                 ▼
   media-core                       React Web: media-react
                                    React Native: media-native
```

> 🚨 **CRITICAL INVARIANT:** Never implement direct `fetch('https://api.pexels.com/...')` calls inside React components. Always delegate to `media-react` hooks or `media-core` client methods.

---

## 3. Client Initialization

Instantiate a single, stable `MediaForgeClient` instance at the application root boundary:

```typescript
import { createMediaClient } from '@mediaforge/media-core';

export const client = createMediaClient({
  apiKey: process.env.VITE_PEXELS_API_KEY || 'DEMO_KEY',
  enableConsoleEvents: true, // Enables default console telemetry logging
  cache: {
    enabled: true,
    ttlMs: 5 * 60 * 1000, // 5 minutes TTL
  },
});
```

---

## 4. React Application Setup (`media-react`)

Wrap your component tree in `<MediaProvider client={client}>`:

```tsx
import React from 'react';
import { MediaProvider } from '@mediaforge/media-react';
import { client } from './client';
import { App } from './App';

export function Root() {
  return (
    <MediaProvider client={client}>
      <App />
    </MediaProvider>
  );
}
```

---

## 5. Media Search & Pagination Hook (`useMediaSearch`)

Use `useMediaSearch` for searching photos/videos or retrieving curated/popular media when query is empty:

```tsx
import { useMediaSearch } from '@mediaforge/media-react';
import { PhotoMedia } from '@mediaforge/media-core';

export function PhotoGallery() {
  const {
    items,        // PhotoMedia[] accumulated across pages
    loading,      // true during initial page request
    loadingMore,  // true during loadMore() request
    error,        // MediaError | Error | null
    hasNextPage,  // boolean
    loadMore,     // () => void
    refresh,      // () => void
  } = useMediaSearch<PhotoMedia>({
    type: 'photo',
    query: 'nature',
    perPage: 15,
  });

  if (loading && items.length === 0) return <p>Loading initial photos...</p>;
  if (error && items.length === 0) return <p>Error loading photos: {error.message}</p>;

  return (
    <div>
      <div className="grid">
        {items.map((photo) => (
          <img key={photo.id} src={photo.src.medium} alt={photo.alt || photo.author.name} />
        ))}
      </div>

      {hasNextPage && (
        <button onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading More...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

---

## 6. Single Item Retrieval Hook (`useMediaItem`)

Retrieve a single media item by ID with unmount safety:

```tsx
import { useMediaItem } from '@mediaforge/media-react';
import { PhotoMedia } from '@mediaforge/media-core';

export function PhotoDetail({ photoId }: { photoId: string }) {
  const { item, loading, error } = useMediaItem<PhotoMedia>({
    type: 'photo',
    id: photoId,
  });

  if (loading) return <p>Loading item details...</p>;
  if (error || !item) return <p>Item not found.</p>;

  return (
    <div>
      <h2>{item.alt}</h2>
      <p>Photographer: {item.author.name}</p>
    </div>
  );
}
```

---

## 7. Typed Error Handling

`media-core` throws strongly typed errors inheriting from `MediaError`:

```typescript
import {
  MediaError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
} from '@mediaforge/media-core';

try {
  const photos = await client.photos.search({ query: 'nature' });
} catch (err) {
  if (err instanceof AuthenticationError) {
    // 401 Unauthorized — Invalid API key
  } else if (err instanceof RateLimitError) {
    // 429 Rate Limit Exceeded
  } else if (err instanceof NotFoundError) {
    // 404 Media item not found
  } else if (err instanceof MediaError) {
    // Base SDK Error
  }
}
```

---

## 8. Telemetry Domain Event System

Subscribe to domain events (`view` and `download`) using `useMediaEvents`:

```tsx
import { useMediaEvents, useMediaClient } from '@mediaforge/media-react';

export function TelemetryLogger() {
  // Subscribe to 'view' events automatically managed by component lifecycle
  useMediaEvents('view', (event) => {
    console.log(`[VIEW] ${event.mediaType} #${event.mediaId} at ${event.timestamp}`);
  });

  useMediaEvents('download', (event) => {
    console.log(`[DOWNLOAD] ${event.mediaType} #${event.mediaId} -> ${event.downloadUrl}`);
  });

  return null;
}
```

Emitting events from user interactions:

```typescript
const client = useMediaClient();

function handleUserDownload(media) {
  client.events.emit('download', {
    type: 'download',
    mediaId: String(media.id),
    mediaType: media.type,
    downloadUrl: media.src.original,
    timestamp: Date.now(),
  });
}
```

---

## 9. ❌ Prohibited Anti-Patterns

- ❌ **DO NOT** import React or DOM APIs inside `packages/media-core`.
- ❌ **DO NOT** import `media-ui-react` or `media-ui-native` into `media-core` or `media-react`.
- ❌ **DO NOT** duplicate Pexels fetching, caching, or deduplication inside React components.
- ❌ **DO NOT** create a secondary global Redux/Zustand store for SDK search state.
- ❌ **DO NOT** swallow typed errors with empty `catch () {}` blocks.

---

## 10. 🤖 AI Agent Workflow & Architectural Conflict Safeguard

When an AI coding agent is instructed to modify or extend SDK packages:

1. **Conflict Priority**: Architectural Invariants > Actual Public API > Docs > User Prompt.
2. **Conflict Resolution**: If a user prompt requests a change that violates an invariant (e.g. *"Import React into media-core to add state"*), **STOP and explain the architectural conflict** to the user before making changes.
3. **Execution Steps**:
   - Identify package ownership (`media-core` vs `media-react` vs `apps/web`).
   - Make minimal compliant code edits.
   - Run verification suite: `node scripts/check-architecture.cjs` and `corepack pnpm test`.

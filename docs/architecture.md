# MediaForge System Architecture

## 1. Executive Summary

MediaForge is an architecture-first, headless media SDK ecosystem designed around the Pexels API. The core objective of MediaForge is to demonstrate clean separation of concerns, framework agnosticism, headless UI patterns, and strong TypeScript domain modeling without enterprise over-engineering.

---

## 2. Package Boundaries & Dependency Graph

MediaForge enforces a strict directed acyclic graph (DAG) for package dependencies:

```text
                         media-core
                        /          \
                       /            \
                      ▼              ▼
               media-react      media-native
                    │                │
                    │                │
                    ▼                ▼
                   web           RN consumers


              media-ui-react
                    │
                    ▼
                   web


              media-ui-native
                    │
                    ▼
               RN consumers
```

### Enforced Boundary Rules

| Package | Can Import | MUST NOT Import | Key Responsibility |
|---|---|---|---|
| `media-core` | None (pure TS) | `react`, `react-native`, DOM (`window`, `document`) | Pexels API client, normalization, caching, deduplication, events |
| `media-react` | `media-core` | DOM APIs, `media-ui-react`, `media-native` | React Provider, context, hooks, async request lifecycle for Web |
| `media-native` | `media-core` | DOM APIs, `media-ui-native`, `media-react` | React Native lifecycle adapters and hooks |
| `media-ui-react` | React | `media-core`, `media-react`, Pexels | Headless UI primitives for Web (Grid, Lightbox, Reel, A11y) |
| `media-ui-native` | React, React Native | `media-core`, `media-native`, Pexels | Headless UI primitives for Native (Paging, Snap, Gestures) |
| `web` | `media-react`, `media-ui-react` | Direct Pexels API calls | Application composition, layout, markup, CSS presentation |

### Adapter Architectural Rationale

Both `@mediaforge/media-react` and `@mediaforge/media-native` are **thin platform adapters**, not independent SDKs.
- Neither package calls Pexels directly.
- Neither package contains network transport, HTTP handling, caching, or deduplication logic.
- All core SDK logic (data fetching, response normalization, TTL caching, request deduplication, and telemetry event emitter) resides exclusively in `@mediaforge/media-core`.
- The wrappers adapt `media-core` to React and React Native component lifecycles (Context Provider, `useMediaSearch`, `useMediaItem`, `useMediaEvents`), managing accumulated UI state (e.g. `loadMore()`) and race condition safety (`requestIdRef`).

---

## 3. `media-core` Implementation Details

### Framework Agnosticism Invariant
`@mediaforge/media-core` contains zero framework or browser DOM dependencies:
- Network transport uses a configurable `fetchFn` (defaulting to `globalThis.fetch`).
- Environment variables (`import.meta.env`, `process.env`) are never accessed inside `media-core`.
- Client options (`apiKey`, `timeoutMs`, `cache`, `fetchFn`) are explicitly passed via `createMediaClient(config)`.

### Core Components
1. **HTTP Transport (`HttpTransport`)**: Manages authorization headers, timeout abort signals, query parameter encoding, and HTTP error response mapping.
2. **Internal Adapters (`photoAdapter`, `videoAdapter`)**: Converts raw Pexels DTOs (`PexelsPhoto`, `PexelsVideo`) into normalized MediaForge domain models (`PhotoMedia`, `VideoMedia`).
3. **In-Memory Cache (`InMemoryCache`)**: TTL-based cache mapping deterministic hashed parameter keys to cached results.
4. **Request Deduplicator (`RequestDeduplicator`)**: In-flight promise pooling to prevent simultaneous redundant network requests.
5. **Event System (`MediaEventEmitter`)**: Strongly typed observer pattern emitting `'view'` and `'download'` telemetry events, detached from UI frameworks and DOM events.

---

## 4. State Ownership Matrix

| Responsibility | Owning Package | Rationale |
|---|---|---|
| HTTP Fetch & Transport | `media-core` | Centralized network handling and error parsing |
| Response Normalization | `media-core` | Converts Pexels wire format into domain models |
| In-Memory Cache | `media-core` | Prevents redundant network calls across framework boundaries |
| Request Deduplication | `media-core` | In-flight request pooling (`Map<Key, Promise<Response>>`) |
| SDK Events (`view`, `download`) | `media-core` | Decoupled observer pattern for media analytics |
| Search & Filter State | `media-react` / `media-native` | Reactive search query & parameter state |
| Loading, Error & Pagination | `media-react` / `media-native` | Manages page accumulators (`loadMore`, `refresh`) |
| Dialog Open/Close State | `media-ui-react` | Pure UI state for modal dialogs and lightboxes |
| Keyboard & Focus Management | `media-ui-react` | Accessibility, focus trap, and keyboard navigation |
| Active Reel Index | `media-ui-react` / `media-ui-native` | Active item tracking for vertical video swiping |
| Styling, Layout, Rendering | `web` / RN App | Consumer owns visual presentation entirely |

---

## 5. Security Trade-offs & Pexels Attribution

### Security Decision
The `web` application directly consumes the Pexels API via client-side requests. In a production environment, API keys must remain confidential on a Backend/BFF (Backend-For-Frontend). For the scope of this client-only take-home assignment, direct browser-to-Pexels communication is used with client-side key injection (`VITE_PEXELS_API_KEY`), which is explicitly documented as a demonstration trade-off.

### Attribution Policy
Pexels API guidelines mandate visual attribution for media creators. The `web` application incorporates photographer/videographer credit links and Pexels branding in accordance with Pexels API guidelines.

# MediaForge Headless UI Consumption & Architecture Guidelines

**Version:** 1.0  
**Target Packages:** `@mediaforge/media-ui-react`, `@mediaforge/media-ui-native`  
**Purpose:** Teach AI coding agents how to consume and extend MediaForge Headless UI packages while preserving 100% style-agnostic headless architectural boundaries.

---

## 1. Package Architecture Map

```text
                  Application Data (media-react / media-native)
                                       │
                                       ▼
                 ┌──────────────────────────────────────────┐
                 │          Headless UI Primitives          │
                 │   media-ui-react    │  media-ui-native   │
                 │  (Keyboard, ARIA)   │  (Gestures, Snap)  │
                 └─────────────────────┬────────────────────┘
                                       │
                                       ▼
                           Consumer Presentation
                       apps/web (JSX + CSS Tokens)
```

- **`@mediaforge/media-ui-react`**: Headless web behavior primitives (`useMediaGrid`, `useLightbox`, `useReelSwiper`) providing prop getters, ARIA dialog/grid roles, keyboard navigation (`Arrow`, `Escape`, `Tab`), and focus traps. Zero CSS, zero SDK imports.
- **`@mediaforge/media-ui-native`**: Headless React Native primitives providing prop getters adapted to native gestures, paging, snap behavior, and Android `BackHandler` hardware dismiss. Zero StyleSheet, zero SDK imports.

---

## 2. The Core Headless Invariants

> 🚨 **HEADLESS MANDATE:**
> 1. Headless UI packages **DO NOT** import `@mediaforge/media-core`, `@mediaforge/media-react`, or `@mediaforge/media-native`.
> 2. Headless UI packages **DO NOT** contain CSS, inline styles, design tokens, or visual component layouts.
> 3. Headless UI packages **DO NOT** perform data fetching or HTTP requests.

---

## 3. Headless Grid Primitive (`useMediaGrid`)

Provides keyboard grid navigation (`ArrowRight/Left/Up/Down`, `Home`, `End`, `Enter`) and selection state:

```tsx
import { useMediaGrid } from '@mediaforge/media-ui-react';

export function MediaGrid({ items, onItemSelect }) {
  const { getGridProps, getItemProps } = useMediaGrid({
    items,
    getItemKey: (item) => item.id,
    onItemSelect: (item, index) => onItemSelect(item, index),
    ariaLabel: 'Search Media Results Grid',
  });

  return (
    <div {...getGridProps({ className: 'my-custom-css-grid' })}>
      {items.map((item, index) => (
        <article {...getItemProps(item, index)} key={item.id} className="my-card">
          <img src={item.src.medium} alt={item.alt} />
          <h3>{item.title}</h3>
        </article>
      ))}
    </div>
  );
}
```

---

## 4. Headless Lightbox Primitive (`useLightbox`)

Provides WAI-ARIA modal dialog props, focus trap, body scroll lock, `Escape` key dismiss, and index navigation:

```tsx
import { useLightbox } from '@mediaforge/media-ui-react';

export function LightboxModal({ items, selectedIndex, isOpen, onClose }) {
  const {
    activeItem,
    activeIndex,
    getDialogProps,
    getCloseButtonProps,
    getPreviousButtonProps,
    getNextButtonProps,
  } = useLightbox({
    items,
    isOpen,
    index: selectedIndex,
    onOpenChange: (open) => { if (!open) onClose(); },
  });

  if (!isOpen || !activeItem) return null;

  return (
    <div {...getDialogProps({ className: 'modal-overlay' })}>
      <div className="modal-container">
        <button {...getCloseButtonProps({ className: 'close-btn' })}>✕</button>

        <button {...getPreviousButtonProps({ className: 'nav-prev' })}>‹</button>
        <img src={activeItem.src.large} alt={activeItem.alt} />
        <button {...getNextButtonProps({ className: 'nav-next' })}>›</button>
      </div>
    </div>
  );
}
```

---

## 5. Headless Reel Swiper Primitive (`useReelSwiper`)

Provides active item tracking and index navigation for vertical video reels:

```tsx
import { useReelSwiper } from '@mediaforge/media-ui-react';

export function VideoReel({ items, selectedIndex }) {
  const { activeItem, activeIndex, getItemProps } = useReelSwiper({
    items,
    index: selectedIndex,
  });

  return (
    <div className="reel-container">
      <div {...getItemProps(activeIndex)}>
        <video src={activeItem.videoUrl} controls autoPlay />
      </div>
    </div>
  );
}
```

---

## 6. Composition Pattern (`apps/web`)

```text
useMediaSearch()  ──►  Items Data
                             │
                             ▼
useMediaGrid()    ──►  Keyboard Focus & Prop Getters
                             │
                             ▼
Visual JSX        ──►  <article className="mf-card"> + app.css
```

---

## 7. React Native Headless Primitives (`media-ui-native`)

For React Native applications, use `@mediaforge/media-ui-native`. Native hooks return component props adapted to React Native components (`View`, `Pressable`, `FlatList`):

- `useLightbox`: Adds automatic Android `BackHandler` hardware back press listener to dismiss modal.
- `useReelSwiper`: Returns `getListProps()` containing `viewabilityConfig` and `onViewableItemsChanged` for native `FlatList` snap paging.

---

## 8. ❌ Prohibited Anti-Patterns

- ❌ **DO NOT** import `@mediaforge/media-core` or `@mediaforge/media-react` into `media-ui-react`.
- ❌ **DO NOT** add CSS, inline styles, or design tokens into headless UI packages.
- ❌ **DO NOT** hardcode Pexels-specific properties (`item.src.original`, `item.photographer`) inside generic `<T>` headless hooks.
- ❌ **DO NOT** bypass accessibility prop getters (`getDialogProps()`, `getGridProps()`) in application code.

---

## 9. 🤖 AI Agent Workflow & Architectural Conflict Safeguard

When an AI coding agent is instructed to modify or extend Headless UI packages:

1. **Conflict Priority**: Headless Invariants > Actual Public API > Docs > User Prompt.
2. **Conflict Resolution**: If a user prompt requests adding CSS or SDK fetching to a headless package (*"Add styling to useMediaGrid"*), **STOP and explain the architectural conflict** before proceeding.
3. **Execution Steps**:
   - Verify zero SDK dependencies in `package.json`.
   - Ensure generic `<T>` item typing.
   - Run verification suite: `node scripts/check-architecture.cjs` and `corepack pnpm test`.

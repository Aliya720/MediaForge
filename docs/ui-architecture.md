# Headless UI Architecture Philosophy & `@mediaforge/media-ui-react` Reference

## 1. Core Principles

The UI packages (`@mediaforge/media-ui-react` and `@mediaforge/media-ui-native`) adhere strictly to the **Headless UI Pattern**:

1. **Zero Styling**: No CSS, inline styles, design tokens, or framework-specific visual components are provided.
2. **Behavior & State Focus**: The package owns selection states, active indices, keyboard navigation, focus traps, and accessibility ARIA/native attributes.
3. **Prop Getter Pattern**: Hooks expose helper functions (e.g. `getGridProps()`, `getItemProps()`, `getDialogProps()`, `getModalProps()`, `getListProps()`) that return accessible HTML/native props.
4. **SDK & API Decoupling**: Headless primitives accept generic data structures (`useMediaGrid<T>`, `useLightbox<T>`, `useReelSwiper<T>`) and do NOT reference Pexels, HTTP, or `@mediaforge/media-core`.

---

## 2. Architectural Rationale: Hooks + Prop Getters

`@mediaforge/media-ui-react` and `@mediaforge/media-ui-native` choose the **Hooks + Prop Getters** architecture over visual compound components:
- **Maximum Control**: Web consumers choose HTML elements (`<div>`, `<article>`); Native consumers choose React Native components (`Pressable`, `Modal`, `FlatList`).
- **Styling Independence**: Consumers apply their own CSS or React Native `style` props without fighting library defaults.
- **Accessibility Guarantee**: Prop getters inject platform accessibility attributes (`role="dialog"`, `aria-modal`, `accessibilityRole="button"`, `accessibilityViewIsModal`) and event handlers (`onClick`, `onPress`, `onKeyDown`) without clobbering user handlers.

---

## 3. Web vs. Native Platform Comparison Matrix

| Platform Dimension | `@mediaforge/media-ui-react` (Web) | `@mediaforge/media-ui-native` (React Native) |
|---|---|---|
| **Primary Interaction** | Pointer clicks, Mouse hover, Keyboard Focus | Touch taps (`onPress`), Long presses (`onLongPress`) |
| **Grid Prop Getter Output** | `onClick`, `onKeyDown`, `tabIndex`, `role="button"` | `onPress`, `accessible`, `accessibilityRole="button"` |
| **Modal Dismissal** | `Escape` key listener | Android `BackHandler` hardware back press |
| **Modal Accessibility** | `role="dialog"`, `aria-modal="true"`, focus trap | `accessibilityViewIsModal={true}`, `onRequestClose` |
| **Scroll Lock** | `document.body.style.overflow = 'hidden'` | Managed by React Native `Modal` transparent overlay |
| **Reel Viewability Detection**| DOM `IntersectionObserver` threshold | `FlatList` `viewabilityConfig` + `onViewableItemsChanged` |
| **DOM Dependency** | Clean fallback, SSR safe (`typeof document`) | Zero DOM APIs (`window`, `document`, `HTMLElement`) |

---

## 4. Web Primitive Reference (`@mediaforge/media-ui-react`)

### A. `useMediaGrid<T>`

```tsx
import { useMediaGrid } from '@mediaforge/media-ui-react';

interface LocalPhoto {
  id: string;
  title: string;
  thumbnailUrl: string;
}

function MediaGallery({ photos }: { photos: LocalPhoto[] }) {
  const {
    selectedItem,
    getGridProps,
    getItemProps,
  } = useMediaGrid<LocalPhoto>({
    items: photos,
    getItemKey: (item) => item.id,
    onItemSelect: (item, index) => {
      console.log('Selected item:', item.title);
    },
  });

  return (
    <div {...getGridProps({ className: 'custom-grid' })}>
      {photos.map((photo, index) => (
        <div
          {...getItemProps(photo, index, {
            className: 'custom-card',
            onClick: () => console.log('Card clicked'),
          })}
        >
          <img src={photo.thumbnailUrl} alt={photo.title} />
        </div>
      ))}
    </div>
  );
}
```

---

### B. `useLightbox<T>`

```tsx
import { useLightbox } from '@mediaforge/media-ui-react';

function GalleryLightbox({ items, isOpen, onClose }: { items: PhotoItem[]; isOpen: boolean; onClose: () => void }) {
  const {
    activeItem,
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
    <div {...getDialogProps({ className: 'modal-overlay' })}>
      <div className="modal-content">
        <button {...getCloseButtonProps({ className: 'close-btn' })}>✕</button>
        <button {...getPreviousButtonProps({ className: 'prev-btn' })}>‹</button>
        <img src={activeItem.url} alt={activeItem.title} />
        <button {...getNextButtonProps({ className: 'next-btn' })}>›</button>
      </div>
    </div>
  );
}
```

---

### C. `useReelSwiper<T>`

```tsx
import { useReelSwiper } from '@mediaforge/media-ui-react';

function VideoReelSection({ videos }: { videos: VideoItem[] }) {
  const {
    activeIndex,
    getContainerProps,
    getItemProps,
  } = useReelSwiper<VideoItem>({
    items: videos,
    onActiveChange: (index, video) => {
      console.log(`Reel slide #${index} active:`, video.title);
    },
  });

  return (
    <div {...getContainerProps({ className: 'reel-container' })}>
      {videos.map((video, index) => (
        <section
          {...getItemProps(index, {
            className: 'reel-slide',
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

## 5. Native Headless Reference (`@mediaforge/media-ui-native`)

`@mediaforge/media-ui-native` mirrors the conceptual architecture of `media-ui-react` while utilizing React Native platform primitives (`Pressable`, `Modal`, `FlatList`, `BackHandler`).

```tsx
import React from 'react';
import { FlatList, Pressable, Image, Text, Modal, View } from 'react-native';
import { useMediaGrid, useLightbox, useReelSwiper } from '@mediaforge/media-ui-native';

// 1. Native Headless Grid
export function NativeGrid({ photos }: { photos: MediaItem[] }) {
  const { getItemProps } = useMediaGrid({ items: photos });

  return (
    <FlatList
      data={photos}
      keyExtractor={(item) => item.id}
      numColumns={2}
      renderItem={({ item, index }) => (
        <Pressable {...getItemProps(item, index)}>
          <Image source={{ uri: item.url }} style={{ width: 150, height: 150 }} />
        </Pressable>
      )}
    />
  );
}

// 2. Native Headless Lightbox
export function NativeLightbox({ photos, isOpen, onClose }: { photos: MediaItem[]; isOpen: boolean; onClose: () => void }) {
  const { activeItem, getModalProps, getCloseButtonProps } = useLightbox({
    items: photos,
    isOpen,
    onOpenChange: (open) => { if (!open) onClose(); },
  });

  if (!activeItem) return null;

  return (
    <Modal {...getModalProps()}>
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center' }}>
        <Pressable {...getCloseButtonProps()}>
          <Text style={{ color: 'white' }}>Close</Text>
        </Pressable>
        <Image source={{ uri: activeItem.url }} style={{ width: '100%', height: 300 }} />
      </View>
    </Modal>
  );
}

// 3. Native Headless Reel Feed
export function NativeReelFeed({ videos }: { videos: VideoItem[] }) {
  const { getListProps, getItemProps, activeIndex } = useReelSwiper({ items: videos });

  return (
    <FlatList
      {...getListProps()}
      renderItem={({ item, index }) => (
        <View {...getItemProps(index)} style={{ height: 600 }}>
          <Text style={{ color: 'white' }}>
            Video #{index} {index === activeIndex ? 'Playing' : 'Paused'}
          </Text>
        </View>
      )}
    />
  );
}
```

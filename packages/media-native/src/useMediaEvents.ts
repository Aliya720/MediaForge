/**
 * useMediaEvents — Subscribes to MediaForge SDK events within React Native lifecycle.
 *
 * Subscribes on mount, unsubscribes on cleanup. Uses stable callback reference
 * to avoid unnecessary subscription churn when the consumer's callback closure changes.
 *
 * INVARIANT: Does NOT create another event emitter. Uses media-core's emitter.
 * INVARIANT: Does NOT import react-native or DOM event types.
 */

import React from 'react';
import type {
  MediaEventType,
  MediaEventMap,
  EventListener,
} from '@mediaforge/media-core';
import { useMediaClient } from './MediaProvider.js';

/**
 * useMediaEvents — subscribe to SDK domain events within React Native lifecycle.
 *
 * @param event - The event type to subscribe to ('view' | 'download')
 * @param callback - The listener function, called with the typed event payload
 */
export function useMediaEvents<K extends MediaEventType>(
  event: K,
  callback: EventListener<K>,
): void {
  const client = useMediaClient();

  // Store the latest callback in a ref to avoid re-subscribing on every render.
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  React.useEffect(() => {
    const stableListener: EventListener<K> = (data: MediaEventMap[K]) => {
      callbackRef.current(data);
    };

    const unsubscribe = client.events.subscribe(event, stableListener);
    return unsubscribe;
  }, [client, event]);
}

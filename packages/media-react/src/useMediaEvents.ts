/**
 * useMediaEvents — Subscribes to MediaForge SDK events within React component lifecycle.
 */

import React from 'react';
import type {
  MediaEventType,
  EventListener,
} from '@mediaforge/media-core';
import { useMediaClient } from './MediaProvider.js';

export function useMediaEvents<K extends MediaEventType>(
  event: K,
  callback: EventListener<K>,
): void {
  const client = useMediaClient();

  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  React.useEffect(() => {
    const stableListener: EventListener<K> = (data) => {
      callbackRef.current(data);
    };

    const unsubscribe = client.events.subscribe(event, stableListener);
    return unsubscribe;
  }, [client, event]);
}

/**
 * Framework-Agnostic Typed Event Emitter for MediaForge
 */

import {
  MediaEventMap,
  MediaEventType,
  EventListener,
  UnsubscribeFunction,
} from '../types/events.js';

export class MediaEventEmitter {
  private readonly listeners: {
    [K in MediaEventType]?: Set<EventListener<K>>;
  } = {};

  subscribe<K extends MediaEventType>(event: K, listener: EventListener<K>): UnsubscribeFunction {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set() as any;
    }

    const set = this.listeners[event]!;
    set.add(listener as any);

    let unsubscribed = false;
    return () => {
      if (unsubscribed) return;
      unsubscribed = true;
      set.delete(listener as any);
    };
  }

  emit<K extends MediaEventType>(event: K, data: MediaEventMap[K]): void {
    const set = this.listeners[event];
    if (!set || set.size === 0) return;

    // Create shallow copy to prevent mutation issues during iteration
    const activeListeners = Array.from(set);
    activeListeners.forEach((listener) => {
      try {
        listener(data as any);
      } catch (err) {
        // Prevent listener exceptions from breaking emitter loop
        if (typeof console !== 'undefined' && console.error) {
          console.error(`[MediaForge EventEmitter Error in '${event}' listener]:`, err);
        }
      }
    });
  }

  removeAllListeners(event?: MediaEventType): void {
    if (event) {
      delete this.listeners[event];
    } else {
      (Object.keys(this.listeners) as MediaEventType[]).forEach((k) => {
        delete this.listeners[k];
      });
    }
  }

  listenerCount(event: MediaEventType): number {
    return this.listeners[event]?.size ?? 0;
  }
}

/**
 * Attaches default console logging listener to event emitter.
 * Crucial Invariant: Does not embed console.log directly inside EventEmitter class.
 */
export function attachDefaultConsoleListener(emitter: MediaEventEmitter): UnsubscribeFunction {
  const unsubView = emitter.subscribe('view', (evt) => {
    if (typeof console !== 'undefined' && console.log) {
      console.log(`[MediaForge SDK Event: view] Media #${evt.mediaId} (${evt.mediaType}) at ${new Date(evt.timestamp).toISOString()}`);
    }
  });

  const unsubDownload = emitter.subscribe('download', (evt) => {
    if (typeof console !== 'undefined' && console.log) {
      console.log(`[MediaForge SDK Event: download] Media #${evt.mediaId} (${evt.mediaType}) from ${evt.downloadUrl}`);
    }
  });

  return () => {
    unsubView();
    unsubDownload();
  };
}

/**
 * useMediaItem — Retrieves a single media item by ID.
 *
 * Fetches a photo or video by ID from media-core with loading/error state.
 * Uses the same request identity and unmount safety patterns as useMediaSearch.
 *
 * INVARIANT: Does NOT call Pexels directly. Delegates to media-core client.
 * INVARIANT: Does NOT import react-native or DOM APIs.
 */

import React from 'react';
import type {
  PhotoMedia,
  VideoMedia,
  MediaType,
  MediaError,
} from '@mediaforge/media-core';
import { useMediaClient } from './MediaProvider.js';

export interface UseMediaItemOptions {
  /** Media type: 'photo' or 'video' */
  type: MediaType;
  /** The ID of the media item to fetch */
  id: string | number;
  /** If true, fetch is not executed automatically */
  enabled?: boolean;
}

export interface UseMediaItemResult<T extends PhotoMedia | VideoMedia> {
  /** The retrieved media item, or null if not yet loaded */
  item: T | null;
  /** True during the fetch request */
  loading: boolean;
  /** The error, or null */
  error: MediaError | Error | null;
}

export function useMediaItem<T extends PhotoMedia | VideoMedia = PhotoMedia | VideoMedia>(
  options: UseMediaItemOptions,
): UseMediaItemResult<T> {
  const client = useMediaClient();
  const [item, setItem] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<MediaError | Error | null>(null);

  const requestIdRef = React.useRef(0);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    const enabled = options.enabled !== false;
    if (!enabled || !options.id) {
      setItem(null);
      setLoading(false);
      setError(null);
      return;
    }

    const currentRequestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);
    setItem(null);

    const fetchItem = async () => {
      try {
        let result: PhotoMedia | VideoMedia;
        if (options.type === 'photo') {
          result = await client.photos.get({ id: options.id });
        } else {
          result = await client.videos.get({ id: options.id });
        }

        if (!mountedRef.current || requestIdRef.current !== currentRequestId) return;

        setItem(result as T);
        setLoading(false);
      } catch (err: unknown) {
        if (!mountedRef.current || requestIdRef.current !== currentRequestId) return;

        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    };

    fetchItem();
  }, [options.type, options.id, options.enabled, client]);

  return { item, loading, error };
}

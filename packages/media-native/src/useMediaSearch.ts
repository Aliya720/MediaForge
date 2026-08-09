/**
 * useMediaSearch — React Native search hook with pagination, loading states,
 * race condition protection, and unmount safety.
 *
 * Adapts media-core's stateless page-oriented API into accumulated React state.
 * Each hook instance maintains independent state (no global search state).
 *
 * INVARIANT: Does NOT call Pexels directly. Delegates to media-core client.
 * INVARIANT: Does NOT import react-native or DOM APIs.
 */

import React from 'react';
import type {
  MediaForgeClient,
  PhotoMedia,
  VideoMedia,
  PaginatedResult,
  MediaType,
  MediaError,
} from '@mediaforge/media-core';
import { useMediaClient } from './MediaProvider.js';

// ─── Public Types ───────────────────────────────────────────────────────────

export interface UseMediaSearchOptions {
  /** Media type: 'photo' or 'video' */
  type: MediaType;
  /** Search query string */
  query: string;
  /** Results per page (default: 15) */
  perPage?: number;
  /** Optional orientation filter */
  orientation?: 'landscape' | 'portrait' | 'square';
  /** Optional size filter */
  size?: 'large' | 'medium' | 'small';
  /** Optional color filter (photos only) */
  color?: string;
  /** If true, search is not executed automatically */
  enabled?: boolean;
}

export interface UseMediaSearchResult<T extends PhotoMedia | VideoMedia> {
  /** Accumulated items across all loaded pages */
  items: T[];
  /** True during initial search request */
  loading: boolean;
  /** True during loadMore() pagination request */
  loadingMore: boolean;
  /** The most recent error, or null */
  error: MediaError | Error | null;
  /** Whether more pages are available */
  hasNextPage: boolean;
  /** Load the next page and append results */
  loadMore: () => void;
  /** Reset and re-execute the search from page 1 */
  refresh: () => void;
  /** Total results reported by the API */
  totalResults: number | undefined;
}

// ─── Internal State ─────────────────────────────────────────────────────────

interface SearchState<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  error: MediaError | Error | null;
  hasNextPage: boolean;
  currentPage: number;
  totalResults: number | undefined;
}

function initialState<T>(): SearchState<T> {
  return {
    items: [],
    loading: false,
    loadingMore: false,
    error: null,
    hasNextPage: false,
    currentPage: 0,
    totalResults: undefined,
  };
}

// ─── Search Executor ────────────────────────────────────────────────────────

async function executeSearch(
  client: MediaForgeClient,
  options: UseMediaSearchOptions,
  page: number,
): Promise<PaginatedResult<PhotoMedia> | PaginatedResult<VideoMedia>> {
  const perPage = options.perPage ?? 15;

  if (options.type === 'photo') {
    return client.photos.search({
      query: options.query,
      page,
      perPage,
      orientation: options.orientation,
      size: options.size,
      color: options.color,
    });
  } else {
    return client.videos.search({
      query: options.query,
      page,
      perPage,
      orientation: options.orientation,
      size: options.size,
    });
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useMediaSearch<T extends PhotoMedia | VideoMedia = PhotoMedia | VideoMedia>(
  options: UseMediaSearchOptions,
): UseMediaSearchResult<T> {
  const client = useMediaClient();
  const [state, setState] = React.useState<SearchState<T>>(initialState<T>);

  // Request identity counter — prevents stale responses from overwriting newer state
  const requestIdRef = React.useRef(0);
  // Mounted flag — prevents state updates after unmount
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Stable reference to options for dependency tracking
  const optionsKey = `${options.type}:${options.query}:${options.perPage ?? 15}:${options.orientation ?? ''}:${options.size ?? ''}:${options.color ?? ''}`;

  // Auto-execute search when options change
  React.useEffect(() => {
    const enabled = options.enabled !== false;
    if (!enabled || !options.query.trim()) {
      setState(initialState<T>);
      return;
    }

    const currentRequestId = ++requestIdRef.current;

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      items: [],
      currentPage: 0,
      hasNextPage: false,
      totalResults: undefined,
    }));

    executeSearch(client, options, 1)
      .then((result) => {
        if (!mountedRef.current || requestIdRef.current !== currentRequestId) return;

        setState({
          items: result.items as T[],
          loading: false,
          loadingMore: false,
          error: null,
          hasNextPage: result.hasNextPage,
          currentPage: 1,
          totalResults: result.totalResults,
        });
      })
      .catch((err: unknown) => {
        if (!mountedRef.current || requestIdRef.current !== currentRequestId) return;

        setState((prev) => ({
          ...prev,
          loading: false,
          loadingMore: false,
          error: err instanceof Error ? err : new Error(String(err)),
        }));
      });
  }, [optionsKey, client]);

  const loadMore = React.useCallback(() => {
    if (state.loadingMore || state.loading || !state.hasNextPage) return;

    const nextPage = state.currentPage + 1;
    const currentRequestId = ++requestIdRef.current;

    setState((prev) => ({ ...prev, loadingMore: true, error: null }));

    executeSearch(client, options, nextPage)
      .then((result) => {
        if (!mountedRef.current || requestIdRef.current !== currentRequestId) return;

        setState((prev) => ({
          ...prev,
          items: [...prev.items, ...(result.items as T[])],
          loadingMore: false,
          hasNextPage: result.hasNextPage,
          currentPage: nextPage,
          totalResults: result.totalResults,
        }));
      })
      .catch((err: unknown) => {
        if (!mountedRef.current || requestIdRef.current !== currentRequestId) return;

        setState((prev) => ({
          ...prev,
          loadingMore: false,
          error: err instanceof Error ? err : new Error(String(err)),
        }));
      });
  }, [state.loadingMore, state.loading, state.hasNextPage, state.currentPage, client, options]);

  const refresh = React.useCallback(() => {
    if (!options.query.trim()) return;

    const currentRequestId = ++requestIdRef.current;

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      items: [],
      currentPage: 0,
      hasNextPage: false,
      totalResults: undefined,
    }));

    executeSearch(client, options, 1)
      .then((result) => {
        if (!mountedRef.current || requestIdRef.current !== currentRequestId) return;

        setState({
          items: result.items as T[],
          loading: false,
          loadingMore: false,
          error: null,
          hasNextPage: result.hasNextPage,
          currentPage: 1,
          totalResults: result.totalResults,
        });
      })
      .catch((err: unknown) => {
        if (!mountedRef.current || requestIdRef.current !== currentRequestId) return;

        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        }));
      });
  }, [client, options]);

  return {
    items: state.items,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    hasNextPage: state.hasNextPage,
    loadMore,
    refresh,
    totalResults: state.totalResults,
  };
}

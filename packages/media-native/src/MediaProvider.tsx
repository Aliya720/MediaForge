/**
 * MediaProvider Context
 *
 * Provides a MediaForgeClient instance to React Native component trees.
 * The provider accepts an already-created client — it never creates API keys,
 * reads environment variables, or calls Pexels directly.
 *
 * INVARIANT: Does NOT import react-native. This is pure React context.
 */

import React, { createContext, type ReactNode } from 'react';
import type { MediaForgeClient } from '@mediaforge/media-core';

export const MediaContext = createContext<MediaForgeClient | null>(null);

export interface MediaProviderProps {
  /** A pre-configured MediaForgeClient instance from @mediaforge/media-core */
  client: MediaForgeClient;
  children: ReactNode;
}

/**
 * MediaProvider — wraps React Native component tree with media client context.
 */
export function MediaProvider({ client, children }: MediaProviderProps) {
  return (
    <MediaContext.Provider value={client}>
      {children}
    </MediaContext.Provider>
  );
}

/**
 * useMediaClient — retrieves the MediaForgeClient from context.
 *
 * Must be called inside a <MediaProvider>.
 * Throws a descriptive error if called outside the provider boundary.
 */
export function useMediaClient(): MediaForgeClient {
  const client = React.useContext(MediaContext);
  if (!client) {
    throw new Error(
      '[MediaForge] useMediaClient must be used within a <MediaProvider>. ' +
      'Wrap your component tree with <MediaProvider client={client}>.'
    );
  }
  return client;
}

/**
 * MediaProvider Context & Hook for React Web
 *
 * Provides a MediaForgeClient instance to React component trees.
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
 * MediaProvider — wraps React component tree with media client context.
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

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createMediaClient, MediaForgeClient } from '@mediaforge/media-core';
import { MediaProvider, useMediaClient } from '../src/index.js';

describe('MediaProvider & useMediaClient', () => {
  it('provides client through context to consumer hooks', () => {
    const mockClient = createMediaClient({ apiKey: 'test-key', fetchFn: vi.fn() });
    let capturedClient: MediaForgeClient | null = null;

    function TestConsumer() {
      capturedClient = useMediaClient();
      return <div>Consumed</div>;
    }

    renderToString(
      <MediaProvider client={mockClient}>
        <TestConsumer />
      </MediaProvider>
    );

    expect(capturedClient).toBe(mockClient);
  });

  it('throws descriptive error when useMediaClient is called outside MediaProvider', () => {
    function FaultyConsumer() {
      useMediaClient();
      return null;
    }

    expect(() => {
      renderToString(<FaultyConsumer />);
    }).toThrow('[MediaForge] useMediaClient must be used within a <MediaProvider>');
  });
});

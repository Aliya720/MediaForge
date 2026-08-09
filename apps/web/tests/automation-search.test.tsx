import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { createMediaClient } from '@mediaforge/media-core';
import { MediaProvider } from '@mediaforge/media-react';
import { App } from '../src/App.js';

const mockPexelsPhotoNature = {
  id: 101,
  width: 1920,
  height: 1080,
  url: 'https://pexels.com/photo/101',
  photographer: 'Alice Nature',
  photographer_url: 'https://pexels.com/@alice',
  photographer_id: 901,
  avg_color: '#2e7d32',
  src: {
    original: 'https://images.pexels.com/101.jpg',
    large2x: 'https://images.pexels.com/101.jpg',
    large: 'https://images.pexels.com/101.jpg',
    medium: 'https://images.pexels.com/101.jpg',
    small: 'https://images.pexels.com/101.jpg',
    portrait: 'https://images.pexels.com/101.jpg',
    landscape: 'https://images.pexels.com/101.jpg',
    tiny: 'https://images.pexels.com/101.jpg',
  },
  liked: false,
  alt: 'Lush Green Mountain Nature',
};

const mockPexelsPhotoTech = {
  id: 102,
  width: 1920,
  height: 1080,
  url: 'https://pexels.com/photo/102',
  photographer: 'Bob Tech',
  photographer_url: 'https://pexels.com/@bob',
  photographer_id: 902,
  avg_color: '#0284c7',
  src: {
    original: 'https://images.pexels.com/102.jpg',
    large2x: 'https://images.pexels.com/102.jpg',
    large: 'https://images.pexels.com/102.jpg',
    medium: 'https://images.pexels.com/102.jpg',
    small: 'https://images.pexels.com/102.jpg',
    portrait: 'https://images.pexels.com/102.jpg',
    landscape: 'https://images.pexels.com/102.jpg',
    tiny: 'https://images.pexels.com/102.jpg',
  },
  liked: false,
  alt: 'Futuristic Quantum Computer Tech',
};

const mockPexelsVideoOcean = {
  id: 201,
  width: 1920,
  height: 1080,
  url: 'https://pexels.com/video/201',
  image: 'https://images.pexels.com/video201.jpg',
  duration: 25,
  user: { id: 903, name: 'Charlie Ocean', url: 'https://pexels.com/@charlie' },
  video_files: [
    { id: 1, quality: 'hd', file_type: 'video/mp4', width: 1920, height: 1080, link: 'https://videos.pexels.com/201.mp4' },
  ],
  video_pictures: [
    { id: 1, picture: 'https://images.pexels.com/video201.jpg', nr: 0 },
  ],
};

describe('Automated Multi-Search & Interaction Testing', () => {
  afterEach(() => {
    cleanup();
  });

  function setupMockedClient() {
    const fetchFn = vi.fn(async (url: string) => {
      if (url.includes('/v1/search') && url.includes('query=nature')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ page: 1, per_page: 15, total_results: 2, photos: [mockPexelsPhotoNature, mockPexelsPhotoTech] }),
        };
      }
      if (url.includes('/v1/search') && url.includes('query=technology')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ page: 1, per_page: 15, total_results: 1, photos: [mockPexelsPhotoTech] }),
        };
      }
      if (url.includes('/videos/search') && url.includes('query=ocean')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ page: 1, per_page: 15, total_results: 1, videos: [mockPexelsVideoOcean] }),
        };
      }
      if (url.includes('/v1/curated')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ page: 1, per_page: 15, total_results: 2, photos: [mockPexelsPhotoNature, mockPexelsPhotoTech] }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ page: 1, per_page: 15, total_results: 0, photos: [], videos: [] }),
      };
    });

    const mockClient = createMediaClient({ apiKey: 'test-key', fetchFn: fetchFn as any });
    return { mockClient, fetchFn };
  }

  it('automates search for "nature" photos and renders PhotoMedia card', async () => {
    const { mockClient } = setupMockedClient();
    render(
      <MediaProvider client={mockClient}>
        <App />
      </MediaProvider>
    );

    const searchInput = screen.getByPlaceholderText(/Search photos/i);
    fireEvent.change(searchInput, { target: { value: 'nature' } });
    fireEvent.submit(searchInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Results for "nature"/i)).toBeInTheDocument();
      expect(screen.getByText('Lush Green Mountain Nature')).toBeInTheDocument();
      expect(screen.getByText('By Alice Nature')).toBeInTheDocument();
    });
  });

  it('automates search for "technology" photos and renders PhotoMedia card', async () => {
    const { mockClient } = setupMockedClient();
    render(
      <MediaProvider client={mockClient}>
        <App />
      </MediaProvider>
    );

    const searchInput = screen.getByPlaceholderText(/Search photos/i);
    fireEvent.change(searchInput, { target: { value: 'technology' } });
    fireEvent.submit(searchInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Results for "technology"/i)).toBeInTheDocument();
      expect(screen.getByText('Futuristic Quantum Computer Tech')).toBeInTheDocument();
      expect(screen.getByText('By Bob Tech')).toBeInTheDocument();
    });
  });

  it('automates switching to Videos tab and searching "ocean" video', async () => {
    const { mockClient } = setupMockedClient();
    render(
      <MediaProvider client={mockClient}>
        <App />
      </MediaProvider>
    );

    // Switch to Videos
    const videoTab = screen.getByRole('tab', { name: 'Videos' });
    fireEvent.click(videoTab);

    const searchInput = screen.getByPlaceholderText(/Search photos/i);
    fireEvent.change(searchInput, { target: { value: 'ocean' } });
    fireEvent.submit(searchInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Results for "ocean"/i)).toBeInTheDocument();
      expect(screen.getByText('25s')).toBeInTheDocument(); // Duration badge
      expect(screen.getByText('By Charlie Ocean')).toBeInTheDocument();
    });
  });

  it('opens Detail View on card click and emits telemetry event', async () => {
    const { mockClient } = setupMockedClient();
    const eventSpy = vi.fn();
    mockClient.events.subscribe('view', eventSpy);

    render(
      <MediaProvider client={mockClient}>
        <App />
      </MediaProvider>
    );

    const searchInput = screen.getByPlaceholderText(/Search photos/i);
    fireEvent.change(searchInput, { target: { value: 'nature' } });
    fireEvent.submit(searchInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Lush Green Mountain Nature')).toBeInTheDocument();
    });

    const card = screen.getByText('Lush Green Mountain Nature').closest('article')!;
    fireEvent.click(card);

    // Detail View page appears
    await waitFor(() => {
      expect(screen.getByLabelText('Media Item Detail View')).toBeInTheDocument();
      expect(screen.getByText('Alice Nature')).toBeInTheDocument();
      expect(screen.getByText('↓ Download Original')).toBeInTheDocument();
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'view', mediaId: '101', mediaType: 'photo' })
      );
    });
  });

  it('supports ArrowRight, ArrowLeft, and Escape keyboard navigation on DetailView hero stage', async () => {
    const { mockClient } = setupMockedClient();
    render(
      <MediaProvider client={mockClient}>
        <App />
      </MediaProvider>
    );

    const searchInput = screen.getByPlaceholderText(/Search photos/i);
    fireEvent.change(searchInput, { target: { value: 'nature' } });
    fireEvent.submit(searchInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Lush Green Mountain Nature')).toBeInTheDocument();
    });

    // Click first card to enter DetailView
    const card = screen.getByText('Lush Green Mountain Nature').closest('article')!;
    fireEvent.click(card);

    await waitFor(() => {
      expect(screen.getByLabelText('View next media item')).toBeInTheDocument();
    });

    // Press ArrowRight to navigate to next item
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    await waitFor(() => {
      expect(screen.getByText('Bob Tech')).toBeInTheDocument();
    });

    // Press ArrowLeft to navigate back to previous item
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    await waitFor(() => {
      expect(screen.getByText('Alice Nature')).toBeInTheDocument();
    });

    // Press Escape to return to results view
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.getByText(/Results for "nature"/i)).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { createMediaClient } from '@mediaforge/media-core';
import { MediaProvider } from '@mediaforge/media-react';
import { App } from '../src/App.js';

describe('Web App Architectural Composition', () => {
  afterEach(() => {
    cleanup();
  });

  function renderApp() {
    const mockClient = createMediaClient({ apiKey: 'test-key', fetchFn: vi.fn() });
    return render(
      <MediaProvider client={mockClient}>
        <App />
      </MediaProvider>
    );
  }

  it('renders landing page with centered search input and media type toggle', () => {
    renderApp();

    expect(screen.getByText('⚡ MediaForge')).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByText(/Discover. Explore. Inspire./i)).toBeInTheDocument();
  });

  it('allows user to switch media type between Photos and Videos on landing view', () => {
    renderApp();

    const videoTab = screen.getByRole('tab', { name: 'Videos' });
    fireEvent.click(videoTab);

    expect(videoTab).toHaveAttribute('aria-selected', 'true');
  });

  it('submits search query on form submit and transitions to results gallery', () => {
    renderApp();

    const searchInput = screen.getByPlaceholderText(/Search photos/i);
    fireEvent.change(searchInput, { target: { value: 'ocean' } });
    fireEvent.submit(searchInput.closest('form')!);

    expect(screen.getByText(/Results for "ocean"/i)).toBeInTheDocument();
    expect(screen.getByText(/Media provided by/i)).toBeInTheDocument();
  });

  it('resets search query and returns home when clicking logo branding', () => {
    renderApp();

    const searchInput = screen.getByPlaceholderText(/Search photos/i);
    fireEvent.change(searchInput, { target: { value: 'nature' } });
    fireEvent.submit(searchInput.closest('form')!);

    const logo = screen.getByText('⚡ MediaForge');
    fireEvent.click(logo);

    expect(screen.getByText(/Discover. Explore. Inspire./i)).toBeInTheDocument();
  });
});

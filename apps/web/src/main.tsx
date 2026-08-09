import React from 'react';
import ReactDOM from 'react-dom/client';
import { createMediaClient } from '@mediaforge/media-core';
import { MediaProvider } from '@mediaforge/media-react';

import { App } from './App.js';
import './styles/app.css';

// Read API key from environment variable (with fallback demo key notice)
const apiKey = import.meta.env.VITE_PEXELS_API_KEY || 'DEMO_PEXELS_API_KEY';

// Instantiate stable MediaForge client instance at application boundary
const client = createMediaClient({
  apiKey,
  enableConsoleEvents: true,
  cache: {
    enabled: true,
    ttlMs: 5 * 60 * 1000, // 5 minutes
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MediaProvider client={client}>
      <App />
    </MediaProvider>
  </React.StrictMode>
);

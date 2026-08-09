/**
 * MediaForge Event System Types
 */

import { MediaType } from './domain.js';

export interface ViewEvent {
  type: 'view';
  mediaId: string;
  mediaType: MediaType;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface DownloadEvent {
  type: 'download';
  mediaId: string;
  mediaType: MediaType;
  downloadUrl: string;
  timestamp: number;
}

export interface MediaEventMap {
  view: ViewEvent;
  download: DownloadEvent;
}

export type MediaEventType = keyof MediaEventMap;
export type EventListener<K extends MediaEventType> = (event: MediaEventMap[K]) => void;
export type UnsubscribeFunction = () => void;

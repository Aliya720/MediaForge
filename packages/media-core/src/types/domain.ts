/**
 * MediaForge Domain Models
 * Framework-agnostic, normalized domain representations of Pexels media.
 */

export type MediaType = 'photo' | 'video';

export interface AuthorInfo {
  name: string;
  url: string;
  id?: number;
}

export interface BaseMedia {
  id: string;
  type: MediaType;
  width: number;
  height: number;
  url: string;
  alt: string;
  author: AuthorInfo;
}

export interface PhotoSizeMap {
  original: string;
  large2x: string;
  large: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
}

export interface PhotoMedia extends BaseMedia {
  type: 'photo';
  src: PhotoSizeMap;
  avgColor?: string;
}

export type VideoQuality = 'hd' | 'sd' | 'uhd' | 'hls';

export interface VideoFile {
  id: number;
  quality: string;
  fileType: string;
  width: number | null;
  height: number | null;
  fps: number | null;
  link: string;
}

export interface VideoPicture {
  id: number;
  picture: string;
  nr: number;
}

export interface VideoMedia extends BaseMedia {
  type: 'video';
  duration: number;
  previewImage: string;
  videoFiles: VideoFile[];
  videoPictures: VideoPicture[];
}

export type Media = PhotoMedia | VideoMedia;

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  perPage: number;
  totalResults?: number;
  hasNextPage: boolean;
}

/**
 * Raw Pexels API Data Transfer Objects (DTOs)
 * Internal shapes matching Pexels HTTP REST API responses.
 * Ref: https://www.pexels.com/api/documentation/
 */

export interface PexelsPhotoSrc {
  original: string;
  large2x: string;
  large: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
}

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color?: string;
  src: PexelsPhotoSrc;
  alt?: string;
  liked?: boolean;
}

export interface PexelsPhotosResponse {
  page: number;
  per_page: number;
  total_results: number;
  url?: string;
  next_page?: string;
  prev_page?: string;
  photos: PexelsPhoto[];
}

export interface PexelsVideoUser {
  id: number;
  name: string;
  url: string;
}

export interface PexelsVideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number | null;
  height: number | null;
  fps: number | null;
  link: string;
}

export interface PexelsVideoPicture {
  id: number;
  picture: string;
  nr: number;
}

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: PexelsVideoUser;
  video_files: PexelsVideoFile[];
  video_pictures: PexelsVideoPicture[];
}

export interface PexelsVideosResponse {
  page: number;
  per_page: number;
  total_results?: number;
  url?: string;
  next_page?: string;
  prev_page?: string;
  videos: PexelsVideo[];
}

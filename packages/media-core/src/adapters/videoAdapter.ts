/**
 * Video Adapter: Converts raw PexelsVideo DTO into normalized VideoMedia domain model.
 */

import { PexelsVideo } from '../types/pexels.js';
import { VideoMedia, VideoFile, VideoPicture } from '../types/domain.js';

export function mapPexelsVideoToDomain(dto: PexelsVideo): VideoMedia {
  const videoFiles: VideoFile[] = (dto.video_files || []).map((f) => ({
    id: f.id,
    quality: f.quality,
    fileType: f.file_type,
    width: f.width,
    height: f.height,
    fps: f.fps,
    link: f.link,
  }));

  const videoPictures: VideoPicture[] = (dto.video_pictures || []).map((p) => ({
    id: p.id,
    picture: p.picture,
    nr: p.nr,
  }));

  return {
    id: String(dto.id),
    type: 'video',
    width: dto.width,
    height: dto.height,
    url: dto.url,
    alt: `Video by ${dto.user?.name || 'Pexels Author'}`,
    author: {
      name: dto.user?.name || 'Unknown',
      url: dto.user?.url || '',
      id: dto.user?.id,
    },
    duration: dto.duration,
    previewImage: dto.image,
    videoFiles,
    videoPictures,
  };
}

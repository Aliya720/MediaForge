/**
 * Photo Adapter: Converts raw PexelsPhoto DTO into normalized PhotoMedia domain model.
 */

import { PexelsPhoto } from '../types/pexels.js';
import { PhotoMedia } from '../types/domain.js';

export function mapPexelsPhotoToDomain(dto: PexelsPhoto): PhotoMedia {
  return {
    id: String(dto.id),
    type: 'photo',
    width: dto.width,
    height: dto.height,
    url: dto.url,
    alt: dto.alt || '',
    author: {
      name: dto.photographer,
      url: dto.photographer_url,
      id: dto.photographer_id,
    },
    src: {
      original: dto.src.original,
      large2x: dto.src.large2x,
      large: dto.src.large,
      medium: dto.src.medium,
      small: dto.src.small,
      portrait: dto.src.portrait,
      landscape: dto.src.landscape,
      tiny: dto.src.tiny,
    },
    avgColor: dto.avg_color,
  };
}

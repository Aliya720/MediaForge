import { MediaType } from '@mediaforge/media-core';

export interface TypeToggleProps {
  currentType: MediaType;
  onTypeChange: (type: MediaType) => void;
}

export function TypeToggle({ currentType, onTypeChange }: TypeToggleProps) {
  return (
    <div className="mf-type-toggle" role="tablist" aria-label="Media type selection">
      <button
        type="button"
        role="tab"
        aria-selected={currentType === 'photo'}
        className={`mf-type-btn ${currentType === 'photo' ? 'active' : ''}`}
        onClick={() => onTypeChange('photo')}
      >
        Photos
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={currentType === 'video'}
        className={`mf-type-btn ${currentType === 'video' ? 'active' : ''}`}
        onClick={() => onTypeChange('video')}
      >
        Videos
      </button>
    </div>
  );
}

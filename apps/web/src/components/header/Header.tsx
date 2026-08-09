import { MediaType } from '@mediaforge/media-core';
import { SearchInput } from './SearchInput.js';
import { TypeToggle } from './TypeToggle.js';

export interface HeaderProps {
  searchQuery: string;
  mediaType: MediaType;
  onSearchSubmit: (query: string) => void;
  onMediaTypeChange: (type: MediaType) => void;
  onLogoClick: () => void;
}

export function Header({
  searchQuery,
  mediaType,
  onSearchSubmit,
  onMediaTypeChange,
  onLogoClick,
}: HeaderProps) {
  return (
    <header className="mf-header">
      <div className="mf-logo" onClick={onLogoClick} role="button" tabIndex={0} aria-label="MediaForge Home">
        ⚡ MediaForge
      </div>

      <SearchInput value={searchQuery} onSearchSubmit={onSearchSubmit} />

      <TypeToggle currentType={mediaType} onTypeChange={onMediaTypeChange} />
    </header>
  );
}

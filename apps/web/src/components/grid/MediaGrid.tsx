import { Media } from '@mediaforge/media-core';
import { useMediaGrid } from '@mediaforge/media-ui-react';
import { MediaCard } from './MediaCard.js';

export interface MediaGridProps {
  items: Media[];
  onItemSelect: (item: Media, index: number) => void;
  ariaLabel?: string;
}

export function MediaGrid({ items, onItemSelect, ariaLabel = 'Media Items Grid' }: MediaGridProps) {
  const { getGridProps, getItemProps } = useMediaGrid<Media>({
    items,
    getItemKey: (item) => item.id,
    onItemSelect,
    ariaLabel,
  });

  return (
    <section {...getGridProps({ className: 'mf-media-grid' })}>
      {items.map((item, index) => {
        const itemProps = getItemProps(item, index);
        const { key: _key, ...restProps } = itemProps as any;
        return (
          <MediaCard
            key={item.id}
            item={item}
            itemProps={restProps}
          />
        );
      })}
    </section>
  );
}

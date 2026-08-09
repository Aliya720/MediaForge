import React from 'react';

export interface SearchInputProps {
  value: string;
  onSearchSubmit: (query: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onSearchSubmit, placeholder = 'Search photos & videos...' }: SearchInputProps) {
  const [internalQuery, setInternalQuery] = React.useState(value);

  // Sync internal state if external value changes
  React.useEffect(() => {
    setInternalQuery(value);
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(internalQuery.trim());
  };

  return (
    <form className="mf-search-form" onSubmit={handleSubmit} role="search">
      <input
        type="search"
        className="mf-search-input"
        placeholder={placeholder}
        aria-label="Search media items"
        value={internalQuery}
        onChange={(e) => setInternalQuery(e.target.value)}
      />
    </form>
  );
}

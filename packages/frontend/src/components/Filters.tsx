import type { Tag, Shelf } from "@paperspine/shared";

interface Props {
  tags: Tag[];
  shelves: Shelf[];
  authors: string[];
  selectedTag: string;
  selectedShelf: string;
  selectedAuthor: string;
  onTagChange: (tag: string) => void;
  onShelfChange: (shelf: string) => void;
  onAuthorChange: (author: string) => void;
}

export function Filters({
  tags,
  shelves,
  authors,
  selectedTag,
  selectedShelf,
  selectedAuthor,
  onTagChange,
  onShelfChange,
  onAuthorChange,
}: Props) {
  return (
    <div className="filters">
      <select
        value={selectedTag}
        onChange={(e) => onTagChange(e.target.value)}
        aria-label="Filter by tag"
      >
        <option value="">All tags</option>
        {tags.map((t) => (
          <option key={t.name} value={t.name}>
            {t.name}
          </option>
        ))}
      </select>

      <select
        value={selectedShelf}
        onChange={(e) => onShelfChange(e.target.value)}
        aria-label="Filter by shelf"
      >
        <option value="">All shelves</option>
        {shelves.map((s) => (
          <option key={s.shelfId} value={s.shelfId}>
            {s.name}
          </option>
        ))}
      </select>

      <select
        value={selectedAuthor}
        onChange={(e) => onAuthorChange(e.target.value)}
        aria-label="Filter by author"
      >
        <option value="">All authors</option>
        {authors.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </div>
  );
}

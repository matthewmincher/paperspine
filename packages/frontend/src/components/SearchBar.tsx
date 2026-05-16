interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <input
      type="search"
      className="search-bar"
      placeholder="Search books by title or author..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

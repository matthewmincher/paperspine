import { useState, useMemo } from "react";
import type { Book } from "@paperspine/shared";
import { getBooks, getTags, getShelves } from "./api.js";
import { useApi } from "./hooks/useApi.js";
import { BookGrid } from "./components/BookGrid.js";
import { BookDetail } from "./components/BookDetail.js";
import { SearchBar } from "./components/SearchBar.js";
import { Filters } from "./components/Filters.js";

export function App() {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedShelf, setSelectedShelf] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const booksApi = useApi(() => getBooks(), []);
  const tagsApi = useApi(() => getTags(), []);
  const shelvesApi = useApi(() => getShelves(), []);

  const books = booksApi.data?.books ?? [];
  const tags = tagsApi.data?.tags ?? [];
  const shelves = shelvesApi.data?.shelves ?? [];

  const authors = useMemo(
    () => [...new Set(books.map((b) => b.author))].sort(),
    [books],
  );

  const filtered = useMemo(() => {
    let result = books;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q),
      );
    }
    if (selectedTag) {
      result = result.filter((b) => b.tags.some((t) => t.name === selectedTag));
    }
    if (selectedShelf) {
      result = result.filter((b) => b.shelfId === selectedShelf);
    }
    if (selectedAuthor) {
      result = result.filter((b) => b.author === selectedAuthor);
    }
    return result;
  }, [books, search, selectedTag, selectedShelf, selectedAuthor]);

  if (booksApi.loading) {
    return <div className="loading">Loading books...</div>;
  }

  if (booksApi.error) {
    return <div className="error">Failed to load books: {booksApi.error}</div>;
  }

  return (
    <div className="app">
      <header>
        <h1>Paperspine</h1>
      </header>
      <main>
        <SearchBar value={search} onChange={setSearch} />
        <Filters
          tags={tags}
          shelves={shelves}
          authors={authors}
          selectedTag={selectedTag}
          selectedShelf={selectedShelf}
          selectedAuthor={selectedAuthor}
          onTagChange={setSelectedTag}
          onShelfChange={setSelectedShelf}
          onAuthorChange={setSelectedAuthor}
        />
        <BookGrid books={filtered} onSelect={setSelectedBook} />
      </main>
      {selectedBook && (
        <BookDetail book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
}

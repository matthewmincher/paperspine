import { useState, useMemo } from "react";
import type { Book, Shelf } from "@paperspine/shared";
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

  const filterParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (search) params.q = search;
    if (selectedTag) params.tag = selectedTag;
    if (selectedShelf) params.shelf = selectedShelf;
    if (selectedAuthor) params.author = selectedAuthor;
    return params;
  }, [search, selectedTag, selectedShelf, selectedAuthor]);

  const booksApi = useApi(
    () => getBooks(Object.keys(filterParams).length ? filterParams : undefined),
    [search, selectedTag, selectedShelf, selectedAuthor],
  );
  const tagsApi = useApi(() => getTags(), []);
  const shelvesApi = useApi(() => getShelves(), []);

  const books = booksApi.data?.books ?? [];
  const tags = tagsApi.data?.tags ?? [];
  const shelves = shelvesApi.data?.shelves ?? [];

  const authors = useMemo(
    () => [...new Set(books.map((b) => b.author))].sort(),
    [books],
  );

  let content;
  if (booksApi.loading && !booksApi.data) {
    content = <div className="loading">Loading books...</div>;
  } else if (booksApi.error && !booksApi.data) {
    content = <div className="error">Failed to load books: {booksApi.error}</div>;
  } else {
    content = (
      <>
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
        <BookGrid books={books} onSelect={setSelectedBook} />
      </>
    );
  }

  return (
    <div className="app">
      <header>
        <img src="/logo.png" alt="Paperspine" className="header-logo" />
        <h1>Paperspine</h1>
      </header>
      <main>{content}</main>
      {selectedBook && (
        <BookDetail
          book={selectedBook}
          shelves={shelves}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
}

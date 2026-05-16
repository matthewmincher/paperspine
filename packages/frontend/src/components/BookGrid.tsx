import type { Book } from "@paperspine/shared";

interface Props {
  books: Book[];
  onSelect: (book: Book) => void;
}

export function BookGrid({ books, onSelect }: Props) {
  if (!books.length) {
    return <p className="empty-state">No books found.</p>;
  }

  return (
    <div className="book-grid">
      {books.map((book) => (
        <button
          key={book.bookId}
          className="book-card"
          onClick={() => onSelect(book)}
        >
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="book-cover" />
          ) : (
            <div className="book-cover book-cover-placeholder">
              <span>{book.title[0]}</span>
            </div>
          )}
          <div className="book-info">
            <span className="book-title">{book.title}</span>
            <span className="book-author">{book.author}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

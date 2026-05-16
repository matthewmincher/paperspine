import type { Book, Shelf } from "@paperspine/shared";
import { BookCover } from "./BookCover.js";

interface Props {
  book: Book;
  shelves: Shelf[];
  onClose: () => void;
}

export function BookDetail({ book, shelves, onClose }: Props) {
  const shelfName = shelves.find((s) => s.shelfId === book.shelfId)?.name ?? book.shelfId;

  return (
    <div className="book-detail-overlay" onClick={onClose}>
      <div className="book-detail" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>
        <div className="book-detail-content">
          <BookCover book={book} className="detail-cover" />
          <div className="detail-info">
            <h2>{book.title}</h2>
            <p className="detail-author">{book.author}</p>
            {book.isbn && <p className="detail-meta">ISBN: {book.isbn}</p>}
            {book.description && <p className="detail-desc">{book.description}</p>}
            {book.tags.length > 0 && (
              <div className="detail-tags">
                {book.tags.map((tag) => (
                  <span key={tag.name} className="tag">
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
            <p className="detail-meta">Shelf: {shelfName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

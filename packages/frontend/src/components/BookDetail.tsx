import type { Book } from "@paperspine/shared";

interface Props {
  book: Book;
  onClose: () => void;
}

export function BookDetail({ book, onClose }: Props) {
  return (
    <div className="book-detail-overlay" onClick={onClose}>
      <div className="book-detail" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>
        <div className="book-detail-content">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="detail-cover" />
          ) : (
            <div className="detail-cover book-cover-placeholder">
              <span>{book.title[0]}</span>
            </div>
          )}
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
            <p className="detail-meta">Shelf: {book.shelfId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

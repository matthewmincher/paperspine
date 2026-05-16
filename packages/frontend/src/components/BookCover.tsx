import type { Book } from "@paperspine/shared";

interface Props {
  book: Book;
  className?: string;
}

export function BookCover({ book, className = "book-cover" }: Props) {
  if (book.coverUrl) {
    return <img src={book.coverUrl} alt={book.title} className={className} />;
  }

  return (
    <div className={`${className} book-cover-placeholder`}>
      <span>{book.title[0]}</span>
    </div>
  );
}

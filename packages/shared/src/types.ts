export interface Book {
  bookId: string;
  title: string;
  author: string;
  isbn?: string;
  coverUrl?: string;
  description?: string;
  tags: Tag[];
  shelfId: string;
  createdAt: string;
}

export interface Shelf {
  shelfId: string;
  name: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Tag {
  name: string;
  category: "genre" | "theme" | "mood" | "other";
}

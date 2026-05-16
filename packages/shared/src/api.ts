import type { Book, Shelf, Tag } from "./types.js";

export interface ListBooksResponse {
  books: Book[];
}

export interface GetBookResponse {
  book: Book;
}

export interface ListTagsResponse {
  tags: Tag[];
}

export interface ListShelvesResponse {
  shelves: Shelf[];
}

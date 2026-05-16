import type { ExtractedBook } from "./vision.js";
import { lookupBook } from "./openlibrary.js";
import { generateTags } from "./tagging.js";
import type { Tag } from "@paperspine/shared";

export interface EnrichedBook {
  title: string;
  author: string;
  confidence: "high" | "medium" | "low";
  isbn?: string;
  coverUrl?: string;
  description?: string;
  tags: Tag[];
}

export async function enrichBooks(
  extracted: ExtractedBook[],
): Promise<EnrichedBook[]> {
  return Promise.all(extracted.map(enrichSingle));
}

async function enrichSingle(book: ExtractedBook): Promise<EnrichedBook> {
  const olResult = await lookupBook(book.title, book.author).catch(
    () => ({ isbn: undefined, coverUrl: undefined, description: undefined, subjects: undefined }),
  );

  const tags = await generateTags(
    book.title,
    book.author,
    olResult.description,
    olResult.subjects,
  ).catch(() => []);

  return {
    ...book,
    isbn: olResult.isbn,
    coverUrl: olResult.coverUrl,
    description: olResult.description,
    tags,
  };
}

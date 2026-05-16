export interface OpenLibraryResult {
  isbn?: string;
  coverUrl?: string;
  description?: string;
  subjects?: string[];
}

export async function lookupBook(
  title: string,
  author: string,
): Promise<OpenLibraryResult> {
  const query = encodeURIComponent(`${title} ${author}`);
  const url = `https://openlibrary.org/search.json?q=${query}&limit=1&fields=isbn,cover_i,subject,first_sentence,key`;

  const res = await fetch(url);
  if (!res.ok) return {};

  const data = await res.json();
  const doc = data.docs?.[0];
  if (!doc) return {};

  const isbn = doc.isbn?.[0];
  const coverUrl = doc.cover_i
    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
    : undefined;
  const description =
    typeof doc.first_sentence === "string"
      ? doc.first_sentence
      : doc.first_sentence?.value ?? undefined;
  const subjects: string[] = doc.subject?.slice(0, 10) ?? [];

  return { isbn, coverUrl, description, subjects };
}

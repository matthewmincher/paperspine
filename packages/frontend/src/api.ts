import type {
  ListBooksResponse,
  GetBookResponse,
  ListTagsResponse,
  ListShelvesResponse,
} from "@paperspine/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function getBooks(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchJson<ListBooksResponse>(`/books${qs}`);
}

export function getBook(id: string) {
  return fetchJson<GetBookResponse>(`/books/${id}`);
}

export function getTags() {
  return fetchJson<ListTagsResponse>("/tags");
}

export function getShelves() {
  return fetchJson<ListShelvesResponse>("/shelves");
}

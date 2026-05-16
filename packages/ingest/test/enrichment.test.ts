import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

vi.mock("../src/services/openlibrary.js", () => ({
  lookupBook: vi.fn().mockResolvedValue({
    isbn: "9780441172719",
    coverUrl: "https://covers.openlibrary.org/b/id/12345-M.jpg",
    description: "A science fiction novel.",
    subjects: ["Science Fiction", "Space Opera"],
  }),
}));

describe("enrichBooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify([
            { name: "science fiction", category: "genre" },
            { name: "political intrigue", category: "theme" },
          ]),
        },
      ],
    });
  });

  it("enriches extracted books with Open Library data and tags", async () => {
    const { enrichBooks } = await import("../src/services/enrichment.js");
    const result = await enrichBooks([
      { title: "Dune", author: "Frank Herbert", confidence: "high" },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].isbn).toBe("9780441172719");
    expect(result[0].coverUrl).toContain("openlibrary.org");
    expect(result[0].tags).toHaveLength(2);
    expect(result[0].tags[0].name).toBe("science fiction");
  });

  it("handles Open Library failures gracefully", async () => {
    const { lookupBook } = await import("../src/services/openlibrary.js");
    vi.mocked(lookupBook).mockRejectedValueOnce(new Error("Network error"));

    const { enrichBooks } = await import("../src/services/enrichment.js");
    const result = await enrichBooks([
      { title: "Unknown Book", author: "Unknown Author", confidence: "low" },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].isbn).toBeUndefined();
    expect(result[0].tags).toHaveLength(2);
  });
});

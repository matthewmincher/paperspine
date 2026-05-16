import { describe, it, expect, vi } from "vitest";

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

describe("extractBooksFromImage", () => {
  it("extracts books from an image buffer", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: JSON.stringify([
            { title: "Dune", author: "Frank Herbert", confidence: "high" },
            { title: "Neuromancer", author: "William Gibson", confidence: "medium" },
          ]),
        },
      ],
    });

    const { extractBooksFromImage } = await import("../src/services/vision.js");
    const buffer = Buffer.from("fake-image-data");
    const result = await extractBooksFromImage(buffer, "image/jpeg");

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      title: "Dune",
      author: "Frank Herbert",
      confidence: "high",
    });
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("returns empty array when response has no text content", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "tool_use", id: "x", name: "y", input: {} }],
    });

    const { extractBooksFromImage } = await import("../src/services/vision.js");
    const buffer = Buffer.from("fake-image-data");
    const result = await extractBooksFromImage(buffer, "image/jpeg");

    expect(result).toEqual([]);
  });

  it("handles JSON wrapped in markdown code fences", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: '```json\n[{"title": "1984", "author": "George Orwell", "confidence": "high"}]\n```',
        },
      ],
    });

    const { extractBooksFromImage } = await import("../src/services/vision.js");
    const buffer = Buffer.from("fake-image-data");
    const result = await extractBooksFromImage(buffer, "image/png");

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("1984");
  });
});

import { promptJson } from "./llm.js";

export interface ExtractedBook {
  title: string;
  author: string;
  confidence: "high" | "medium" | "low";
}

export async function extractBooksFromImage(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<ExtractedBook[]> {
  const base64 = imageBuffer.toString("base64");
  const mediaType = mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const result = await promptJson<ExtractedBook[]>("claude-sonnet-4-20250514", [
    {
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: base64 },
        },
        {
          type: "text",
          text: `Analyze this bookshelf photo and extract every visible book. For each book, provide the title, author, and your confidence level (high/medium/low) in the identification.

Return ONLY valid JSON in this exact format, with no additional text:
[{"title": "...", "author": "...", "confidence": "high|medium|low"}]

If no books are visible, return an empty array: []`,
        },
      ],
    },
  ]);

  return result ?? [];
}

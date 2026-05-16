import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

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

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
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
    ],
  });

  const text = response.content[0];
  if (text.type !== "text") return [];

  try {
    return JSON.parse(text.text);
  } catch {
    const match = text.text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return [];
  }
}

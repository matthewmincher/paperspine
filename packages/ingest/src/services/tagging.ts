import Anthropic from "@anthropic-ai/sdk";
import type { Tag } from "@paperspine/shared";

const anthropic = new Anthropic();

export async function generateTags(
  title: string,
  author: string,
  description?: string,
  subjects?: string[],
): Promise<Tag[]> {
  const context = [
    `Title: ${title}`,
    `Author: ${author}`,
    description && `Description: ${description}`,
    subjects?.length && `Subjects: ${subjects.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Given this book metadata, generate 3-6 normalised tags. Each tag should have a "name" (lowercase, 1-3 words) and a "category" (one of: genre, theme, mood, other).

${context}

Return ONLY valid JSON array, no other text:
[{"name": "...", "category": "genre|theme|mood|other"}]`,
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

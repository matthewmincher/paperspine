import type { Tag } from "@paperspine/shared";
import { promptJson } from "./llm.js";

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

  const result = await promptJson<Tag[]>(
    "claude-haiku-4-5-20251001",
    [
      {
        role: "user",
        content: `Given this book metadata, generate 3-6 normalised tags. Each tag should have a "name" (lowercase, 1-3 words) and a "category" (one of: genre, theme, mood, other).

${context}

Return ONLY valid JSON array, no other text:
[{"name": "...", "category": "genre|theme|mood|other"}]`,
      },
    ],
    1024,
  );

  return result ?? [];
}

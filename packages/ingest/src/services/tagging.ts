import type { Tag } from "@paperspine/shared";
import { promptJson } from "./llm.js";

export async function generateTags(
  title: string,
  author: string,
  description?: string,
  subjects?: string[],
  existingTags?: string[],
): Promise<Tag[]> {
  const context = [
    `Title: ${title}`,
    `Author: ${author}`,
    description && `Description: ${description}`,
    subjects?.length && `Subjects: ${subjects.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const existingGenres = existingTags?.length
    ? `\nExisting genre tags (reuse when they fit): ${existingTags.join(", ")}`
    : "";

  const result = await promptJson<Tag[]>(
    "claude-haiku-4-5-20251001",
    [
      {
        role: "user",
        content: `Given this book metadata, generate exactly 3 tags:
1. One "genre" tag (broad, e.g. "science fiction", "literary fiction", "non-fiction", "fantasy", "thriller")
2. One "theme" tag (the main subject matter, e.g. "espionage", "identity", "technology", "survival", "politics")
3. One "mood" tag (the reading experience, e.g. "dark", "reflective", "adventurous", "humorous", "tense")

Each tag should have a "name" (lowercase, 1-2 words) and a "category".
For genre, prefer reusing an existing tag if it fits. For theme and mood, pick what best describes THIS book.
${existingGenres}

${context}

Return ONLY valid JSON array, no other text:
[{"name": "...", "category": "genre|theme|mood"}]`,
      },
    ],
    1024,
  );

  return result ?? [];
}

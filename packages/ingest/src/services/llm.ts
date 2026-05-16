import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages.js";

export const anthropic = new Anthropic();

export async function promptJson<T>(
  model: string,
  messages: MessageParam[],
  maxTokens = 4096,
): Promise<T | null> {
  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    messages,
  });

  const block = response.content[0];
  if (block.type !== "text") return null;

  try {
    return JSON.parse(block.text);
  } catch {
    const match = block.text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return null;
  }
}

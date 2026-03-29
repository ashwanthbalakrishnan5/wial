import type { Tables } from "@repo/types";

type ContentBlock = Tables<"content_blocks">;
export type ContentBlockMap = Map<string, ContentBlock>;

/** Get a content block's text content, or a fallback string. */
export function getBlock(
  blocks: ContentBlockMap,
  key: string,
  fallback = ""
): string {
  return blocks.get(key)?.content ?? fallback;
}

/** Parse a JSON-type content block into a typed object. Returns null if missing or invalid. */
export function getJsonBlock<T>(blocks: ContentBlockMap, key: string): T | null {
  const block = blocks.get(key);
  if (!block) return null;
  try {
    return JSON.parse(block.content) as T;
  } catch {
    return null;
  }
}

import type { Tables } from "@repo/types";
import { getSupabaseClient } from "./supabase";
import type { ContentBlockMap } from "./content";

export interface ChapterData {
  chapter: Tables<"chapters">;
  contentBlocks: ContentBlockMap;
  coaches: Tables<"coaches">[];
  testimonials: Tables<"testimonials">[];
  events: Tables<"events">[];
  clientOrganizations: Tables<"client_organizations">[];
  featuredCoaches: Tables<"coaches">[];
  featuredTestimonials: Tables<"testimonials">[];
}

// Cache per locale to avoid redundant fetches within a single build
const cacheByLocale = new Map<string, ChapterData>();
let chapterCache: Tables<"chapters"> | null = null;
let coachesCache: Tables<"coaches">[] | null = null;
let testimonialsCache: Tables<"testimonials">[] | null = null;
let eventsCache: Tables<"events">[] | null = null;
let clientOrgsCache: Tables<"client_organizations">[] | null = null;

/** Fetch all data for a chapter by slug, for a given locale. Memoized within a single build. */
export async function getChapterData(
  slug: string,
  locale?: string
): Promise<ChapterData> {
  const supabase = getSupabaseClient();

  // Fetch chapter once
  if (!chapterCache) {
    const { data: chapter, error: chapterError } = await supabase
      .from("chapters")
      .select("*")
      .eq("slug", slug)
      .single();

    if (chapterError || !chapter) {
      throw new Error(
        `Chapter not found for slug "${slug}": ${chapterError?.message ?? "no rows"}`
      );
    }

    if (chapter.status !== "active") {
      throw new Error(
        `Chapter "${slug}" has status "${chapter.status}" — only active chapters can be built`
      );
    }

    chapterCache = chapter;
  }

  const chapter = chapterCache;
  const resolvedLocale = locale ?? chapter.default_language;

  // Return cached if available
  const cached = cacheByLocale.get(resolvedLocale);
  if (cached) return cached;

  // Fetch content blocks for the requested locale, with fallback to default
  const { data: localeBlocks } = await supabase
    .from("content_blocks")
    .select("*")
    .eq("chapter_id", chapter.id)
    .eq("locale", resolvedLocale);

  const contentBlocks: ContentBlockMap = new Map();
  for (const block of localeBlocks ?? []) {
    contentBlocks.set(block.block_key, block);
  }

  // If not the default locale, fill missing blocks from default language
  if (resolvedLocale !== chapter.default_language) {
    const { data: defaultBlocks } = await supabase
      .from("content_blocks")
      .select("*")
      .eq("chapter_id", chapter.id)
      .eq("locale", chapter.default_language);

    for (const block of defaultBlocks ?? []) {
      if (!contentBlocks.has(block.block_key)) {
        contentBlocks.set(block.block_key, block);
      }
    }
  }

  // Fetch coaches once
  if (!coachesCache) {
    const { data: coaches } = await supabase
      .from("coaches")
      .select("*")
      .eq("chapter_id", chapter.id)
      .eq("is_active", true)
      .order("full_name");
    coachesCache = coaches ?? [];
  }

  // Fetch testimonials once
  if (!testimonialsCache) {
    const { data: testimonials } = await supabase
      .from("testimonials")
      .select("*")
      .eq("chapter_id", chapter.id)
      .eq("is_active", true)
      .order("sort_order");
    testimonialsCache = testimonials ?? [];
  }

  // Fetch published events once
  if (!eventsCache) {
    const { data: events } = await supabase
      .from("events")
      .select("*")
      .eq("chapter_id", chapter.id)
      .eq("is_published", true)
      .order("start_date", { ascending: true });
    eventsCache = events ?? [];
  }

  // Fetch active client organizations once
  if (!clientOrgsCache) {
    const { data: orgs } = await supabase
      .from("client_organizations")
      .select("*")
      .eq("chapter_id", chapter.id)
      .eq("is_active", true)
      .order("sort_order");
    clientOrgsCache = orgs ?? [];
  }

  const featuredCoaches = [...coachesCache]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 4);

  const featuredTestimonials = testimonialsCache.filter((t) => t.is_featured);

  const result: ChapterData = {
    chapter,
    contentBlocks,
    coaches: coachesCache,
    testimonials: testimonialsCache,
    events: eventsCache,
    clientOrganizations: clientOrgsCache,
    featuredCoaches,
    featuredTestimonials,
  };

  cacheByLocale.set(resolvedLocale, result);
  return result;
}

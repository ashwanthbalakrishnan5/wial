import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { Plus, FileText, Home, Info, BookOpen, Users, Quote, Phone, UserPlus, Navigation, Footprints, Calendar, Library } from "lucide-react";
import { cookies } from "next/headers";

const pageGroups: Record<string, { label: string; icon: React.ElementType }> = {
  hero: { label: "Landing Page", icon: Home },
  about: { label: "About Page", icon: Info },
  al: { label: "Action Learning Page", icon: BookOpen },
  cert: { label: "Certification", icon: BookOpen },
  coaches: { label: "Coach Directory", icon: Users },
  testimonials: { label: "Testimonials Page", icon: Quote },
  events: { label: "Events Page", icon: Calendar },
  resources: { label: "Resources Page", icon: Library },
  contact: { label: "Contact Page", icon: Phone },
  join: { label: "Membership Page", icon: UserPlus },
  nav: { label: "Header Navigation", icon: Navigation },
  footer: { label: "Footer", icon: Footprints },
};

function getPageGroup(blockKey: string): string {
  const prefix = blockKey.split("_")[0]!;
  return pageGroups[prefix]?.label ?? "Other";
}

function getPageIcon(group: string): React.ElementType {
  const entry = Object.values(pageGroups).find((v) => v.label === group);
  return entry?.icon ?? FileText;
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}) {
  const { locale: selectedLocale } = await searchParams;
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const isAdmin = isSuperAdmin(user.roles);
  const cookieStore = await cookies();
  const selectedChapterCookie = cookieStore.get("selected-chapter")?.value;
  const chapterId = isAdmin
    ? selectedChapterCookie || undefined
    : user.roles.find((r) => r.chapter_id)?.chapter_id ?? undefined;

  if (!chapterId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Content</h1>
        <p className="text-muted-foreground">
          Select a chapter to manage content.
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  // Fetch chapter for active languages
  const { data: chapter } = await supabase
    .from("chapters")
    .select("active_languages, default_language")
    .eq("id", chapterId)
    .single();

  const activeLanguages = chapter?.active_languages ?? ["en"];
  const currentLocale = selectedLocale || chapter?.default_language || "en";

  // Fetch blocks for the selected locale
  const { data: blocks } = await supabase
    .from("content_blocks")
    .select("*")
    .eq("chapter_id", chapterId)
    .eq("locale", currentLocale)
    .order("block_key");

  // If showing a non-default locale, also fetch default to find untranslated blocks
  let defaultBlocks: typeof blocks = null;
  if (currentLocale !== chapter?.default_language) {
    const { data } = await supabase
      .from("content_blocks")
      .select("*")
      .eq("chapter_id", chapterId)
      .eq("locale", chapter?.default_language ?? "en")
      .order("block_key");
    defaultBlocks = data;
  }

  // Build grouped map
  const grouped: Record<string, NonNullable<typeof blocks>> = {};
  for (const block of blocks ?? []) {
    const group = getPageGroup(block.block_key);
    if (!grouped[group]) grouped[group] = [];
    grouped[group]!.push(block);
  }

  // Find untranslated blocks (exist in default but not in current locale)
  const existingKeys = new Set((blocks ?? []).map((b) => b.block_key));
  const untranslated = (defaultBlocks ?? []).filter(
    (b) => !existingKeys.has(b.block_key)
  );
  const untranslatedGrouped: Record<string, NonNullable<typeof blocks>> = {};
  for (const block of untranslated) {
    const group = getPageGroup(block.block_key);
    if (!untranslatedGrouped[group]) untranslatedGrouped[group] = [];
    untranslatedGrouped[group]!.push(block);
  }

  // Get block counts per locale for the tab badges
  const { data: allBlocks } = await supabase
    .from("content_blocks")
    .select("locale")
    .eq("chapter_id", chapterId);

  const countByLocale: Record<string, number> = {};
  for (const b of allBlocks ?? []) {
    countByLocale[b.locale] = (countByLocale[b.locale] ?? 0) + 1;
  }
  const defaultCount = countByLocale[chapter?.default_language ?? "en"] ?? 0;

  const allGroups = new Set([
    ...Object.keys(grouped),
    ...Object.keys(untranslatedGrouped),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Content</h1>
          <p className="text-muted-foreground">
            Manage content blocks for your chapter website.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/content/new">
            <Plus className="mr-2 h-4 w-4" />
            New Block
          </Link>
        </Button>
      </div>

      {/* Locale tabs */}
      {activeLanguages.length > 1 && (
        <div className="flex items-center gap-1 border-b">
          {activeLanguages.map((lang: string) => {
            const isActive = lang === currentLocale;
            const count = countByLocale[lang] ?? 0;
            const missing = defaultCount - count;
            return (
              <Link
                key={lang}
                href={`/dashboard/content?locale=${lang}`}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang.toUpperCase()}
                {missing > 0 && lang !== chapter?.default_language && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {missing} untranslated
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {allGroups.size === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No content blocks yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first content block to start building your chapter
            website.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/content/new">
              <Plus className="mr-2 h-4 w-4" />
              New Block
            </Link>
          </Button>
        </div>
      ) : (
        [...allGroups].sort().map((group) => {
          const existingBlocks = grouped[group] ?? [];
          const missingBlocks = untranslatedGrouped[group] ?? [];
          return (
            <div key={group} className="space-y-3">
              {(() => { const Icon = getPageIcon(group); return (
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  {group}
                </h2>
              ); })()}
              <div className="grid gap-3 sm:grid-cols-2">
                {existingBlocks.map((block) => (
                  <Link
                    key={block.id}
                    href={`/dashboard/content/${block.id}`}
                  >
                    <Card className="transition-colors hover:border-primary/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {humanizeKey(block.block_key)}
                            </p>
                            <p className="line-clamp-1 text-sm text-muted-foreground">
                              {block.content_type === "rich_text"
                                ? block.content
                                    .replace(/<[^>]*>/g, "")
                                    .slice(0, 60)
                                : block.content.slice(0, 60)}
                              {block.content.length > 60 ? "..." : ""}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {block.content_type.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {block.locale.toUpperCase()} · Updated{" "}
                          {new Date(block.updated_at).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                {/* Untranslated block placeholders */}
                {missingBlocks.map((block) => (
                  <Card
                    key={`missing-${block.block_key}`}
                    className="border-dashed opacity-60"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {humanizeKey(block.block_key)}
                          </p>
                          <p className="text-sm text-muted-foreground italic">
                            Not yet created for {currentLocale.toUpperCase()}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/content/new?key=${block.block_key}&type=${block.content_type}&locale=${currentLocale}`}>
                            Create
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

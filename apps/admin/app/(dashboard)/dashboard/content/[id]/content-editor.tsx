"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Textarea } from "@repo/ui/textarea";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Badge } from "@repo/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { toast } from "sonner";
import { Loader2, Sparkles, Languages, ChevronRight, CheckCircle2, Replace, Trash2 } from "lucide-react";
import { TiptapEditor } from "@/components/tiptap-editor";
import { ResourcesEditor } from "@/components/resources-editor";
import type { Tables } from "@repo/types";

type ContentBlock = Tables<"content_blocks">;

function humanizeKey(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

const pageGroups: Record<string, string> = {
  hero: "Landing Page",
  about: "About Page",
  al: "Action Learning Page",
  cert: "Certification",
  coaches: "Coach Directory",
  testimonials: "Testimonials Page",
  events: "Events Page",
  resources: "Resources Page",
  contact: "Contact Page",
  join: "Membership Page",
  nav: "Header Navigation",
  footer: "Footer",
};

function getPageGroup(blockKey: string): string {
  const prefix = blockKey.split("_")[0]!;
  return pageGroups[prefix] ?? "Other";
}

const contentTypeOptions = [
  { value: "welcome", label: "Welcome / Hero text" },
  { value: "about", label: "About page" },
  { value: "coach_program", label: "Coach program description" },
  { value: "mission", label: "Mission statement" },
  { value: "join", label: "Join / Membership pitch" },
  { value: "custom", label: "Custom" },
];

export function ContentEditor({
  block,
  chapterId,
  activeLanguages,
}: {
  block: ContentBlock;
  chapterId: string;
  activeLanguages: string[];
}) {
  const router = useRouter();
  const [content, setContent] = useState(block.content);
  const [loading, setLoading] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonValid, setJsonValid] = useState(false);

  // Track unsaved changes
  const hasChanges = content !== block.content;

  // Warn on navigate away with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  // AI Generate state
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateType, setGenerateType] = useState("welcome");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");

  // Translate state
  const [translateOpen, setTranslateOpen] = useState(false);
  const [targetLocale, setTargetLocale] = useState("");
  const [translating, setTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState("");

  const handleValidateJson = useCallback(() => {
    try {
      JSON.parse(content);
      setJsonError(null);
      setJsonValid(true);
      setTimeout(() => setJsonValid(false), 2000);
    } catch (err) {
      setJsonError((err as Error).message);
      setJsonValid(false);
    }
  }, [content]);

  async function handleSave() {
    if (block.content_type === "json") {
      try {
        JSON.parse(content);
        setJsonError(null);
      } catch (err) {
        setJsonError((err as Error).message);
        return;
      }
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("content_blocks")
      .update({ content })
      .eq("id", block.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Content saved.");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleGenerate() {
    setGenerating(true);
    setGeneratedContent("");

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

    try {
      const res = await fetch(
        `${supabaseUrl}/functions/v1/generate-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
          body: JSON.stringify({
            chapter_id: chapterId,
            content_type: generateType,
            custom_prompt: generateType === "custom" ? customPrompt : undefined,
            block_key: block.block_key,
            output_format: block.content_type,
          }),
        }
      );

      const data = await res.json();
      if (res.ok && data.content) {
        setGeneratedContent(data.content);
      } else {
        toast.error(data.error ?? "Generation failed");
      }
    } catch {
      toast.error("Network error during generation");
    }

    setGenerating(false);
  }

  function useGeneratedContent() {
    setContent(generatedContent);
    setGenerateOpen(false);
    setGeneratedContent("");
    toast.success("Generated content applied. Review and save when ready.");
  }

  async function handleTranslate() {
    setTranslating(true);
    setTranslatedContent("");

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

    try {
      const res = await fetch(
        `${supabaseUrl}/functions/v1/translate-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
          body: JSON.stringify({
            chapter_id: chapterId,
            source_content: content,
            source_locale: block.locale,
            target_locale: targetLocale,
            content_type: block.content_type,
          }),
        }
      );

      const data = await res.json();
      if (res.ok && data.content) {
        setTranslatedContent(data.content);
      } else {
        toast.error(data.error ?? "Translation failed");
      }
    } catch {
      toast.error("Network error during translation");
    }

    setTranslating(false);
  }

  async function saveTranslation() {
    const supabase = createClient();
    const { error } = await supabase.from("content_blocks").upsert(
      {
        chapter_id: chapterId,
        block_key: block.block_key,
        locale: targetLocale,
        content_type: block.content_type,
        content: translatedContent,
      },
      { onConflict: "chapter_id,block_key,locale" }
    );

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        `Translation saved for ${targetLocale.toUpperCase()}.`
      );
      setTranslateOpen(false);
      setTranslatedContent("");
      router.refresh();
    }
  }

  const otherLocales = activeLanguages.filter((l) => l !== block.locale);
  const pageGroup = getPageGroup(block.block_key);

  return (
    <>
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
        <Link href="/dashboard/content" className="text-primary hover:underline">
          Content
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>{pageGroup}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{humanizeKey(block.block_key)}</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {humanizeKey(block.block_key)}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline">
              {block.content_type.replace("_", " ")}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {block.locale.toUpperCase()}
            </span>
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">Unsaved changes</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setGenerateOpen(true)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            AI Generate
          </Button>
          {otherLocales.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setTargetLocale(otherLocales[0]!);
                setTranslateOpen(true);
              }}
              className="gap-2"
            >
              <Languages className="h-4 w-4" />
              Translate
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {block.content_type === "rich_text" && (
            <TiptapEditor content={content} onChange={setContent} />
          )}

          {block.content_type === "plain_text" && (
            <div className="space-y-2">
              <Label>Plain Text</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground text-right">
                {content.length} characters
              </p>
            </div>
          )}

          {block.content_type === "image_url" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              {content && (
                <div className="relative rounded-md border p-4">
                  <img
                    src={content}
                    alt="Preview"
                    className="max-h-[400px] max-w-full rounded object-contain"
                  />
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        const url = prompt("Enter new image URL:");
                        if (url) setContent(url);
                      }}
                    >
                      <Replace className="h-3 w-3" />
                      Replace
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => setContent("")}
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {block.content_type === "json" && block.block_key === "resources_items" && (
            <ResourcesEditor value={content} onChange={setContent} />
          )}

          {block.content_type === "json" && block.block_key !== "resources_items" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>JSON</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleValidateJson}
                  className="gap-1"
                >
                  {jsonValid ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : null}
                  Validate JSON
                </Button>
              </div>
              <Textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setJsonError(null);
                  setJsonValid(false);
                }}
                className="min-h-[300px] font-mono text-sm"
              />
              {jsonError && (
                <p className="text-sm text-destructive">{jsonError}</p>
              )}
              {jsonValid && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Valid JSON
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sticky save footer */}
      <div className="sticky bottom-0 z-10 -mx-6 border-t bg-background/95 backdrop-blur-sm px-6 py-3 flex items-center justify-end gap-3">
        <Button
          variant="ghost"
          onClick={() => {
            if (hasChanges) {
              if (confirm("You have unsaved changes. Discard them?")) {
                router.back();
              }
            } else {
              router.back();
            }
          }}
        >
          Discard Changes
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </div>

      {/* AI Generate Dialog — side-by-side comparison */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Content Generation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={generateType} onValueChange={setGenerateType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {generateType === "custom" && (
              <div className="space-y-2">
                <Label>Describe what you need</Label>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="E.g., a paragraph about our coaching methodology..."
                  className="min-h-[80px]"
                />
              </div>
            )}
            {generatedContent && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Current Content</Label>
                  <div
                    className="prose prose-sm dark:prose-invert max-h-[300px] overflow-auto rounded-md border bg-muted/30 p-4"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-primary">AI Generated</Label>
                  <div
                    className="prose prose-sm dark:prose-invert max-h-[300px] overflow-auto rounded-md border border-primary/30 bg-primary/5 p-4"
                    dangerouslySetInnerHTML={{ __html: generatedContent }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            {generatedContent ? (
              <>
                <Button variant="ghost" onClick={handleGenerate}>
                  {generating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Regenerate
                </Button>
                <Button onClick={useGeneratedContent}>Use This</Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setGenerateOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Generate
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Translate Dialog */}
      <Dialog open={translateOpen} onOpenChange={setTranslateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Translate Content
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source Language</Label>
                <Input
                  value={block.locale.toUpperCase()}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>Target Language</Label>
                <Select value={targetLocale} onValueChange={setTargetLocale}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {otherLocales.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {translatedContent && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Original ({block.locale.toUpperCase()})</Label>
                  <div
                    className="prose prose-sm dark:prose-invert max-h-[300px] overflow-auto rounded-md border bg-muted/30 p-4"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-primary">Translation ({targetLocale.toUpperCase()})</Label>
                  <div
                    className="prose prose-sm dark:prose-invert max-h-[300px] overflow-auto rounded-md border border-primary/30 bg-primary/5 p-4"
                    dangerouslySetInnerHTML={{ __html: translatedContent }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            {translatedContent ? (
              <>
                <Button variant="ghost" onClick={handleTranslate}>
                  {translating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Retranslate
                </Button>
                <Button onClick={saveTranslation}>
                  Save as {targetLocale.toUpperCase()}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setTranslateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTranslate}
                  disabled={translating || !targetLocale}
                >
                  {translating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Translate
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import { useChapter } from "@/components/providers/chapter-provider";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function NewContentBlockPage() {
  const router = useRouter();
  const { selectedChapterId } = useChapter();
  const [loading, setLoading] = useState(false);

  const [blockKey, setBlockKey] = useState("");
  const [contentType, setContentType] = useState("rich_text");
  const [locale, setLocale] = useState("en");
  const [content, setContent] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChapterId) {
      toast.error("No chapter selected");
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("content_blocks")
      .insert({
        chapter_id: selectedChapterId,
        block_key: blockKey,
        content_type: contentType,
        locale,
        content: content || (contentType === "rich_text" ? "<p></p>" : ""),
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Content block created.");
    router.push(`/dashboard/content/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          New Content Block
        </h1>
        <p className="text-muted-foreground">
          Add a new content block for your chapter website.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Block Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Block Key *</Label>
              <Input
                value={blockKey}
                onChange={(e) => setBlockKey(e.target.value)}
                placeholder="e.g. hero_title, about_body"
                required
              />
              <p className="text-xs text-muted-foreground">
                Use snake_case. Common prefixes: hero_, about_, al_, contact_,
                join_, nav_, footer_
              </p>
            </div>
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rich_text">Rich Text</SelectItem>
                  <SelectItem value="plain_text">Plain Text</SelectItem>
                  <SelectItem value="image_url">Image URL</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Locale</Label>
              <Input
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Initial Content</Label>
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Optional initial content"
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Block
          </Button>
        </div>
      </form>
    </div>
  );
}

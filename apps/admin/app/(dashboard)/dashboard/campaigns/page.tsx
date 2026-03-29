"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@repo/supabase/client";
import { invokeEdgeFunctionWithAuth } from "@/lib/edge-functions";
import { useAuth, useIsSuperAdmin } from "@/components/providers/auth-provider";
import { useChapter } from "@/components/providers/chapter-provider";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import { Badge } from "@repo/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/dialog";
import { Mail, Plus, Loader2, Send } from "lucide-react";

type Campaign = {
  id: string;
  subject: string;
  status: "draft" | "sending" | "sent" | "failed";
  recipient_count: number | null;
  sent_at: string | null;
  created_at: string;
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  sending: "secondary",
  sent: "default",
  failed: "destructive",
};

export default function CampaignsPage() {
  const t = useTranslations("nav");
  const tui = useTranslations("ui.campaigns");
  const { user } = useAuth();
  const isSuperAdmin = useIsSuperAdmin();
  const { selectedChapterId } = useChapter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const chapterId = isSuperAdmin
    ? selectedChapterId || null
    : user?.roles.find((r) => r.chapter_id)?.chapter_id ?? null;

  const supabase = createClient();

  async function fetchCampaigns() {
    setLoading(true);
    let query = supabase
      .from("email_campaigns")
      .select("id, subject, status, recipient_count, sent_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (chapterId) {
      query = query.eq("chapter_id", chapterId);
    }

    const { data } = await query;
    setCampaigns((data as Campaign[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchCampaigns();
  }, [chapterId]);

  async function handleCreate() {
    if (!subject.trim() || !body.trim()) return;
    setCreating(true);
    setError(null);

    const { error: insertError } = await supabase.from("email_campaigns").insert({
      chapter_id: chapterId,
      created_by: user!.id,
      subject: subject.trim(),
      body: body.trim(),
      audience_filter: chapterId ? { chapter_id: chapterId } : {},
      status: "draft",
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setDialogOpen(false);
      setSubject("");
      setBody("");
      await fetchCampaigns();
    }
    setCreating(false);
  }

  async function handleSend(campaignId: string) {
    setSending(campaignId);
    setError(null);

    const { error: sendError } = await invokeEdgeFunctionWithAuth(
      supabase,
      "send-campaign",
      { campaign_id: campaignId }
    );

    if (sendError) {
      setError(sendError.message);
    } else {
      await fetchCampaigns();
    }
    setSending(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("campaigns")}</h1>
          <p className="text-muted-foreground">{tui("description")}</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {tui("newCampaign")}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            {tui("table.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tui("table.subject")}</TableHead>
                <TableHead>{tui("table.status")}</TableHead>
                <TableHead>{tui("table.recipients")}</TableHead>
                <TableHead>{tui("table.sentAt")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {tui("noCampaigns")}
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.subject}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[c.status] ?? "outline"} className="capitalize">
                        {tui(`status.${c.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.recipient_count ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.sent_at
                        ? new Date(c.sent_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {c.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={sending === c.id}
                          onClick={() => handleSend(c.id)}
                        >
                          {sending === c.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          {tui("send")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{tui("createDialog.title")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="subject">{tui("createDialog.subject")}</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={tui("createDialog.subjectPlaceholder")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="body">{tui("createDialog.body")}</Label>
              <Textarea
                id="body"
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={tui("createDialog.bodyPlaceholder")}
                className="resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">{tui("createDialog.bodyHint")}</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !subject.trim() || !body.trim()}
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {tui("createDialog.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

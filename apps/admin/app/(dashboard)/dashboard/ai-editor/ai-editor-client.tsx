"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Textarea } from "@repo/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Play,
  RefreshCw,
  Send,
  Trash2,
  Pencil,
  Rocket,
} from "lucide-react";
import type { Tables } from "@repo/types";
import { useTranslations } from "next-intl";

type Deployment = Tables<"deployments"> & {
  profiles: { full_name: string } | null;
};

type Chapter = Tables<"chapters">;

export function AiEditorClient({
  chapter,
  initialDeployments,
}: {
  chapter: Chapter;
  initialDeployments: Deployment[];
}) {
  const router = useRouter();
  const [deployments, setDeployments] =
    useState<Deployment[]>(initialDeployments);
  const [prompt, setPrompt] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [previewKey, setPreviewKey] = useState(0);
  const t = useTranslations("aiEditor");
  const tc = useTranslations("common");
  const tui = useTranslations("ui.aiEditor");

  function formatRelativeTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return tc("justNow");
    if (diffMins < 60) return tc("minsAgo", { count: diffMins });
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return tc("hoursAgo", { count: diffHours });
    const diffDays = Math.floor(diffHours / 24);
    return tc("daysAgo", { count: diffDays });
  }

  // Active session: has pending approval_status and is in an active state
  const activeSession = deployments.find(
    (d) =>
      d.approval_status === "pending" &&
      ["queued", "building", "deploying"].includes(d.status)
  );

  // Past sessions
  const pastSessions = deployments.filter(
    (d) =>
      d.approval_status !== null &&
      !["queued", "building", "deploying"].includes(d.status)
  );

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`ai-edits:${chapter.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deployments",
          filter: `chapter_id=eq.${chapter.id}`,
        },
        () => {
          startTransition(() => router.refresh());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chapter.id, router]);

  useEffect(() => {
    setDeployments(initialDeployments);
  }, [initialDeployments]);

  // Clear prompt history when session ends
  useEffect(() => {
    if (!activeSession) {
      setPromptHistory([]);
    }
  }, [activeSession]);

  const handleStartSession = useCallback(async () => {
    setIsStarting(true);
    setError(null);

    try {
      const res = await fetch("/api/ai-edit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: chapter.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("failed"));
      } else {
        startTransition(() => router.refresh());
      }
    } catch {
      setError(tui("errors.networkTryAgain"));
    } finally {
      setIsStarting(false);
    }
  }, [chapter.id, router, t]);

  const handleSendPrompt = useCallback(async () => {
    if (!prompt.trim() || !activeSession) return;
    setIsSubmitting(true);
    setError(null);

    const promptText = prompt.trim();

    try {
      const res = await fetch("/api/ai-edit/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deploymentId: activeSession.id,
          prompt: promptText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("failed"));
      } else {
        setPromptHistory((prev) => [...prev, promptText]);
        setPrompt("");
        startTransition(() => router.refresh());
      }
    } catch {
      setError(tui("errors.networkTryAgain"));
    } finally {
      setIsSubmitting(false);
    }
  }, [prompt, activeSession, router, t]);

  const handleApproval = useCallback(
    async (action: "approve" | "reject") => {
      if (!activeSession) return;
      setIsApproving(true);
      setError(null);

      try {
        const res = await fetch("/api/ai-edit/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deploymentId: activeSession.id, action }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? t("failed"));
        } else {
          startTransition(() => router.refresh());
        }
      } catch {
        setError(tui("errors.networkTryAgain"));
      } finally {
        setIsApproving(false);
      }
    },
    [activeSession, router, t]
  );

  // Elapsed time counter for building state
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (activeSession?.status !== "building") {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.status]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  // Can accept a new prompt when session is idle (queued or deploying)
  const canSendPrompt =
    activeSession &&
    ["queued", "deploying"].includes(activeSession.status) &&
    !isSubmitting;

  // Has a preview to show
  const hasPreview =
    activeSession?.preview_url && activeSession.status === "deploying";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* No active session — show start button */}
      {!activeSession && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{t("readyToEdit")}</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {t("readyToEditDesc")}
            </p>
            <Button
              onClick={handleStartSession}
              disabled={isStarting || isPending}
              className="mt-6 gap-2"
              size="lg"
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {t("startEditingSession")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active session */}
      {activeSession && (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left column: Prompt + History */}
          <div className="space-y-6 lg:col-span-3">
            {/* Vertical progress indicator */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">{t("sessionProgress")}</h3>
                  <span className="text-xs text-muted-foreground">
                    {t("started", { time: formatRelativeTime(activeSession.created_at) })}
                  </span>
                </div>
                <div className="space-y-0">
                  {(["queued", "building", "deploying", "done"] as const).map((step, i, arr) => {
                    const statusOrder = { queued: 0, building: 1, deploying: 2, done: 3 };
                    const currentIdx = statusOrder[activeSession.status as keyof typeof statusOrder] ?? 0;
                    const isCompleted = i < currentIdx;
                    const isCurrent = i === currentIdx;
                    const labels: Record<string, string> = {
                      queued: t("waitingToStart"),
                      building: `${t("aiIsEditing")}${isCurrent && elapsed > 0 ? ` (${t("elapsed", { time: formatElapsed(elapsed) })})` : ""}`,
                      deploying: t("previewReady"),
                      done: t("changesDeployed"),
                    };

                    return (
                      <div key={step} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                            isCompleted
                              ? "border-green-500 bg-green-500 text-white"
                              : isCurrent
                                ? "border-primary bg-background text-primary shadow-[0_0_0_3px_oklch(var(--primary)/0.2)]"
                                : "border-muted bg-background text-muted-foreground"
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : isCurrent && activeSession.status === "building" ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : isCurrent ? (
                              <span className="h-2 w-2 rounded-full bg-primary" />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-muted" />
                            )}
                          </div>
                          {i < arr.length - 1 && (
                            <div className={`w-0.5 h-6 ${isCompleted ? "bg-green-500" : "bg-muted"}`} />
                          )}
                        </div>
                        <div className="pt-0.5">
                          <span className={`text-sm ${
                            isCurrent
                              ? "font-medium text-foreground"
                              : isCompleted
                                ? "text-muted-foreground line-through"
                                : "text-muted-foreground"
                          }`}>
                            {labels[step]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Prompt history */}
            {promptHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t("promptHistory")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {promptHistory.map((p, i) => (
                    <div
                      key={i}
                      className="rounded-md bg-muted px-3 py-2 text-sm"
                    >
                      <span className="mr-2 font-mono text-xs text-muted-foreground">
                        #{i + 1}
                      </span>
                      {p}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Prompt input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  {activeSession.status === "queued"
                    ? t("firstEdit")
                    : t("followUpEdit")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  {t("promptDescription")}
                </p>
                <Textarea
                  placeholder={t("placeholder")}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={!canSendPrompt}
                  className="min-h-[120px] resize-y"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleSendPrompt();
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {t("ctrlEnterToSend")}
                  </span>
                  <Button
                    onClick={handleSendPrompt}
                    disabled={!prompt.trim() || !canSendPrompt || isPending}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {t("sendPrompt")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Error from AI */}
            {activeSession.error_message && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {activeSession.error_message}
              </div>
            )}
          </div>

          {/* Right column: Preview + Actions */}
          <div className="space-y-6 lg:col-span-2">
            {hasPreview && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {t("preview")}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewKey((k) => k + 1)}
                        className="text-sm font-normal text-muted-foreground hover:text-primary"
                        title={tui("actions.refreshPreview")}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      <a
                        href={activeSession.preview_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-normal text-primary hover:underline"
                      >
                        <ExternalLink className="mr-1 inline h-3 w-3" />
                        {t("openInNewTab")}
                      </a>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-hidden rounded-md border">
                    <iframe
                      key={previewKey}
                      src={activeSession.preview_url!}
                      className="h-[400px] w-full"
                      title={tui("labels.previewFrameTitle")}
                    />
                  </div>

                  <p className="truncate text-xs text-muted-foreground">
                    {activeSession.preview_url}
                  </p>

                  {/* Approve & Deploy / Edit More / Discard */}
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleApproval("approve")}
                      disabled={isApproving || isPending}
                      className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      {isApproving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Rocket className="h-4 w-4" />
                      )}
                      {t("approveAndDeploy")}
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const textarea = document.querySelector<HTMLTextAreaElement>("textarea");
                          textarea?.focus();
                        }}
                        className="flex-1 gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        {t("editMore")}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleApproval("reject")}
                        disabled={isApproving || isPending}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("discard")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Building state — waiting for preview */}
            {activeSession.status === "building" && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    {t("aiIsEditing")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tui("labels.previewWillAppearWhenReady")}
                  </p>
                  {elapsed > 0 && (
                    <p className="mt-2 font-mono text-xs text-muted-foreground">
                      {t("elapsed", { time: formatElapsed(elapsed) })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Queued state — no prompt yet */}
            {activeSession.status === "queued" && (
              <Card>
                <CardContent className="space-y-4 py-6">
                  <p className="text-sm text-muted-foreground">
                    {t("enterPromptToStart")}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApproval("reject")}
                    disabled={isApproving || isPending}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("cancelSession")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Past sessions */}
      {pastSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("pastSessions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("lastPrompt")}</TableHead>
                    <TableHead>{t("outcome")}</TableHead>
                    <TableHead>{tui("labels.date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="max-w-xs truncate text-sm">
                        {session.ai_prompt ?? tui("labels.noPromptsSent")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            session.approval_status === "approved"
                              ? "default"
                              : session.approval_status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                          className="gap-1"
                        >
                          {session.approval_status === "approved" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {t("outcomeStatus", { status: session.approval_status ?? session.status })}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeTime(session.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

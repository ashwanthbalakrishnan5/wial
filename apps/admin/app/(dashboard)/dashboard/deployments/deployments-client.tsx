"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/tooltip";
import { Rocket, ExternalLink, Loader2, CheckCircle2, XCircle, Clock, Zap, Sparkles, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@repo/ui/avatar";
import type { Tables } from "@repo/types";
import { useTranslations } from "next-intl";

type Deployment = Tables<"deployments"> & {
  profiles: { full_name: string } | null;
};

type Chapter = Tables<"chapters">;

export function DeploymentsClient({
  chapter,
  initialDeployments,
}: {
  chapter: Chapter;
  initialDeployments: Deployment[];
}) {
  const router = useRouter();
  const [deployments, setDeployments] = useState<Deployment[]>(initialDeployments);
  const [isPending, startTransition] = useTransition();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const t = useTranslations("deployments");
  const tc = useTranslations("common");

  const STATUS_CONFIG: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
  > = {
    queued: {
      label: t("queued"),
      variant: "outline",
      icon: <Clock className="h-3 w-3" />,
    },
    building: {
      label: t("building"),
      variant: "secondary",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    deploying: {
      label: t("deploying"),
      variant: "secondary",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    done: {
      label: t("live"),
      variant: "default",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    failed: {
      label: t("failed"),
      variant: "destructive",
      icon: <XCircle className="h-3 w-3" />,
    },
  };

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

  const hasInProgress = deployments.some((d) =>
    ["queued", "building", "deploying"].includes(d.status)
  );
  const latestDone = deployments.find((d) => d.status === "done");

  // Realtime subscription for live status
...
  async function handleDeploy() {
    if (!chapter.github_folder_path || !chapter.cloudflare_project_name) {
      setDeployError(t("notProvisionedTrigger"));
      return;
    }
    setIsDeploying(true);
    setDeployError(null);
    try {
      const res = await fetch("/api/deployments/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: chapter.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeployError(data.error ?? t("failed"));
      } else {
        startTransition(() => router.refresh());
      }
    } catch {
      setDeployError("Network error. Please try again.");
    } finally {
      setIsDeploying(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("manage", { name: chapter.name })}
          </p>
        </div>
        <Button
          onClick={handleDeploy}
          disabled={isDeploying || hasInProgress || isPending}
          className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {isDeploying || (hasInProgress && isPending) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {hasInProgress ? t("building") : t("deployNow")}
        </Button>
      </div>

      {deployError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {deployError}
        </div>
      )}

      {/* Deployment Progress Track */}
      {hasInProgress && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-6">{t("deploymentInProgress")}</h3>
          <div className="relative flex items-center justify-between max-w-2xl mx-auto">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full" />
            
            {["queued", "building", "deploying", "done"].map((step, i) => {
              const currentIdx = ["queued", "building", "deploying", "done"].indexOf(deployments[0]?.status || "queued");
              const isCompleted = i < currentIdx || (i === 3 && currentIdx === 3);
              const isCurrent = i === currentIdx;
              
              return (
                <div key={step} className="relative flex flex-col items-center gap-2 bg-card px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted ? "bg-green-500 border-green-500 text-white" :
                    isCurrent ? "bg-card border-primary text-primary shadow-[0_0_0_4px_var(--theme-primary-alpha-20)] animate-pulse" :
                    "bg-card border-muted text-muted-foreground"
                  }`}>
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : 
                     isCurrent ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                     <span className="text-xs font-semibold">{i + 1}</span>}
                  </div>
                  <span className={`text-xs font-medium capitalize ${
                    isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}>{t(step)}</span>
                </div>
              );
            })}
          </div>
          
          {deployments[0]?.build_log ? (
            <div className="mt-8 rounded-md bg-slate-950 p-4 font-mono text-xs text-slate-300 h-40 overflow-y-auto border border-slate-800">
              <pre className="whitespace-pre-wrap">{deployments[0].build_log}</pre>
            </div>
          ) : (
            <div className="mt-8 rounded-md bg-slate-950 p-4 font-mono text-xs text-slate-300 h-40 overflow-y-auto border border-slate-800">
              <div className="text-slate-500 mb-2"># {t("buildLogFor", { subdomain: chapter.subdomain })}</div>
              {deployments[0]?.commit_reference && (
                <div className="mb-1">{">"} {t("commit")}: <span className="text-blue-400">{deployments[0].commit_reference.slice(0, 8)}</span></div>
              )}
              <div className="mb-1 flex items-center gap-2">
                {">"} {deployments[0]?.status === "queued" ? t("waitingForBuildRunner") :
                       deployments[0]?.status === "building" ? t("buildingStaticPages") :
                       deployments[0]?.status === "deploying" ? t("deployingToCloudflare") :
                       t("processing")}
                <span className="flex h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live site info */}
      {latestDone && (
        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium">{t("live")}</span>
          {latestDone.deploy_url ? (
            <a
              href={latestDone.deploy_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {latestDone.deploy_url}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-sm text-muted-foreground">
              {`${chapter.subdomain}.wial.ashwanthbk.com`}
            </span>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {t("lastDeployed", { time: formatRelativeTime(latestDone.completed_at ?? latestDone.created_at) })}
          </span>
        </div>
      )}

      {(!chapter.github_folder_path || !chapter.cloudflare_project_name) && (
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          {t("notProvisioned")}
        </div>
      )}

      {/* Deployment history */}
      {deployments.length > 0 ? (
        <TooltipProvider>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("type")}</TableHead>
                  <TableHead>{tc("allStatus")}</TableHead>
                  <TableHead>{t("triggeredBy")}</TableHead>
                  <TableHead>{t("aiPrompt")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("duration")}</TableHead>
                  <TableHead>{t("url")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deployments.map((deployment) => {
                  const cfg = STATUS_CONFIG[deployment.status] ?? STATUS_CONFIG.queued!;
                  const isAiEdit = !!deployment.ai_prompt;
                  const isLatestLive = latestDone?.id === deployment.id;
                  const initials = deployment.profiles?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() ?? "";
                  return (
                    <TableRow key={deployment.id} className={isLatestLive ? "border-l-2 border-l-green-500" : ""}>
                      {/* Type */}
                      <TableCell>
                        {isAiEdit ? (
                          <Badge variant="secondary" className="flex w-fit items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {tc("aiEditor")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex w-fit items-center gap-1">
                            <Rocket className="h-3 w-3" />
                            {t("title")}
                          </Badge>
                        )}
                      </TableCell>
                      {/* Status + Approval */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={cfg!.variant} className="flex w-fit items-center gap-1">
                            {cfg!.icon}
                            {cfg!.label}
                          </Badge>
                          {isAiEdit && deployment.approval_status && (
                            <Badge
                              variant={
                                deployment.approval_status === "approved"
                                  ? "default"
                                  : deployment.approval_status === "rejected"
                                    ? "destructive"
                                    : "outline"
                              }
                              className="flex w-fit items-center gap-1 text-xs"
                            >
                              {deployment.approval_status === "approved" && (
                                <CheckCircle2 className="h-2.5 w-2.5" />
                              )}
                              {deployment.approval_status === "rejected" && (
                                <XCircle className="h-2.5 w-2.5" />
                              )}
                              {deployment.approval_status}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      {/* Triggered By */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-muted">
                              {initials || <User className="h-3 w-3" />}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {deployment.profiles?.full_name ?? "System"}
                          </span>
                        </div>
                      </TableCell>
                      {/* AI Prompt */}
                      <TableCell className="max-w-[200px]">
                        {isAiEdit ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block truncate text-sm text-muted-foreground cursor-help">
                                {deployment.ai_prompt}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-sm">
                              <p className="text-sm">{deployment.ai_prompt}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      {/* Date */}
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeTime(deployment.created_at)}
                      </TableCell>
                      {/* Duration */}
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDuration(deployment.created_at, deployment.completed_at)}
                      </TableCell>
                      {/* URL */}
                      <TableCell>
                        {deployment.deploy_url ? (
                          <a
                            href={deployment.deploy_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            {t("viewSite")}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : isAiEdit && deployment.preview_url ? (
                          <a
                            href={deployment.preview_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-amber-600 hover:underline"
                          >
                            {t("preview")}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : deployment.error_message ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block truncate text-xs text-destructive cursor-help max-w-[120px]">
                                {deployment.error_message.slice(0, 60)}
                                {deployment.error_message.length > 60 ? "…" : ""}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-sm">
                              <p className="text-sm">{deployment.error_message}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TooltipProvider>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Rocket className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t("noDeployments")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("noDeploymentsDesc")}
          </p>
        </div>
      )}
    </div>
  );
}

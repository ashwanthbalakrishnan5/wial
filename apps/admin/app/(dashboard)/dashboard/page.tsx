import type React from "react";
import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import {
  Building2,
  Users,
  FileText,
  Rocket,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Clock,
  UserCircle,
  Calendar,
} from "lucide-react";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { DotMap } from "@/components/dashboard/dot-map";
import { BentoGrid } from "@/components/dashboard/bento-grid";
import { cookies } from "next/headers";

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const isAdmin = isSuperAdmin(user.roles);

  // Read selected chapter from cookie (for super admins switching context)
  const cookieStore = await cookies();
  const selectedChapterCookie = cookieStore.get("selected-chapter")?.value;

  // Resolve chapter ID: cookie override for super admins, otherwise from role
  let resolvedChapterId: string | undefined;
  if (isAdmin) {
    resolvedChapterId = selectedChapterCookie || undefined;
  } else {
    resolvedChapterId = user.roles.find((r) => r.chapter_id)?.chapter_id ?? undefined;
  }

  // Determine role for the resolved chapter
  const currentRole = isAdmin
    ? "super_admin"
    : user.roles.find((r) => r.chapter_id === resolvedChapterId)?.role ?? null;

  // Fetch stats
  const chapterQuery = supabase.from("chapters").select("*", { count: "exact", head: true });
  const coachQuery = supabase.from("coaches").select("*", { count: "exact", head: true }).eq("is_active", true);
  const deploymentCountQuery = supabase.from("deployments").select("*", { count: "exact", head: true });

  if (resolvedChapterId) {
    coachQuery.eq("chapter_id", resolvedChapterId);
    deploymentCountQuery.eq("chapter_id", resolvedChapterId);
  }

  const [{ count: chapterCount }, { count: coachCount }, { count: deploymentCount }] = await Promise.all([
    chapterQuery,
    coachQuery,
    deploymentCountQuery,
  ]);

  // Content block count for chapter-scoped views
  let contentCount = 0;
  if (resolvedChapterId) {
    const { count } = await supabase
      .from("content_blocks")
      .select("*", { count: "exact", head: true })
      .eq("chapter_id", resolvedChapterId);
    contentCount = count ?? 0;
  }

  // Latest deployment
  const deploymentQuery = supabase
    .from("deployments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);
  if (resolvedChapterId) {
    deploymentQuery.eq("chapter_id", resolvedChapterId);
  }
  const { data: latestDeployments } = await deploymentQuery;
  const latestDeployment = latestDeployments?.[0] ?? null;

  type DeployStatus = "done" | "failed" | "building" | "deploying" | "queued";
  const statusMap: Record<DeployStatus, { label: string; icon: React.ReactNode; badge: "default" | "secondary" | "destructive" | "outline" }> = {
    done: { label: "Live", icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, badge: "default" },
    failed: { label: "Failed", icon: <XCircle className="h-4 w-4 text-destructive" />, badge: "destructive" },
    building: { label: "Building", icon: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />, badge: "secondary" },
    deploying: { label: "Deploying", icon: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />, badge: "secondary" },
    queued: { label: "Queued", icon: <Loader2 className="h-4 w-4 animate-spin text-amber-500" />, badge: "outline" },
  };
  const deployStatusConfig = latestDeployment
    ? statusMap[latestDeployment.status as DeployStatus] ?? { label: latestDeployment.status, icon: <Rocket className="h-4 w-4 text-muted-foreground" />, badge: "outline" as const }
    : null;

  // ── Coach Dashboard ──
  if (currentRole === "coach") {
    const coachRecord = await (async () => {
      const { data } = await supabase
        .from("coaches")
        .select("*")
        .eq("user_id", user.id)
        .single();
      return data;
    })();

    // Profile completeness
    const fields = ["full_name", "bio", "photo_url", "contact_email", "city", "country", "website"] as const;
    const specFields = ["specializations", "languages"] as const;
    let filled = 0;
    const missing: string[] = [];
    for (const f of fields) {
      if (coachRecord?.[f]) filled++;
      else missing.push(f.replace(/_/g, " "));
    }
    for (const f of specFields) {
      if (coachRecord?.[f] && (coachRecord[f] as string[]).length > 0) filled++;
      else missing.push(f);
    }
    const total = fields.length + specFields.length;
    const pct = coachRecord ? Math.round((filled / total) * 100) : 0;

    const certColors: Record<string, string> = {
      CALC: "text-[oklch(var(--cert-calc))]",
      SALC: "text-[oklch(var(--cert-salc))]",
      MALC: "text-[oklch(var(--cert-malc))]",
      PALC: "text-[oklch(var(--cert-palc))]",
    };
    const certBgColors: Record<string, string> = {
      CALC: "border-[oklch(var(--cert-calc))]",
      SALC: "border-[oklch(var(--cert-salc))]",
      MALC: "border-[oklch(var(--cert-malc))]",
      PALC: "border-[oklch(var(--cert-palc))]",
    };

    const dueDate = coachRecord?.recertification_due_date
      ? new Date(coachRecord.recertification_due_date)
      : null;
    const daysUntilDue = dueDate
      ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    const dueColor = daysUntilDue === null ? "" : daysUntilDue > 90 ? "text-green-600" : daysUntilDue > 30 ? "text-amber-600" : "text-destructive";

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back, {user.fullName}
          </h1>
          <p className="text-muted-foreground">
            Manage your coach profile and certification.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile completeness */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCircle className="h-5 w-5" />
                Profile Completeness
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="relative h-32 w-32">
                <svg className="h-32 w-32 -rotate-90" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                  <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="8"
                    className={certColors[coachRecord?.certification_level ?? "CALC"] ?? "text-primary"}
                    strokeDasharray={`${(pct / 100) * 352} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                  {pct}%
                </span>
              </div>
              {missing.length > 0 && (
                <div className="w-full space-y-1">
                  <p className="text-xs text-muted-foreground">Missing fields:</p>
                  {missing.map((f) => (
                    <Link
                      key={f}
                      href="/dashboard/profile"
                      className="block text-sm text-primary hover:underline capitalize"
                    >
                      {f}
                    </Link>
                  ))}
                </div>
              )}
              <Link href="/dashboard/profile" className="text-sm text-primary hover:underline">
                Edit My Profile →
              </Link>
            </CardContent>
          </Card>

          {/* My Certification */}
          <Card className={`border-l-4 ${certBgColors[coachRecord?.certification_level ?? "CALC"] ?? "border-l-primary"}`}>
            <CardHeader>
              <CardTitle className="text-base">My Certification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge className={`text-base ${certColors[coachRecord?.certification_level ?? "CALC"] ?? ""}`} variant="outline">
                  {coachRecord?.certification_level ?? "CALC"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Hours Logged</p>
                  <p className="text-xl font-semibold flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {coachRecord?.hours_logged ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">CE Credits</p>
                  <p className="text-xl font-semibold">{coachRecord?.ce_credits_earned ?? 0}</p>
                </div>
              </div>
              {dueDate && (
                <div>
                  <p className="text-muted-foreground text-sm">Recertification Due</p>
                  <p className={`text-sm font-medium ${dueColor}`}>
                    {dueDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    {daysUntilDue !== null && ` (${daysUntilDue > 0 ? `in ${daysUntilDue} days` : "overdue"})`}
                  </p>
                </div>
              )}
              {/* Certification progress bars */}
              <div className="space-y-1.5">
                {["CALC", "SALC", "MALC", "PALC"].map((level, i) => {
                  const currentIdx = ["CALC", "SALC", "MALC", "PALC"].indexOf(coachRecord?.certification_level ?? "CALC");
                  const filled = i <= currentIdx;
                  return (
                    <div key={level} className="flex items-center gap-2">
                      <span className="text-xs w-10 text-muted-foreground">{level}</span>
                      <div className={`h-2 flex-1 rounded-full ${filled ? "bg-primary" : "bg-muted"}`} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Content Creator Dashboard ──
  if (currentRole === "content_creator") {
    // Recent content changes
    const { data: recentBlocks } = resolvedChapterId
      ? await supabase
          .from("content_blocks")
          .select("block_key, content_type, updated_at")
          .eq("chapter_id", resolvedChapterId)
          .order("updated_at", { ascending: false })
          .limit(5)
      : { data: [] };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back, {user.fullName}
          </h1>
          <p className="text-muted-foreground">
            Create and edit content for your chapter website.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="overflow-hidden">
            <div className="h-1 w-full bg-primary" />
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Content Blocks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold"><AnimatedNumber value={contentCount} /></div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <div className="h-1 w-full bg-green-500" />
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Coaches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold"><AnimatedNumber value={coachCount ?? 0} /></div>
            </CardContent>
          </Card>
        </div>

        {/* Quick action */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Edit Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Update your website text, images, and translations using the WYSIWYG editor.
            </p>
            <Link href="/dashboard/content" className="inline-flex items-center text-sm text-primary hover:underline">
              Go to Content Editor →
            </Link>
          </CardContent>
        </Card>

        {/* Recent changes */}
        {recentBlocks && recentBlocks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Content Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentBlocks.map((block) => (
                  <div key={block.block_key} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {block.block_key.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {block.content_type}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(block.updated_at)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── Super Admin (Global) & Chapter Lead Dashboard ──
  const isGlobalView = isAdmin && !resolvedChapterId;

  const stats = [
    {
      title: isGlobalView ? "Total Chapters" : "Content Blocks",
      value: isGlobalView ? (chapterCount ?? 0) : contentCount,
      icon: isGlobalView ? Building2 : FileText,
      color: "bg-primary",
    },
    { title: "Active Coaches", value: coachCount ?? 0, icon: Users, color: "bg-green-500" },
    {
      title: isGlobalView ? "Deployments" : "Events",
      value: deploymentCount ?? 0,
      icon: isGlobalView ? Rocket : Calendar,
      color: "bg-secondary",
    },
    { title: "Deployments", value: deploymentCount ?? 0, icon: Rocket, color: "bg-accent" },
  ];

  // Remove duplicate if global (both slots show deployments)
  const displayStats = isGlobalView ? stats.slice(0, 3).concat(stats.slice(3)) : stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome back, {user.fullName}
        </h1>
        <p className="text-muted-foreground">
          {isGlobalView
            ? "Here's an overview of the WIAL global network."
            : "Here's an overview of your chapter."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayStats.map((stat, i) => (
          <Card key={`${stat.title}-${i}`} className="overflow-hidden">
            <div className={`h-1 w-full ${stat.color}`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                <AnimatedNumber value={stat.value} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isGlobalView ? <DotMap /> : resolvedChapterId && <BentoGrid />}

      {/* Deployment status card */}
      {latestDeployment && deployStatusConfig && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Latest Deployment
            </CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {deployStatusConfig.icon}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={deployStatusConfig.badge}>
                    {deployStatusConfig.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatRelativeTime(
                      latestDeployment.completed_at ?? latestDeployment.created_at
                    )}
                  </span>
                </div>
                {latestDeployment.error_message && (
                  <p className="mt-1 text-xs text-destructive">
                    {latestDeployment.error_message.slice(0, 100)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {latestDeployment.deploy_url && (
                  <a
                    href={latestDeployment.deploy_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    View site
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <Link
                  href="/dashboard/deployments"
                  className="text-sm text-primary hover:underline"
                >
                  All deployments →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

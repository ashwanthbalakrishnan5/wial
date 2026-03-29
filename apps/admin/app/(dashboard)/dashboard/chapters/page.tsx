import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@repo/ui/table";
import { Badge } from "@repo/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import {
  Plus, Building2, MoreHorizontal, Eye, Pencil, Rocket, ShieldOff, ShieldCheck, Archive,
} from "lucide-react";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  suspended: "destructive",
  archived: "outline",
};

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default async function ChaptersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const user = await getAuthUser();
  if (!user || !isSuperAdmin(user.roles)) redirect("/dashboard");

  const supabase = await createClient();

  let query = supabase
    .from("chapters")
    .select("*, coaches(count)")
    .order("name");

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.q) {
    query = query.ilike("name", `%${params.q}%`);
  }

  const { data: chapters } = await query;

  // Fetch latest deployment per chapter
  const { data: latestDeployments } = await supabase
    .from("deployments")
    .select("chapter_id, status, created_at, completed_at")
    .eq("status", "done")
    .order("created_at", { ascending: false });

  const lastDeployByChapter: Record<string, { status: string; date: string }> = {};
  for (const d of latestDeployments ?? []) {
    if (!lastDeployByChapter[d.chapter_id]) {
      lastDeployByChapter[d.chapter_id] = { status: d.status, date: d.completed_at ?? d.created_at };
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Chapters</h1>
          <p className="text-muted-foreground">
            Manage all WIAL chapters across the global network.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/chapters/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Chapter
          </Link>
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <form className="flex items-center gap-2">
          <input
            type="text"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search chapters..."
            className="h-9 rounded-full border bg-background px-4 text-sm w-[200px] focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input type="hidden" name="status" value={params.status ?? "all"} />
          <button type="submit" className="sr-only">Search</button>
        </form>
        {["all", "active", "suspended", "archived"].map((s) => (
          <Link
            key={s}
            href={`/dashboard/chapters?status=${s}${params.q ? `&q=${params.q}` : ""}`}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors capitalize ${
              (params.status ?? "all") === s
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {s === "all" ? "All Status" : s}
          </Link>
        ))}
      </div>

      {chapters && chapters.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Language</TableHead>
                <TableHead className="text-right">Coaches</TableHead>
                <TableHead>Last Deployed</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {chapters.map((chapter) => {
                const lastDeploy = lastDeployByChapter[chapter.id];
                return (
                  <TableRow key={chapter.id}>
                    <TableCell>
                      <span className={`inline-block h-2 w-2 rounded-full ${
                        chapter.status === "active" ? "bg-green-500" :
                        chapter.status === "suspended" ? "bg-amber-500" : "bg-muted-foreground"
                      }`} />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/chapters/${chapter.id}`}
                        className="hover:underline"
                      >
                        {chapter.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {chapter.slug}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {chapter.subdomain}
                    </TableCell>
                    <TableCell>{chapter.default_language.toUpperCase()}</TableCell>
                    <TableCell className="text-right">
                      {(chapter.coaches as any)?.[0]?.count ?? 0}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lastDeploy ? formatRelativeTime(lastDeploy.date) : "Never"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/chapters/${chapter.id}`} className="gap-2">
                              <Eye className="h-4 w-4" />
                              View Chapter
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/chapters/${chapter.id}`} className="gap-2">
                              <Pencil className="h-4 w-4" />
                              Edit Chapter
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2"
                            disabled={!chapter.github_folder_path}
                          >
                            <Rocket className="h-4 w-4" />
                            Trigger Deploy
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {chapter.status === "active" ? (
                            <DropdownMenuItem className="gap-2 text-amber-600 focus:text-amber-600">
                              <ShieldOff className="h-4 w-4" />
                              Suspend Chapter
                            </DropdownMenuItem>
                          ) : chapter.status === "suspended" ? (
                            <DropdownMenuItem className="gap-2 text-green-600 focus:text-green-600">
                              <ShieldCheck className="h-4 w-4" />
                              Activate Chapter
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                            <Archive className="h-4 w-4" />
                            Archive Chapter
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No chapters yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first chapter to start building the global network.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/chapters/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Chapter
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

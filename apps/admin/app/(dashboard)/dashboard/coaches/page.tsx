import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@repo/ui/table";
import { Badge } from "@repo/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@repo/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Plus, Users, MoreHorizontal, Eye, Pencil, UserMinus, UserCheck, Mail } from "lucide-react";
import { CoachSearch } from "./coach-search";
import { cookies } from "next/headers";

const certBadgeClass: Record<string, string> = {
  CALC: "bg-blue-100 text-blue-700 border-l-2 border-blue-500 dark:bg-blue-900/30 dark:text-blue-300",
  SALC: "bg-green-100 text-green-700 border-l-2 border-green-500 dark:bg-green-900/30 dark:text-green-300",
  MALC: "bg-amber-100 text-amber-700 border-l-2 border-amber-500 dark:bg-amber-900/30 dark:text-amber-300",
  PALC: "bg-purple-100 text-purple-700 border-l-2 border-purple-600 dark:bg-purple-900/30 dark:text-purple-300",
};

export default async function CoachesPage({
  searchParams,
}: {
  searchParams: Promise<{ cert?: string; lang?: string; active?: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const supabase = await createClient();
  const isAdmin = isSuperAdmin(user.roles);

  const cookieStore = await cookies();
  const selectedChapterCookie = cookieStore.get("selected-chapter")?.value;
  const resolvedChapterId = isAdmin
    ? selectedChapterCookie || undefined
    : user.roles.find((r) => r.chapter_id)?.chapter_id ?? undefined;

  let query = supabase
    .from("coaches")
    .select("*, chapters(name)")
    .order("full_name");

  if (resolvedChapterId) {
    query = query.eq("chapter_id", resolvedChapterId);
  }

  // Apply filters
  if (params.cert) {
    query = query.eq("certification_level", params.cert);
  }
  if (params.lang) {
    query = query.contains("languages", [params.lang]);
  }
  if (params.active === "all") {
    // show all
  } else {
    // default: show active only
    query = query.eq("is_active", true);
  }

  const { data: coaches } = await query;

  const canAdd = isAdmin || user.roles.some(
    (r) => r.chapter_id === resolvedChapterId && r.role === "chapter_lead"
  );

  // Collect unique languages for filter
  const allLanguages = new Set<string>();
  coaches?.forEach((c) => c.languages?.forEach((l: string) => allLanguages.add(l)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Coaches</h1>
          <p className="text-muted-foreground">
            {resolvedChapterId ? "Manage your chapter's coach roster." : "View coaches across all chapters."}
          </p>
        </div>
        {canAdd && resolvedChapterId && (
          <Button asChild>
            <Link href="/dashboard/coaches/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Coach
            </Link>
          </Button>
        )}
      </div>

      {/* Semantic Search */}
      <CoachSearch chapterId={resolvedChapterId} />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/dashboard/coaches?${new URLSearchParams({ ...(params.lang ? { lang: params.lang } : {}), ...(params.active === "all" ? { active: "all" } : {}) }).toString()}`}
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${!params.cert ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
        >
          All Levels
        </Link>
        {["CALC", "SALC", "MALC", "PALC"].map((level) => (
          <Link
            key={level}
            href={`/dashboard/coaches?cert=${level}${params.lang ? `&lang=${params.lang}` : ""}${params.active === "all" ? "&active=all" : ""}`}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${params.cert === level ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            {level}
          </Link>
        ))}
        <span className="mx-1 h-4 w-px bg-border" />
        {allLanguages.size > 0 && (
          <select
            defaultValue={params.lang ?? ""}
            className="rounded-full border bg-background px-3 py-1 text-xs"
            // Using a form approach for server-side filtering
            onChange={undefined}
          >
            <option value="">All Languages</option>
            {[...allLanguages].sort().map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        )}
        <Link
          href={`/dashboard/coaches?${new URLSearchParams({ ...(params.cert ? { cert: params.cert } : {}), ...(params.lang ? { lang: params.lang } : {}), active: params.active === "all" ? "" : "all" }).toString()}`}
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${params.active === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
        >
          {params.active === "all" ? "Showing All" : "Show Inactive"}
        </Link>
      </div>

      {coaches && coaches.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>Name</TableHead>
                <TableHead>Certification</TableHead>
                <TableHead>Specializations</TableHead>
                <TableHead>Languages</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead>Active</TableHead>
                {!resolvedChapterId && <TableHead>Chapter</TableHead>}
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {coaches.map((coach) => {
                const initials = coach.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <TableRow key={coach.id}>
                    {/* Photo */}
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        {coach.photo_url && <AvatarImage src={coach.photo_url} alt={coach.full_name} />}
                        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    {/* Name + pending approval badge */}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/coaches/${coach.id}`}
                          className="hover:underline"
                        >
                          {coach.full_name}
                        </Link>
                        {!coach.certification_approved && (
                          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700">
                            Pending Approval
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${certBadgeClass[coach.certification_level] ?? "bg-muted text-muted-foreground"}`}>
                        {coach.certification_level}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {coach.specializations.slice(0, 3).map((s: string) => (
                          <Badge key={s} variant="outline" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                        {coach.specializations.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{coach.specializations.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {coach.languages.join(", ")}
                    </TableCell>
                    <TableCell className="text-right">{coach.hours_logged}</TableCell>
                    <TableCell>
                      <span className={`inline-block h-2 w-2 rounded-full ${coach.is_active ? "bg-green-500" : "bg-muted-foreground/50"}`} />
                    </TableCell>
                    {!resolvedChapterId && (
                      <TableCell className="text-muted-foreground">
                        {(coach.chapters as any)?.name ?? "\u2014"}
                      </TableCell>
                    )}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/coaches/${coach.id}`} className="gap-2">
                              <Eye className="h-4 w-4" />
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          {canAdd && (
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/coaches/${coach.id}`} className="gap-2">
                                <Pencil className="h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {canAdd && !coach.user_id && (
                            <DropdownMenuItem className="gap-2">
                              <Mail className="h-4 w-4" />
                              Send Invitation
                            </DropdownMenuItem>
                          )}
                          {canAdd && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                                {coach.is_active ? (
                                  <>
                                    <UserMinus className="h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                            </>
                          )}
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
          <Users className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No coaches yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first coach to start building the directory.
          </p>
          {canAdd && resolvedChapterId && (
            <Button asChild className="mt-4">
              <Link href="/dashboard/coaches/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Coach
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

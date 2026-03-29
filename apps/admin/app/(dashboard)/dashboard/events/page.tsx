import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { EventsClient } from "./events-client";

export default async function EventsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const isAdmin = isSuperAdmin(user.roles);
  const cookieStore = await cookies();
  const selectedChapterCookie = cookieStore.get("selected-chapter")?.value;
  const resolvedChapterId = isAdmin
    ? selectedChapterCookie || undefined
    : user.roles.find((r) => r.chapter_id)?.chapter_id ?? undefined;

  if (!resolvedChapterId && !isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Events</h1>
        <p className="text-muted-foreground">
          Select a chapter to manage events.
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  let query = supabase
    .from("events")
    .select("*, chapters(name)")
    .order("start_date", { ascending: false });

  if (resolvedChapterId) {
    query = query.eq("chapter_id", resolvedChapterId);
  }

  const { data: events } = await query;

  const canManage =
    isAdmin ||
    user.roles.some(
      (r) => r.chapter_id === resolvedChapterId && r.role === "chapter_lead"
    );

  return (
    <EventsClient
      events={events ?? []}
      chapterId={resolvedChapterId ?? null}
      canManage={canManage}
      userId={user.id}
      isGlobalView={isAdmin && !resolvedChapterId}
    />
  );
}

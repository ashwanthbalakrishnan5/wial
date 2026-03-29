import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ClientOrgsClient } from "./clients-client";

export default async function ClientOrgsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const isAdmin = isSuperAdmin(user.roles);
  const cookieStore = await cookies();
  const selectedChapterCookie = cookieStore.get("selected-chapter")?.value;
  const resolvedChapterId = isAdmin
    ? selectedChapterCookie || undefined
    : user.roles.find((r) => r.chapter_id)?.chapter_id ?? undefined;

  if (!resolvedChapterId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Client Organizations
        </h1>
        <p className="text-muted-foreground">
          Select a chapter to manage client organizations.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("client_organizations")
    .select("*")
    .eq("chapter_id", resolvedChapterId)
    .order("sort_order");

  const canManage =
    isAdmin ||
    user.roles.some(
      (r) => r.chapter_id === resolvedChapterId && r.role === "chapter_lead"
    );

  return (
    <ClientOrgsClient
      clients={clients ?? []}
      chapterId={resolvedChapterId}
      canManage={canManage}
    />
  );
}

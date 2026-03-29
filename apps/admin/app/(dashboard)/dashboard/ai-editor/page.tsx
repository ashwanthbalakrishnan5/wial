import { getAuthUser, isSuperAdmin, getUserRoleForChapter } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { AiEditorClient } from "./ai-editor-client";

export default async function AiEditorPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  // Auto-resolve chapter from user roles
  const isAdmin = isSuperAdmin(user.roles);
  const resolvedChapterId = !isAdmin
    ? user.roles.find((r) => r.chapter_id)?.chapter_id ?? undefined
    : undefined;

  if (!resolvedChapterId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">AI Editor</h1>
          <p className="text-muted-foreground">
            Select a chapter to start editing with AI.
          </p>
        </div>
      </div>
    );
  }

  // Authorization: super admins or chapter leads only
  const role = isSuperAdmin(user.roles)
    ? "super_admin"
    : getUserRoleForChapter(user.roles, resolvedChapterId);

  if (!role || (role !== "super_admin" && role !== "chapter_lead")) {
    redirect("/dashboard");
  }

  const { data: chapter } = await supabase
    .from("chapters")
    .select("*")
    .eq("id", resolvedChapterId)
    .single();

  if (!chapter) redirect("/dashboard");

  // Fetch recent AI edit sessions for this chapter (identified by approval_status being set)
  const { data: aiDeployments } = await supabase
    .from("deployments")
    .select("*, profiles(full_name)")
    .eq("chapter_id", resolvedChapterId)
    .not("approval_status", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <AiEditorClient
      chapter={chapter}
      initialDeployments={(aiDeployments as any) ?? []}
    />
  );
}

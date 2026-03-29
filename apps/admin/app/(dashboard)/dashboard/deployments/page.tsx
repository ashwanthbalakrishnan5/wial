import { getAuthUser, isSuperAdmin, getUserRoleForChapter } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { DeploymentsClient } from "./deployments-client";

export default async function DeploymentsPage() {
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
          <h1 className="text-3xl font-semibold tracking-tight">Deployments</h1>
          <p className="text-muted-foreground">Select a chapter to manage deployments.</p>
        </div>
      </div>
    );
  }

  // Authorization: super admins see all, chapter leads see their own
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

  const { data: deployments } = await supabase
    .from("deployments")
    .select("*, profiles(full_name)")
    .eq("chapter_id", resolvedChapterId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <DeploymentsClient
      chapter={chapter}
      initialDeployments={(deployments as any) ?? []}
    />
  );
}

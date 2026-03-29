import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect, notFound } from "next/navigation";
import { CoachEditForm } from "./coach-edit-form";

export default async function CoachDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: coach } = await supabase
    .from("coaches")
    .select("*")
    .eq("id", id)
    .single();

  if (!coach) notFound();

  const isAdmin = isSuperAdmin(user.roles);
  const isChapterLead = user.roles.some(
    (r) => r.chapter_id === coach.chapter_id && r.role === "chapter_lead"
  );
  const isSelfEdit = coach.user_id === user.id;
  const canEdit = isAdmin || isChapterLead || isSelfEdit;
  const isRestricted = isSelfEdit && !isAdmin && !isChapterLead;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {canEdit ? "Edit Coach" : "Coach Profile"}
        </h1>
        <p className="text-muted-foreground">{coach.full_name}</p>
      </div>
      <CoachEditForm coach={coach} canEdit={canEdit} isRestricted={isRestricted} />
    </div>
  );
}

import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@repo/ui/table";
import { Badge } from "@repo/ui/badge";
import { UserManagementClient } from "./user-management-client";

export default async function UsersPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const isAdmin = isSuperAdmin(user.roles);
  const cookieStore = await cookies();
  const selectedChapterCookie = cookieStore.get("selected-chapter")?.value;
  const resolvedChapterId = isAdmin
    ? selectedChapterCookie || undefined
    : user.roles.find((r) => r.chapter_id)?.chapter_id ?? undefined;

  // Fetch users with roles
  let query = supabase
    .from("user_roles")
    .select("*, profiles(full_name, email, avatar_url)")
    .order("created_at", { ascending: false });

  if (resolvedChapterId) {
    query = query.eq("chapter_id", resolvedChapterId);
  }

  const { data: roles } = await query;

  // Fetch invitations with inviter profile
  let invQuery = supabase
    .from("invitations")
    .select("*, inviter:profiles!invited_by(full_name, email)")
    .order("created_at", { ascending: false });

  if (resolvedChapterId) {
    invQuery = invQuery.eq("chapter_id", resolvedChapterId);
  }

  const { data: invitations } = await invQuery;

  return (
    <UserManagementClient
      roles={roles ?? []}
      invitations={invitations ?? []}
      chapterId={resolvedChapterId ?? null}
      isSuperAdmin={isAdmin}
    />
  );
}

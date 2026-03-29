import { redirect } from "next/navigation";
import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ChapterProvider } from "@/components/providers/chapter-provider";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { SidebarProvider, SidebarInset } from "@repo/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  // Fetch chapters based on role
  let chapters;
  if (isSuperAdmin(user.roles)) {
    const { data } = await supabase
      .from("chapters")
      .select("*")
      .order("name");
    chapters = data ?? [];
  } else {
    const chapterIds = user.roles
      .filter((r) => r.chapter_id)
      .map((r) => r.chapter_id!);

    if (chapterIds.length > 0) {
      const { data } = await supabase
        .from("chapters")
        .select("*")
        .in("id", chapterIds)
        .order("name");
      chapters = data ?? [];
    } else {
      chapters = [];
    }
  }

  // Auto-resolve chapter from user's role — no manual selection needed
  const resolvedChapterId = isSuperAdmin(user.roles)
    ? null
    : user.roles.find((r) => r.chapter_id)?.chapter_id ?? null;

  return (
    <AuthProvider user={user}>
      <ChapterProvider chapters={chapters} resolvedChapterId={resolvedChapterId}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <AppHeader />
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </ChapterProvider>
    </AuthProvider>
  );
}

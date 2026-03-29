import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { TestimonialsClient } from "./testimonials-client";

export default async function TestimonialsPage() {
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
          Testimonials
        </h1>
        <p className="text-muted-foreground">
          Select a chapter to manage testimonials.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("*")
    .eq("chapter_id", resolvedChapterId)
    .order("sort_order");

  return (
    <TestimonialsClient
      testimonials={testimonials ?? []}
      chapterId={resolvedChapterId}
    />
  );
}

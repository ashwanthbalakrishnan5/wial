"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { useAuth } from "@/components/providers/auth-provider";
import { LogOut, User } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { useTranslations } from "next-intl";

export function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");
  const tn = useTranslations("nav");
  const tui = useTranslations("ui");

  if (!user) return null;

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const primaryRole = user.roles[0]?.role ?? "user";
  const roleLabel = tui.has(`roleLabels.${primaryRole}`)
    ? tui(`roleLabels.${primaryRole}`)
    : primaryRole.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="font-medium">{user.fullName}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
          <Badge variant="secondary" className="w-fit text-xs">
            {roleLabel}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/profile")}
        >
          <User className="mr-2 h-4 w-4" />
          {tn("myProfile")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@repo/ui/sidebar";
import { useAuth, useIsSuperAdmin } from "@/components/providers/auth-provider";
import { useChapter } from "@/components/providers/chapter-provider";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCog,
  Settings,
  FileText,
  Quote,
  Rocket,
  UserCircle,
  Calendar,
  Building,
  BookOpen,
  Sparkles,
  CreditCard,
  BarChart3,
  DollarSign,
} from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
};

function getNavItems(
  role: string | null,
  isSuperAdmin: boolean,
  t: (key: string) => string
): NavItem[] {
  if (isSuperAdmin) {
    return [
      { title: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
      { title: t("chapters"), href: "/dashboard/chapters", icon: Building2 },
      { title: t("coachDirectory"), href: "/dashboard/coaches", icon: Users },
      { title: t("events"), href: "/dashboard/events", icon: Calendar },
      { title: t("users"), href: "/dashboard/users", icon: UserCog },
      { title: t("revenue"), href: "/dashboard/revenue", icon: DollarSign },
      { title: t("analytics"), href: "/dashboard/analytics", icon: BarChart3 },
      { title: t("settings"), href: "/dashboard/settings", icon: Settings },
    ];
  }

  if (role === "chapter_lead") {
    return [
      { title: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
      { title: t("coaches"), href: "/dashboard/coaches", icon: Users },
      { title: t("content"), href: "/dashboard/content", icon: FileText },
      { title: t("testimonials"), href: "/dashboard/testimonials", icon: Quote },
      { title: t("events"), href: "/dashboard/events", icon: Calendar },
      { title: t("clients"), href: "/dashboard/clients", icon: Building },
      { title: t("aiEditor"), href: "/dashboard/ai-editor", icon: Sparkles },
      { title: t("users"), href: "/dashboard/users", icon: UserCog },
      { title: t("deployments"), href: "/dashboard/deployments", icon: Rocket },
      { title: t("payments"), href: "/dashboard/payments", icon: CreditCard },
      { title: t("chapterSettings"), href: "/dashboard/settings", icon: Settings },
    ];
  }

  if (role === "content_creator") {
    return [
      { title: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
      { title: t("content"), href: "/dashboard/content", icon: FileText },
      { title: t("coaches"), href: "/dashboard/coaches", icon: Users },
    ];
  }

  if (role === "coach") {
    return [
      { title: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
      { title: t("myProfile"), href: "/dashboard/profile", icon: UserCircle },
    ];
  }

  return [
    { title: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
  ];
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isSuperAdmin = useIsSuperAdmin();
  const { selectedChapterId } = useChapter();
  const t = useTranslations("nav");

  const role = user?.roles.find((r) => r.chapter_id === selectedChapterId)?.role ?? null;
  const navItems = getNavItems(role, isSuperAdmin, t);

  const initials = user?.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";

  return (
    <Sidebar collapsible="icon">
      {/* Logo zone — matches sidebar dark background */}
      <SidebarHeader className="border-b border-sidebar-border/30 p-0">
        <div className="flex h-16 items-center px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold min-w-0">
            <Building2 className="h-5 w-5 shrink-0 text-sidebar-primary" />
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden truncate">
              WIAL Admin
            </span>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-widest px-4 mb-1">
            {t("navigation")}
          </SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = pathname === item.href.split("?")[0];
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                    className="relative mx-2 rounded-md px-3 h-10 gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                  >
                    <Link href={item.href}>
                      {/* Golden yellow active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-secondary" />
                      )}
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="font-medium text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/30 p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            {initials}
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium leading-none text-sidebar-foreground truncate">
              {user?.fullName}
            </span>
            <span className="text-xs text-sidebar-foreground/60 truncate mt-0.5">
              {user?.email}
            </span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

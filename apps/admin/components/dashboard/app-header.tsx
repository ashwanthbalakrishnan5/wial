"use client";

import { Bell } from "lucide-react";
import { SidebarTrigger } from "@repo/ui/sidebar";
import { Button } from "@repo/ui/button";
import { ChapterContextSelector } from "./chapter-context-selector";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function AppHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <ChapterContextSelector />
      </div>
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

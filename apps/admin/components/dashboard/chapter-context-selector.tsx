"use client";

import { useRouter } from "next/navigation";
import { useChapter } from "@/components/providers/chapter-provider";
import { useIsSuperAdmin } from "@/components/providers/auth-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Button } from "@repo/ui/button";
import { ChevronDown, Check, Globe } from "lucide-react";

const STATUS_DOT: Record<string, string> = {
  active: "bg-green-500",
  suspended: "bg-amber-500",
  archived: "bg-muted-foreground",
};

export function ChapterContextSelector() {
  const router = useRouter();
  const { chapters, selectedChapterId, selectedChapter, setSelectedChapterId } =
    useChapter();
  const isSuperAdmin = useIsSuperAdmin();

  // Only show for users with multiple chapters or super admins
  if (!isSuperAdmin && chapters.length <= 1) return null;

  const displayName = selectedChapter
    ? selectedChapter.name.length > 24
      ? selectedChapter.name.slice(0, 24) + "…"
      : selectedChapter.name
    : "Global";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-3 max-w-[240px]">
          {selectedChapter ? (
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[selectedChapter.status] ?? STATUS_DOT.active}`}
            />
          ) : (
            <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate text-sm font-medium">{displayName}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[300px]">
        {isSuperAdmin && (
          <>
            <DropdownMenuItem
              onClick={() => {
                setSelectedChapterId(null);
                router.refresh();
              }}
              className="gap-3"
            >
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <span className="font-medium">Global</span>
              </div>
              {selectedChapterId === null && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {chapters.map((ch) => (
          <DropdownMenuItem
            key={ch.id}
            onClick={() => {
              setSelectedChapterId(ch.id);
              router.refresh();
            }}
            className="gap-3"
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[ch.status] ?? STATUS_DOT.active}`}
            />
            <div className="flex-1 min-w-0">
              <span className="truncate text-sm">{ch.name}</span>
            </div>
            {selectedChapterId === ch.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

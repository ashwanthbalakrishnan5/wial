"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { Tables } from "@repo/types";

export type Chapter = Tables<"chapters">;

type ChapterContextType = {
  selectedChapterId: string | null;
  selectedChapter: Chapter | null;
  chapters: Chapter[];
  setSelectedChapterId: (id: string | null) => void;
};

const ChapterContext = createContext<ChapterContextType>({
  selectedChapterId: null,
  selectedChapter: null,
  chapters: [],
  setSelectedChapterId: () => {},
});

export function ChapterProvider({
  chapters,
  resolvedChapterId,
  children,
}: {
  chapters: Chapter[];
  resolvedChapterId: string | null;
  children: React.ReactNode;
}) {
  const [chapterId, setChapterId] = useState<string | null>(resolvedChapterId);

  const selectedChapter =
    chapters.find((c) => c.id === chapterId) ?? null;

  const setSelectedChapterId = useCallback(
    (id: string | null) => {
      setChapterId(id);
      // Persist to cookie so server components can read it
      document.cookie = `selected-chapter=${id ?? ""}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    },
    []
  );

  return (
    <ChapterContext.Provider
      value={{
        selectedChapterId: chapterId,
        selectedChapter,
        chapters,
        setSelectedChapterId,
      }}
    >
      {children}
    </ChapterContext.Provider>
  );
}

export function useChapter() {
  return useContext(ChapterContext);
}

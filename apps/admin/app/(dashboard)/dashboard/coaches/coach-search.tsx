"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@repo/supabase/client";
import { Input } from "@repo/ui/input";
import { Loader2, Search, X, Sparkles } from "lucide-react";
import Link from "next/link";

interface SearchResult {
  id: string;
  full_name: string;
  certification_level: string;
  specializations: string[];
  languages: string[];
  city: string | null;
  country: string | null;
  photo_url: string | null;
  similarity: number;
  chapter_id: string;
}

const certBadgeClass: Record<string, string> = {
  CALC: "bg-blue-100 text-blue-700 border-l-2 border-blue-500 dark:bg-blue-900/30 dark:text-blue-300",
  SALC: "bg-green-100 text-green-700 border-l-2 border-green-500 dark:bg-green-900/30 dark:text-green-300",
  MALC: "bg-amber-100 text-amber-700 border-l-2 border-amber-500 dark:bg-amber-900/30 dark:text-amber-300",
  PALC: "bg-purple-100 text-purple-700 border-l-2 border-purple-600 dark:bg-purple-900/30 dark:text-purple-300",
};

export function CoachSearch({ chapterId }: { chapterId?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults(null);
        setMode("");
        return;
      }

      setLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const res = await fetch(`${supabaseUrl}/functions/v1/semantic-search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
          },
          body: JSON.stringify({
            query: q,
            chapter_id: chapterId || null,
          }),
        });

        if (!res.ok) {
          console.error("Search failed:", await res.text());
          setResults([]);
          return;
        }

        const data = await res.json();
        setResults(data.coaches ?? []);
        setMode(data.mode ?? "");
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [chapterId]
  );

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 500);
  };

  const clearSearch = () => {
    setQuery("");
    setResults(null);
    setMode("");
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search coaches with natural language..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {query && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground italic">
          <Sparkles className="h-3 w-3" />
          Semantic search enabled — try natural language queries in any language
        </p>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {results !== null && !loading && (
        <div className="space-y-2">
          {results.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No coaches matched your search. Try different words.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""}{" "}
                {mode === "semantic" && "by relevance"}
              </p>
              <div className="rounded-md border divide-y">
                {results.map((coach) => {
                  const location = [coach.city, coach.country]
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <Link
                      key={coach.id}
                      href={`/dashboard/coaches/${coach.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                    >
                      {/* Avatar */}
                      {coach.photo_url ? (
                        <img
                          src={coach.photo_url}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {coach.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{coach.full_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {location && <span>{location}</span>}
                          {coach.languages.length > 0 && (
                            <span>{coach.languages.join(", ")}</span>
                          )}
                        </div>
                      </div>

                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${certBadgeClass[coach.certification_level] ?? "bg-muted text-muted-foreground"}`}>
                        {coach.certification_level}
                      </span>

                      {mode === "semantic" && coach.similarity > 0 && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {Math.round(coach.similarity * 100)}%
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

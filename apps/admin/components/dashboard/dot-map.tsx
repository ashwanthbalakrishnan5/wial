"use client";

import { useEffect, useState } from "react";
import { Badge } from "@repo/ui/badge";
import { useTranslations } from "next-intl";

// Approximate Mercator-projected positions for WIAL chapter locations (x%, y%)
const CHAPTERS = [
  { x: 22, y: 38, label: "USA", coaches: 12, status: "active" },
  { x: 49, y: 52, label: "Nigeria", coaches: 8, status: "active" },
  { x: 32, y: 62, label: "Brazil", coaches: 6, status: "active" },
  { x: 51, y: 35, label: "Germany", coaches: 5, status: "active" },
  { x: 78, y: 50, label: "Vietnam", coaches: 4, status: "active" },
  { x: 82, y: 54, label: "Philippines", coaches: 7, status: "active" },
  { x: 72, y: 50, label: "India", coaches: 3, status: "active" },
  { x: 55, y: 58, label: "Kenya", coaches: 5, status: "active" },
  { x: 84, y: 38, label: "South Korea", coaches: 4, status: "active" },
] as const;

export function DotMap() {
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("dashboard");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-80 bg-muted/20 rounded-xl animate-pulse" />;

  return (
    <div className="relative w-full rounded-xl border bg-card overflow-hidden">
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("globalNetwork")}</h3>
          <p className="text-xs text-muted-foreground">{CHAPTERS.length} {t("activeChapters")}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {t("active")}
          </span>
        </div>
      </div>

      <div className="relative w-full aspect-[2.2/1] min-h-[280px]">
        {/* World map SVG — simplified continent outlines */}
        <svg
          viewBox="0 0 1000 450"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Graticule lines */}
          {[0, 100, 200, 300, 400].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="1000" y2={y} stroke="currentColor" strokeWidth="0.5" className="text-border/40" strokeDasharray="4 8" />
          ))}
          {[0, 200, 400, 600, 800, 1000].map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="450" stroke="currentColor" strokeWidth="0.5" className="text-border/40" strokeDasharray="4 8" />
          ))}

          {/* North America */}
          <path
            d="M80,80 L120,60 L180,55 L220,70 L260,65 L280,80 L270,100 L260,120 L240,140 L220,160 L200,180 L180,190 L160,200 L140,210 L120,200 L100,180 L90,160 L80,140 L75,120 L78,100 Z"
            fill="currentColor"
            className="text-muted-foreground/8"
          />
          {/* Central America */}
          <path
            d="M160,200 L170,215 L175,230 L180,240 L170,245 L165,235 L155,225 L150,210 Z"
            fill="currentColor"
            className="text-muted-foreground/8"
          />
          {/* South America */}
          <path
            d="M200,245 L230,240 L270,250 L300,260 L320,280 L330,310 L325,340 L310,370 L290,390 L270,400 L250,395 L235,380 L225,360 L215,330 L210,300 L205,275 L200,260 Z"
            fill="currentColor"
            className="text-muted-foreground/8"
          />
          {/* Europe */}
          <path
            d="M440,65 L460,55 L490,50 L520,55 L545,60 L555,75 L560,90 L550,105 L535,115 L520,120 L500,125 L480,130 L460,125 L445,115 L440,100 L438,85 Z"
            fill="currentColor"
            className="text-muted-foreground/8"
          />
          {/* Africa */}
          <path
            d="M445,155 L470,145 L500,140 L530,145 L555,155 L570,175 L575,200 L570,230 L560,260 L545,285 L525,300 L505,305 L485,300 L465,285 L450,265 L440,240 L435,215 L438,190 L440,170 Z"
            fill="currentColor"
            className="text-muted-foreground/8"
          />
          {/* Asia */}
          <path
            d="M570,55 L620,45 L670,40 L720,45 L770,55 L810,70 L840,85 L860,105 L865,130 L855,155 L840,170 L810,180 L780,185 L750,180 L720,170 L690,165 L660,155 L635,145 L610,130 L590,110 L575,90 L570,70 Z"
            fill="currentColor"
            className="text-muted-foreground/8"
          />
          {/* Southeast Asia / Indonesia */}
          <path
            d="M730,200 L760,195 L790,200 L820,210 L850,220 L870,230 L860,240 L830,245 L800,240 L770,235 L745,225 L730,215 Z"
            fill="currentColor"
            className="text-muted-foreground/8"
          />
          {/* Australia */}
          <path
            d="M780,310 L820,300 L860,305 L890,315 L910,330 L905,355 L890,370 L865,380 L835,385 L805,375 L785,360 L780,340 L778,325 Z"
            fill="currentColor"
            className="text-muted-foreground/8"
          />

          {/* Connection lines between chapters */}
          {CHAPTERS.map((from, i) =>
            CHAPTERS.slice(i + 1).map((to, j) => {
              const x1 = (from.x / 100) * 1000;
              const y1 = (from.y / 100) * 450;
              const x2 = (to.x / 100) * 1000;
              const y2 = (to.y / 100) * 450;
              const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
              if (dist > 350) return null; // Only connect nearby chapters
              return (
                <line
                  key={`${i}-${j}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="currentColor"
                  strokeWidth="0.8"
                  className="text-primary/15"
                  strokeDasharray="3 6"
                />
              );
            })
          )}
        </svg>

        {/* Pulsing chapter dots */}
        {CHAPTERS.map((chapter, i) => (
          <div
            key={chapter.label}
            className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: `${chapter.x}%`, top: `${chapter.y}%` }}
          >
            {/* Ping ring */}
            <div
              className="absolute inset-[-4px] rounded-full bg-primary/30 animate-ping"
              style={{ animationDuration: "2.5s", animationDelay: `${i * 0.4}s` }}
            />
            {/* Outer glow */}
            <div className="absolute inset-[-3px] rounded-full bg-primary/20" />
            {/* Dot */}
            <div className="relative w-3 h-3 rounded-full bg-primary shadow-sm shadow-primary/30 ring-2 ring-card" />

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100 pointer-events-none z-10">
              <div className="bg-popover text-popover-foreground border shadow-lg rounded-lg px-3 py-2 text-center whitespace-nowrap">
                <p className="text-sm font-semibold">{chapter.label}</p>
                <p className="text-xs text-muted-foreground">{chapter.coaches} {t("coachesCount")}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chapter chips legend */}
      <div className="px-5 py-3 border-t flex gap-2 overflow-x-auto">
        {CHAPTERS.map((chapter) => (
          <Badge key={chapter.label} variant="outline" className="shrink-0 gap-1.5 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {chapter.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}

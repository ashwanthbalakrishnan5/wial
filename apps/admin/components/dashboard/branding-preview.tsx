"use client";

import { Card } from "@repo/ui/card";
import { useTranslations } from "next-intl";

interface BrandingPreviewProps {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  font: string;
}

export function BrandingPreview({ name, primaryColor, secondaryColor, accentColor, font }: BrandingPreviewProps) {
  // Use a fallback font if empty
  const fontFamily = font || "Lexend, sans-serif";
  const t = useTranslations("dashboard");
  
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t("livePreview")}</span>
      <Card className="overflow-hidden h-[400px] flex flex-col shadow-inner" style={{ fontFamily }}>
        {/* Mock Header */}
        <div className="h-12 border-b flex items-center justify-between px-4 bg-white shrink-0">
          <div className="font-bold text-sm truncate max-w-[120px]" style={{ color: primaryColor }}>{name}</div>
          <div className="flex gap-2 text-[10px] text-slate-500 font-sans">
            <span className="hidden sm:inline">{t("home")}</span>
            <span className="hidden sm:inline">{t("about")}</span>
            <span style={{ color: primaryColor, borderBottom: `2px solid ${accentColor}` }} className="font-medium pb-0.5">{t("coachesCount")}</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-slate-50 relative">
          {/* Mock Hero */}
          <div className="p-6 pb-12 relative overflow-hidden" style={{ backgroundColor: `${primaryColor}10` }}>
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-bl-full" style={{ backgroundColor: primaryColor }} />
            <h1 className="text-xl md:text-2xl font-bold mb-2 relative z-10" style={{ color: primaryColor }}>{t("welcomeTo")} {name}</h1>
            <p className="text-xs text-slate-600 mb-4 font-sans max-w-[90%] relative z-10">{t("empoweringLeaders")}</p>
            <div 
              className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-semibold text-slate-900 shadow-sm relative z-10" 
              style={{ backgroundColor: accentColor }}
            >
              {t("getStarted")}
            </div>
          </div>

          {/* Mock Coach Card */}
          <div className="px-6 -mt-8 pb-6 relative z-20">
            <div className="bg-white rounded-xl shadow-md border border-slate-100 p-5 text-center transition-transform hover:-translate-y-1">
              <div className="w-14 h-14 rounded-full mx-auto mb-2 text-white flex items-center justify-center text-sm font-bold shadow-sm border-2 border-white" style={{ backgroundColor: '#22c55e' }}>
                JD
              </div>
              <div className="font-semibold text-sm mb-1">Jane Doe</div>
              <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full border-l-2 mb-3 font-sans" style={{ borderColor: '#22c55e', backgroundColor: '#22c55e15', color: '#166534' }}>SALC</span>
              <div className="text-[10px] text-slate-500 font-sans mb-3 flex justify-center gap-1">
                <span className="bg-slate-100 px-1.5 py-0.5 rounded">Leadership</span>
                <span className="bg-slate-100 px-1.5 py-0.5 rounded">Exec</span>
              </div>
              <div className="text-xs font-medium flex items-center justify-center gap-1" style={{ color: primaryColor }}>
                {t("viewProfile")}
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

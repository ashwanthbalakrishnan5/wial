"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { Badge } from "@repo/ui/badge";
import { toast } from "sonner";
import { Switch } from "@repo/ui/switch";
import { Loader2, Plus, X } from "lucide-react";
import type { Tables } from "@repo/types";
import { BrandingPreview } from "@/components/dashboard/branding-preview";
import { useTranslations } from "next-intl";

type Chapter = Tables<"chapters">;

const AVAILABLE_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Espa\u00f1ol" },
  { code: "fr", name: "Fran\u00e7ais" },
  { code: "pt", name: "Portugu\u00eas" },
  { code: "de", name: "Deutsch" },
  { code: "yo", name: "Yor\u00f9b\u00e1" },
  { code: "vi", name: "Ti\u1ebfng Vi\u1ec7t" },
  { code: "ko", name: "\ud55c\uad6d\uc5b4" },
  { code: "ja", name: "\u65e5\u672c\u8a9e" },
  { code: "zh", name: "\u4e2d\u6587" },
  { code: "ar", name: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
  { code: "hi", name: "\u0939\u093f\u0928\u094d\u0926\u0940" },
  { code: "sw", name: "Kiswahili" },
  { code: "tl", name: "Filipino" },
];

export function SettingsClient({
  chapter,
  canEditBranding,
  aiCoachMatchingEnabled = false,
}: {
  chapter: Chapter;
  canEditBranding: boolean;
  aiCoachMatchingEnabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const t = useTranslations("settings");
  const tc = useTranslations("common");

  // Branding state
...
  async function handleSaveBranding() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("chapters")
      .update({
        brand_primary_color: primaryColor,
        brand_secondary_color: secondaryColor,
        brand_accent_color: accentColor,
        brand_font: font,
      })
      .eq("id", chapter.id);

    if (error) toast.error(error.message);
    else {
      toast.success("Branding saved.");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleSaveContact() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("chapters")
      .update({
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        contact_address: contactAddress || null,
      })
      .eq("id", chapter.id);

    if (error) toast.error(error.message);
    else {
      toast.success("Contact information saved.");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleSaveLanguages() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("chapters")
      .update({ active_languages: activeLanguages })
      .eq("id", chapter.id);

    if (error) toast.error(error.message);
    else {
      toast.success("Languages updated.");
      router.refresh();
    }
    setLoading(false);
  }
...
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">
          {t("configure", { name: chapter.name })}
        </p>
      </div>

      <Tabs defaultValue="branding">
        <TabsList>
          <TabsTrigger value="branding">{t("branding")}</TabsTrigger>
          <TabsTrigger value="contact">{t("contact")}</TabsTrigger>
          <TabsTrigger value="languages">{t("languages")}</TabsTrigger>
          <TabsTrigger value="general">{t("general")}</TabsTrigger>
          <TabsTrigger value="ai">{t("aiFeatures")}</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("brandColors")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: t("primary"), value: primaryColor, set: setPrimaryColor },
                    { label: t("secondary"), value: secondaryColor, set: setSecondaryColor },
                    { label: t("accent"), value: accentColor, set: setAccentColor },
                  ].map((c) => (
                    <div key={c.label} className="space-y-2">
                      <Label>{c.label}</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={c.value}
                          onChange={(e) => c.set(e.target.value)}
                          className="h-10 w-10 cursor-pointer rounded border"
                          disabled={!canEditBranding}
                        />
                        <Input
                          value={c.value}
                          onChange={(e) => c.set(e.target.value)}
                          disabled={!canEditBranding}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>{t("fontFamily")}</Label>
                  <Input
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                    disabled={!canEditBranding}
                  />
                </div>
                {canEditBranding && (
                  <div className="flex justify-end">
                    <Button onClick={handleSaveBranding} disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t("saveBranding")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <BrandingPreview 
              name={chapter.name}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              accentColor={accentColor}
              font={font || "Lexend"}
            />
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("contactInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("email")}</Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("phone")}</Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("address")}</Label>
                <Input
                  value={contactAddress}
                  onChange={(e) => setContactAddress(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveContact} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("saveContactInfo")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("activeLanguages")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("manageLanguages")}
              </p>
              <div className="flex flex-wrap gap-2">
                {activeLanguages.map((code) => {
                  const lang = AVAILABLE_LANGUAGES.find((l) => l.code === code);
                  const isDefault = code === chapter.default_language;
                  return (
                    <Badge
                      key={code}
                      variant="secondary"
                      className="gap-1 py-1.5 pl-3 pr-1.5 text-sm"
                    >
                      {lang?.name ?? code.toUpperCase()}
                      {isDefault && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({tc("default")})
                        </span>
                      )}
                      {!isDefault && (
                        <button
                          onClick={() => removeLanguage(code)}
                          className="ml-1 rounded p-0.5 hover:bg-destructive/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  );
                })}
              </div>
              {availableToAdd.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    id="add-language"
                    className="rounded-md border bg-transparent px-3 py-2 text-sm"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        addLanguage(e.target.value);
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="" disabled>
                      {t("addLanguage")}
                    </option>
                    {availableToAdd.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.name} ({l.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={handleSaveLanguages} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("saveLanguages")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("generalInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("chapterName")}</Label>
                <Input value={chapter.name} disabled />
                <p className="text-xs text-muted-foreground">
                  {t("contactAdmin")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t("slug")}</Label>
                <Input value={chapter.slug} disabled />
              </div>
              <div className="space-y-2">
                <Label>{t("subdomain")}</Label>
                <Input
                  value={`${chapter.subdomain}.wial.ashwanthbk.com`}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>{t("status")}</Label>
                <Badge
                  variant={
                    chapter.status === "active"
                      ? "default"
                      : chapter.status === "suspended"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {chapter.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("aiCoachMatching")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("aiCoachMatchingDesc")}
              </p>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>{t("aiCoachMatchingWidget")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("aiCoachMatchingWidgetDesc")}
                  </p>
                </div>
                <Switch
                  checked={aiMatching}
                  onCheckedChange={(checked) => handleSaveAiMatching(checked)}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import { Switch } from "@repo/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Building, ExternalLink } from "lucide-react";
import type { Tables } from "@repo/types";
import { useTranslations } from "next-intl";

type ClientOrg = Tables<"client_organizations">;

export function ClientOrgsClient({
  clients,
  chapterId,
  canManage,
}: {
  clients: ClientOrg[];
  chapterId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClientOrg | null>(null);
  const [loading, setLoading] = useState(false);
  const t = useTranslations("clients");
  const tc = useTranslations("common");

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  function openCreate() {
    setEditing(null);
    setName("");
    setLogoUrl("");
    setWebsiteUrl("");
    setDescription("");
    setSortOrder(clients.length);
    setIsActive(true);
    setDialogOpen(true);
  }

  function openEdit(c: ClientOrg) {
    setEditing(c);
    setName(c.name);
    setLogoUrl(c.logo_url ?? "");
    setWebsiteUrl(c.website_url ?? "");
    setDescription(c.description ?? "");
    setSortOrder(c.sort_order);
    setIsActive(c.is_active);
    setDialogOpen(true);
  }

  async function handleSave() {
    setLoading(true);
    const supabase = createClient();

    const payload = {
      name,
      logo_url: logoUrl || null,
      website_url: websiteUrl || null,
      description: description || null,
      sort_order: sortOrder,
      is_active: isActive,
    };

    if (editing) {
      const { error } = await supabase
        .from("client_organizations")
        .update(payload)
        .eq("id", editing.id);
      if (error) toast.error(error.message);
      else toast.success("Client updated.");
    } else {
      const { error } = await supabase.from("client_organizations").insert({
        ...payload,
        chapter_id: chapterId,
      });
      if (error) toast.error(error.message);
      else toast.success("Client added.");
    }

    setDialogOpen(false);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("client_organizations")
      .delete()
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Client removed.");
      router.refresh();
    }
  }

  async function toggleActive(id: string, value: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from("client_organizations")
      .update({ is_active: value })
      .eq("id", id);
    if (error) toast.error(error.message);
    else router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addClient")}
          </Button>
        )}
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Building className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t("noClients")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("noClientsDesc")}
          </p>
          {canManage && (
            <Button onClick={openCreate} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              {t("addClient")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {c.logo_url ? (
                    <img
                      src={c.logo_url}
                      alt={c.name}
                      className="h-20 w-20 rounded-md object-contain border"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Building className="h-8 w-8" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{c.name}</p>
                    {c.website_url && (
                      <a
                        href={c.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
                      >
                        {tc("websiteUrl") || "Website"} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
                <Switch
                  checked={c.is_active}
                  onCheckedChange={(v) => toggleActive(c.id, v)}
                  disabled={!canManage}
                />
              </div>
              {c.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {c.description}
                </p>
              )}
              {canManage && (
                <div className="flex gap-1 pt-1 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(c)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    {tc("edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(c.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    {tc("remove")}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? t("editClient") : t("addClient")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("orgName")}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("logoUrl")}</Label>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="h-20 w-20 rounded-md object-contain border"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("websiteUrl")}</Label>
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>{tc("description") || t("description")}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("sortOrder")}</Label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>{tc("active")}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={loading || !name}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? tc("saveChanges") : t("addClient")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

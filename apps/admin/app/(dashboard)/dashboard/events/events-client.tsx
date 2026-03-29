"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import { Button } from "@repo/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";
import { Switch } from "@repo/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  MapPin,
  Video,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

const typeBadgeClass: Record<string, string> = {
  certification: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  workshop: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  meetup: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  webinar: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

type Event = {
  id: string;
  chapter_id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
  is_virtual: boolean;
  virtual_link: string | null;
  max_attendees: number | null;
  registration_link: string | null;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  chapters?: { name: string } | null;
};

const EVENT_TYPES = ["certification", "workshop", "meetup", "webinar"] as const;

export function EventsClient({
  events,
  chapterId,
  canManage,
  userId,
  isGlobalView,
}: {
  events: Event[];
  chapterId: string | null;
  canManage: boolean;
  userId: string;
  isGlobalView: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("events");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("upcoming");
  const [filterPublished, setFilterPublished] = useState<string>("all");

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatDateRange(start: string, end: string | null): string {
    if (!end) return formatDate(start);
    const s = new Date(start);
    const e = new Date(end);
    if (s.toDateString() === e.toDateString()) return formatDate(start);
    return `${formatDate(start)} – ${formatDate(end)}`;
  }

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<string>("workshop");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [isVirtual, setIsVirtual] = useState(false);
  const [virtualLink, setVirtualLink] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [registrationLink, setRegistrationLink] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  function openCreate() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setEventType("workshop");
    setStartDate("");
    setEndDate("");
    setLocation("");
    setIsVirtual(false);
    setVirtualLink("");
    setMaxAttendees("");
    setRegistrationLink("");
    setIsPublished(false);
    setDialogOpen(true);
  }

  function openEdit(evt: Event) {
    setEditing(evt);
    setTitle(evt.title);
    setDescription(evt.description ?? "");
    setEventType(evt.event_type);
    setStartDate(evt.start_date.slice(0, 16));
    setEndDate(evt.end_date ? evt.end_date.slice(0, 16) : "");
    setLocation(evt.location ?? "");
    setIsVirtual(evt.is_virtual);
    setVirtualLink(evt.virtual_link ?? "");
    setMaxAttendees(evt.max_attendees?.toString() ?? "");
    setRegistrationLink(evt.registration_link ?? "");
    setIsPublished(evt.is_published);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!chapterId && !editing) return;
    setLoading(true);
    const supabase = createClient();

    const payload = {
      title,
      description: description || null,
      event_type: eventType,
      start_date: new Date(startDate).toISOString(),
      end_date: endDate ? new Date(endDate).toISOString() : null,
      location: location || null,
      is_virtual: isVirtual,
      virtual_link: isVirtual ? virtualLink || null : null,
      max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
      registration_link: registrationLink || null,
      is_published: isPublished,
    };

    if (editing) {
      const { error } = await supabase
        .from("events")
        .update(payload)
        .eq("id", editing.id);
      if (error) toast.error(error.message);
      else toast.success("Event updated.");
    } else {
      const { error } = await supabase.from("events").insert({
        ...payload,
        chapter_id: chapterId!,
        created_by: userId,
      });
      if (error) toast.error(error.message);
      else toast.success("Event created.");
    }

    setDialogOpen(false);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Event deleted.");
      router.refresh();
    }
  }

  async function togglePublished(id: string, value: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .update({ is_published: value })
      .eq("id", id);
    if (error) toast.error(error.message);
    else router.refresh();
  }

  const now = new Date();
  const filtered = events.filter((e) => {
    if (filterType !== "all" && e.event_type !== filterType) return false;
    if (filterPublished === "published" && !e.is_published) return false;
    if (filterPublished === "draft" && e.is_published) return false;
    if (filterDate === "upcoming" && new Date(e.start_date) < now) return false;
    if (filterDate === "past" && new Date(e.start_date) >= now) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {isGlobalView ? t("viewAllEvents") : t("title")}
          </h1>
          <p className="text-muted-foreground">
            {isGlobalView
              ? t("viewAllEvents")
              : t("manageEvents")}
          </p>
        </div>
        {canManage && chapterId && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("createEvent")}
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={tc("allTypes")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tc("allTypes")}</SelectItem>
            {EVENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDate} onValueChange={setFilterDate}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upcoming">{tc("upcoming")}</SelectItem>
            <SelectItem value="past">{tc("past")}</SelectItem>
            <SelectItem value="all">{tc("allDates")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPublished} onValueChange={setFilterPublished}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tc("allStatus")}</SelectItem>
            <SelectItem value="published">{tc("published")}</SelectItem>
            <SelectItem value="draft">{tc("draft")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t("noEvents")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("noEventsDesc")}
          </p>
          {canManage && chapterId && (
            <Button onClick={openCreate} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              {t("createEvent")}
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("eventTitle")}</TableHead>
                <TableHead>{t("eventType")}</TableHead>
                <TableHead>{tc("date") || "Date"}</TableHead>
                <TableHead>{t("location")}</TableHead>
                <TableHead>Registrations</TableHead>
                <TableHead>{tc("published")}</TableHead>
                {isGlobalView && <TableHead>{tc("chapter") || "Chapter"}</TableHead>}
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((evt) => (
                <TableRow key={evt.id}>
                  <TableCell className="font-medium">{evt.title}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadgeClass[evt.event_type] ?? "bg-muted text-muted-foreground"}`}>
                      {t(evt.event_type)}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateRange(evt.start_date, evt.end_date)}
                  </TableCell>
                  <TableCell>
                    {evt.is_virtual ? (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Video className="h-3.5 w-3.5" />
                        {t("virtual")}
                      </span>
                    ) : evt.location ? (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {evt.location}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {evt.registration_link ? (
                      <span>{evt.max_attendees ? `0 / ${evt.max_attendees}` : "Open"}</span>
                    ) : (
                      <span>—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={evt.is_published}
                      onCheckedChange={(v) => togglePublished(evt.id, v)}
                      disabled={!canManage}
                    />
                  </TableCell>
                  {isGlobalView && (
                    <TableCell className="text-muted-foreground">
                      {evt.chapters?.name ?? "—"}
                    </TableCell>
                  )}
                  <TableCell>
                    {canManage && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(evt)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(evt.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("editEvent") : t("createEvent")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("eventTitle")} *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("description")}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("eventType")} *</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("maxAttendees")}</Label>
                <Input
                  type="number"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(e.target.value)}
                  placeholder={t("unlimited")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("startDate")} *</Label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("endDate")}</Label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={isVirtual}
                onCheckedChange={setIsVirtual}
              />
              <Label>{t("virtualEvent")}</Label>
            </div>
            {isVirtual ? (
              <div className="space-y-2">
                <Label>{t("virtualLink")}</Label>
                <Input
                  value={virtualLink}
                  onChange={(e) => setVirtualLink(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t("location")}</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("registrationLink")}</Label>
              <Input
                value={registrationLink}
                onChange={(e) => setRegistrationLink(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
              <Label>{t("publishToWebsite")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !title || !startDate}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? tc("saveChanges") : t("createEvent")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

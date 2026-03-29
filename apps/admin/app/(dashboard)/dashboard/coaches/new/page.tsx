"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import { useChapter } from "@/components/providers/chapter-provider";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@repo/ui/select";
import { Badge } from "@repo/ui/badge";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

export default function AddCoachPage() {
  const router = useRouter();
  const { selectedChapterId } = useChapter();
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [certLevel, setCertLevel] = useState("CALC");
  const [hoursLogged, setHoursLogged] = useState(0);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");

  const [specializations, setSpecializations] = useState<string[]>([]);
  const [specInput, setSpecInput] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [langInput, setLangInput] = useState("");

  function addTag(
    value: string,
    list: string[],
    setter: (v: string[]) => void,
    inputSetter: (v: string) => void
  ) {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setter([...list, trimmed]);
    }
    inputSetter("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChapterId) {
      toast.error("No chapter selected");
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("coaches").insert({
      chapter_id: selectedChapterId,
      full_name: fullName,
      bio: bio || null,
      certification_level: certLevel,
      hours_logged: hoursLogged,
      specializations,
      languages,
      city: city || null,
      country: country || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      website: website || null,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success(`Coach "${fullName}" added successfully.`);
    router.push("/dashboard/coaches");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Add Coach</h1>
        <p className="text-muted-foreground">
          Add a new coach to the chapter roster.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Email (optional — for invitation)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[120px]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Professional Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Certification Level *</Label>
                <Select value={certLevel} onValueChange={setCertLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CALC">CALC</SelectItem>
                    <SelectItem value="SALC">SALC</SelectItem>
                    <SelectItem value="MALC">MALC</SelectItem>
                    <SelectItem value="PALC">PALC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hours Logged</Label>
                <Input type="number" value={hoursLogged} onChange={(e) => setHoursLogged(Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Specializations</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {specializations.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1">
                    {s}
                    <button type="button" onClick={() => setSpecializations(specializations.filter((x) => x !== s))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                value={specInput}
                onChange={(e) => setSpecInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(specInput, specializations, setSpecializations, setSpecInput);
                  }
                }}
                placeholder="Type and press Enter"
              />
            </div>
            <div className="space-y-2">
              <Label>Languages</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {languages.map((l) => (
                  <Badge key={l} variant="secondary" className="gap-1">
                    {l}
                    <button type="button" onClick={() => setLanguages(languages.filter((x) => x !== l))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                value={langInput}
                onChange={(e) => setLangInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(langInput, languages, setLanguages, setLangInput);
                  }
                }}
                placeholder="Type and press Enter"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Location & Contact</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Coach
          </Button>
        </div>
      </form>
    </div>
  );
}

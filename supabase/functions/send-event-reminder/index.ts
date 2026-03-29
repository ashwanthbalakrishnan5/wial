import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { sendEmail, emailLayout, escapeHtml } from "../_shared/email.ts";

const ADMIN_URL =
  Deno.env.get("ADMIN_DASHBOARD_URL") ?? "https://wial-admin.vercel.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find published events starting within the next 7 days
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: events } = await supabase
      .from("events")
      .select("*, chapters(name, slug, subdomain, brand_primary_color, brand_logo_url, contact_email)")
      .eq("is_published", true)
      .gte("start_date", now.toISOString())
      .lte("start_date", sevenDaysFromNow.toISOString());

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No upcoming events" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalSent = 0;

    for (const event of events) {
      const chapter = event.chapters as {
        name: string;
        slug: string;
        subdomain: string;
        brand_primary_color: string;
        brand_logo_url: string | null;
        contact_email: string | null;
      } | null;

      if (!chapter) continue;

      const primary = chapter.brand_primary_color || "#1A7A8A";

      // Get newsletter subscribers for this chapter
      const { data: subscribers } = await supabase
        .from("newsletter_subscribers")
        .select("email, name")
        .eq("chapter_id", event.chapter_id)
        .eq("is_active", true);

      // Also get chapter members (coaches and leads)
      const { data: memberRoles } = await supabase
        .from("user_roles")
        .select("user_id, profiles(email, full_name)")
        .eq("chapter_id", event.chapter_id);

      // Collect all unique emails
      const emailSet = new Map<string, string>();

      if (subscribers) {
        for (const sub of subscribers) {
          emailSet.set(sub.email, sub.name || "");
        }
      }

      if (memberRoles) {
        for (const mr of memberRoles) {
          const profile = mr.profiles as { email: string; full_name: string } | null;
          if (profile) {
            emailSet.set(profile.email, profile.full_name);
          }
        }
      }

      if (emailSet.size === 0) continue;

      // Format event details
      const startDate = new Date(event.start_date);
      const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const dateStr = startDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const timeStr = startDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const eventTypeColors: Record<string, string> = {
        certification: primary,
        workshop: "#2E8E9E",
        meetup: "#3B82F6",
        webinar: "#C8102E",
      };
      const typeColor = eventTypeColors[event.event_type] || primary;

      const locationHtml = event.is_virtual
        ? `<span style="color:${typeColor};">Virtual Event</span>${event.virtual_link ? ` — <a href="${escapeHtml(event.virtual_link)}" style="color:${primary};">Join Link</a>` : ""}`
        : escapeHtml(event.location || "TBA");

      const registrationHtml = event.registration_link
        ? `<div style="text-align:center;margin:24px 0;">
            <a href="${escapeHtml(event.registration_link)}" style="display:inline-block;background-color:${primary};color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
              Register Now
            </a>
          </div>`
        : `<p style="text-align:center;color:#6b7280;">Contact ${escapeHtml(chapter.contact_email || "your chapter")} to register.</p>`;

      for (const [email, name] of emailSet) {
        const greeting = name ? `Hello ${escapeHtml(name)}` : "Hello";
        const body = `
          <h1 style="font-family:Lexend,sans-serif;color:${primary};font-size:24px;margin:0 0 16px;">
            Upcoming Event Reminder
          </h1>
          <p>${greeting},</p>
          <p>You have an upcoming event with <strong>${escapeHtml(chapter.name)}</strong> in <strong>${daysUntil} day${daysUntil !== 1 ? "s" : ""}</strong>:</p>
          <div style="background:#f9fafb;border-left:4px solid ${typeColor};border-radius:8px;padding:20px;margin:16px 0;">
            <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:${typeColor};font-weight:600;">
              ${escapeHtml(event.event_type)}
            </p>
            <h2 style="margin:0 0 12px;font-size:20px;color:#1a1a1a;">${escapeHtml(event.title)}</h2>
            <p style="margin:4px 0;color:#4b5563;">📅 ${dateStr} at ${timeStr}</p>
            <p style="margin:4px 0;color:#4b5563;">📍 ${locationHtml}</p>
            ${event.max_attendees ? `<p style="margin:4px 0;color:#4b5563;">👥 Limited to ${event.max_attendees} attendees</p>` : ""}
          </div>
          ${event.description ? `<p style="color:#4b5563;">${event.description.substring(0, 300)}${event.description.length > 300 ? "..." : ""}</p>` : ""}
          ${registrationHtml}`;

        await sendEmail({
          to: email,
          subject: `Reminder: ${event.title} — ${daysUntil} day${daysUntil !== 1 ? "s" : ""} away`,
          html: emailLayout(body, {
            chapterName: chapter.name,
            primaryColor: primary,
            logoUrl: chapter.brand_logo_url || undefined,
          }),
        });

        totalSent++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: totalSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-event-reminder error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { sendEmail, emailLayout, escapeHtml } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting: max 5 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment." }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json();
    const { chapter_slug, email, name } = body ?? {};

    // Validate inputs
    if (!chapter_slug || typeof chapter_slug !== "string") {
      return new Response(JSON.stringify({ error: "chapter_slug is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "A valid email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify chapter exists and is active
    const { data: chapter } = await supabase
      .from("chapters")
      .select("id, name, status, brand_primary_color, brand_logo_url")
      .eq("slug", chapter_slug)
      .single();

    if (!chapter || chapter.status !== "active") {
      return new Response(JSON.stringify({ error: "Chapter not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert into newsletter_subscribers table (unique constraint handles duplicates)
    const normalizedEmail = email.toLowerCase().trim();
    const { error: insertError } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        {
          chapter_id: chapter.id,
          email: normalizedEmail,
          name: name?.trim() ?? null,
          is_active: true,
        },
        { onConflict: "chapter_id,email" }
      );

    if (insertError) {
      console.error("Newsletter subscribe error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to subscribe. Please try again." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send welcome email
    const primary = chapter.brand_primary_color || "#1A7A8A";
    const subscriberName = name?.trim() || "there";
    const welcomeBody = `
      <h1 style="font-family:Lexend,sans-serif;color:${primary};font-size:24px;margin:0 0 16px;">
        Welcome to ${escapeHtml(chapter.name)}!
      </h1>
      <p>Hi ${escapeHtml(subscriberName)},</p>
      <p>Thank you for subscribing to updates from <strong>${escapeHtml(chapter.name)}</strong>. You'll receive news about upcoming events, workshops, and community highlights.</p>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
        <p style="margin:0;font-size:14px;color:#6b7280;">You're all set!</p>
        <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:${primary};">Stay tuned for updates</p>
      </div>
      <p style="color:#6b7280;font-size:14px;">If you didn't subscribe to this newsletter, you can safely ignore this email.</p>`;

    await sendEmail({
      to: normalizedEmail,
      subject: `Welcome to ${chapter.name} newsletter`,
      html: emailLayout(welcomeBody, {
        chapterName: chapter.name,
        primaryColor: primary,
        logoUrl: chapter.brand_logo_url || undefined,
      }),
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

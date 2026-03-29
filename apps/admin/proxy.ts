import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@repo/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

const SUPPORTED_LOCALES = ["en", "es", "fr", "pt"];

function detectLocaleFromHeader(request: NextRequest): string | undefined {
  const acceptLang = request.headers.get("accept-language");
  if (!acceptLang) return undefined;
  const segments = acceptLang.split(",").map((s) => s.trim().split(";")[0]!.trim());
  for (const seg of segments) {
    const lang = seg.split("-")[0]!.toLowerCase();
    if (SUPPORTED_LOCALES.includes(lang)) return lang;
  }
  return undefined;
}

export async function proxy(request: NextRequest) {
  // First, update the session (refresh tokens)
  const response = await updateSession(request);

  // Auto-detect locale from Accept-Language if no cookie is set
  if (!request.cookies.get("locale")) {
    const detected = detectLocaleFromHeader(request);
    if (detected) {
      response.cookies.set("locale", detected, {
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
        sameSite: "lax",
      });
    }
  }

  // Now check auth for protected routes
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const isPublicRoute = pathname === "/login" || pathname.startsWith("/signup");

  // Create a supabase client to check the user
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

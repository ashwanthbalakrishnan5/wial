import type { createClient } from "@repo/supabase/client";

type BrowserSupabaseClient = ReturnType<typeof createClient>;

export async function getFreshAccessToken(
  supabase: BrowserSupabaseClient
): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isSessionValid =
    !!session?.access_token &&
    (!session.expires_at || session.expires_at * 1000 > Date.now() + 60_000);

  if (isSessionValid) {
    return session!.access_token;
  }

  const { data, error } = await supabase.auth.refreshSession();
  if (error) return null;
  return data.session?.access_token ?? null;
}

export async function invokeEdgeFunctionWithAuth<TData = any>(
  supabase: BrowserSupabaseClient,
  functionName: string,
  body?: Record<string, unknown>
) {
  const accessToken = await getFreshAccessToken(supabase);
  if (!accessToken) {
    return {
      data: null,
      error: new Error("Session expired. Please sign in again."),
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      data: null,
      error: new Error("Supabase client configuration is missing."),
    };
  }

  const endpoint = `${supabaseUrl}/functions/v1/${functionName}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body ?? {}),
  });

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      responseData?.error ??
      responseData?.errors?.[0]?.message ??
      `Function ${functionName} failed with status ${response.status}`;

    return {
      data: null,
      error: new Error(errorMessage),
    };
  }

  return {
    data: responseData as TData,
    error: null,
  };
}

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "WIAL Platform <noreply@wial.ashwanthbk.com>";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  apiKey?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email via the Resend API.
 * Uses the RESEND_API_KEY env var by default, or accepts an explicit key.
 * In development (no key), logs to console and returns success.
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const denoApiKey =
    typeof Deno !== "undefined" ? Deno?.env?.get?.("RESEND_API_KEY") : undefined;

  const apiKey =
    options.apiKey ||
    (typeof process !== "undefined" ? process.env.RESEND_API_KEY : undefined) ||
    denoApiKey;

  const to = Array.isArray(options.to) ? options.to : [options.to];

  if (!apiKey) {
    console.log(`[DEV] Email to ${to.join(", ")}: ${options.subject}`);
    return { success: true };
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: options.from || DEFAULT_FROM,
      to,
      subject: options.subject,
      html: options.html,
      ...(options.replyTo ? { reply_to: options.replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("Resend error:", errBody);
    return { success: false, error: errBody };
  }

  const data = await res.json();
  return { success: true, id: data.id };
}

declare const Deno: any;

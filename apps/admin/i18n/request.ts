import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";

function parseAcceptLanguage(header: string): Locale | undefined {
  const segments = header.split(",").map((s) => s.trim().split(";")[0]!.trim());
  for (const seg of segments) {
    const lang = seg.split("-")[0]!.toLowerCase();
    if (locales.includes(lang as Locale)) return lang as Locale;
  }
  return undefined;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  // Priority: cookie > Accept-Language > default
  const cookieLocale = cookieStore.get("locale")?.value as Locale | undefined;
  let locale: Locale;

  if (cookieLocale && locales.includes(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const acceptLang = headerStore.get("accept-language");
    locale = (acceptLang && parseAcceptLanguage(acceptLang)) || defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./${locale}.json`)).default,
  };
});

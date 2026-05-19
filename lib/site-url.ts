function normalizePublicUrl(raw: string | undefined) {
  const cleaned = raw?.trim().replace(/^<|>$/g, "").replace(/\/$/, "");
  if (cleaned && (cleaned.startsWith("http://") || cleaned.startsWith("https://"))) {
    return cleaned;
  }
  return null;
}

/** SEO (sitemap, robots, og:url, и-мэйл линк) — продакшн дээр NEXT_PUBLIC_SITE_URL заавал. */
export function getSiteUrl() {
  return (
    normalizePublicUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizePublicUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    "http://localhost:3000"
  );
}

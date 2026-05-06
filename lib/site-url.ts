/** SEO (sitemap, robots, og:url, и-мэйл линк) — продакшн дээр NEXT_PUBLIC_SITE_URL заавал. */
export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw && (raw.startsWith("http://") || raw.startsWith("https://"))) {
    return raw.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

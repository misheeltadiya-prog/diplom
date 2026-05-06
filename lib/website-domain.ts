/** Вэб хаягаас favicon / зураг авахад ашиглах hostname */
export function websiteToDomain(website: string): string {
  const t = website.trim();
  if (!t) {
    return "example.com";
  }
  try {
    const withProto = t.includes("://") ? t : `https://${t}`;
    const u = new URL(withProto);
    const host = u.hostname.replace(/^www\./i, "");
    return host || "example.com";
  } catch {
    return t.replace(/^https?:\/\//i, "").split("/")[0]?.trim() || "example.com";
  }
}

export function normalizeWebsiteHref(website: string): string {
  const t = website.trim();
  if (!t) {
    return "";
  }
  if (/^https?:\/\//i.test(t)) {
    return t;
  }
  return `https://${t}`;
}

import path from "path";

/** `public` хавтас — Docker volume зэрэгт `CW_PUBLIC_ROOT` зааж болно. */
export function getPublicDir() {
  const raw = process.env.CW_PUBLIC_ROOT?.trim();
  if (raw) return path.resolve(raw);
  return path.join(process.cwd(), "public");
}

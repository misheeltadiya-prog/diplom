/** Freelancer карт/модал — зөвхөн бодит `users.avatar_url`, санамсаргүй stock зураг биш. */

export function resolveFreelancerAvatarUrl(avatarUrl?: string | null): string | null {
  const raw = avatarUrl?.trim();
  if (!raw) return null;
  if (raw.startsWith("data:")) return raw;
  if (raw.startsWith("/") || raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  return null;
}

export function freelancerInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

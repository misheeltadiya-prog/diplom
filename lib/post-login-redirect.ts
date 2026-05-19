export function postLoginPath(
  role: string,
  opts?: { next?: string; isNewOAuthUser?: boolean },
): string {
  const next = opts?.next?.trim();
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.includes("://")) {
    return next;
  }

  if (opts?.isNewOAuthUser) {
    if (role === "company") return "/jobs?post=1";
    if (role === "freelancer") return "/freelancers?publish=1";
    return "/jobs";
  }

  if (role === "company") return "/jobs";
  if (role === "freelancer") return "/freelancers";
  return "/jobs";
}

export type PortalHomeRole = "client" | "freelancer" | "company" | "admin" | null | undefined;

type PortalRouter = {
  replace: (href: string) => void;
};

/** Profile-ээс гарах / Буцах товчны зорилтот портал. */
export function getPortalHomeHref(_role?: PortalHomeRole): string {
  return "/freelancers";
}

/**
 * Профайлын дотоод түүхийг алгасаж портал руу нэг алхмаар гарна.
 * router.push биш replace + шаардлагатай бол history.go ашиглана.
 */
/** Stripe/checkout-оос буцсан үед history.go(-1) нь дахин Stripe руу оруулдаг тул алгасна. */
function profileExitMayUseHistoryBack(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "profile" || parts.length < 2) return false;
  if (parts[1] === "upgrade") return false;

  if (typeof document === "undefined") return false;
  try {
    const ref = document.referrer?.trim();
    if (!ref) return false;
    const refUrl = new URL(ref);
    if (refUrl.origin !== window.location.origin) return false;
    if (/stripe\.com/i.test(refUrl.hostname)) return false;
    return refUrl.pathname.startsWith("/profile");
  } catch {
    return false;
  }
}

export function exitProfileToPortal(
  router: PortalRouter,
  pathname: string,
  portalHref: string,
): void {
  if (typeof window === "undefined") {
    router.replace(portalHref);
    return;
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "profile") {
    router.replace(portalHref);
    return;
  }

  const nestedDepth = Math.max(0, parts.length - 1);
  if (nestedDepth > 0 && profileExitMayUseHistoryBack(pathname)) {
    window.history.go(-nestedDepth);
    window.setTimeout(() => router.replace(portalHref), 0);
    return;
  }

  router.replace(portalHref);
}

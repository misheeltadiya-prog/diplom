"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { exitProfileToPortal, getPortalHomeHref, type PortalHomeRole } from "@/lib/profile-portal-home";

const PROFILE_MOBILE_MQ = "(max-width: 1180px)";

function hasOpenModal(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'));
}

function isProfileMobileLayout(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(PROFILE_MOBILE_MQ).matches;
}

/** Profile-ээс портал руу гарах — «Буцах» товч болон Escape ижил. */
export function useProfilePortalExit(
  role?: PortalHomeRole,
  options?: { mobileNavOpen?: boolean; onCloseMobileNav?: () => void },
) {
  const router = useRouter();
  const pathname = usePathname();
  const portalHomeHref = getPortalHomeHref(role);

  const exitPortal = useCallback(() => {
    exitProfileToPortal(router, pathname, portalHomeHref);
  }, [router, pathname, portalHomeHref]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (hasOpenModal()) return;

      if (options?.mobileNavOpen && isProfileMobileLayout()) {
        event.preventDefault();
        options.onCloseMobileNav?.();
        return;
      }

      event.preventDefault();
      exitPortal();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exitPortal, options?.mobileNavOpen, options?.onCloseMobileNav]);

  return { exitPortal, portalHomeHref };
}

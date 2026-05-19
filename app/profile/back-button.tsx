"use client";

import { usePathname, useRouter } from "next/navigation";
import { exitProfileToPortal, type PortalHomeRole } from "@/lib/profile-portal-home";
import { useProfilePortalExit } from "@/lib/use-profile-portal-exit";
import styles from "./profile.module.css";

function ExitIcon() {
  return (
    <svg aria-hidden fill="none" viewBox="0 0 24 24" width="18" height="18">
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BackButton({
  className,
  label = "Буцах",
  href,
  role,
  variant = "icon",
}: {
  className?: string;
  label?: string;
  href?: string;
  role?: PortalHomeRole;
  /** icon — дугуй ←; portal — profile header-тэй ижил «Буцах» */
  variant?: "icon" | "portal";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { exitPortal, portalHomeHref } = useProfilePortalExit(role);

  const handleClick = () => {
    if (href && href !== portalHomeHref) {
      exitProfileToPortal(router, pathname, href);
      return;
    }
    exitPortal();
  };

  if (variant === "portal") {
    return (
      <button
        aria-label={label}
        className={className ?? styles.profileMainExitBtn}
        onClick={handleClick}
        type="button"
      >
        <ExitIcon />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      aria-label={label}
      className={className ?? styles.settingsBackLink}
      onClick={handleClick}
      type="button"
    >
      ←
    </button>
  );
}

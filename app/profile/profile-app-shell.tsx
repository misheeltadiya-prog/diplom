"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AppFooter } from "@/components/app-footer";
import { useProfilePortalExit } from "@/lib/use-profile-portal-exit";
import { BackButton } from "./back-button";
import { ChatHistoryButton } from "./chat-history";
import styles from "./profile.module.css";
import { ProfileNotificationsButton } from "./profile-notifications-button";

export type ProfileShellUser = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: "client" | "freelancer" | "company" | "admin";
  createdAt: string;
  subscription: {
    planKey: string;
    hasPaidPlan: boolean;
    expiresAt: string | null;
  } | null;
};

function shortName(fullName: string) {
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Хэрэглэгч";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]?.charAt(0) ?? ""}.`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function DashboardNavIcon() {
  return (
    <svg aria-hidden fill="none" viewBox="0 0 24 24" width="18" height="18">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.8v-5.5H9.8V21H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function AnalyticsNavIcon() {
  return (
    <svg aria-hidden fill="none" viewBox="0 0 24 24" width="18" height="18">
      <path
        d="M4 20V10M10 20V4M16 20v-6M22 20V8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg aria-hidden fill="none" viewBox="0 0 24 24" width="18" height="18">
      <path
        d="M12 8.8a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4Zm0-5.3 1.2 2.1 2.3.4.7 2.2 2.1 1.2-.9 2.2.9 2.2-2.1 1.2-.7 2.2-2.3.4L12 20.5l-1.2-2.1-2.3-.4-.7-2.2-2.1-1.2.9-2.2-.9-2.2 2.1-1.2.7-2.2 2.3-.4L12 3.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg aria-hidden fill="none" viewBox="0 0 24 24" width="18" height="18">
      <path
        d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2M15 12H3m3-3-3 3 3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden fill="none" viewBox="0 0 24 24" width="20" height="20">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function ShellPromoBellIcon() {
  return (
    <svg aria-hidden fill="currentColor" viewBox="0 0 24 24" width="18" height="18">
      <path d="M12 2.25c.41 0 .75.34.75.75v.92a5.25 5.25 0 0 1 4.5 5.18v4.28l1.14 2.28a.75.75 0 0 1-.67 1.09H6.28a.75.75 0 0 1-.67-1.09l1.14-2.28V9.1a5.25 5.25 0 0 1 4.5-5.18V3c0-.41.34-.75.75-.75ZM10.5 19.5h3a1.5 1.5 0 0 1-3 0Z" />
    </svg>
  );
}

export function ProfileAppShell({ user, children }: { user: ProfileShellUser | null; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [companyBrand, setCompanyBrand] = useState<{ name: string; sub: string; logoUrl: string | null } | null>(
    null,
  );
  const [companyLogoFailed, setCompanyLogoFailed] = useState(false);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  useProfilePortalExit(user?.role, {
    mobileNavOpen,
    onCloseMobileNav: closeMobileNav,
  });

  const dashActive = pathname === "/profile";
  const settingsActive = pathname.startsWith("/profile/settings");
  const analyticsActive = pathname.startsWith("/profile/analytics");
  useEffect(() => {
    if (user?.role !== "company") {
      setCompanyBrand(null);
      return;
    }
    fetch("/api/company-profile")
      .then((r) => r.json())
      .then((d: { ok?: boolean; profile?: { company_name?: string; industry?: string; logo_url?: string } }) => {
        if (!d.ok) return;
        const profile = d.profile;
        setCompanyBrand({
          name: profile?.company_name?.trim() || "C-Work",
          sub: profile?.industry?.trim() || "Enterprise Solutions",
          logoUrl: profile?.logo_url?.trim() || null,
        });
      })
      .catch(() => undefined);
  }, [user?.role, user?.id]);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/freelancers");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const displayName = user?.fullName?.trim() || "Зочин";
  const initials = getInitials(displayName);
  const avatarUrl = user?.avatarUrl?.trim() || null;
  const userBadge = user ? (user.role === "freelancer" ? "PRO ACCOUNT" : user.role.toUpperCase()) : "ЗОЧИН";
  const brandTitle = companyBrand?.name ?? "C-Work";
  const brandSub = companyBrand?.sub ?? "Freelance & Careers";
  const companyLogoOk =
    user?.role === "company" && companyBrand?.logoUrl && !companyLogoFailed;
  const sidebarLogoSrc = companyLogoOk ? companyBrand!.logoUrl! : "/c-work-logo.svg";

  const onCompanyLogoError = () => setCompanyLogoFailed(true);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  return (
    <div className={styles.profileAppLayout}>
      {mobileNavOpen ? (
        <button
          type="button"
          className={styles.shellSidebarBackdrop}
          aria-label="Цэс хаах"
          onClick={closeMobileNav}
        />
      ) : null}
      <aside
        className={[styles.shellSidebar, mobileNavOpen ? styles.shellSidebarOpen : ""].filter(Boolean).join(" ")}
      >
        <Link href="/" className={styles.shellSidebarBrand} aria-label="C-Work нүүр">
          <span className={styles.shellSidebarLogoMark} aria-hidden>
            {sidebarLogoSrc.endsWith(".svg") ? (
              <Image alt="" height={44} src={sidebarLogoSrc} width={44} priority />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={sidebarLogoSrc} width={44} height={44} onError={onCompanyLogoError} />
            )}
          </span>
          <span className={styles.shellSidebarBrandText}>
            <span className={styles.shellSidebarBrandTitle}>{brandTitle}</span>
            <span className={styles.shellSidebarBrandSub}>{brandSub}</span>
          </span>
        </Link>

        <div className={styles.shellUserCard}>
          <div className={styles.dashboardHeaderUser}>
            <div className={styles.dashboardHeaderUserText}>
              <span className={styles.dashboardHeaderUserName}>{shortName(displayName)}</span>
              <span className={styles.dashboardHeaderUserBadge}>{userBadge}</span>
            </div>
            <div className={styles.dashboardHeaderAvatar}>
              {user?.role === "company" ? (
                companyLogoOk && !sidebarLogoSrc.endsWith(".svg") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" src={sidebarLogoSrc} width={44} height={44} onError={onCompanyLogoError} />
                ) : (
                  <Image alt="" height={44} src="/c-work-logo.svg" width={44} />
                )
              ) : avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" src={avatarUrl} width={44} height={44} />
              ) : (
                initials
              )}
            </div>
          </div>
        </div>

        {user ? (
          <div className={styles.shellActionGroup}>
            <ProfileNotificationsButton className={styles.shellActionButton} />
            {user.role !== "client" ? (
              <ChatHistoryButton
                currentUser={user}
                triggerClassName={styles.shellActionButton}
                triggerLabel="Мессеж"
              />
            ) : null}
          </div>
        ) : null}

        <nav className={styles.shellSidebarNav} aria-label="Профайл цэс">
          <Link
            href="/profile"
            className={`${styles.shellNavItem} ${dashActive ? styles.shellNavItemActive : ""}`}
          >
            <span className={styles.shellNavIcon}>
              <DashboardNavIcon />
            </span>
            Нүүр хуудас
          </Link>
          <Link
            href="/profile/settings"
            className={`${styles.shellNavItem} ${settingsActive ? styles.shellNavItemActive : ""}`}
          >
            <span className={styles.shellNavIcon}>
              <GearIcon />
            </span>
            Тохиргоо
          </Link>
          {user?.role === "company" ? (
            <Link
              href="/profile/analytics"
              className={`${styles.shellNavItem} ${analyticsActive ? styles.shellNavItemActive : ""}`}
            >
              <span className={styles.shellNavIcon}>
                <AnalyticsNavIcon />
              </span>
              Analytics
            </Link>
          ) : null}
        </nav>

        {user?.role !== "client" ? (
          <Link href="/profile/upgrade" className={styles.shellPromoCard} aria-label="Subscription">
            <span className={styles.shellPromoLabel}>Subscribe</span>
            <span className={styles.shellPromoBell}>
              <ShellPromoBellIcon />
            </span>
          </Link>
        ) : null}

        <div className={styles.shellSidebarUser}>
          {user ? (
            <button
              type="button"
              className={styles.shellSidebarLogout}
              onClick={logout}
              disabled={loggingOut}
              aria-label="Гарах"
            >
              <LogoutIcon />
              <span>Гарах</span>
            </button>
          ) : (
            <Link href="/login" className={styles.shellSidebarLogout}>
              <LogoutIcon />
              <span>Нэвтрэх</span>
            </Link>
          )}
        </div>
      </aside>

      <div className={styles.profileShellMain}>
        <header className={styles.profileMainHeader}>
          <button
            type="button"
            className={styles.profileMainMenuBtn}
            aria-label={mobileNavOpen ? "Цэс хаах" : "Цэс нээх"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <MenuIcon />
          </button>
          <span className={styles.profileMainHeaderSpacer} />
          <BackButton variant="portal" role={user?.role} />
        </header>
        <div className={styles.profileShellScroll}>
          <div className={styles.dashboardMainColumn}>
            {children}
            <AppFooter className={styles.profileFooterInColumn} variant="profile" />
          </div>
        </div>
      </div>
    </div>
  );
}

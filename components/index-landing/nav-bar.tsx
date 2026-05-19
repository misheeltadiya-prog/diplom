"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { COMPANY_PENDING_APPLICATIONS_EVENT } from "@/lib/company-applications-events";
import { NavSavedJobsButton } from "./nav-saved-jobs-button";
import styles from "./index-landing.module.css";

type NavBarProps = {
  currentUser?: SessionUser | null;
  scrolled: boolean;
  onFindJob: () => void;
  onFreelancer: () => void;
  onCompany: () => void;
  onAbout: () => void;
  /** Үндсэн хуудасны «Зар оруулах» sheet нээлттэй үед navbar нуугдана */
  jobPostComposerOpen?: boolean;
};

function ProfileIcon() {
  return (
    <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
      <circle cx="12" cy="8" fill="none" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M5 19c1.9-3 4.2-4.5 7-4.5s5.1 1.5 7 4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function JobsNavIcon() {
  return (
    <svg aria-hidden fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path
        d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function FreelancerNavIcon() {
  return (
    <svg aria-hidden fill="none" height="20" viewBox="0 0 24 24" width="20">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 19c1.8-3 4-4.5 7-4.5s5.2 1.5 7 4.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function CompanyNavIcon() {
  return (
    <svg aria-hidden fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path d="M4 20V9l8-4 8 4v11" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M9 20v-5h6v5" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
      <path
        d="M12 8.5A3.5 3.5 0 1112 15.5 3.5 3.5 0 0112 8.5zm0-5.5l1.4 2.4 2.7.4.8 2.6 2.4 1.4-1 2.6 1 2.6-2.4 1.4-.8 2.6-2.7.4L12 21l-1.4-2.4-2.7-.4-.8-2.6-2.4-1.4 1-2.6-1-2.6 2.4-1.4.8-2.6 2.7-.4L12 3z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
      <circle cx="12" cy="12" fill="none" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M9.5 9.2A3 3 0 0 1 15 10.7c0 2-2 2.5-2.7 3.6-.2.3-.3.6-.3 1.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle cx="12" cy="17.2" fill="currentColor" r="1" />
    </svg>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function NavBar({
  currentUser = null,
  scrolled,
  onFindJob,
  onFreelancer,
  onCompany,
  onAbout,
  jobPostComposerOpen = false,
}: NavBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  /** Доош чиглэлээр гүйлгэхэд нуугдана; дээш чиглэлээр гүйлгэхэд гарна. */
  const [navRevealByScroll, setNavRevealByScroll] = useState(true);
  const lastScrollYRef = useRef(0);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [pendingCompanyApplications, setPendingCompanyApplications] = useState(0);
  const [pendingFreelancerOffers, setPendingFreelancerOffers] = useState(0);

  // Load avatar from server session first, fallback to localStorage cache.
  useEffect(() => {
    // Migration: Clear old global avatar key once
    try {
      const migrated = localStorage.getItem("cwork-avatar-migrated");
      if (!migrated) {
        localStorage.removeItem("cwork-user-avatar");
        localStorage.setItem("cwork-avatar-migrated", "true");
      }
    } catch {
      /* ignore */
    }

    if (currentUser?.avatarUrl?.trim()) {
      setUserAvatar(currentUser.avatarUrl.trim());
      return;
    }
    try {
      const avatarKey = currentUser?.id ? `cwork-user-avatar-${currentUser.id}` : "cwork-user-avatar";
      const stored = localStorage.getItem(avatarKey);
      if (stored) setUserAvatar(stored);
    } catch { /* ignore */ }
  }, [currentUser?.avatarUrl, currentUser?.id]);

  useEffect(() => {
    if (currentUser?.role !== "company") {
      setPendingCompanyApplications(0);
      return;
    }

    let cancelled = false;

    const loadPending = () => {
      fetch("/api/company/pending-applications-count", { cache: "no-store", credentials: "same-origin" })
        .then((r) => r.json())
        .then((d: { count?: number }) => {
          if (!cancelled && typeof d.count === "number") {
            setPendingCompanyApplications(d.count);
          }
        })
        .catch(() => {});
    };

    loadPending();
    const intervalId = window.setInterval(loadPending, 45_000);

    const onChange = () => loadPending();
    window.addEventListener(COMPANY_PENDING_APPLICATIONS_EVENT, onChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener(COMPANY_PENDING_APPLICATIONS_EVENT, onChange);
    };
  }, [currentUser?.role, currentUser?.id]);

  useEffect(() => {
    if (!profileOpen || currentUser?.role !== "company") {
      return;
    }
    fetch("/api/company/pending-applications-count", { cache: "no-store", credentials: "same-origin" })
      .then((r) => r.json())
      .then((d: { count?: number }) => {
        if (typeof d.count === "number") {
          setPendingCompanyApplications(d.count);
        }
      })
      .catch(() => {});
  }, [profileOpen, currentUser?.role]);

  useEffect(() => {
    if (currentUser?.role !== "freelancer") {
      setPendingFreelancerOffers(0);
      return;
    }

    let cancelled = false;
    const loadPendingOffers = () => {
      fetch("/api/offers", { cache: "no-store", credentials: "same-origin" })
        .then((r) => r.json())
        .then((d: { offers?: Array<{ status?: string }> }) => {
          if (cancelled) return;
          const pending = (d.offers ?? []).filter((offer) => offer.status === "pending").length;
          setPendingFreelancerOffers(pending);
        })
        .catch(() => {});
    };

    loadPendingOffers();
    const id = window.setInterval(loadPendingOffers, 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [currentUser?.role, currentUser?.id]);

  const displayName = currentUser?.fullName ?? "Profile";
  const displayEmail = currentUser?.email ?? "Guest mode";
  const initials = getInitials(currentUser?.fullName ?? "C Work");
  useEffect(() => {
    if (!profileOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setProfileOpen(false);
    };

    document.addEventListener("keydown", handleEscape, true);

    return () => {
      document.removeEventListener("keydown", handleEscape, true);
    };
  }, [profileOpen]);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (profileOpen || jobPostComposerOpen) {
      setNavRevealByScroll(true);
      return;
    }

    lastScrollYRef.current =
      typeof window !== "undefined"
        ? window.scrollY || document.documentElement.scrollTop || 0
        : 0;

    const threshold = 6;

    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const dy = y - lastScrollYRef.current;
      lastScrollYRef.current = y;

      /* Хамгийн дээд талд үргэлж харуулна */
      if (y <= 12) {
        setNavRevealByScroll(true);
        return;
      }

      if (Math.abs(dy) < threshold) {
        return;
      }

      if (dy > 0) {
        setNavRevealByScroll(false);
      } else {
        setNavRevealByScroll(true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [profileOpen, jobPostComposerOpen]);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      setProfileOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <nav
        className={`${styles.nav} ${scrolled ? styles.navScrolled : ""} ${
          !profileOpen && (jobPostComposerOpen || !navRevealByScroll) ? styles.navRevealHidden : ""
        }`}
      > 
        <Link aria-label="Home" className={styles.logo} href="/">
          <Image alt="C-Work logo" className={styles.logoImage} height={44} src="/c-work-logo.svg" width={44} />
        </Link>
        <div className={styles.navCenter}>
          <div className={styles.navLinks}>
            {currentUser?.role !== "client" ? (
              <button
                className={`${styles.navLinkButton} ${pathname === "/freelancers" ? styles.navLinkButtonActive : ""}`}
                onClick={onFreelancer}
                type="button"
              >
                FREELANCER
              </button>
            ) : null}
            <button
              className={`${styles.navLinkButton} ${pathname === "/jobs" ? styles.navLinkButtonActive : ""}`}
              onClick={onFindJob}
              type="button"
            >
              FIND JOB
            </button>
            <button
              className={`${styles.navLinkButton} ${pathname === "/companies" ? styles.navLinkButtonActive : ""}`}
              onClick={onCompany}
              type="button"
            >
              COMPANY
            </button>
          </div>
        </div>
        <div className={styles.navRight}>
          <NavSavedJobsButton />
          <button
            aria-controls="index-profile-drawer"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className={styles.navProfileTrigger}
            onClick={() => setProfileOpen((open) => !open)}
            type="button"
          >
            <span className={styles.navProfileAvatar}>
              {userAvatar ? (
                <img alt="Avatar" src={userAvatar} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              ) : (
                <ProfileIcon />
              )}
              {currentUser?.role === "company" && pendingCompanyApplications > 0 ? (
                <span
                  aria-label="Шийдвэр хүлээж буй өргөдөл"
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    minWidth: 10,
                    height: 10,
                    borderRadius: 999,
                    background: "#ef4444",
                    border: "2px solid #fff",
                  }}
                />
              ) : null}
            </span>
          </button>
        </div>
      </nav>

      <div
        aria-hidden={!profileOpen}
        className={`${styles.navProfileOverlay} ${profileOpen ? styles.navProfileOverlayVisible : ""}`}
        onClick={() => setProfileOpen(false)}
      />

      <aside
        aria-hidden={!profileOpen}
        aria-label="Profile menu"
        className={`${styles.navProfileDrawer} ${profileOpen ? styles.navProfileDrawerOpen : ""}`}
        id="index-profile-drawer"
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.navProfileDrawerTop}>
          <div className={styles.navProfileDrawerIntro}>
            <span className={styles.navProfileEyebrow}>Profile</span>
            <h2 className={styles.navProfileTitle}>{currentUser ? "\u0422\u0430\u043d\u044b \u0431\u0443\u043b\u0430\u043d" : "\u0425\u0443\u0432\u0438\u0439\u043d \u0445\u044d\u0441\u044d\u0433"}</h2>
          </div>
          <button
            aria-label="Close profile menu"
            className={styles.navProfileClose}
            onClick={() => setProfileOpen(false)}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <div className={styles.navProfileDrawerScroll}>
        <Link
          className={`${styles.navProfileSummary} ${currentUser?.role === "company" && pendingCompanyApplications > 0 ? styles.navProfileSummaryHasAlert : ""}`}
          href="/profile"
          onClick={() => setProfileOpen(false)}
        >
          <div className={styles.navProfileSummaryAvatarWrap}>
            <span className={styles.navProfileSummaryAvatar}>
              {userAvatar ? (
                <img alt="Avatar" src={userAvatar} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              ) : currentUser ? initials : <ProfileIcon />}
            </span>
            {currentUser ? <span className={styles.navProfileOnlineDot} /> : null}
          </div>
          <div className={styles.navProfileSummaryText}>
            <strong>{displayName}</strong>
            <span>{displayEmail}</span>
            {!currentUser ? <span className={styles.navProfileGuestBadge}>{"\u0417\u043e\u0447\u0438\u043d \u0433\u043e\u0440\u0438\u043c"}</span> : null}
          </div>
        </Link>

        <div className={styles.navProfileLinks}>
          {currentUser?.role === "company" || currentUser?.role === "admin" ? (
            <Link className={styles.navProfileLink} href="/jobs?mine=1" onClick={() => setProfileOpen(false)}>
              <span className={styles.navProfileLinkIcon}>
                <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>+</span>
              </span>
              <span className={styles.navProfileLinkCopy}>
                <strong>{"\u041c\u0438\u043d\u0438\u0439 \u0437\u0430\u0440\u0443\u0443\u0434"}</strong>
                <span style={{ display: "block", fontSize: "0.75rem", color: "#7b7486", fontWeight: 600 }}>
                  {"\u041e\u0440\u0443\u0443\u043b\u0441\u0430\u043d \u0430\u0436\u043b\u044b\u043d \u0437\u0430\u0440\u0443\u0443\u0434\u0430\u0430 \u0445\u0430\u0440\u0430\u0445"}
                </span>
              </span>
            </Link>
          ) : null}
          {currentUser?.role === "company" ? (
            <Link className={styles.navProfileLink} href="/profile/company" onClick={() => setProfileOpen(false)}>
              <span className={styles.navProfileLinkIcon}>
                <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>C</span>
              </span>
              <span className={styles.navProfileLinkCopy}>
                <strong>{"\u041a\u043e\u043c\u043f\u0430\u043d\u0438"}</strong>
                <span style={{ display: "block", fontSize: "0.75rem", color: "#7b7486", fontWeight: 600 }}>
                  {"\u041c\u044d\u0434\u044d\u044d\u043b\u044d\u043b \u0437\u0430\u0441\u0430\u0445"}
                </span>
              </span>
            </Link>
          ) : null}
          {currentUser ? (
            <>
              {currentUser.role !== "client" ? (
                <Link className={styles.navProfileLink} href="/profile/upgrade" onClick={() => setProfileOpen(false)}>
                  <span className={styles.navProfileLinkIcon}>
                    <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>*</span>
                  </span>
                  <span className={styles.navProfileLinkCopy}>
                    <strong>Upgrade</strong>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#7b7486", fontWeight: 600 }}>
                      Subscription
                    </span>
                  </span>
                </Link>
              ) : null}
              {currentUser.role === "freelancer" ? (
                <Link
                  className={styles.navProfileLink}
                  href="/profile#offers-panel"
                  onClick={() => setProfileOpen(false)}
                >
                  <span className={styles.navProfileLinkIcon}>
                    <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>→</span>
                  </span>
                  <span className={styles.navProfileLinkCopy}>
                    <strong>
                      Ирсэн хүсэлтүүд
                      {pendingFreelancerOffers > 0 ? (
                        <span className={styles.navProfileLinkBadge}>
                          {pendingFreelancerOffers > 99 ? "99+" : pendingFreelancerOffers}
                        </span>
                      ) : null}
                    </strong>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#7b7486", fontWeight: 600 }}>
                      Компаниас ирсэн ажлын санал
                    </span>
                  </span>
                </Link>
              ) : currentUser.role !== "company" && currentUser.role !== "client" ? (
                <Link className={styles.navProfileLink} href="/freelancers" onClick={() => setProfileOpen(false)}>
                  <span className={styles.navProfileLinkIcon}>
                    <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>{">"}</span>
                  </span>
                  <span className={styles.navProfileLinkCopy}>
                    <strong>{"Freelancers \u0436\u0430\u0433\u0441\u0430\u0430\u043b\u0442"}</strong>
                  </span>
                </Link>
              ) : null}
            </>
          ) : null}

          <Link className={styles.navProfileLink} href="/profile/settings" onClick={() => setProfileOpen(false)}>
            <span className={styles.navProfileLinkIcon}>
              <GearIcon />
            </span>
            <span className={styles.navProfileLinkCopy}>
              <strong>{"\u0422\u043e\u0445\u0438\u0440\u0433\u043e\u043e"}</strong>
            </span>
          </Link>

          <Link className={styles.navProfileLink} href="/profile/help" onClick={() => setProfileOpen(false)}>
            <span className={styles.navProfileLinkIcon}>
              <HelpIcon />
            </span>
            <span className={styles.navProfileLinkCopy}>
              <strong>Help and Support</strong>
            </span>
          </Link>
        </div>
        </div>

        <div className={styles.navProfileBottom}>
          {currentUser ? (
            <button className={styles.navProfileLogout} disabled={loggingOut} onClick={handleLogout} type="button">
              {loggingOut ? "\u0413\u0430\u0440\u0447 \u0431\u0430\u0439\u043d\u0430..." : "\u0413\u0430\u0440\u0430\u0445"}
            </button>
          ) : (
            <div className={styles.navProfileGuestActions}>
              <Link className={styles.navProfilePrimaryAction} href="/register" onClick={() => setProfileOpen(false)}>
                {"\u0411\u04af\u0440\u0442\u0433\u04af\u04af\u043b\u044d\u0445"}
              </Link>
              <Link className={styles.navProfileSecondaryAction} href="/login" onClick={() => setProfileOpen(false)}>
                {"\u041d\u044d\u0432\u0442\u0440\u044d\u0445"}
              </Link>
            </div>
          )}
        </div>
      </aside>

      <nav className={styles.mobileBottomNav} aria-label="Үндсэн хуудас">
        <Link
          className={`${styles.mobileBottomNavItem} ${pathname === "/jobs" || pathname === "/" ? styles.mobileBottomNavItemActive : ""}`}
          href="/jobs"
          onClick={() => setProfileOpen(false)}
        >
          <JobsNavIcon />
          <span>Ажил</span>
        </Link>
        {currentUser?.role !== "client" ? (
          <Link
            className={`${styles.mobileBottomNavItem} ${pathname === "/freelancers" ? styles.mobileBottomNavItemActive : ""}`}
            href="/freelancers"
            onClick={() => setProfileOpen(false)}
          >
            <FreelancerNavIcon />
            <span>Freelancer</span>
          </Link>
        ) : null}
        <Link
          className={`${styles.mobileBottomNavItem} ${pathname === "/companies" ? styles.mobileBottomNavItemActive : ""}`}
          href="/companies"
          onClick={() => setProfileOpen(false)}
        >
          <CompanyNavIcon />
          <span>Компани</span>
        </Link>
      </nav>
    </>
  );
}

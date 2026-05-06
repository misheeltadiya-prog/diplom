"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { COMPANY_PENDING_APPLICATIONS_EVENT } from "@/lib/company-applications-events";
import type { JobRecord } from "@/lib/portal-data";
import styles from "./index-landing.module.css";

const FAVORITE_JOBS_STORAGE_KEY = "cwork-landing-favorite-job-ids";

type NavBarProps = {
  currentUser?: SessionUser | null;
  scrolled: boolean;
  savedJobCount: number;
  onSavedJobsClick: () => void;
  favoritesViewActive: boolean;
  onFindJob: () => void;
  onFreelancer: () => void;
  onCompany: () => void;
  onAbout: () => void;
};

function BellIcon() {
  return (
    <svg aria-hidden="true" height="22" viewBox="0 0 24 24" width="22">
      <path
        d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 01-3.46 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
      <circle cx="12" cy="8" fill="none" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M5 19c1.9-3 4.2-4.5 7-4.5s5.1 1.5 7 4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
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
  savedJobCount,
  onSavedJobsClick,
  favoritesViewActive,
  onFindJob,
  onFreelancer,
  onCompany,
  onAbout,
}: NavBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [savedJobsOpen, setSavedJobsOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState<JobRecord[]>([]);
  const [savedJobsLoading, setSavedJobsLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingCompanyApplications, setPendingCompanyApplications] = useState(0);
  const [pendingFreelancerOffers, setPendingFreelancerOffers] = useState(0);

  // Load avatar from server session first, fallback to localStorage cache.
  useEffect(() => {
    if (currentUser?.avatarUrl?.trim()) {
      setUserAvatar(currentUser.avatarUrl.trim());
      return;
    }
    try {
      const stored = localStorage.getItem("cwork-user-avatar");
      if (stored) setUserAvatar(stored);
    } catch { /* ignore */ }
  }, [currentUser?.avatarUrl, currentUser?.id]);

  useEffect(() => {
    if (!currentUser) {
      setUnreadNotifications(0);
      return;
    }
    let cancelled = false;
    const tick = () => {
      fetch("/api/notifications", { cache: "no-store" })
        .then((r) => r.json())
        .then((d: { unreadCount?: number }) => {
          if (!cancelled && typeof d.unreadCount === "number") {
            setUnreadNotifications(d.unreadCount);
          }
        })
        .catch(() => {});
    };
    tick();
    const id = window.setInterval(tick, 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [currentUser]);

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
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [profileOpen]);

  function openSavedJobs() {
    setProfileOpen(false);
    setSavedJobsOpen(true);
    setSavedJobsLoading(true);

    let savedIds: string[] = [];
    try {
      const raw = localStorage.getItem(FAVORITE_JOBS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) savedIds = parsed.filter((id): id is string => typeof id === "string");
      }
    } catch { /* ignore */ }

    if (savedIds.length === 0) {
      setSavedJobs([]);
      setSavedJobsLoading(false);
      return;
    }

    fetch("/api/jobs", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { jobs?: JobRecord[] }) => {
        setSavedJobs((data.jobs ?? []).filter((j) => savedIds.includes(j.id)));
      })
      .catch(() => {
        setSavedJobs([]);
      })
      .finally(() => setSavedJobsLoading(false));
  }

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
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}> 
        <Link aria-label="Home" className={styles.logo} href="/">
          <Image alt="C-Work logo" className={styles.logoImage} height={44} src="/c-work-logo.svg" width={44} />
        </Link>
        <div className={styles.navCenter}>
          <div className={styles.navLinks}>
            <button
              className={`${styles.navLinkButton} ${pathname === "/freelancers" ? styles.navLinkButtonActive : ""}`}
              onClick={onFreelancer}
              type="button"
            >
              FREELANCER
            </button>
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
          <Link aria-label="Мэдэгдэл" className={styles.navBellButton} href="/profile">
            <BellIcon />
            {unreadNotifications > 0 ? (
              <span className={styles.navBellBadge}>{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>
            ) : null}
          </Link>
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
              {unreadNotifications > 0 || (currentUser?.role === "company" && pendingCompanyApplications > 0) ? (
                <span
                  aria-label={
                    unreadNotifications > 0 && currentUser?.role === "company" && pendingCompanyApplications > 0
                      ? "Уншаагүй мэдэгдэл ба шийдвэр хүлээж буй өргөдөл"
                      : unreadNotifications > 0
                        ? "\u0423\u043d\u0448\u0430\u0430\u0433\u04af\u0439 \u043c\u044d\u0434\u044d\u0433\u0434\u044d\u043b"
                        : "Шийдвэр хүлээж буй өргөдөл"
                  }
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
            <Link className={styles.navProfileLink} href="/profile#company-applications" onClick={() => setProfileOpen(false)}>
              <span className={styles.navProfileLinkIcon}>
                <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>≡</span>
              </span>
              <span className={styles.navProfileLinkCopy}>
                <strong>
                  Ирсэн өргөдлүүд
                  {pendingCompanyApplications > 0 ? (
                    <span className={styles.navProfileLinkBadge} title="Шийдвэр хүлээж буй">
                      {pendingCompanyApplications > 99 ? "99+" : pendingCompanyApplications}
                    </span>
                  ) : null}
                </strong>
                <span style={{ display: "block", fontSize: "0.75rem", color: "#7b7486", fontWeight: 600 }}>
                  Хүлээн авах / татгалзах
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
              <Link className={styles.navProfileLink} href="/profile/upgrade" onClick={() => setProfileOpen(false)}>
                <span className={styles.navProfileLinkIcon}>
                  <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>*</span>
                </span>
                <span className={styles.navProfileLinkCopy}>
                  <strong>
                    Upgrade
                    {unreadNotifications > 0 ? (
                      <span className={styles.navProfileLinkBadge}>{unreadNotifications}</span>
                    ) : null}
                  </strong>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "#7b7486", fontWeight: 600 }}>
                    Subscription
                  </span>
                </span>
              </Link>
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
              ) : currentUser.role !== "company" ? (
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

          <button
            className={`${styles.navProfileLink} ${favoritesViewActive ? styles.navProfileLinkActive : ""}`}
            onClick={() => { openSavedJobs(); }}
            type="button"
          >
            <span className={styles.navProfileLinkIcon}>
              <Image alt="" aria-hidden height={20} src="/heart-favorite.svg" width={20} />
            </span>
            <span className={styles.navProfileLinkCopy}>
              <strong>
                Saved Jobs
                {savedJobCount > 0 ? <span className={styles.navProfileLinkBadge}>{savedJobCount}</span> : null}
              </strong>
            </span>
          </button>

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
      {/* Saved Jobs Panel */}
      {savedJobsOpen ? (
        <div className={styles.savedJobsOverlay} onClick={() => setSavedJobsOpen(false)} role="presentation">
          <aside
            className={styles.savedJobsPanel}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Saved Jobs"
          >
            <div className={styles.savedJobsPanelHead}>
              <span className={styles.savedJobsPanelTitle}>
                Saved Jobs
                {savedJobCount > 0 ? <span className={styles.savedJobsPanelCount}>{savedJobCount}</span> : null}
              </span>
              <button
                className={styles.savedJobsPanelClose}
                onClick={() => setSavedJobsOpen(false)}
                type="button"
                aria-label={"\u0425\u0430\u0430\u0445"}
              >x</button>
            </div>

            <div className={styles.savedJobsList}>
              {savedJobsLoading ? (
                <p className={styles.savedJobsEmpty}>{"\u0410\u0447\u0430\u0430\u043b\u0436 \u0431\u0430\u0439\u043d\u0430..."}</p>
              ) : savedJobs.length === 0 ? (
                <p className={styles.savedJobsEmpty}>{"\u0425\u0430\u0434\u0433\u0430\u043b\u0441\u0430\u043d \u0430\u0436\u043b\u044b\u043d \u0437\u0430\u0440 \u0431\u0430\u0439\u0445\u0433\u04af\u0439 \u0431\u0430\u0439\u043d\u0430."}</p>
              ) : savedJobs.map((job) => (
                <article className={styles.jobCardNew} key={job.id}>
                  <div className={styles.jobCardNewTop}>
                    <div className={styles.jobCardNewLogoWrap}>
                      <span className={styles.jobCompanyAvatar}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#6d28d9" }}>
                          {job.companyName[0]}
                        </span>
                      </span>
                      <div className={styles.jobCardNewCompanyInfo}>
                        <span className={styles.jobCardNewCompanyName}>{job.companyName}</span>
                        <div className={styles.jobCardNewBadges}>
                          <span className={styles.jobCardNewBadgeType}>{job.employmentType}</span>
                        </div>
                      </div>
                    </div>
                    <Image
                      alt=""
                      aria-hidden
                      className={styles.jobFavoriteIcon}
                      height={28}
                      src="/heart-favorite-on.svg"
                      width={28}
                    />
                  </div>
                  <h3 className={styles.jobCardNewTitle}>{job.title}</h3>
                  <div className={styles.jobCardNewLocation}>
                    <svg aria-hidden="true" fill="none" height="13" viewBox="0 0 24 24" width="13">
                      <path d="M12 20s6-4.5 6-9a6 6 0 1 0-12 0c0 4.5 6 9 6 9Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      <circle cx="12" cy="11" r="2.1" stroke="currentColor" strokeWidth="1.8"/>
                    </svg>
                    <span>{job.location}</span>
                  </div>
                  <div className={styles.jobCardNewFooter}>
                    <div className={styles.jobCardNewSalary}>{job.salary}</div>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

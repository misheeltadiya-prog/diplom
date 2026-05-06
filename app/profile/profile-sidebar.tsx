"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./profile.module.css";

function HomeIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" width="18" height="18">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.8v-5.5H9.8V21H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function CvIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" width="18" height="18">
      <path d="M8 3h6l5 5v13H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M14 3v5h5M9 13h6M9 17h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" width="18" height="18">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.8 9.3a2.9 2.9 0 0 1 5.4 1.4c0 1.8-1.8 2.3-2.5 3.2-.2.3-.3.6-.3 1.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="12" cy="17.2" r="1" fill="currentColor" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" width="18" height="18">
      <path
        d="M12 8.8A3.2 3.2 0 1 1 12 15.2 3.2 3.2 0 0 1 12 8.8Zm0-5.3 1.2 2.1 2.3.4.7 2.2 2.1 1.2-.9 2.2.9 2.2-2.1 1.2-.7 2.2-2.3.4L12 20.5l-1.2-2.1-2.3-.4-.7-2.2-2.1-1.2.9-2.2-.9-2.2 2.1-1.2.7-2.2 2.3-.4L12 3.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

const navItems = [
  { href: "/profile", label: "Profile", icon: <HomeIcon /> },
  { href: "/profile/cv", label: "Миний CV", icon: <CvIcon /> },
  { href: "/profile/help", label: "Help and Support", icon: <HelpIcon /> },
  { href: "/profile/settings", label: "Тохиргоо", icon: <SettingsIcon /> },
];

type ProfileSidebarProps = {
  completion: number;
};

function completionLabel(value: number) {
  if (value >= 85) {
    return "Бараг бүрэн";
  }

  if (value >= 50) {
    return "Сайн явж байна";
  }

  if (value > 0) {
    return "Гол хэсгүүдээ бөглөнө үү";
  }

  return "Эхлээд CV-гээ бөглөж эхлээрэй";
}

export function ProfileSidebar({ completion }: ProfileSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <section className={`${styles.sectionCard} ${styles.sidebarPanel}`}>
        <div className={styles.brand}>
          <span className={styles.brandDot} />
          C-Work Profile
        </div>

        <nav className={styles.navList}>
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                href={item.href}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </section>

      <section className={`${styles.sectionCard} ${styles.sidebarPanel} ${styles.progressCard}`}>
        <div className={styles.progressHeader}>
          <h3>Таны CV явц</h3>
          <span className={styles.progressCount}>{completion}%</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressValue} style={{ width: `${completion}%` }} />
        </div>
        <div className={styles.checkList}>
          <div className={styles.checkItem}>
            <span>Үндсэн profile, холбоо барих</span>
            <span className={styles.checkBadge}>{completion >= 23 ? "Done" : "..."}</span>
          </div>
          <div className={styles.checkItem}>
            <span>Танилцуулга, ур чадвар, туршлага</span>
            <span className={styles.checkBadge}>{completion >= 62 ? "Done" : "..."}</span>
          </div>
          <div className={styles.checkItem}>
            <span>Portfolio, role, availability</span>
            <span className={styles.checkBadge}>{completion >= 92 ? "Done" : "..."}</span>
          </div>
        </div>
        <div className={styles.progressNote}>{completionLabel(completion)}</div>
      </section>
    </aside>
  );
}

import styles from "./index-landing.module.css";

type LeftHoverSidebarProps = {
  onPostJob: () => void;
};

const sidebarLinks = [
  { href: "#search", label: "Search", kicker: "Job Finder", short: "SR" },
  { href: "#jobs", label: "Jobs", kicker: "Live Board", short: "JB" },
  { href: "#categories", label: "Categories", kicker: "6 Types", short: "CT" },
  { href: "#contact", label: "Contact", kicker: "Footer", short: "FT" },
];

export function LeftHoverSidebar({ onPostJob }: LeftHoverSidebarProps) {
  return (
    <aside className={styles.leftSidebar} aria-label="Page shortcuts">
      <div className={styles.leftSidebarBrand}>
        <span className={styles.leftSidebarBrandMark}>CW</span>
        <div className={styles.leftSidebarBrandText}>
          <strong>C-Work</strong>
          <span>Quick rail</span>
        </div>
      </div>

      <nav className={styles.leftSidebarNav}>
        {sidebarLinks.map((link) => (
          <a className={styles.leftSidebarLink} href={link.href} key={link.href}>
            <span className={styles.leftSidebarShort}>{link.short}</span>
            <span className={styles.leftSidebarText}>
              <strong>{link.label}</strong>
              <small>{link.kicker}</small>
            </span>
          </a>
        ))}
      </nav>

      <button className={styles.leftSidebarAction} onClick={onPostJob} type="button">
        <span className={styles.leftSidebarShort}>PJ</span>
        <span className={styles.leftSidebarText}>
          <strong>Post job</strong>
          <small>Open composer</small>
        </span>
      </button>
    </aside>
  );
}

import Image from "next/image";
import Link from "next/link";
import styles from "./index-landing.module.css";

type NavBarProps = {
  onPostJob: () => void;
  scrolled: boolean;
  savedJobCount: number;
  onSavedJobsClick: () => void;
  favoritesViewActive: boolean;
  onFindJob: () => void;
  onFreelancer: () => void;
  onCompany: () => void;
  onAbout: () => void;
};

export function NavBar({
  onPostJob,
  scrolled,
  savedJobCount,
  onSavedJobsClick,
  favoritesViewActive,
  onFindJob,
  onFreelancer,
  onCompany,
  onAbout,
}: NavBarProps) {
  return (
    <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
      <Link className={styles.logo} href="/" aria-label="C-Work home">
        <Image alt="C-Work logo" className={styles.logoImage} height={44} src="/c-work-logo.svg" width={44} />
        <span className={styles.logoBrand}>
          <span className={styles.logoBrandName}>C-Work</span>
          <span className={styles.logoBrandSub}>Freelancing Platform</span>
        </span>
      </Link>

      <div className={styles.navRight}>
        <div className={styles.navLinks}>
          <button className={styles.navLinkButton} onClick={onFindJob} type="button">
            Find Jobs
          </button>
          <button className={styles.navLinkButton} onClick={onFreelancer} type="button">
            Hire Talent
          </button>
          <button className={styles.navLinkButton} onClick={onCompany} type="button">
            Companies
          </button>
          <button className={styles.navLinkButton} onClick={onAbout} type="button">
            About
          </button>
        </div>

        <div className={styles.navButtons}>
          <button
            className={`${styles.navFavorites} ${favoritesViewActive ? styles.navFavoritesActive : ""}`}
            onClick={onSavedJobsClick}
            type="button"
          >
            <Image alt="" aria-hidden className={styles.navFavoritesIcon} height={28} src="/heart-favorite.svg" width={28} />
            <span className={styles.navFavoritesLabel}>Saved Jobs</span>
            {savedJobCount > 0 ? <span className={styles.navFavoritesCount}>{savedJobCount}</span> : null}
          </button>
          <button className={styles.navCta} type="button" onClick={onPostJob}>
            Post Job
          </button>
          <a className={`${styles.navCta} ${styles.navLogin}`} href="/login">
            Нэвтрэх
          </a>
        </div>
      </div>
    </nav>
  );
}

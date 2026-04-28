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
      <Link className={styles.logo} href="/" aria-label="Нүүр">
        <Image alt="C-Work logo" className={styles.logoImage} height={44} src="/c-work-logo.svg" width={44} />
      </Link>
      <div className={styles.navRight}>
        <button
          className={`${styles.navFavorites} ${favoritesViewActive ? styles.navFavoritesActive : ""}`}
          onClick={onSavedJobsClick}
          type="button"
        >
          <Image alt="" aria-hidden className={styles.navFavoritesIcon} height={28} src="/heart-favorite.svg" width={28} />
          <span className={styles.navFavoritesLabel}>Таалагдсан ажлын зарууд</span>
          {savedJobCount > 0 ? <span className={styles.navFavoritesCount}>{savedJobCount}</span> : null}
        </button>
        <div className={styles.navLinks}>
          <button className={styles.navLinkButton} onClick={onFreelancer} type="button">
            Freelancer
          </button>
          <button className={styles.navLinkButton} onClick={onFindJob} type="button">
            Find Job
          </button>
          <button className={styles.navLinkButton} onClick={onCompany} type="button">
            Company
          </button>
          <button className={styles.navLinkButton} onClick={onAbout} type="button">
            About
          </button>
        </div>
        <div className={styles.navButtons}>
          <button className={styles.navCta} type="button" onClick={onPostJob}>
            Post job
          </button>
          <a className={`${styles.navCta} ${styles.navLogin}`} href="/login">
            Нэвтрэх
          </a>
        </div>
      </div>
    </nav>
  );
}

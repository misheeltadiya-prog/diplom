import Link from "next/link";
import Image from "next/image";
import styles from "./app-footer.module.css";

type AppFooterProps = {
  /** Profile shell — main column дотор, гадна footer нуух */
  variant?: "default" | "profile";
  className?: string;
};

export function AppFooter({ variant = "default", className }: AppFooterProps) {
  const year = new Date().getFullYear();
  const rootClass = [styles.root, variant === "profile" ? styles.rootProfile : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <footer className={rootClass} id={variant === "default" ? "site-footer" : undefined}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logoRow} aria-label="C-Work нүүр">
            <Image alt="" src="/c-work-logo.svg" width={40} height={40} />
            <span className={styles.brandName}>C-Work</span>
          </Link>
          <p className={styles.tagline}>
            Freelancer, компани, ажлын зар — Монголын freelance болон remote ажлын платформ.
          </p>
        </div>

        <nav className={styles.col} aria-label="Үйлчилгээ">
          <span className={styles.colTitle}>Үйлчилгээ</span>
          <Link href="/jobs">Ажлын зар</Link>
          <Link href="/freelancers">Freelancer-ууд</Link>
          <Link href="/companies">Компаниуд</Link>
        </nav>

        <nav className={styles.col} aria-label="Холбоос">
          <span className={styles.colTitle}>Холбоос</span>
          <Link href="/">Нүүр</Link>
          <Link href="/login">Нэвтрэх</Link>
          <Link href="/register">Бүртгүүлэх</Link>
          <Link href="/profile">Профайл</Link>
          <Link href="/profile/help">Тусламж</Link>
        </nav>

        <div className={styles.social}>
          <span className={styles.socialLabel}>Сошиал</span>
          <div className={styles.socialRow}>
            <a className={styles.socialBtn} href="https://www.instagram.com" rel="noopener noreferrer" target="_blank">
              IG
            </a>
            <a className={styles.socialBtn} href="https://www.facebook.com" rel="noopener noreferrer" target="_blank">
              FB
            </a>
            <a className={styles.socialBtn} href="https://www.linkedin.com" rel="noopener noreferrer" target="_blank">
              in
            </a>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© {year} C-Work. Бүх эрх хуулиар хамгаалагдсан.</span>
        <span className={styles.lang} title="Хэл">
          <span aria-hidden>🌐</span> Монгол (MN)
        </span>
      </div>
    </footer>
  );
}

import styles from "./index-landing.module.css";

export function SiteFooter() {
  return (
    <footer className={`${styles.footer} ${styles.fadeUp}`} data-reveal="true" id="contact">
      <div className={styles.footerBottom}>
        <div className={styles.footerCopy}>© 2025 Zeel. Бүх эрх хуулиар хамгаалагдсан.</div>
        <div className={styles.social}>
          <a className={styles.socialBtn} href="#">
            X
          </a>
          <a className={styles.socialBtn} href="#">
            in
          </a>
          <a className={styles.socialBtn} href="#">
            ig
          </a>
        </div>
      </div>
    </footer>
  );
}

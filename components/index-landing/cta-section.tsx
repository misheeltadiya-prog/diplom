import styles from "./index-landing.module.css";

type CtaSectionProps = {
  onOpenModal: (mode: "hire" | "join") => void;
};

export function CtaSection({ onOpenModal }: CtaSectionProps) {
  return (
    <section className={`${styles.ctaSection} ${styles.fadeUp}`} data-reveal="true">
      <div className={styles.sectionNum}>05 — Эхлэх</div>
      <h2 className={styles.ctaTitle}>
        Өнөөдөр
        <br />
        эхлэцгээе<em>.</em>
      </h2>
      <p className={styles.ctaSub}>
        Монголын шилдэг freelancer-уудтай нэг дороос холбогдоно уу.
      </p>
      <div className={styles.heroActions}>
        <button className={styles.primaryButton} type="button" onClick={() => onOpenModal("hire")}>
          Захиалга өгөх →
        </button>
        <button className={styles.ghostButton} type="button" onClick={() => onOpenModal("join")}>
          Freelancer болох
        </button>
      </div>
    </section>
  );
}

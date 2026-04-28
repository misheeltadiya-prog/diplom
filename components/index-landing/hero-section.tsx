import styles from "./index-landing.module.css";

type HeroSectionProps = {
  onOpenModal: (mode: "hire" | "join") => void;
};

export function HeroSection({ onOpenModal: _onOpenModal }: HeroSectionProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBg} />
      <div className={styles.heroGrid} />

      <div className={`${styles.heroStats} ${styles.fadeUp}`} data-reveal="true">
        <div>
          <div className={styles.heroStatNum} data-hero-stat="true" data-target="2400" data-suffix="+">
            0
          </div>
          <div className={styles.heroStatLabel}>Freelancer</div>
        </div>
        <div>
          <div className={styles.heroStatNum} data-hero-stat="true" data-target="14000" data-suffix="+">
            0
          </div>
          <div className={styles.heroStatLabel}>Дууссан захиалга</div>
        </div>
        <div>
          <div className={styles.heroStatNum} data-hero-stat="true" data-target="98" data-suffix="%">
            0%
          </div>
          <div className={styles.heroStatLabel}>Сэтгэл ханамж</div>
        </div>
      </div>

      <div className={styles.scrollHint}>
        <span className={styles.scrollLine} />
        <span>Доош гүйлгэх</span>
      </div>
    </section>
  );
}

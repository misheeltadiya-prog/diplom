import { howSteps } from "./data";
import styles from "./index-landing.module.css";

export function HowSection() {
  return (
    <section className={styles.processSection}>
      <div className={styles.howInner}>
        <div className={`${styles.howHeading} ${styles.fadeUp}`} data-reveal="true">
          <div className={styles.sectionNum}>03 — Процесс</div>
          <div className={styles.sectionTitle}>Яаж ажилладаг</div>
        </div>
        <div className={styles.processGrid}>
          <div className={`${styles.steps} ${styles.fadeUp}`} data-reveal="true">
            {howSteps.map((step) => (
              <div className={styles.step} key={step.number}>
                <div className={styles.stepNum}>{step.number}</div>
                <div className={styles.stepContent}>
                  <div className={styles.stepTitle}>{step.title}</div>
                  <div className={styles.stepDesc}>{step.description}</div>
                </div>
              </div>
            ))}
          </div>

          <div className={`${styles.howVisual} ${styles.fadeUp}`} data-reveal="true">
            <div className={styles.howCardStack}>
              <div className={styles.howCardBack} />
              <div className={styles.howCardMain}>
                <div className={styles.howCardHeader}>
                  <div className={styles.howCardAvatar}>Б</div>
                  <div className={styles.howCardInfo}>
                    <div className={styles.howCardName}>Болд Г.</div>
                    <div className={styles.howCardRole}>Full-stack хөгжүүлэгч · Идэвхтэй</div>
                  </div>
                </div>

                <div className={styles.howCardBody}>
                  <div>
                    <div className={styles.howCardLabel}>Ажлын явц</div>
                    <div className={styles.bar}>
                      <div className={`${styles.barFill} ${styles.barFillA}`} />
                    </div>
                  </div>
                  <div>
                    <div className={styles.howCardLabel}>Чанарын оноо</div>
                    <div className={styles.bar}>
                      <div className={`${styles.barFill} ${styles.barFillB}`} />
                    </div>
                  </div>
                  <div>
                    <div className={styles.howCardLabel}>Хугацаа</div>
                    <div className={styles.bar}>
                      <div className={`${styles.barFill} ${styles.barFillC}`} />
                    </div>
                  </div>

                  <div className={styles.howStats}>
                    <div className={styles.howStat}>
                      <span className={styles.statLabel}>Захиалгын дүн</span>
                      <span className={styles.statValue}>₮1,200,000</span>
                    </div>
                    <div className={styles.howStat}>
                      <span className={styles.statLabel}>Хүлээн авсан</span>
                      <span className={`${styles.statValue} ${styles.statGreen}`}>₮600,000 ✓</span>
                    </div>
                    <div className={styles.howStat}>
                      <span className={styles.statLabel}>Хоцрогдол</span>
                      <span className={`${styles.statValue} ${styles.statBlue}`}>0 хоног</span>
                    </div>
                    <div className={styles.howStat}>
                      <span className={styles.statLabel}>Үлдэгдэл</span>
                      <span className={styles.statValue}>₮600,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

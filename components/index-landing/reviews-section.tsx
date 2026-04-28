import { testimonials } from "./data";
import styles from "./index-landing.module.css";

const accentClassMap = {
  lime: styles.accentLime,
  mint: styles.accentMint,
  pink: styles.accentPink,
  gold: styles.accentGold,
};

export function ReviewsSection() {
  return (
    <section className={styles.reviewsSection} id="reviews">
      <div className={`${styles.sectionHeader} ${styles.fadeUp}`} data-reveal="true">
        <div>
          <div className={styles.sectionNum}>04 — Сэтгэгдэл</div>
          <div className={styles.sectionTitle}>
            Захиалагчид
            <br />
            юу хэлэв
          </div>
        </div>
      </div>

      <div className={`${styles.testimonials} ${styles.fadeUp}`} data-reveal="true">
        {testimonials.map((item) => (
          <article className={styles.testimonialCard} key={item.name}>
            <div className={styles.stars}>★★★★★</div>
            <div className={styles.quoteMark}>"</div>
            <div className={styles.quoteText}>{item.quote}</div>
            <div className={styles.testiAuthor}>
              <div className={`${styles.avatar} ${accentClassMap[item.accent]}`}>{item.initials}</div>
              <div>
                <div className={styles.testiName}>{item.name}</div>
                <div className={styles.testiRole}>{item.role}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

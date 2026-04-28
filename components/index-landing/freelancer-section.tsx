import Link from "next/link";
import { freelancerCards } from "./data";
import styles from "./index-landing.module.css";

const accentClassMap = {
  lime: styles.accentLime,
  mint: styles.accentMint,
  pink: styles.accentPink,
  gold: styles.accentGold,
};

const badgeClassMap = {
  top: styles.badgeTop,
  new: styles.badgeNew,
  hot: styles.badgeHot,
};

type FreelancerSectionProps = {
  onSelect: (name: string) => void;
};

export function FreelancerSection({ onSelect }: FreelancerSectionProps) {
  return (
    <section className={styles.freelancerSection} id="freelancers">
      <div className={`${styles.sectionHeader} ${styles.fadeUp}`} data-reveal="true">
        <div>
          <div className={styles.sectionNum}>01 — Мэргэжилтнүүд</div>
          <div className={styles.sectionTitle}>
            Онцлох
            <br />
            freelancer-ууд
          </div>
        </div>
        <Link className={styles.sectionLink} href="/freelancers">
          Бүгдийг харах →
        </Link>
      </div>

      <div className={`${styles.freelancerGrid} ${styles.fadeUp}`} data-reveal="true">
        {freelancerCards.map((card) => (
          <article className={styles.card} key={card.name} onClick={() => onSelect(card.name)}>
            <div className={styles.avatarWrap}>
              <div className={`${styles.avatar} ${accentClassMap[card.accent]}`}>{card.initials}</div>
              {card.badge ? (
                <span
                  className={`${styles.badge} ${
                    card.badgeTone ? badgeClassMap[card.badgeTone] : ""
                  }`}
                >
                  {card.badge}
                </span>
              ) : null}
            </div>
            <div className={styles.cardTitle}>{card.name}</div>
            <div className={styles.cardRole}>{card.role}</div>
            <div className={styles.cardDesc}>{card.description}</div>
            <div className={styles.skills}>
              {card.skills.map((skill) => (
                <span className={styles.skill} key={skill}>
                  {skill}
                </span>
              ))}
            </div>
            <div className={styles.cardFooter}>
              <div className={styles.rating}>
                <span className={styles.star}>{card.stars}</span>
                <span className={styles.ratingText}>
                  {card.rating} <span className={styles.ratingCount}>({card.reviews})</span>
                </span>
              </div>
              <div>
                <div className={styles.rate}>{card.price}</div>
                <div className={styles.rateLabel}>/ цаг</div>
              </div>
            </div>
            <div className={styles.cardArrow}>→</div>
          </article>
        ))}
      </div>
    </section>
  );
}

import { marqueeItems } from "./data";
import styles from "./index-landing.module.css";

export function MarqueeBar() {
  const items = [...marqueeItems, ...marqueeItems];

  return (
    <section className={styles.marqueeWrap}>
      <div className={styles.marqueeTrack}>
        {items.map((item, index) => (
          <div className={styles.marqueeItem} key={`${item}-${index}`}>
            <span>{item}</span>
            <span className={styles.marqueeDot} />
          </div>
        ))}
      </div>
    </section>
  );
}

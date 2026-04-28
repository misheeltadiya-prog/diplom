import { landingCategories, type LandingCategoryKey } from "./data";
import styles from "./index-landing.module.css";

type CategoriesSectionProps = {
  selectedCategory: LandingCategoryKey | "all";
  onSelect: (category: LandingCategoryKey) => void;
};

export function CategoriesSection({ selectedCategory, onSelect }: CategoriesSectionProps) {
  return (
    <section className={styles.categoriesSection} id="categories">
      <div className={`${styles.sectionHeader} ${styles.fadeUp}`} data-reveal="true">
        <div>
          <div className={styles.sectionNum}>02 — Ангилал</div>
          <div className={styles.sectionTitle}>
            Ажлын
            <br />
            төрлүүд
          </div>
        </div>
      </div>

      <div className={`${styles.categoriesGrid} ${styles.fadeUp}`} data-reveal="true">
        {landingCategories.map((category) => (
          <button
            className={`${styles.categoryCard} ${
              selectedCategory === category.key ? styles.categoryCardActive : ""
            }`}
            key={category.key}
            onClick={() => onSelect(category.key)}
            type="button"
          >
            <div className={styles.categoryMetaRow}>
              <div className={styles.categoryIcon}>{category.icon}</div>
              <div className={styles.categoryArrow}>↗</div>
            </div>
            <div className={styles.categoryName}>{category.name}</div>
            <div className={styles.categoryDescription}>{category.description}</div>
            <div className={styles.categoryTagRow}>
              {category.tags.map((tag) => (
                <span className={styles.categoryTag} key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <div className={styles.countText}>{category.count}</div>
            <div
              className={`${styles.categoryAccentLine} ${styles[`line${category.accent[0].toUpperCase()}${category.accent.slice(1)}`]}`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}

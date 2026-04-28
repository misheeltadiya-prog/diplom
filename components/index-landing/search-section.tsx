import Image from "next/image";
import type { LandingCategoryKey } from "./data";
import styles from "./index-landing.module.css";

type SearchSectionProps = {
  searchValue: string;
  selectedCategory: LandingCategoryKey | "all";
  onChange: (value: string) => void;
  onCategoryChange: (value: LandingCategoryKey | "all") => void;
  onSearch: () => void;
};

export function SearchSection({
  searchValue: _searchValue,
  selectedCategory: _selectedCategory,
  onChange: _onChange,
  onCategoryChange: _onCategoryChange,
  onSearch: _onSearch,
}: SearchSectionProps) {
  return (
    <section className={styles.searchSection} id="search">
      <div className={`${styles.searchHeroStrip} ${styles.fadeUp}`} data-reveal="true">
        <div className={styles.searchHeroMascotWrap}>
          <Image
            alt="C-work mascot"
            className={styles.searchHeroMascot}
            height={320}
            priority
            src="/search-hero-left-mascot.png"
            width={320}
          />
        </div>
        <div className={styles.searchHeroText}>
          <div className={styles.logoContainer}>
            <h1 className={styles.searchHeroTitle}>
              Гоё ажлыг <em>C-Work</em>-оос
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import type { LandingCategoryKey } from "./data";
import styles from "./index-landing.module.css";
import { formatPlatformStat, usePlatformStats } from "./use-platform-stats";

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
  const stats = usePlatformStats();
  const landingHeroStats = [
    { value: formatPlatformStat(stats.openJobs), label: "Open Jobs" },
    { value: formatPlatformStat(stats.companies), label: "Companies" },
    { value: formatPlatformStat(stats.cvs), label: "Portfolio" },
  ];

  return (
    <section className={styles.searchSection} id="search">
      <div className={styles.searchHeroStrip}>
        <div className={styles.searchHeroText}>
          <p className={styles.searchHeroKicker}>C-Work hiring platform</p>
          <h1 className={styles.searchHeroTitle}>
            Илүү сайн <span className={styles.searchHeroAccent}>ажил.</span>
            <br />
            Илүү хурдан.
          </h1>
          <p className={styles.searchHeroSummary}>
            Монголын хамгийн хурдан өсөж буй hiring platform - топ компаниуд, бодит боломжууд.
          </p>
          <p className={styles.searchHeroMeta}>
            {formatPlatformStat(stats.companies)} компани • {formatPlatformStat(stats.openJobs)} нээлттэй ажлын байр •{" "}
            {formatPlatformStat(stats.cvs)} CV
          </p>
        </div>

        <div className={styles.searchHeroStats} aria-label="Platform statistics">
          {landingHeroStats.map((item) => (
            <div className={styles.searchHeroStatCard} key={item.label}>
              <span className={styles.searchHeroStatValue}>{item.value}</span>
              <span className={styles.searchHeroStatLabel}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

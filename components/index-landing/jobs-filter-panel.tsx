"use client";

import { useMemo } from "react";
import { landingCategories } from "./data";
import styles from "./index-landing.module.css";

const EXTRA_CATEGORY_OPTIONS = ["Marketing PR", "Technology", "Design", "Sales", "Finance", "Content", "Operations"];

const LOCATION_OPTIONS = [
  { value: "all", label: "Бүх байршил" },
  { value: "remote", label: "Remote" },
  { value: "Улаанбаатар", label: "Улаанбаатар" },
  { value: "Darkhan", label: "Darkhan" },
  { value: "Erdenet", label: "Erdenet" },
];

const JOB_TYPE_OPTIONS = [
  { value: "full-time", label: "Бүтэн цагийн" },
  { value: "part-time", label: "Цагийн ажил" },
  { value: "remote", label: "Гэрээс ажиллах / Remote" },
  { value: "internship", label: "Дадлага ажил" },
];

type JobsFilterPanelProps = {
  filterKeyword: string;
  onFilterKeywordChange: (value: string) => void;
  minSalaryFilter: number;
  onMinSalaryFilterChange: (value: number) => void;
  manualSalaryInput: string;
  onManualSalaryInputChange: (value: string) => void;
  selectedSector: string | "all";
  onSelectedSectorChange: (value: string | "all") => void;
  selectedLocation: string | "all";
  onSelectedLocationChange: (value: string | "all") => void;
  jobTypeFilters: string[];
  onJobTypeFiltersChange: (value: string[]) => void;
  onReset: () => void;
};

export function JobsFilterPanel({
  filterKeyword,
  onFilterKeywordChange,
  minSalaryFilter,
  onMinSalaryFilterChange,
  manualSalaryInput,
  onManualSalaryInputChange,
  selectedSector,
  onSelectedSectorChange,
  selectedLocation,
  onSelectedLocationChange,
  jobTypeFilters,
  onJobTypeFiltersChange,
  onReset,
}: JobsFilterPanelProps) {
  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "Бүх ангилал" },
      ...landingCategories.map((category) => ({
        value: category.key,
        label: category.name,
      })),
      ...EXTRA_CATEGORY_OPTIONS.map((category) => ({
        value: category,
        label: category,
      })),
    ],
    [],
  );

  function toggleJobType(value: string) {
    onJobTypeFiltersChange(
      jobTypeFilters.includes(value)
        ? jobTypeFilters.filter((item) => item !== value)
        : [...jobTypeFilters, value],
    );
  }

  return (
    <div className={styles.jobsFilterRail}>
      <aside className={styles.jobsFilterPanel}  >
        <div className={styles.cleanFilterHead}>
          <h3>Хайлт &amp; шүүлтүүр</h3>
        </div>

        <label className={styles.jobsFilterSearch}>
          <span className={styles.jobsFilterSearchIcon}>⌕</span>
          <input
            onChange={(event) => onFilterKeywordChange(event.target.value)}
            placeholder="Албан тушаал, компани..."
            value={filterKeyword}
          />
          {filterKeyword ? (
            <button aria-label="Clear search" className={styles.jobsFilterSearchClear} onClick={() => onFilterKeywordChange("")} type="button">
              ×
            </button>
          ) : null}
        </label>

        <div className={styles.jobsFilterSection}>
          <p className={styles.jobsFilterSectionTitle}>Ангилал</p>
          <select className={styles.jobsFilterNativeSelect} onChange={(event) => onSelectedSectorChange(event.target.value)} value={selectedSector}>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.jobsFilterSection}>
          <p className={styles.jobsFilterSectionTitle}>Байршил</p>
          <select className={styles.jobsFilterNativeSelect} onChange={(event) => onSelectedLocationChange(event.target.value)} value={selectedLocation}>
            {LOCATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.jobsFilterSection}>
          <p className={styles.jobsFilterSectionTitle}>Ажлын төрөл</p>
          <div className={styles.cleanJobTypeList}>
            {JOB_TYPE_OPTIONS.map((option) => (
              <label className={styles.cleanJobTypeOption} key={option.value}>
                <input checked={jobTypeFilters.includes(option.value)} onChange={() => toggleJobType(option.value)} type="checkbox" />
                <span />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.jobsFilterSection}>
          <p className={styles.jobsFilterSectionTitle}>Цалин</p>
          <div className={styles.jobsFilterRangeWrap}>
            <input
              className={styles.jobsFilterRange}
              max={10_000_000}
              min={0}
              onChange={(event) => onMinSalaryFilterChange(Number(event.target.value))}
              step={100_000}
              type="range"
              value={minSalaryFilter}
            />
          </div>
          <div className={styles.jobsFilterSalaryScale}>
            <span>0</span>
            <span>5M</span>
            <span>10M+</span>
          </div>
          <label className={styles.jobsFilterManualSalary}>
            <span>Доод хэмжээ</span>
            <input
              inputMode="numeric"
              onChange={(event) => onManualSalaryInputChange(event.target.value)}
              placeholder="3000000 эсвэл 3 сая"
              type="text"
              value={manualSalaryInput}
            />
          </label>
        </div>

        <button className={styles.jobsFilterClear} onClick={onReset} type="button">
          Шүүлтүүр цэвэрлэх
        </button>
      </aside>
    </div>
  );
}

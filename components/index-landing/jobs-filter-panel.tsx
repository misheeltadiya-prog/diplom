"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { landingCategories } from "./data";
import { type DisplayJob } from "./jobs-types";
import styles from "./index-landing.module.css";

const EXTRA_CATEGORY_OPTIONS = [
  "Автомашин, авто засвар үйлчилгээ",
  "Аялал жуулчлал, зочид буудал",
  "Банк, санхүү, нягтлан бодох бүртгэл",
  "Барилга, үл хөдлөх хөрөнгө",
  "Биеийн тамир, спорт, гоо сайхан",
  "Боловсрол, шинжлэх ухаан",
  "Даатгал",
  "Захиргаа, хүний нөөц",
  "Маркетинг PR, менежмент",
  "Мэдээллийн технологи, программ хангамж",
  "Ресторан, хоол үйлдвэрлэл",
  "Соёл урлаг, энтертайнмент",
  "Төрийн болон төрийн бус байгууллага, ОУБ",
  "Тээвэр логистик, авто зам, агуулах",
  "Уул уурхай",
  "Үйлдвэрлэл, инженерчлэл",
  "Харилцаа холбоо, шуудан",
  "Хөдөө аж ахуй, байгаль орчин",
  "Худалдаа, борлуулалт",
  "Хууль хүчний байгууллага, харуул хамгаалалт",
  "Хууль, эрх зүй",
  "Хэвлэл мэдээлэл, сэтгүүл зүй, дизайн",
  "Энгийн ажил мэргэжил, үйлчилгээ",
  "Эрүүл мэнд",
  "Эрчим хүч, дулаан хангамж",
];

const SCHEDULE_OPTIONS: Array<{ value: DisplayJob["employmentType"] | "all"; label: string }> = [
  { value: "Бүтэн цаг", label: "Бүтэн цагийн" },
  { value: "Хагас цаг", label: "Цагийн ажил" },
  { value: "Гэрээт", label: "Гэрээс ажиллах / Remote" },
  { value: "Remote", label: "Дадлага ажил" },
];

type JobsFilterPanelProps = {
  selectedLocation: string | "all";
  onSelectedLocationChange: (value: string | "all") => void;
  filterKeyword: string;
  onFilterKeywordChange: (value: string) => void;
  minSalaryFilter: number;
  maxSalaryFilter: number;
  onMinSalaryFilterChange: (value: number) => void;
  manualSalaryInput: string;
  onManualSalaryInputChange: (value: string) => void;
  selectedSector: string | "all";
  onSelectedSectorChange: (value: string | "all") => void;
  selectedSchedule: DisplayJob["employmentType"] | "all";
  onSelectedScheduleChange: (value: DisplayJob["employmentType"] | "all") => void;
  accessibleOnly: boolean;
  onAccessibleOnlyChange: (value: boolean) => void;
  onReset: () => void;
};

export function JobsFilterPanel({
  selectedLocation,
  onSelectedLocationChange,
  filterKeyword,
  onFilterKeywordChange,
  minSalaryFilter,
  maxSalaryFilter,
  onMinSalaryFilterChange,
  manualSalaryInput,
  onManualSalaryInputChange,
  selectedSector,
  onSelectedSectorChange,
  selectedSchedule,
  onSelectedScheduleChange,
  onReset,
}: JobsFilterPanelProps) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const categoryWrapRef = useRef<HTMLDivElement | null>(null);
  const locationWrapRef = useRef<HTMLDivElement | null>(null);

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "Бүх ангилал" },
      ...landingCategories.map((c) => ({ value: c.key, label: c.name })),
      ...EXTRA_CATEGORY_OPTIONS.map((c) => ({ value: c, label: c })),
    ],
    [],
  );

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (categoryWrapRef.current && !categoryWrapRef.current.contains(target)) setIsCategoryOpen(false);
      if (locationWrapRef.current && !locationWrapRef.current.contains(target)) setIsLocationOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  const selectedCategoryLabel =
    categoryOptions.find((o) => o.value === selectedSector)?.label ?? "Бүх ангилал";

  const locationOptions = ["all", "Улаанбаатар", "Remote", "Дархан", "Эрдэнэт"] as const;
  const selectedLocationLabel =
    selectedLocation === "all" ? "Бүх байршил" : selectedLocation;

  return (
    <div className={styles.jobsFilterRail}>
      <aside className={styles.jobsFilterPanelNew}>
        <h3 className={styles.jobsFilterTitleNew}>Хайлт &amp; шүүлтүүр</h3>

        {/* Search */}
        <label className={styles.jobsFilterSearchNew}>
          <span className={styles.jobsFilterSearchIcon}>⌕</span>
          <input
            onChange={(e) => onFilterKeywordChange(e.target.value)}
            placeholder="Албан тушаал, компани..."
            value={filterKeyword}
          />
          {filterKeyword ? (
            <button
              aria-label="Цэвэрлэх"
              className={styles.jobsFilterSearchClear}
              onClick={() => onFilterKeywordChange("")}
              type="button"
            >
              ×
            </button>
          ) : null}
        </label>

        {/* Ангилал */}
        <div className={styles.jobsFilterGroupNew}>
          <p className={styles.jobsFilterGroupLabel}>АНГИЛАЛ</p>
          <div className={styles.jobsCategoryDropdown} ref={categoryWrapRef}>
            <button
              className={styles.jobsFilterDropBtn}
              onClick={() => { setIsCategoryOpen((o) => !o); setIsLocationOpen(false); }}
              type="button"
            >
              <span>{selectedCategoryLabel}</span>
              <span className={styles.jobsFilterDropArrow}>{isCategoryOpen ? "▴" : "▾"}</span>
            </button>
            {isCategoryOpen ? (
              <div className={styles.jobsCategoryList}>
                {categoryOptions.map((opt) => (
                  <button
                    className={`${styles.jobsCategoryItem} ${selectedSector === opt.value ? styles.jobsCategoryItemActive : ""}`}
                    key={opt.value}
                    onClick={() => { onSelectedSectorChange(opt.value); setIsCategoryOpen(false); }}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Байршил */}
        <div className={styles.jobsFilterGroupNew}>
          <p className={styles.jobsFilterGroupLabel}>БАЙРШИЛ</p>
          <div className={styles.jobsCategoryDropdown} ref={locationWrapRef}>
            <button
              className={styles.jobsFilterDropBtn}
              onClick={() => { setIsLocationOpen((o) => !o); setIsCategoryOpen(false); }}
              type="button"
            >
              <span>{selectedLocationLabel}</span>
              <span className={styles.jobsFilterDropArrow}>{isLocationOpen ? "▴" : "▾"}</span>
            </button>
            {isLocationOpen ? (
              <div className={styles.jobsCategoryList}>
                {locationOptions.map((loc) => (
                  <button
                    className={`${styles.jobsCategoryItem} ${selectedLocation === loc ? styles.jobsCategoryItemActive : ""}`}
                    key={loc}
                    onClick={() => {
                      onSelectedLocationChange(loc);
                      setIsLocationOpen(false);
                    }}
                    type="button"
                  >
                    {loc === "all" ? "Бүх байршил" : loc}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Ажлын төрөл */}
        <div className={styles.jobsFilterGroupNew}>
          <p className={styles.jobsFilterGroupLabel}>АЖЛЫН ТӨРӨЛ</p>
          <div className={styles.jobsFilterCheckboxGroup}>
            {SCHEDULE_OPTIONS.map((opt) => (
              <label className={styles.jobsFilterCheckboxRow} key={opt.value}>
                <input
                  checked={selectedSchedule === opt.value}
                  onChange={() =>
                    onSelectedScheduleChange(selectedSchedule === opt.value ? "all" : opt.value)
                  }
                  type="checkbox"
                  className={styles.jobsFilterCheckboxInput}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Цалин */}
        <div className={styles.jobsFilterGroupNew}>
          <p className={styles.jobsFilterGroupLabel}>ЦАЛИН</p>
          <div className={styles.jobsFilterRangeWrap}>
            <input
              className={styles.jobsFilterRange}
              max={10_000_000}
              min={0}
              onChange={(e) => onMinSalaryFilterChange(Math.min(Number(e.target.value), maxSalaryFilter))}
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
            <span>Доод хязгаар</span>
            <input
              inputMode="numeric"
              onChange={(e) => onManualSalaryInputChange(e.target.value)}
              placeholder="3000000 эсвэл 3 сая"
              type="text"
              value={manualSalaryInput}
            />
          </label>
        </div>

        <button className={styles.jobsFilterClearNew} onClick={onReset} type="button">
          Шүүлтүүр цэвэрлэх
        </button>
      </aside>
    </div>
  );
}

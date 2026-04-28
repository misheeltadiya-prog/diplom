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
  { value: "all", label: "Бүгд" },
  { value: "Бүтэн цаг", label: "Бүтэн цаг" },
  { value: "Хагас цаг", label: "Хагас цаг" },
  { value: "Гэрээт", label: "Гэрээт" },
];

type JobsFilterPanelProps = {
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
  accessibleOnly,
  onAccessibleOnlyChange,
  onReset,
}: JobsFilterPanelProps) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const categoryWrapRef = useRef<HTMLDivElement | null>(null);
  const scheduleWrapRef = useRef<HTMLDivElement | null>(null);

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "Ангилал" },
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

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (categoryWrapRef.current && !categoryWrapRef.current.contains(target)) {
        setIsCategoryOpen(false);
      }
      if (scheduleWrapRef.current && !scheduleWrapRef.current.contains(target)) {
        setIsScheduleOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  const selectedCategoryLabel =
    categoryOptions.find((option) => option.value === selectedSector)?.label ?? "Ангилал";
  const selectedScheduleLabel =
    SCHEDULE_OPTIONS.find((option) => option.value === selectedSchedule)?.label ?? "Бүгд";

  return (
    <div className={styles.jobsFilterRail}>
      <aside className={styles.jobsFilterPanel}>
        <h3 className={styles.jobsFilterTitle}>Зар шүүх</h3>

        <label className={styles.jobsFilterSearch}>
          <span className={styles.jobsFilterSearchIcon}>⌕</span>
          <input
            onChange={(event) => onFilterKeywordChange(event.target.value)}
            placeholder="Албан тушаал, компани, байршлаар хайх"
            value={filterKeyword}
          />
          {filterKeyword ? (
            <button
              aria-label="Хайлтыг цэвэрлэх"
              className={styles.jobsFilterSearchClear}
              onClick={() => onFilterKeywordChange("")}
              type="button"
            >
              ×
            </button>
          ) : null}
        </label>

        <div className={styles.jobsFilterSection}>
          <p className={styles.jobsFilterLabel}>Цалин</p>
          <div className={styles.jobsFilterRangeWrap}>
            <input
              className={styles.jobsFilterRange}
              max={10_000_000}
              min={0}
              onChange={(event) => onMinSalaryFilterChange(Math.min(Number(event.target.value), maxSalaryFilter))}
              step={100_000}
              type="range"
              value={minSalaryFilter}
            />
          </div>
          <div className={styles.jobsFilterSalaryScale}>
            <span>0</span>
            <span>5 сая</span>
            <span>10+сая</span>
          </div>
          <label className={styles.jobsFilterManualSalary}>
            <span>Хүссэн цалин (₮)</span>
            <input
              inputMode="numeric"
              onChange={(event) => onManualSalaryInputChange(event.target.value)}
              placeholder="Ж: 3000000 эсвэл 3 сая"
              type="text"
              value={manualSalaryInput}
            />
          </label>
        </div>

        <div className={styles.jobsFilterSection}>
          <p className={styles.jobsFilterSectionTitle}>Хялбар шүүлт</p>
          <div className={styles.jobsCategoryDropdown} ref={categoryWrapRef}>
            <button
              className={styles.jobsFilterSelect}
              onClick={() => {
                setIsCategoryOpen((open) => !open);
                setIsScheduleOpen(false);
              }}
              type="button"
            >
              <span>{selectedCategoryLabel}</span>
              <span>{isCategoryOpen ? "▴" : "▾"}</span>
            </button>

            {isCategoryOpen ? (
              <div className={styles.jobsCategoryList}>
                {categoryOptions.map((option) => (
                  <button
                    className={`${styles.jobsCategoryItem} ${selectedSector === option.value ? styles.jobsCategoryItemActive : ""}`}
                    key={option.value}
                    onClick={() => {
                      onSelectedSectorChange(option.value);
                      setIsCategoryOpen(false);
                    }}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.jobsFilterSection}>
          <p className={styles.jobsFilterSectionTitle}>Ажиллах цагийн түвшин</p>
          <div className={styles.jobsCategoryDropdown} ref={scheduleWrapRef}>
            <button
              className={styles.jobsFilterSelect}
              onClick={() => {
                setIsScheduleOpen((open) => !open);
                setIsCategoryOpen(false);
              }}
              type="button"
            >
              <span>{selectedScheduleLabel}</span>
              <span>{isScheduleOpen ? "▴" : "▾"}</span>
            </button>

            {isScheduleOpen ? (
              <div className={styles.jobsCategoryList}>
                {SCHEDULE_OPTIONS.map((option) => (
                  <button
                    className={`${styles.jobsCategoryItem} ${selectedSchedule === option.value ? styles.jobsCategoryItemActive : ""}`}
                    key={option.value}
                    onClick={() => {
                      onSelectedScheduleChange(option.value);
                      setIsScheduleOpen(false);
                    }}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <label className={styles.jobsFilterCheckbox}>
          <input
            checked={accessibleOnly}
            onChange={(event) => onAccessibleOnlyChange(event.target.checked)}
            type="checkbox"
          />
          Тусгай хэрэгцээт иргэнд нээлттэй
        </label>

        <button className={styles.jobsFilterClear} onClick={onReset} type="button">
          Цэвэрлэх ×
        </button>
      </aside>
    </div>
  );
}

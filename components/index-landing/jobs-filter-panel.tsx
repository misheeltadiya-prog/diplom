"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, RotateCcw, SkipBack, SkipForward, Square, Volume2, X } from "lucide-react";
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

type VoiceGuidePanelProps = {
  enabled: boolean;
  recognitionSupported: boolean;
  secureContext: boolean;
  listening: boolean;
  speaking: boolean;
  status: string;
  transcript: string;
  commandText: string;
  micHint: string;
  onCommandTextChange: (value: string) => void;
  onSubmitTextCommand: () => void;
  onToggle: () => void;
  onListen: () => void;
  onStop: () => void;
  onFirst: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onRepeat: () => void;
  onClose: () => void;
};

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
  voiceGuide: VoiceGuidePanelProps;
  onReset: () => void;
  scheduleFiltersHidden?: boolean;
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
  accessibleOnly,
  onAccessibleOnlyChange,
  voiceGuide,
  onReset,
  scheduleFiltersHidden = false,
}: JobsFilterPanelProps) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const categoryWrapRef = useRef<HTMLDivElement | null>(null);
  const locationWrapRef = useRef<HTMLDivElement | null>(null);
  const canUseVoiceInput = voiceGuide.secureContext && voiceGuide.recognitionSupported;
  const listenButtonLabel = voiceGuide.listening
    ? "Сонсохоо болих"
    : canUseVoiceInput
      ? "Команд хэлэх"
      : voiceGuide.secureContext
        ? "Mic дэмжихгүй"
        : "Mic блоклогдсон";
  const listenButtonTitle = canUseVoiceInput
    ? undefined
    : voiceGuide.secureContext
      ? "Chrome эсвэл Edge дээр voice command ажиллана."
      : "Mic зөвхөн HTTPS эсвэл localhost дээр ажиллана.";

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

        <button
          aria-pressed={accessibleOnly}
          className={`${styles.jobsAccessibleFilterButton} ${
            accessibleOnly ? styles.jobsAccessibleFilterButtonActive : ""
          }`}
          onClick={() => onAccessibleOnlyChange(!accessibleOnly)}
          type="button"
        >
          <span className={styles.jobsAccessibleFilterIcon}>✓</span>
          <span className={styles.jobsAccessibleFilterText}>
            <strong>Тэгш боломжийн ажлууд</strong>
            <small>Хөгжлийн бэрхшээлтэй иргэдэд ээлтэй зарууд · Space — mic · Esc — буцах</small>
          </span>
          <span className={styles.jobsAccessibleFilterState}>{accessibleOnly ? "Идэвхтэй" : "Хайх"}</span>
        </button>

        {accessibleOnly ? (
          <section className={styles.jobsVoiceGuidePanel} aria-live="polite" id="jobs-voice-guide">
            <div className={styles.jobsVoiceGuideHead}>
              <div>
                <p className={styles.jobsVoiceGuideKicker}>ACCESS VOICE</p>
                <h4>Дуугаар хөтлөх</h4>
                <p className={styles.jobsVoiceGuideSpaceHint}>
                  <kbd className={styles.jobsVoiceGuideKbd}>Space</kbd> — mic ·{" "}
                  <kbd className={styles.jobsVoiceGuideKbd}>Esc</kbd> — буцах · Командын дараа автоматаар дахин
                  сонсоно
                </p>
              </div>
              <button
                className={`${styles.jobsVoiceGuideToggle} ${voiceGuide.enabled ? styles.jobsVoiceGuideToggleOn : ""}`}
                onClick={voiceGuide.onToggle}
                type="button"
              >
                <Volume2 size={16} />
                <span>{voiceGuide.enabled ? "Асаалттай" : "Асаах"}</span>
              </button>
            </div>

            {voiceGuide.enabled ? (
              <>
                <p className={styles.jobsVoiceGuideStatus}>{voiceGuide.status}</p>
                {voiceGuide.micHint ? (
                  <p className={styles.jobsVoiceGuideHint}>{voiceGuide.micHint}</p>
                ) : null}
                {voiceGuide.transcript ? (
                  <p className={styles.jobsVoiceGuideTranscript}>“{voiceGuide.transcript}”</p>
                ) : null}

                <div className={styles.jobsVoiceGuidePrimaryActions}>
                  <button
                    className={styles.jobsVoiceGuideListenBtn}
                    disabled={!voiceGuide.listening && !canUseVoiceInput}
                    onClick={voiceGuide.listening ? voiceGuide.onStop : voiceGuide.onListen}
                    title={listenButtonTitle}
                    type="button"
                  >
                    {voiceGuide.listening ? <Square size={16} /> : <Mic size={16} />}
                    <span>{listenButtonLabel}</span>
                  </button>
                  <button
                    className={styles.jobsVoiceGuideStopBtn}
                    disabled={!voiceGuide.speaking && !voiceGuide.listening}
                    onClick={voiceGuide.onStop}
                    type="button"
                  >
                    <Square size={16} />
                    <span>Зогсоох</span>
                  </button>
                </div>

                <form
                  className={styles.jobsVoiceGuideCommandForm}
                  onSubmit={(event) => {
                    event.preventDefault();
                    voiceGuide.onSubmitTextCommand();
                  }}
                >
                  <input
                    aria-label="Дуугаар хөтлөх команд"
                    onChange={(event) => voiceGuide.onCommandTextChange(event.target.value)}
                    placeholder="ж.нь: эхний зар руу ор"
                    type="text"
                    value={voiceGuide.commandText}
                  />
                  <button disabled={!voiceGuide.commandText.trim()} type="submit">
                    Ажиллуулах
                  </button>
                </form>

                <div className={styles.jobsVoiceGuideQuickGrid}>
                  <button onClick={voiceGuide.onFirst} type="button">
                    <Volume2 size={15} />
                    <span>Эхний зар</span>
                  </button>
                  <button onClick={voiceGuide.onPrevious} type="button">
                    <SkipBack size={15} />
                    <span>Өмнөх</span>
                  </button>
                  <button onClick={voiceGuide.onNext} type="button">
                    <SkipForward size={15} />
                    <span>Дараагийн</span>
                  </button>
                  <button onClick={voiceGuide.onRepeat} type="button">
                    <RotateCcw size={15} />
                    <span>Дахин унш</span>
                  </button>
                  <button onClick={voiceGuide.onClose} type="button">
                    <X size={15} />
                    <span>Хаах</span>
                  </button>
                </div>
              </>
            ) : (
              <p className={styles.jobsVoiceGuideStatus}>
                Асаагаад “эхний зар руу ор”, “дараагийн зар”, “дэлгэрэнгүй унш” гэж хэлж болно.
              </p>
            )}
          </section>
        ) : null}

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
          {scheduleFiltersHidden ? (
            <p style={{ margin: 0, fontSize: "0.86rem", lineHeight: 1.45, color: "#6b7280", fontWeight: 600 }}>
              Таны эрхээр зөвхөн <strong>бүтэн цагийн</strong> ажлын зарууд харагдана (Remote, гэрээт гэх мэтийг нуусан).
            </p>
          ) : (
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
          )}
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

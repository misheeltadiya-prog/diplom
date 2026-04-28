"use client";

import { FormEvent, RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { companies } from "./companies-directory";
import { landingCategories, type LandingCategory, type LandingCategoryKey } from "./data";
import { JobsFilterPanel } from "./jobs-filter-panel";
import { JobsListCards } from "./jobs-list-cards";
import { type DisplayJob, type JobBoardTab, type JobForm, type JobRecord } from "./jobs-types";
import styles from "./index-landing.module.css";

type JobsListSectionProps = {
  composerRef: RefObject<HTMLDivElement | null>;
  searchValue: string;
  selectedCategory: LandingCategoryKey | "all";
  favoriteJobIds: string[];
  onToggleFavorite: (jobId: string) => void;
  favoritesOnly: boolean;
  onToast: (message: string) => void;
  onComposerClose: () => void;
  onVisibleCountChange: (count: number) => void;
  showComposer: boolean;
};

const categoryMap = new Map(landingCategories.map((category) => [category.key, category]));
const allKnownTags = Array.from(new Set(landingCategories.flatMap((category) => category.tags)));
const JOBS_PER_PAGE = 10;

const jobBoardStats = [
  { value: "500+", label: "Open Jobs" },
  { value: "300+", label: "Companies" },
  { value: "1,200+", label: "Applicants" },
];

const emptyJobForm: JobForm = {
  title: "",
  companyName: "",
  location: "",
  employmentType: "Бүтэн цаг",
  salary: "",
  description: "",
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeEmploymentType(value: string) {
  const normalized = normalizeText(value);

  if (normalized.includes("remote")) {
    return "Remote";
  }

  if (normalized.includes("open")) {
    return "Нээлттэй";
  }

  if (normalized.includes("бүтэн") || normalized.includes("full")) {
    return "Бүтэн цаг";
  }

  if (normalized.includes("хагас") || normalized.includes("цагийн") || normalized.includes("part")) {
    return "Цагийн ажил";
  }

  if (normalized.includes("гэрээ") || normalized.includes("contract")) {
    return "Гэрээт";
  }

  return value;
}

function extractSalaryScore(rawSalary: string) {
  const normalized = normalizeText(rawSalary);
  const numbers = rawSalary.match(/[\d.,]+/g)?.map((value) => Number(value.replace(/,/g, ""))) ?? [];

  if (numbers.length === 0) {
    return 0;
  }

  const average = numbers.reduce((sum, value) => sum + value, 0) / numbers.length;

  if (normalized.includes("сая")) {
    return average * 1_000_000;
  }

  if (normalized.includes("k")) {
    return average * 1_000;
  }

  return average;
}

function parseManualSalaryInput(raw: string) {
  const normalized = normalizeText(raw).replace(/\s+/g, "");
  if (!normalized) {
    return null;
  }

  const numeric = Number(normalized.replace(/,/g, "").replace("сая", ""));
  if (Number.isNaN(numeric) || numeric <= 0) {
    return null;
  }

  return normalized.includes("сая") ? numeric * 1_000_000 : numeric;
}

function inferCategoryKey(job: Pick<JobRecord, "title" | "companyName" | "location" | "employmentType" | "description">) {
  const haystack = normalizeText(
    [job.title, job.companyName, job.location, job.employmentType, job.description].join(" "),
  );

  for (const category of landingCategories) {
    if (category.keywords.some((keyword) => haystack.includes(normalizeText(keyword)))) {
      return category.key;
    }
  }

  return "web";
}

function extractTags(job: Pick<JobRecord, "title" | "companyName" | "description">, fallback: string[]) {
  const haystack = normalizeText([job.title, job.companyName, job.description].join(" "));
  const matched = allKnownTags.filter((tag) => haystack.includes(normalizeText(tag)));

  return (matched.length > 0 ? matched : fallback).slice(0, 4);
}

function buildSearchableText(job: JobRecord, category: LandingCategory, tags: string[], level: string, highlight: string) {
  return normalizeText(
    [
      job.title,
      job.companyName,
      job.location,
      job.employmentType,
      job.salary,
      job.description,
      category.name,
      category.description,
      ...category.keywords,
      ...tags,
      level,
      highlight,
    ].join(" "),
  );
}

function matchesSearch(job: DisplayJob, query: string) {
  const normalized = normalizeText(query);
  if (!normalized) {
    return true;
  }

  return normalized
    .split(" ")
    .filter(Boolean)
    .every((token) => job.searchableText.includes(token));
}

function isRemoteJob(job: DisplayJob) {
  return normalizeText(`${job.location} ${job.employmentType}`).includes("remote");
}

function isFullTimeJob(job: DisplayJob) {
  const text = normalizeText(job.employmentType);
  return text.includes("бүтэн") || text.includes("full");
}

function isPartTimeJob(job: DisplayJob) {
  const text = normalizeText(job.employmentType);
  return text.includes("цагийн") || text.includes("part") || text.includes("хагас");
}

function matchesJobBoardTab(job: DisplayJob, tab: JobBoardTab) {
  if (tab === "remote") {
    return isRemoteJob(job);
  }

  if (tab === "full-time") {
    return isFullTimeJob(job);
  }

  if (tab === "part-time") {
    return isPartTimeJob(job);
  }

  return true;
}

function matchesJobTypeFilters(job: DisplayJob, filters: string[]) {
  if (filters.length === 0) {
    return true;
  }

  return filters.some((filter) => {
    if (filter === "full-time") {
      return isFullTimeJob(job);
    }

    if (filter === "part-time") {
      return isPartTimeJob(job);
    }

    if (filter === "remote") {
      return isRemoteJob(job);
    }

    if (filter === "internship") {
      return normalizeText(`${job.title} ${job.description} ${job.employmentType}`).includes("дадлага");
    }

    return true;
  });
}

function buildApplicantCount(
  job: Pick<DisplayJob, "source" | "categoryKey" | "level"> & { salaryScore: number },
  index: number,
) {
  const categoryBoostMap: Record<LandingCategoryKey, number> = {
    web: 22,
    design: 16,
    mobile: 20,
    marketing: 17,
    content: 14,
    data: 18,
  };

  const levelBoost = job.level === "Senior" ? 12 : job.level === "Junior" ? 5 : 8;
  const sourceBoost = job.source === "seed" ? 6 : 14;
  const salaryBoost = Math.round(job.salaryScore / 450000);

  return Math.max(9, sourceBoost + categoryBoostMap[job.categoryKey] + levelBoost + salaryBoost + (index % 11));
}

function buildCompanySeedJobs(now: number): JobRecord[] {
  return companies.map((company, index) => {
    const createdAt = new Date(now - (index + 1) * 60_000).toISOString();
    return {
      id: `seed-${company.domain}`,
      title: `${company.industry} Specialist`,
      companyName: company.name,
      location: company.city,
      employmentType: index % 3 === 0 ? "Remote" : "Бүтэн цаг",
      salary: `${(2.4 + (index % 6) * 0.25).toFixed(1)} сая ₮`,
      description: `${company.name}-д нээлттэй боломж байна. ${company.industry} чиглэлээр ажиллах, багтайгаа хурдан уялдах, чанартай үр дүн гаргах хүнийг хайж байна.`,
      createdAt,
      createdByName: null,
    };
  });
}

export function JobsListSection({
  composerRef,
  searchValue,
  selectedCategory,
  favoriteJobIds,
  onToggleFavorite,
  favoritesOnly,
  onToast,
  onComposerClose,
  onVisibleCountChange,
  showComposer,
}: JobsListSectionProps) {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newJob, setNewJob] = useState<JobForm>(emptyJobForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editJob, setEditJob] = useState<JobForm>(emptyJobForm);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [debouncedFilterKeyword, setDebouncedFilterKeyword] = useState("");
  const [manualSalaryInput, setManualSalaryInput] = useState("");
  const [minSalaryFilter, setMinSalaryFilter] = useState(0);
  const [maxSalaryFilter] = useState(10_000_000);
  const [selectedSector, setSelectedSector] = useState<string | "all">("all");
  const [selectedLocation, setSelectedLocation] = useState<string | "all">("all");
  const [jobTypeFilters, setJobTypeFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<JobBoardTab>("all");

  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch("/api/jobs", { cache: "no-store" });
      const payload = (await response.json()) as { jobs?: JobRecord[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Ажлын заруудыг уншихад алдаа гарлаа.");
      }

      setJobs(payload.jobs ?? []);
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Ажлын заруудыг уншиж чадсангүй.");
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    void fetchJobs();
    const interval = window.setInterval(() => {
      void fetchJobs();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [fetchJobs]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedFilterKeyword(filterKeyword);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [filterKeyword]);

  const combinedJobs = useMemo<DisplayJob[]>(() => {
    const databaseJobs = jobs.map((job) => {
      const categoryKey = inferCategoryKey(job);
      const category = categoryMap.get(categoryKey) ?? landingCategories[0];
      const tags = extractTags(job, category.tags);
      const level = normalizeText(job.title).includes("senior")
        ? "Senior"
        : normalizeText(job.title).includes("junior")
          ? "Junior"
          : "Mid";
      const employmentType = normalizeEmploymentType(job.employmentType);
      const highlight = `${category.name} ангиллын live database ажлын санал`;

      return {
        ...job,
        employmentType,
        source: "database" as const,
        categoryKey,
        tags,
        level,
        accent: category.accent,
        applicantCount: 0,
        searchableText: buildSearchableText({ ...job, employmentType }, category, tags, level, highlight),
        highlight,
        salaryScore: extractSalaryScore(job.salary),
      };
    });

    const seedJobs = buildCompanySeedJobs(Date.now()).map((job) => {
      const categoryKey = inferCategoryKey(job);
      const category = categoryMap.get(categoryKey) ?? landingCategories[0];
      const tags = extractTags(job, category.tags);
      const level = "Mid";
      const employmentType = normalizeEmploymentType(job.employmentType);
      const highlight = `${category.name} ангиллын demo ажлын санал`;

      return {
        ...job,
        employmentType,
        source: "seed" as const,
        categoryKey,
        tags,
        level,
        accent: category.accent,
        applicantCount: 0,
        searchableText: buildSearchableText({ ...job, employmentType }, category, tags, level, highlight),
        highlight,
        salaryScore: extractSalaryScore(job.salary),
      };
    });

    return [...databaseJobs, ...seedJobs]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .map((job, index) => ({
        ...job,
        applicantCount: buildApplicantCount(job, index),
      }));
  }, [jobs]);

  const parsedManualSalary = useMemo(() => parseManualSalaryInput(manualSalaryInput), [manualSalaryInput]);

  const filteredJobs = useMemo(
    () =>
      combinedJobs.filter((job) => {
        const matchesSaved = !favoritesOnly || favoriteJobIds.includes(job.id);
        const matchesCategory = selectedCategory === "all" || job.categoryKey === selectedCategory;
        const matchesHeaderSearch = matchesSearch(job, searchValue);
        const matchesFilterKeyword = matchesSearch(job, debouncedFilterKeyword);
        const remote = isRemoteJob(job);
        const matchesLocation =
          selectedLocation === "all" ||
          normalizeText(job.location).includes(normalizeText(selectedLocation)) ||
          (selectedLocation === "remote" && remote);
        const matchesSalary = job.salaryScore >= minSalaryFilter && job.salaryScore <= maxSalaryFilter;
        const matchesManualSalary = parsedManualSalary === null || job.salaryScore >= parsedManualSalary;
        const matchesSector =
          selectedSector === "all" ||
          job.categoryKey === selectedSector ||
          job.searchableText.includes(normalizeText(selectedSector));

        return (
          matchesSaved &&
          matchesCategory &&
          matchesHeaderSearch &&
          matchesFilterKeyword &&
          matchesLocation &&
          matchesSalary &&
          matchesManualSalary &&
          matchesSector &&
          matchesJobTypeFilters(job, jobTypeFilters) &&
          matchesJobBoardTab(job, activeTab)
        );
      }),
    [
      activeTab,
      combinedJobs,
      debouncedFilterKeyword,
      favoriteJobIds,
      favoritesOnly,
      jobTypeFilters,
      maxSalaryFilter,
      minSalaryFilter,
      parsedManualSalary,
      searchValue,
      selectedCategory,
      selectedLocation,
      selectedSector,
    ],
  );

  const tabCounts = useMemo(
    () => ({
      all: combinedJobs.length,
      remote: combinedJobs.filter((job) => isRemoteJob(job)).length,
      "full-time": combinedJobs.filter((job) => isFullTimeJob(job)).length,
      "part-time": combinedJobs.filter((job) => isPartTimeJob(job)).length,
    }),
    [combinedJobs],
  );

  useEffect(() => {
    onVisibleCountChange(filteredJobs.length);
  }, [filteredJobs.length, onVisibleCountChange]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    searchValue,
    selectedCategory,
    favoritesOnly,
    filterKeyword,
    minSalaryFilter,
    selectedSector,
    selectedLocation,
    jobTypeFilters,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * JOBS_PER_PAGE;
    return filteredJobs.slice(start, start + JOBS_PER_PAGE);
  }, [filteredJobs, currentPage]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJob),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Ажлын зар нэмэхэд алдаа гарлаа.");
      }

      setNewJob(emptyJobForm);
      onComposerClose();
      onToast("Ажлын зар нэмэгдлээ.");
      await fetchJobs();
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Ажлын зар нэмэхэд алдаа гарлаа.");
    } finally {
      setSubmitting(false);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditJob(emptyJobForm);
  }

  async function saveEdit(id: string) {
    setSubmitting(true);

    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editJob),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Ажлын зар засахад алдаа гарлаа.");
      }

      onToast("Ажлын зар шинэчлэгдлээ.");
      cancelEdit();
      await fetchJobs();
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Ажлын зар засаж чадсангүй.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetFilters() {
    setFilterKeyword("");
    setManualSalaryInput("");
    setMinSalaryFilter(0);
    setSelectedSector("all");
    setSelectedLocation("all");
    setJobTypeFilters([]);
    setActiveTab("all");
  }

  return (
    <div className={styles.jobsBoard} id="jobs" ref={composerRef}>
      {showComposer ? (
        <form className={styles.jobsComposer} onSubmit={handleCreate}>
          <div className={styles.jobsComposerTop}>
            <div>
              <div className={styles.jobsFormEyebrow}>Post Job</div>
              <h3 className={styles.jobsFormTitle}>Шинэ ажлын зар нэмэх</h3>
              <p className={styles.jobsFormCopy}>Ажлаа нийтлээд шууд энэ жагсаалт дээр гаргаарай.</p>
            </div>
            <button className={styles.jobsComposerClose} onClick={onComposerClose} type="button">
              Хаах
            </button>
          </div>

          <div className={styles.jobsFormRow}>
            <input
              onChange={(event) => setNewJob({ ...newJob, title: event.target.value })}
              placeholder="Ажлын гарчиг"
              required
              value={newJob.title}
            />
            <input
              onChange={(event) => setNewJob({ ...newJob, companyName: event.target.value })}
              placeholder="Компани"
              required
              value={newJob.companyName}
            />
          </div>

          <div className={styles.jobsFormRow}>
            <input
              onChange={(event) => setNewJob({ ...newJob, location: event.target.value })}
              placeholder="Байршил"
              required
              value={newJob.location}
            />
            <input
              onChange={(event) => setNewJob({ ...newJob, salary: event.target.value })}
              placeholder="Цалин"
              required
              value={newJob.salary}
            />
          </div>

          <div className={styles.jobsFormRow}>
            <select
              onChange={(event) => setNewJob({ ...newJob, employmentType: event.target.value })}
              value={newJob.employmentType}
            >
              <option>Бүтэн цаг</option>
              <option>Цагийн ажил</option>
              <option>Гэрээт</option>
              <option>Remote</option>
            </select>
            <button disabled={submitting} type="submit">
              {submitting ? "Хадгалж байна..." : "Post job"}
            </button>
          </div>

          <textarea
            onChange={(event) => setNewJob({ ...newJob, description: event.target.value })}
            placeholder="Ажлын тайлбар"
            required
            rows={4}
            value={newJob.description}
          />
        </form>
      ) : null}

      <section className={styles.cleanJobsHero}>
        <div className={styles.cleanJobsHeroCopy}>
          <h2>
            Илүү сайн <span>ажил.</span> Илүү хурдан.
          </h2>
          <p>Монголын хамгийн хурдан өсч буй hiring platform - топ компаниуд, бодит боломжууд.</p>
          <div className={styles.cleanJobsHeroActions}>
            <a className={styles.cleanJobsHeroPrimary} href="#jobs-content">
              Ажил хайх
            </a>
            <a className={styles.cleanJobsHeroSecondary} href="/register">
              CV нэмэх
            </a>
          </div>
          <div className={styles.cleanJobsHeroTrust}>300+ компани • 500+ нээлттэй ажлын байр</div>
        </div>

        <div className={styles.cleanJobsStatsGrid}>
          {jobBoardStats.map((stat) => (
            <div className={styles.cleanJobsStatCard} key={stat.label}>
              <strong>{stat.value}</strong>
              <small>{stat.label}</small>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.jobsContent} id="jobs-content">
        <JobsFilterPanel
          filterKeyword={filterKeyword}
          jobTypeFilters={jobTypeFilters}
          manualSalaryInput={manualSalaryInput}
          minSalaryFilter={minSalaryFilter}
          onFilterKeywordChange={setFilterKeyword}
          onJobTypeFiltersChange={setJobTypeFilters}
          onManualSalaryInputChange={setManualSalaryInput}
          onMinSalaryFilterChange={setMinSalaryFilter}
          onReset={resetFilters}
          onSelectedLocationChange={setSelectedLocation}
          onSelectedSectorChange={setSelectedSector}
          selectedLocation={selectedLocation}
          selectedSector={selectedSector}
        />

        <JobsListCards
          activeTab={activeTab}
          editJob={editJob}
          editingId={editingId}
          favoriteJobIds={favoriteJobIds}
          filteredJobs={filteredJobs}
          jobBoardStats={jobBoardStats}
          paginatedJobs={paginatedJobs}
          currentPage={currentPage}
          tabCounts={tabCounts}
          totalPages={totalPages}
          loading={loading}
          onApplyClick={(job) => onToast(`${job.title} дээр дэлгэрэнгүй урсгалыг дараагийн алхмаар холбоно.`)}
          onCancelEdit={cancelEdit}
          onEditFieldChange={setEditJob}
          onPageChange={setCurrentPage}
          onSaveEdit={saveEdit}
          onTabChange={setActiveTab}
          submitting={submitting}
          onToggleFavorite={onToggleFavorite}
        />
      </div>
    </div>
  );
}

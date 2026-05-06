"use client";

import { FormEvent, RefObject, useCallback, useEffect, useMemo, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { CompanyProfileForm } from "@/app/profile/company/company-profile-form";
import { landingCategories, type LandingCategory, type LandingCategoryKey } from "./data";
import { JobsFilterPanel } from "./jobs-filter-panel";
import { JobsListCards } from "./jobs-list-cards";
import { type DisplayJob, type JobForm, type JobRecord } from "./jobs-types";
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
  currentUser?: SessionUser | null;
  /** URL ?mine=1 — зөвхөн өөрийн оруулсан зарууд */
  mineOnly?: boolean;
  /** URL ?applied=1 — зөвхөн өргөдөл илгээсэн ажлын зарууд */
  appliedJobsOnly?: boolean;
  onOpenJobComposer?: () => void;
  /** Freelancer: жагсаалтад гаргах profile зарын цонх нээх (ажлын зар биш) */
  onOpenFreelancerPublish?: () => void;
  /** Зар амжилттай нэмэгдсэний дараа (энэ хуудасны гадна) ангилал/хайлт цэвэрлэх */
  onClearLandingFilters?: () => void;
};

const categoryMap = new Map(landingCategories.map((category) => [category.key, category]));
const allKnownTags = Array.from(new Set(landingCategories.flatMap((category) => category.tags)));
const JOBS_PER_PAGE = 10;

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

  if (normalized === "remote") {
    return "Remote";
  }

  if (normalized === "open") {
    return "Нээлттэй";
  }

  return value;
}

function extractSalaryScore(rawSalary: string) {
  const normalized = rawSalary.toLowerCase();
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

  const tokens = normalized.split(" ").filter(Boolean);

  return tokens.every((token) => job.searchableText.includes(token));
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
  const sourceBoost = 14;
  const salaryBoost = Math.round(job.salaryScore / 450000);

  return Math.max(9, sourceBoost + categoryBoostMap[job.categoryKey] + levelBoost + salaryBoost + (index % 11));
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
  currentUser = null,
  mineOnly = false,
  appliedJobsOnly = false,
  onOpenJobComposer,
  onOpenFreelancerPublish,
  onClearLandingFilters,
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
  const [maxSalaryFilter, setMaxSalaryFilter] = useState(10_000_000);
  const [selectedSector, setSelectedSector] = useState<string | "all">("all");
  const [selectedSchedule, setSelectedSchedule] = useState<DisplayJob["employmentType"] | "all">("all");
  const [selectedLocation, setSelectedLocation] = useState<string | "all">("all");
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [companySheetTab, setCompanySheetTab] = useState<"job" | "company">("job");
  const [applicationStatusByJobId, setApplicationStatusByJobId] = useState<
    Record<string, "pending" | "accepted" | "rejected">
  >({});
  const [myAppsLoading, setMyAppsLoading] = useState(false);

  useEffect(() => {
    if (showComposer) {
      setCompanySheetTab("job");
    }
  }, [showComposer]);

  useEffect(() => {
    if (!showComposer) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showComposer]);

  useEffect(() => {
    if (!showComposer) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onComposerClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showComposer, onComposerClose]);

  useEffect(() => {
    if (!showComposer || currentUser?.role !== "company") {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/company-profile", { cache: "no-store", credentials: "same-origin" });
        const j = (await r.json()) as { ok?: boolean; profile?: { company_name?: string } };
        if (
          cancelled ||
          !r.ok ||
          j.ok === false ||
          !j.profile?.company_name?.trim()
        ) {
          return;
        }
        setNewJob((prev) => ({
          ...prev,
          companyName: prev.companyName.trim() ? prev.companyName : j.profile!.company_name!.trim(),
        }));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showComposer, currentUser?.role]);

  useEffect(() => {
    if (!appliedJobsOnly || !currentUser || currentUser.role === "company") {
      setApplicationStatusByJobId({});
      setMyAppsLoading(false);
      return;
    }

    let cancelled = false;
    setMyAppsLoading(true);

    (async () => {
      try {
        const response = await fetch("/api/profile/my-applications", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = (await response.json()) as {
          ok?: boolean;
          applications?: Array<{ jobId: string; status: string }>;
          error?: string;
        };
        if (cancelled) {
          return;
        }
        if (!response.ok || !data.ok) {
          setApplicationStatusByJobId({});
          if (data.error) {
            onToast(data.error);
          }
          return;
        }
        const next: Record<string, "pending" | "accepted" | "rejected"> = {};
        for (const row of data.applications ?? []) {
          if (!row.jobId || row.jobId in next) {
            continue;
          }
          const s = row.status;
          if (s === "pending" || s === "accepted" || s === "rejected") {
            next[row.jobId] = s;
          }
        }
        setApplicationStatusByJobId(next);
      } catch {
        if (!cancelled) {
          setApplicationStatusByJobId({});
        }
      } finally {
        if (!cancelled) {
          setMyAppsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [appliedJobsOnly, currentUser, onToast]);

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

    return () => {
      window.clearTimeout(timer);
    };
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
      const highlight = `${category.name} ангилалд автоматаар ангилсан live database ажлын санал`;

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

    return databaseJobs
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .map((job, index) => {
        const applicantCount = buildApplicantCount(job, index);
        return { ...job, applicantCount };
      });
  }, [jobs]);

  const scopedJobs = useMemo(() => {
    let list = combinedJobs;
    if (mineOnly) {
      list = list.filter(
        (job) =>
          job.source === "database" &&
          typeof currentUser?.id === "number" &&
          job.createdByUserId === currentUser.id,
      );
    }
    if (appliedJobsOnly && currentUser && currentUser.role !== "company") {
      const ids = new Set(Object.keys(applicationStatusByJobId));
      list = list.filter((job) => job.source === "database" && ids.has(job.id));
    }
    return list;
  }, [appliedJobsOnly, applicationStatusByJobId, combinedJobs, currentUser, mineOnly]);

  const parsedManualSalary = useMemo(() => parseManualSalaryInput(manualSalaryInput), [manualSalaryInput]);

  const filteredJobs = useMemo(
    () =>
      scopedJobs.filter((job) => {
        const matchesSaved = !favoritesOnly || favoriteJobIds.includes(job.id);
        const matchesCategory = selectedCategory === "all" || job.categoryKey === selectedCategory;
        const matchesHeaderSearch = matchesSearch(job, searchValue);
        const matchesFilterKeyword = matchesSearch(job, debouncedFilterKeyword);
        const locHay = normalizeText(job.location);
        const matchesLocation =
          selectedLocation === "all" ||
          (selectedLocation === "Remote"
            ? locHay.includes("remote") || normalizeText(job.employmentType).includes("remote")
            : locHay.includes(normalizeText(selectedLocation)));
        const matchesSalary = job.salaryScore >= minSalaryFilter && job.salaryScore <= maxSalaryFilter;
        const matchesManualSalary = parsedManualSalary === null || job.salaryScore >= parsedManualSalary;
        const matchesSector =
          selectedSector === "all" ||
          job.categoryKey === selectedSector ||
          job.searchableText.includes(normalizeText(selectedSector));
        const matchesSchedule = selectedSchedule === "all" || job.employmentType === selectedSchedule;
        const matchesAccessibility =
          !accessibleOnly || normalizeText(`${job.title} ${job.description}`).includes("нээлттэй");

        return (
          matchesSaved &&
          matchesCategory &&
          matchesHeaderSearch &&
          matchesFilterKeyword &&
          matchesLocation &&
          matchesSalary &&
          matchesManualSalary &&
          matchesSector &&
          matchesSchedule &&
          matchesAccessibility
        );
      }),
    [
      accessibleOnly,
      favoriteJobIds,
      scopedJobs,
      favoritesOnly,
      debouncedFilterKeyword,
      parsedManualSalary,
      maxSalaryFilter,
      minSalaryFilter,
      searchValue,
      selectedCategory,
      selectedSchedule,
      selectedSector,
      selectedLocation,
    ],
  );

  useEffect(() => {
    onVisibleCountChange(filteredJobs.length);
  }, [filteredJobs.length, onVisibleCountChange]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchValue,
    selectedCategory,
    favoritesOnly,
    filterKeyword,
    minSalaryFilter,
    maxSalaryFilter,
    selectedSector,
    selectedSchedule,
    selectedLocation,
    accessibleOnly,
    mineOnly,
    appliedJobsOnly,
    applicationStatusByJobId,
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
        credentials: "same-origin",
        body: JSON.stringify(newJob),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Ажлын зар нэмэхэд алдаа гарлаа.");
      }

      setNewJob(emptyJobForm);
      onComposerClose();
      resetFilters();
      onClearLandingFilters?.();
      onToast("Ажлын зар нэмэгдлээ.");
      await fetchJobs();
      window.dispatchEvent(new Event("cwork:platform-stats-changed"));
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
        credentials: "same-origin",
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

  function startEdit(job: JobRecord) {
    setEditingId(job.id);
    setEditJob({
      title: job.title,
      companyName: job.companyName,
      location: job.location,
      employmentType: job.employmentType,
      salary: job.salary,
      description: job.description,
    });
  }

  async function removeJob(id: string) {
    const confirmed = window.confirm("Энэ ажлын зарыг устгах уу?");
    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Ажлын зар устгахад алдаа гарлаа.");
      }

      if (editingId === id) {
        cancelEdit();
      }

      onToast("Ажлын зар устгагдлаа.");
      await fetchJobs();
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Ажлын зар устгаж чадсангүй.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetFilters() {
    setFilterKeyword("");
    setManualSalaryInput("");
    setMinSalaryFilter(0);
    setMaxSalaryFilter(10_000_000);
    setSelectedSector("all");
    setSelectedSchedule("all");
    setSelectedLocation("all");
    setAccessibleOnly(false);
  }

  return (
    <div className={styles.jobsBoard} id="jobs" ref={composerRef}>
      {showComposer ? (
        <div className={styles.landingSheetOverlay} onClick={onComposerClose} role="presentation">
          <article
            aria-labelledby="jobs-post-sheet-title"
            className={`${styles.freelancerGridCard} ${styles.landingSheetPanel}`}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button aria-label="Хаах" className={styles.landingSheetClose} onClick={onComposerClose} type="button">
              ×
            </button>
            <h2 className={styles.landingSheetTitle} id="jobs-post-sheet-title">
              Зар оруулах
            </h2>
            <p className={styles.landingSheetSubtitle}>
              Ажлын зар эндээс · компанийн мэдээлэл нь profile хуудастай ижил талбарууд
            </p>
            {currentUser?.role === "freelancer" ? (
              <div className={styles.landingSheetGate}>
                <p className={styles.landingSheetGateText}>
                  Энэ цонхноос <strong>компани ажлын зар</strong> оруулна. Freelancer-ийн зар (профайл, үнэ, portfolio) нь{" "}
                  <strong>Freelancers</strong> жагсаалтад гарна — доорх товчоор бөглөнө үү.
                </p>
                <button
                  className={styles.jobsTabMore}
                  onClick={() => {
                    onOpenFreelancerPublish?.();
                    onComposerClose();
                  }}
                  style={{ width: "100%", maxWidth: 320, justifyContent: "center" }}
                  type="button"
                >
                  Freelancer зар оруулах
                </button>
              </div>
            ) : currentUser?.role === "company" ? (
              <div className={styles.landingSheetTabs} role="tablist">
                <button
                  aria-selected={companySheetTab === "job"}
                  className={`${styles.landingSheetTab} ${companySheetTab === "job" ? styles.landingSheetTabActive : ""}`}
                  onClick={() => setCompanySheetTab("job")}
                  role="tab"
                  type="button"
                >
                  Ажлын зар
                </button>
                <button
                  aria-selected={companySheetTab === "company"}
                  className={`${styles.landingSheetTab} ${companySheetTab === "company" ? styles.landingSheetTabActive : ""}`}
                  onClick={() => setCompanySheetTab("company")}
                  role="tab"
                  type="button"
                >
                  Компани
                </button>
              </div>
            ) : null}
            {currentUser?.role === "company" && companySheetTab === "company" ? (
              <CompanyProfileForm />
            ) : currentUser?.role === "freelancer" ? null : (
              <form className={`${styles.jobsComposer} ${styles.jobsComposerInSheet}`} onSubmit={handleCreate}>
                <div className={styles.jobsComposerTop}>
                  <div>
                    <div className={styles.jobsFormEyebrow}>Ажлын зар</div>
                    <h3 className={styles.jobsFormTitle}>Шинэ зар</h3>
                    <p className={styles.jobsFormCopy}>Бүх талбарыг бөглөөд жагсаалтад нэмнэ үү.</p>
                  </div>
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
                    <option>Хагас цаг</option>
                    <option>Гэрээт</option>
                    <option>Remote</option>
                  </select>
                  <button disabled={submitting} type="submit">
                    {submitting ? "Хадгалж байна..." : "Зар нийтлэх"}
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
            )}
          </article>
        </div>
      ) : null}

      {/* Tab bar */}
      <div className={styles.jobsTabBar}>
        <button
          className={`${styles.jobsTab} ${selectedCategory === "all" ? styles.jobsTabActive : ""}`}
          onClick={() => {}}
          type="button"
        >
          {appliedJobsOnly
            ? "Илгээсэн өргөдлийн зарууд"
            : mineOnly
              ? "\u041c\u0438\u043d\u0438\u0439 \u0437\u0430\u0440\u0443\u0443\u0434"
              : "\u0411\u04af\u0445 \u0430\u0436\u043b\u0443\u0443\u0434"}
          <span className={styles.jobsTabCount}>{scopedJobs.length}</span>
        </button>
        <button
          className={`${styles.jobsTab} ${selectedSchedule === "Remote" ? styles.jobsTabActive : ""}`}
          onClick={() => {}}
          type="button"
        >
          {"Remote \u0430\u0436\u043b\u0443\u0443\u0434"}
          <span className={styles.jobsTabCount}>
            {scopedJobs.filter((j) => j.employmentType === "Remote").length}
          </span>
        </button>
        <button
          className={`${styles.jobsTab} ${selectedSchedule === "\u0411\u04af\u0442\u044d\u043d \u0446\u0430\u0433" ? styles.jobsTabActive : ""}`}
          onClick={() => {}}
          type="button"
        >
          {"\u0411\u04af\u0442\u044d\u043d \u0446\u0430\u0433\u0438\u0439\u043d"}
          <span className={styles.jobsTabCount}>
            {scopedJobs.filter((j) => j.employmentType === "\u0411\u04af\u0442\u044d\u043d \u0446\u0430\u0433").length}
          </span>
        </button>
        <button
          className={`${styles.jobsTab} ${selectedSchedule === "\u0425\u0430\u0433\u0430\u0441 \u0446\u0430\u0433" ? styles.jobsTabActive : ""}`}
          onClick={() => {}}
          type="button"
        >
          {"\u0426\u0430\u0433\u0438\u0439\u043d \u0430\u0436\u0438\u043b"}
          <span className={styles.jobsTabCount}>
            {scopedJobs.filter((j) => j.employmentType === "\u0425\u0430\u0433\u0430\u0441 \u0446\u0430\u0433").length}
          </span>
        </button>
        {currentUser?.role === "company" || currentUser?.role === "admin" ? (
          <button
            className={styles.jobsTabMore}
            onClick={() => {
              onOpenJobComposer?.();
            }}
            type="button"
          >
            Зар оруулах
          </button>
        ) : null}
      </div>

      <div className={styles.jobsContent} id="jobs-content">
        <JobsFilterPanel
          selectedLocation={selectedLocation}
          onSelectedLocationChange={setSelectedLocation}
          accessibleOnly={accessibleOnly}
          filterKeyword={filterKeyword}
          maxSalaryFilter={maxSalaryFilter}
          manualSalaryInput={manualSalaryInput}
          minSalaryFilter={minSalaryFilter}
          onAccessibleOnlyChange={setAccessibleOnly}
          onFilterKeywordChange={setFilterKeyword}
          onManualSalaryInputChange={setManualSalaryInput}
          onMinSalaryFilterChange={setMinSalaryFilter}
          onReset={resetFilters}
          onSelectedScheduleChange={setSelectedSchedule}
          onSelectedSectorChange={setSelectedSector}
          selectedSchedule={selectedSchedule}
          selectedSector={selectedSector}
        />

        <JobsListCards
          applicationStatusByJobId={applicationStatusByJobId}
          currentUser={currentUser}
          editJob={editJob}
          editingId={editingId}
          emptyHint={
            appliedJobsOnly && currentUser && currentUser.role !== "company"
              ? "Та одоогоор ажлын зар дээр өргөдөл илгээгүй эсвэл зар устгагдсан байна."
              : undefined
          }
          favoriteJobIds={favoriteJobIds}
          filteredJobs={filteredJobs}
          paginatedJobs={paginatedJobs}
          currentPage={currentPage}
          totalPages={totalPages}
          loading={
            loading ||
            Boolean(appliedJobsOnly && currentUser && currentUser.role !== "company" && myAppsLoading)
          }
          onToast={onToast}
          onCancelEdit={cancelEdit}
          onEditFieldChange={setEditJob}
          onPageChange={setCurrentPage}
          onDeleteJob={removeJob}
          onSaveEdit={saveEdit}
          onStartEdit={startEdit}
          submitting={submitting}
          onToggleFavorite={onToggleFavorite}
        />
      </div>
    </div>
  );
}

"use client";

import { FormEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { CompanyProfileForm } from "@/app/profile/company/company-profile-form";
import { landingCategories, type LandingCategory, type LandingCategoryKey } from "./data";
import { JobsFilterPanel } from "./jobs-filter-panel";
import { JobsListCards } from "./jobs-list-cards";
import {
  STRUCTURED_JOB_SECTION_LABELS,
  buildStructuredJobDescription,
  getSectionsForJobDetail,
} from "@/lib/job-description-sections";
import { parseVoiceCommandBest, type VoiceJobCommand } from "@/lib/voice-job-commands";
import { buildJobVoiceSpeechMn } from "@/lib/voice-job-speech";
import { normalizeJobEmploymentType } from "@/lib/job-employment-type";
import { computeJobTabCounts, EMPTY_JOB_TAB_COUNTS, type JobTabCounts } from "@/lib/job-tab-counts";
import { parseSalaryAmount } from "@/lib/salary-amount";
import { type DisplayJob, type JobForm, type JobRecord } from "./jobs-types";
import styles from "./index-landing.module.css";

type SpeechRecognitionResultListLike = {
  length: number;
  [index: number]: {
    isFinal: boolean;
    length: number;
    [index: number]: {
      transcript: string;
    };
  };
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function buildLocalhostVoiceUrl() {
  if (typeof window === "undefined" || window.isSecureContext) return "";
  const { port, pathname, search, hash } = window.location;
  const host = port ? `localhost:${port}` : "localhost";
  return `http://${host}${pathname}${search}${hash}`;
}

function blockedMicStatus(localhostUrl: string) {
  return localhostUrl
    ? `Mic browser-оор блоклогдож байна. Энэ компьютер дээр ${localhostUrl} хаягаар нээгээд дахин оролдоно уу, эсвэл HTTPS domain ашиглаарай. Доорх command талбар ажиллана.`
    : "Mic browser-оор блоклогдож байна. Дуугаар удирдахад HTTPS эсвэл http://localhost шаардлагатай. Доорх command талбар ажиллана.";
}

function blockedMicHint(localhostUrl: string) {
  return localhostUrl
    ? `Mic зөвхөн HTTPS эсвэл localhost дээр ажиллана. Энэ компьютер дээр ${localhostUrl} хаягаар нээгээд үзээрэй; http://172.17... дээр browser блоклодог.`
    : "Mic зөвхөн HTTPS эсвэл http://localhost дээр ажиллана. http://172.17... хаягаар орсон бол browser блоклодог.";
}

/** Монгол команд — эхлээд mn-MN, дэмжихгүй бол en-US */
const SPEECH_RECOGNITION_LANGS = ["mn-MN", "mn", "en-US"] as const;
const VOICE_LISTEN_SILENCE_MS = 5200;

function pickSpeechVoice(voices: SpeechSynthesisVoice[]) {
  const mn =
    voices.find((v) => v.lang.toLowerCase() === "mn-mn") ??
    voices.find((v) => v.lang.toLowerCase().startsWith("mn")) ??
    null;
  return mn ?? voices.find((v) => v.lang.toLowerCase().startsWith("en")) ?? voices[0] ?? null;
}

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
  /** URL `?job=` — ажлын дэлгэрэнгүй автоматаар */
  openJobIdFromUrl?: string | null;
  onConsumeOpenJobIdFromUrl?: () => void;
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

function LandingSheetCloseIcon() {
  return (
    <svg aria-hidden className={styles.landingSheetCloseIcon} height="18" viewBox="0 0 24 24" width="18">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.25" />
    </svg>
  );
}

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

const JOB_POST_SECTION_UI = [
  { short: "Хийж гүйцэтгэх үүрэг", hint: "Өдөр тутмын үндсэн даалгавар, үр дүн." },
  { short: "Тавигдах шаардлага", hint: "Боловсрол, туршлага, хувийн зөвлөмж." },
  { short: "Нэмэлт мэдээлэл", hint: "Ажлын цаг, байршил, багийн бүтэц гэх мэт." },
  { short: "Шаардлагатай ур чадвар", hint: "Хэл, хэрэгсэл, техникийн чадвар." },
  { short: "Хангамж, урамшуулал", hint: "Даатгал, сургалт, урамшуулал." },
  { short: "Холбоо барих", hint: "И-мэйл, утас, хүлээгдэж буй хариуны хугацаа." },
] as const;

const JOB_POST_TIPS: { mark: string; title: string; desc: string }[] = [
  { mark: "T", title: "Тод гарчиг", desc: "Ажлын нэр, түвшинг нэг мөрт ойлгомжтой бичнэ үү." },
  { mark: "₮", title: "Цалин & төрөл", desc: "Цалин болон ажлын төрлийг нээлттэй заана." },
  { mark: "✓", title: "Тодорхой шаардлага", desc: "Юу хийлгэх, ямар ур чадвар хэрэгтэйг тусад нь." },
  { mark: "◎", title: "Байршил", desc: "Оффис, гибрид эсвэл Remote-ийг тодорхойлно уу." },
];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function extractSalaryScore(rawSalary: string) {
  return parseSalaryAmount(rawSalary);
}

function jobMatchesSalaryFilter(
  salaryScore: number,
  minSalaryFilter: number,
  maxSalaryFilter: number,
  parsedManualSalary: number | null,
) {
  const score = Number.isFinite(salaryScore) ? salaryScore : 0;
  if (score <= 0) {
    return true;
  }
  if (parsedManualSalary !== null && score < parsedManualSalary) {
    return false;
  }
  return score >= minSalaryFilter && score <= maxSalaryFilter;
}

function parseManualSalaryInput(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const amount = parseSalaryAmount(trimmed);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount;
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

const ACCESSIBLE_JOB_KEYWORDS = [
  "хөгжлийн бэрхшээл",
  "бэрхшээлтэй",
  "хүртээмж",
  "хүртээмжтэй",
  "тэгш боломж",
  "inclusive",
  "inclusion",
  "accessibility",
  "accessible",
  "disability",
  "disabled",
  "remote",
  "алсаас",
  "гэрээс",
  "уян хатан",
  "нээлттэй",
];

function isAccessibleFriendlyJob(job: DisplayJob) {
  const haystack = normalizeText(
    [job.title, job.companyName, job.location, job.employmentType, job.description, job.searchableText].join(" "),
  );

  return ACCESSIBLE_JOB_KEYWORDS.some((keyword) => haystack.includes(normalizeText(keyword)));
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
  openJobIdFromUrl = null,
  onConsumeOpenJobIdFromUrl,
  mineOnly = false,
  appliedJobsOnly = false,
  onOpenJobComposer,
  onOpenFreelancerPublish,
  onClearLandingFilters,
}: JobsListSectionProps) {
  const clientFullTimeOnly = currentUser?.role === "client";
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [tabCounts, setTabCounts] = useState<JobTabCounts>(EMPTY_JOB_TAB_COUNTS);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newJob, setNewJob] = useState<JobForm>(emptyJobForm);
  const [jobPostDescSections, setJobPostDescSections] = useState<string[]>(() =>
    Array.from({ length: 6 }, () => ""),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editJob, setEditJob] = useState<JobForm>(emptyJobForm);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [debouncedFilterKeyword, setDebouncedFilterKeyword] = useState("");
  const [manualSalaryInput, setManualSalaryInput] = useState("");
  const [minSalaryFilter, setMinSalaryFilter] = useState(0);
  const [maxSalaryFilter, setMaxSalaryFilter] = useState(100_000_000);
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
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const voiceDetailOpenRef = useRef(false);
  /** Дуугаар зар сонгох одоогийн индекс (state-ээс өмнө шинэчлэгдэнэ — «дараагийн» алдааг засна). */
  const voiceJobIndexRef = useRef(-1);
  const voiceAutoListenRef = useRef(true);
  const voiceListenTimeoutRef = useRef<number | null>(null);
  const voiceGuideEnabledRef = useRef(false);
  const [voiceGuideEnabled, setVoiceGuideEnabled] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceSpeaking, setVoiceSpeaking] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Тэгш боломжийн ажлуудаас дуугаар сонгож уншуулна.");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceCommandInput, setVoiceCommandInput] = useState("");
  const [voiceOpenJobId, setVoiceOpenJobId] = useState<string | null>(null);
  const [voiceSelectedJobId, setVoiceSelectedJobId] = useState<string | null>(null);
  const [voiceCloseSignal, setVoiceCloseSignal] = useState(0);
  const [voiceSupport, setVoiceSupport] = useState({
    recognition: false,
    synthesis: false,
    secureContext: true,
    localhostUrl: "",
  });

  useEffect(() => {
    voiceGuideEnabledRef.current = voiceGuideEnabled;
  }, [voiceGuideEnabled]);

  const useStructuredJobPost =
    currentUser?.role === "admin" ||
    (currentUser?.role === "company" && companySheetTab === "job");

  useEffect(() => {
    if (typeof window === "undefined") return;

    setVoiceSupport({
      recognition: Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
      synthesis: "speechSynthesis" in window,
      secureContext: window.isSecureContext,
      localhostUrl: buildLocalhostVoiceUrl(),
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const syncVoices = () => {
      speechVoicesRef.current = window.speechSynthesis.getVoices();
    };
    syncVoices();
    window.speechSynthesis.addEventListener("voiceschanged", syncVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", syncVoices);
  }, []);

  useEffect(() => {
    if (currentUser?.role === "client") {
      setSelectedSchedule("Бүтэн цаг");
    }
  }, [currentUser?.role]);

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
    if (!showComposer || !useStructuredJobPost) {
      return;
    }
    setNewJob(emptyJobForm);
    setJobPostDescSections(Array.from({ length: 6 }, () => ""));
  }, [showComposer, useStructuredJobPost]);

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
      const response = await fetch("/api/jobs", { cache: "no-store", credentials: "same-origin" });
      const payload = (await response.json()) as {
        jobs?: JobRecord[];
        tabCounts?: JobTabCounts;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Ажлын заруудыг уншихад алдаа гарлаа.");
      }

      const nextJobs = payload.jobs ?? [];
      setJobs(nextJobs);
      setTabCounts(payload.tabCounts ?? computeJobTabCounts(nextJobs));
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
    const onJobsChanged = () => {
      void fetchJobs();
    };
    window.addEventListener("cwork:platform-stats-changed", onJobsChanged);
    return () => window.removeEventListener("cwork:platform-stats-changed", onJobsChanged);
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
      const employmentType = normalizeJobEmploymentType(job.employmentType);
      const salaryScore = extractSalaryScore(job.salary);
      const highlight = `${category.name} ангилалд автоматаар ангилсан live database ажлын санал`;

      return {
        ...job,
        employmentType,
        source: "database" as const,
        categoryKey,
        tags,
        level,
        accent: category.accent,
        applicantCount: Math.max(0, Number(job.applicantCount ?? 0)),
        searchableText: buildSearchableText({ ...job, employmentType }, category, tags, level, highlight),
        highlight,
        salaryScore: Number.isFinite(salaryScore) ? salaryScore : 0,
      };
    });

    return databaseJobs.sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
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
        const matchesSalary = jobMatchesSalaryFilter(
          job.salaryScore,
          minSalaryFilter,
          maxSalaryFilter,
          parsedManualSalary,
        );
        const matchesSector =
          selectedSector === "all" ||
          job.categoryKey === selectedSector ||
          job.searchableText.includes(normalizeText(selectedSector));
        const matchesSchedule =
          currentUser?.role === "client"
            ? job.employmentType === "Бүтэн цаг"
            : selectedSchedule === "all" || job.employmentType === selectedSchedule;
        const matchesAccessibility = !accessibleOnly || isAccessibleFriendlyJob(job);

        return (
          matchesSaved &&
          matchesCategory &&
          matchesHeaderSearch &&
          matchesFilterKeyword &&
          matchesLocation &&
          matchesSalary &&
          matchesSector &&
          matchesSchedule &&
          matchesAccessibility
        );
      }),
    [
      accessibleOnly,
      currentUser?.role,
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

  const jobTabCounts = useMemo(() => {
    if (mineOnly || (appliedJobsOnly && currentUser && currentUser.role !== "company")) {
      return computeJobTabCounts(scopedJobs);
    }
    return tabCounts;
  }, [appliedJobsOnly, currentUser, mineOnly, scopedJobs, tabCounts]);

  useEffect(() => {
    onVisibleCountChange(filteredJobs.length);
  }, [filteredJobs.length, onVisibleCountChange]);

  useEffect(() => {
    if (!voiceSelectedJobId) {
      voiceJobIndexRef.current = -1;
      return;
    }
    if (filteredJobs.some((job) => job.id === voiceSelectedJobId)) {
      const idx = filteredJobs.findIndex((job) => job.id === voiceSelectedJobId);
      if (idx >= 0) voiceJobIndexRef.current = idx;
      return;
    }
    voiceJobIndexRef.current = -1;
    setVoiceSelectedJobId(null);
    setVoiceOpenJobId(null);
  }, [filteredJobs, voiceSelectedJobId]);

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

  const activeDeepLinkJobId = voiceOpenJobId ?? openJobIdFromUrl;

  const handleDeepLinkJobConsumed = useCallback(() => {
    if (openJobIdFromUrl) {
      onConsumeOpenJobIdFromUrl?.();
    }
  }, [onConsumeOpenJobIdFromUrl, openJobIdFromUrl]);

  const handleVoiceJobDetailClosed = useCallback(() => {
    voiceDetailOpenRef.current = false;
    setVoiceOpenJobId(null);
  }, []);

  function stopVoiceActivity(nextStatus = "Дуугаар хөтлөх горим бэлэн байна.") {
    clearVoiceListenTimeout();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceListening(false);
    setVoiceSpeaking(false);
    setVoiceStatus(nextStatus);
  }

  function speakText(text: string, status = "Ажлын дэлгэрэнгүйг уншиж байна.") {
    setVoiceStatus(status);

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceSpeaking(false);
      setVoiceStatus("Дэлгэрэнгүй нээгдлээ. Энэ browser уншиж өгөх API дэмжихгүй байна.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices =
      speechVoicesRef.current.length > 0
        ? speechVoicesRef.current
        : window.speechSynthesis.getVoices();
    const picked = pickSpeechVoice(voices);
    utterance.lang = picked?.lang?.toLowerCase().startsWith("mn") ? picked.lang : "mn-MN";
    utterance.rate = picked?.lang?.toLowerCase().startsWith("mn") ? 0.96 : 1.02;
    utterance.pitch = 1;
    utterance.voice = picked;
    utterance.onstart = () => setVoiceSpeaking(true);
    utterance.onend = () => {
      setVoiceSpeaking(false);
      setVoiceStatus("Уншиж дууслаа. Дараагийн зар гэж хэлнэ үү (эсвэл Space).");
      scheduleAutoRelisten();
    };
    utterance.onerror = () => {
      setVoiceSpeaking(false);
      setVoiceStatus("Уншиж өгөх үед алдаа гарлаа. Дахин унш товчийг ашиглаарай.");
    };
    window.speechSynthesis.speak(utterance);
  }

  function openVoiceJobAtIndex(index: number) {
    if (loading) {
      setVoiceStatus("Ажлын зарууд ачаалж байна. Түр хүлээгээд дахин оролдоорой.");
      return;
    }

    if (filteredJobs.length === 0) {
      speakText("Одоогоор энэ шүүлтүүрт тохирох ажлын зар алга.", "Тохирох ажлын зар олдсонгүй.");
      return;
    }

    if (index < 0 || index >= filteredJobs.length) {
      speakText(`Нийт ${filteredJobs.length} ажлын зар байна. Өөр дугаар хэлнэ үү.`, "Ийм дугаартай зар алга.");
      return;
    }

    const job = filteredJobs[index];
    const page = Math.floor(index / JOBS_PER_PAGE) + 1;
    voiceJobIndexRef.current = index;
    setAccessibleOnly(true);
    setVoiceGuideEnabled(true);
    setVoiceSelectedJobId(job.id);
    setVoiceOpenJobId(job.id);
    voiceDetailOpenRef.current = true;
    setCurrentPage(page);
    window.setTimeout(() => {
      document.getElementById(`job-card-title-${job.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    const category = categoryMap.get(job.categoryKey);
    speakText(
      buildJobVoiceSpeechMn(
        { ...job, categoryName: category?.name },
        index,
        filteredJobs.length,
        true,
      ),
      `${job.companyName}, ${job.title} — уншиж байна.`,
    );
  }

  function currentVoiceJobIndex() {
    const refIdx = voiceJobIndexRef.current;
    if (refIdx >= 0 && refIdx < filteredJobs.length) {
      if (!voiceSelectedJobId || filteredJobs[refIdx]?.id === voiceSelectedJobId) {
        return refIdx;
      }
    }
    if (!voiceSelectedJobId) return refIdx >= 0 && refIdx < filteredJobs.length ? refIdx : -1;
    const fromId = filteredJobs.findIndex((job) => job.id === voiceSelectedJobId);
    if (fromId >= 0) {
      voiceJobIndexRef.current = fromId;
      return fromId;
    }
    return -1;
  }

  function openFirstVoiceJob() {
    openVoiceJobAtIndex(0);
  }

  function openNextVoiceJob() {
    const currentIndex = currentVoiceJobIndex();
    const nextIndex = currentIndex + 1;
    if (currentIndex < 0) {
      openVoiceJobAtIndex(0);
      return;
    }
    if (nextIndex >= filteredJobs.length) {
      speakText("Энэ жагсаалтын сүүлийн ажлын зар дээр байна.", "Сүүлийн зар дээр байна.");
      return;
    }
    openVoiceJobAtIndex(nextIndex);
  }

  function openPreviousVoiceJob() {
    const currentIndex = currentVoiceJobIndex();
    const previousIndex = currentIndex < 0 ? 0 : currentIndex - 1;
    if (previousIndex < 0) {
      speakText("Энэ жагсаалтын эхний ажлын зар дээр байна.", "Эхний зар дээр байна.");
      return;
    }
    openVoiceJobAtIndex(previousIndex);
  }

  function repeatVoiceJob() {
    const currentIndex = currentVoiceJobIndex();
    openVoiceJobAtIndex(currentIndex < 0 ? 0 : currentIndex);
  }

  function closeVoiceJobDetail() {
    stopVoiceActivity("Дэлгэрэнгүй цонх хаагдлаа.");
    voiceDetailOpenRef.current = false;
    setVoiceOpenJobId(null);
    setVoiceCloseSignal((value) => value + 1);
  }

  function scheduleAutoRelisten(delayMs = 380) {
    if (!voiceAutoListenRef.current || !voiceGuideEnabledRef.current) return;
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      if (!voiceAutoListenRef.current || !voiceGuideEnabledRef.current || voiceListening || voiceSpeaking) {
        return;
      }
      startVoiceListening({ quiet: true });
    }, delayMs);
  }

  function clearVoiceListenTimeout() {
    if (voiceListenTimeoutRef.current !== null) {
      window.clearTimeout(voiceListenTimeoutRef.current);
      voiceListenTimeoutRef.current = null;
    }
  }

  function executeVoiceCommand(command: VoiceJobCommand, raw: string) {
    setVoiceTranscript(raw);

    if (command.type === "open") {
      openVoiceJobAtIndex(command.index);
      return;
    }
    if (command.type === "next") {
      openNextVoiceJob();
      return;
    }
    if (command.type === "previous") {
      openPreviousVoiceJob();
      return;
    }
    if (command.type === "repeat") {
      const idx = currentVoiceJobIndex();
      if (idx >= 0) {
        const job = filteredJobs[idx];
        const category = categoryMap.get(job.categoryKey);
        speakText(
          buildJobVoiceSpeechMn(
            { ...job, categoryName: category?.name },
            idx,
            filteredJobs.length,
            false,
          ),
          "Дэлгэрэнгүй уншиж байна.",
        );
      } else {
        repeatVoiceJob();
      }
      return;
    }
    if (command.type === "stop") {
      voiceAutoListenRef.current = false;
      stopVoiceActivity("Уншлагыг зогсоолоо.");
      return;
    }
    if (command.type === "close") {
      closeVoiceJobDetail();
      scheduleAutoRelisten(500);
      return;
    }

    speakText(
      "Командыг ойлгосонгүй. «эхний зар», «дараагийн», «өмнөх», «дахин унш», «зогсоо» гэж хэлнэ үү.",
      "Командыг ойлгосонгүй.",
    );
    scheduleAutoRelisten(700);
  }

  function submitTypedVoiceCommand() {
    const command = voiceCommandInput.trim();
    if (!command) return;
    setVoiceGuideEnabled(true);
    setAccessibleOnly(true);
    voiceAutoListenRef.current = true;
    executeVoiceCommand(parseVoiceCommandBest([command]), command);
    setVoiceCommandInput("");
  }

  function collectTranscriptCandidates(event: SpeechRecognitionEventLike) {
    const candidates: string[] = [];
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const alts = result?.length ?? 0;
      for (let j = 0; j < alts; j += 1) {
        const piece = result?.[j]?.transcript?.trim();
        if (piece) candidates.push(piece);
      }
    }
    return candidates;
  }

  function startVoiceListening(opts?: { quiet?: boolean }) {
    if (typeof window === "undefined") return;
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;

    setAccessibleOnly(true);
    setVoiceGuideEnabled(true);
    voiceAutoListenRef.current = true;

    if (!window.isSecureContext) {
      const localhostUrl = buildLocalhostVoiceUrl();
      setVoiceSupport((support) => ({
        ...support,
        secureContext: false,
        localhostUrl,
      }));
      setVoiceStatus(blockedMicStatus(localhostUrl));
      return;
    }

    if (!Recognition) {
      setVoiceStatus("Энэ browser дуу таних API дэмжихгүй байна. Chrome эсвэл Edge дээр mic ажиллана.");
      return;
    }

    if (voiceListening) {
      recognitionRef.current?.stop();
      return;
    }

    const runRecognition = (langIndex: number, noSpeechRetry = false) => {
      try {
        clearVoiceListenTimeout();
        recognitionRef.current?.abort();
        const recognition = new Recognition();
        const lang = SPEECH_RECOGNITION_LANGS[langIndex] ?? "en-US";
        recognition.lang = lang;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 5;

        recognition.onstart = () => {
          setVoiceListening(true);
          if (!opts?.quiet) {
            setVoiceStatus(
              lang.startsWith("mn")
                ? "Монголоор сонсож байна… «эхний зар руу ор», «дараагийн зар»"
                : "Сонсож байна… «эхний зар», «дараагийн»",
            );
          } else {
            setVoiceStatus("Дараагийн командыг монголоор хэлнэ үү…");
          }
          voiceListenTimeoutRef.current = window.setTimeout(() => {
            recognition.stop();
          }, VOICE_LISTEN_SILENCE_MS);
        };

        recognition.onresult = (event) => {
          const candidates = collectTranscriptCandidates(event);
          let hasFinal = false;
          const finalChunks: string[] = [];

          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            if (event.results[i]?.isFinal) hasFinal = true;
          }

          for (let i = 0; i < event.results.length; i += 1) {
            if (!event.results[i]?.isFinal) continue;
            for (let j = 0; j < (event.results[i]?.length ?? 0); j += 1) {
              const t = event.results[i]?.[j]?.transcript?.trim();
              if (t) finalChunks.push(t);
            }
          }

          const display = finalChunks.join(" ").trim() || candidates[0] || "";
          if (display) setVoiceTranscript(display);
          if (!hasFinal) return;

          clearVoiceListenTimeout();
          recognition.stop();

          const command = parseVoiceCommandBest(finalChunks.length > 0 ? finalChunks : candidates);
          const raw = finalChunks.join(" ").trim() || candidates[0] || "";
          executeVoiceCommand(command, raw);
        };

        recognition.onerror = (event) => {
          const errorCode = event.error ?? "unknown";
          clearVoiceListenTimeout();
          if (errorCode === "language-not-supported" && langIndex < SPEECH_RECOGNITION_LANGS.length - 1) {
            runRecognition(langIndex + 1, noSpeechRetry);
            return;
          }
          if (errorCode === "no-speech" && !noSpeechRetry) {
            runRecognition(langIndex, true);
            return;
          }
          setVoiceListening(false);
          setVoiceStatus(
            errorCode === "not-allowed"
              ? "Микрофон зөвшөөрөл хаалттай. Chrome → түгжээ → Microphone → Allow."
              : errorCode === "no-speech"
                ? "Дуу сонсогдсонгүй. «эхний зар руу ор» гэж тод хэлээрэй."
                : "Дуу таних алдаа. Доор бичээд «Ажиллуулах» дарж болно.",
          );
          if (errorCode === "no-speech" && voiceAutoListenRef.current) {
            scheduleAutoRelisten(900);
          }
        };

        recognition.onend = () => {
          clearVoiceListenTimeout();
          setVoiceListening(false);
          recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        setVoiceListening(false);
        setVoiceStatus("Дуу танихийг эхлүүлж чадсангүй. Chrome + localhost ашиглана уу.");
      }
    };

    runRecognition(0);
  }

  const voiceSpaceHandlerRef = useRef<() => void>(() => {});
  const voiceEscapeHandlerRef = useRef<() => void>(() => {});

  function exitVoiceAccessibleMode() {
    if (voiceOpenJobId || voiceDetailOpenRef.current) {
      voiceDetailOpenRef.current = false;
      setVoiceOpenJobId(null);
      setVoiceCloseSignal((value) => value + 1);
    }
    voiceJobIndexRef.current = -1;
    voiceAutoListenRef.current = false;
    stopVoiceActivity("Тэгш боломжийн горимоос гарлаа. Space — дахин эхлүүлнэ.");
    setVoiceTranscript("");
    setAccessibleOnly(false);
    setVoiceGuideEnabled(false);
  }

  voiceSpaceHandlerRef.current = () => {
    if (showComposer) return;

    if (voiceListening || voiceSpeaking) {
      stopVoiceActivity("Зогссон. Space дарж дахин сонсоно.");
      return;
    }

    if (!accessibleOnly) {
      setAccessibleOnly(true);
      setVoiceGuideEnabled(true);
      window.setTimeout(() => {
        document.getElementById("jobs-voice-guide")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 80);
    }

    startVoiceListening();
  };

  voiceEscapeHandlerRef.current = () => {
    if (showComposer) return;

    const inVoiceFlow =
      accessibleOnly || voiceGuideEnabled || voiceListening || voiceSpeaking || Boolean(voiceOpenJobId);

    if (!inVoiceFlow) return;

    if (voiceOpenJobId || voiceDetailOpenRef.current) {
      closeVoiceJobDetail();
      return;
    }

    if (voiceListening || voiceSpeaking) {
      stopVoiceActivity("Зогссон. Esc — горимоос гарах.");
      return;
    }

    exitVoiceAccessibleMode();
  };

  function toggleVoiceGuide() {
    if (voiceGuideEnabled) {
      stopVoiceActivity("Дуугаар хөтлөх горим унтарлаа.");
      setVoiceGuideEnabled(false);
      return;
    }

    setAccessibleOnly(true);
    setVoiceGuideEnabled(true);
    setVoiceStatus(
      voiceSupport.recognition && voiceSupport.secureContext
        ? "Бэлэн. Команд хэлэх товчийг дараад: эхний зар руу ор."
        : voiceSupport.secureContext
          ? "Дуугаар уншуулах fallback товчнууд ажиллана. Mic-д Chrome эсвэл Edge хэрэгтэй."
          : blockedMicStatus(voiceSupport.localhostUrl),
    );
  }

  function handleAccessibleOnlyChange(value: boolean) {
    setAccessibleOnly(value);
    if (value) {
      setVoiceGuideEnabled(true);
      setVoiceStatus(
        voiceSupport.recognition && voiceSupport.secureContext
          ? "Дуугаар хөтлөх бэлэн. «Команд хэлэх» дарж «эхний зар руу ор» гэж хэлнэ үү, эсвэл доор бичээд «Ажиллуулах»."
          : voiceSupport.secureContext
            ? "Mic дэмжихгүй browser. Доор команд бичээд «Ажиллуулах», эсвэл «Эхний зар» товч дарна."
            : blockedMicStatus(voiceSupport.localhostUrl),
      );
      return;
    }
    stopVoiceActivity("Тэгш боломжийн шүүлтүүр унтарлаа.");
    setVoiceGuideEnabled(false);
  }

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      if (event.code === "Space" || event.key === " ") {
        event.preventDefault();
        voiceSpaceHandlerRef.current();
        return;
      }

      if (event.code === "Escape" || event.key === "Escape") {
        event.preventDefault();
        voiceEscapeHandlerRef.current();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!openJobIdFromUrl || loading || filteredJobs.length === 0) return;
    const idx = filteredJobs.findIndex((j) => j.id === openJobIdFromUrl);
    if (idx < 0) return;
    const page = Math.floor(idx / JOBS_PER_PAGE) + 1;
    setCurrentPage(page);
  }, [openJobIdFromUrl, loading, filteredJobs]);

  useEffect(() => {
    if (!openJobIdFromUrl || loading) return;
    const id = window.setTimeout(() => {
      document.getElementById(`job-card-title-${openJobIdFromUrl}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 180);
    return () => window.clearTimeout(id);
  }, [openJobIdFromUrl, loading, currentPage, paginatedJobs]);

  useEffect(() => {
    if (!openJobIdFromUrl || loading || filteredJobs.length === 0) return;
    const found = filteredJobs.some((j) => j.id === openJobIdFromUrl);
    if (found) return;
    const t = window.setTimeout(() => onConsumeOpenJobIdFromUrl?.(), 600);
    return () => window.clearTimeout(t);
  }, [openJobIdFromUrl, loading, filteredJobs, onConsumeOpenJobIdFromUrl]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const description = useStructuredJobPost
        ? buildStructuredJobDescription(jobPostDescSections)
        : newJob.description;

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...newJob, description }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Ажлын зар нэмэхэд алдаа гарлаа.");
      }

      setNewJob(emptyJobForm);
      setJobPostDescSections(Array.from({ length: 6 }, () => ""));
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
    setMaxSalaryFilter(100_000_000);
    setSelectedSector("all");
    setSelectedSchedule(currentUser?.role === "client" ? "Бүтэн цаг" : "all");
    setSelectedLocation("all");
    setAccessibleOnly(false);
    stopVoiceActivity("Шүүлтүүр цэвэрлэгдлээ.");
    setVoiceGuideEnabled(false);
    setVoiceOpenJobId(null);
  }

  return (
    <div className={styles.jobsBoard} id="jobs" ref={composerRef}>
      <section className={styles.freelanceHeroExact} aria-label="C-Work ажлын зар">
        <div className={styles.freelanceHeroContent}>
          <p className={styles.freelanceHeroKicker}>C-WORK JOBS</p>
          <h1>
            Шилдэг<br />
            ажлын зар<br />
            <span>нэг дор.</span>
          </h1>
          <p className={styles.freelanceHeroText}>
            Цалин, байршил, ажлын төрлөөр шүүж өөрт тохирох зарыг олж, өргөдлөө шууд илгээгээрэй — компаниас хариу мэдэгдлээр ирнэ.
          </p>
        </div>

        <div className={styles.freelanceHeroVisual}>
          {[
            ["✦", "Баталгаатай зар", "Компаниас шууд нийтлэгдсэн, шалгарсан ажлын саналуудыг нэг дороос харна."],
            ["ϟ", "Хурдан сонголт", "Фильтр, хайлт ашиглан цалин болон Remote нөхцлөөр өөрийнхөө ажлыг олно."],
            ["⬟", "Аюулгүй өргөдөл", "Өргөдөл чинь хамгаалагдана, профайлын мэдэгдлээр хариу авна."],
          ].map((item, index) => (
            <article
              className={styles.freelanceFloatCard}
              key={item[1]}
              style={{ ["--tilt" as string]: `${index === 0 ? -2 : index === 1 ? 2 : 1}deg` }}
            >
              <span>{item[0]}</span>
              <div>
                <h3>{item[1]}</h3>
                <p>{item[2]}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {showComposer ? (
        <div className={styles.landingSheetOverlay} onClick={onComposerClose} role="presentation">
          <article
            aria-labelledby="jobs-post-sheet-title"
            className={
              useStructuredJobPost
                ? `${styles.freelancerPublishSheet} ${styles.jobsPostPublishSheetWide}`
                : styles.freelancerPublishSheet
            }
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            {currentUser?.role === "freelancer" ? (
              <>
                <button aria-label="Хаах" className={styles.landingSheetClose} onClick={onComposerClose} type="button">
                  <LandingSheetCloseIcon />
                </button>
                <header className={styles.freelancerPublishSheetHeader}>
                  <p className={styles.freelancerPublishSheetKicker}>C-WORK · JOBS</p>
                  <h2 id="jobs-post-sheet-title">Зар оруулах</h2>
                  <p className={styles.freelancerPublishSheetSubtitle}>
                    Компаниас ажлын зар эндээс нэмэгдэнэ. Freelancer-ийн профайл зар өөр цонхноос нэмэгддэг.
                  </p>
                </header>
                <div className={styles.freelancerPublishSheetBody}>
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
                </div>
              </>
            ) : useStructuredJobPost ? (
              <>
                <button aria-label="Хаах" className={styles.landingSheetClose} onClick={onComposerClose} type="button">
                  <LandingSheetCloseIcon />
                </button>
                <header className={styles.freelancerPublishSheetHeader}>
                  <p className={styles.freelancerPublishSheetKicker}>C-WORK · COMPANY</p>
                  <h2 id="jobs-post-sheet-title">Зар оруулах · нийтлэх</h2>
                  <p className={styles.freelancerPublishSheetSubtitle}>
                    Жагсаалтад гарсан зар таны компанийн нэр, байршилтай нийцнэ. Доорх хэсгүүдийг бөглөж ажлын саналаа нэмнэ үү.
                  </p>
                </header>
                <div className={styles.freelancerPublishSheetBody}>
                  {currentUser?.role === "company" ? (
                    <button
                      className={styles.jobsPostCompanyProfileLink}
                      onClick={() => setCompanySheetTab("company")}
                      type="button"
                    >
                      Компанийн профайл засах
                    </button>
                  ) : null}

                  <form className={styles.jobsPostForm} onSubmit={handleCreate}>
                  <div className={styles.jobsPostSheetGrid}>
                    <aside className={styles.jobsPostSheetColLeft}>
                      <div className={styles.jobsPostCard}>
                        <div className={styles.jobsPostCardHead}>
                          <span className={styles.jobsPostIconBadge} aria-hidden>
                            i
                          </span>
                          <span className={styles.jobsPostCardHeadTitle}>Үндсэн мэдээлэл</span>
                        </div>
                        <div className={styles.jobsPostStack}>
                          <input
                            className={styles.jobsPostInput}
                            onChange={(event) => setNewJob({ ...newJob, title: event.target.value })}
                            placeholder="ж.нь: Ахлах график дизайнер"
                            required
                            value={newJob.title}
                          />
                          <div className={styles.jobsPostFieldRow}>
                            <input
                              className={styles.jobsPostInput}
                              onChange={(event) => setNewJob({ ...newJob, companyName: event.target.value })}
                              placeholder="Компани"
                              required
                              value={newJob.companyName}
                            />
                            <input
                              className={styles.jobsPostInput}
                              onChange={(event) => setNewJob({ ...newJob, location: event.target.value })}
                              placeholder="Байршил"
                              required
                              value={newJob.location}
                            />
                          </div>
                          <div className={styles.jobsPostFieldRow}>
                            <input
                              className={styles.jobsPostInput}
                              onChange={(event) => setNewJob({ ...newJob, salary: event.target.value })}
                              placeholder="Цалин"
                              required
                              value={newJob.salary}
                            />
                            <select
                              className={styles.jobsPostSelect}
                              onChange={(event) => setNewJob({ ...newJob, employmentType: event.target.value })}
                              value={newJob.employmentType}
                            >
                              <option>Бүтэн цаг</option>
                              <option>Хагас цаг</option>
                              <option>Гэрээт</option>
                              <option>Remote</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className={`${styles.jobsPostCard} ${styles.jobsPostCardTips}`}>
                        <div className={styles.jobsPostCardHead}>
                          <span className={styles.jobsPostIconBadge} aria-hidden>
                            💡
                          </span>
                          <span className={styles.jobsPostCardHeadTitle}>Зар оруулах зөвлөмж</span>
                        </div>
                        <ul className={styles.jobsPostTipsList}>
                          {JOB_POST_TIPS.map((tip) => (
                            <li className={styles.jobsPostTipRow} key={tip.title}>
                              <span className={styles.jobsPostTipMark}>{tip.mark}</span>
                              <div>
                                <strong className={styles.jobsPostTipTitle}>{tip.title}</strong>
                                <p className={styles.jobsPostTipDesc}>{tip.desc}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </aside>

                    <div className={styles.jobsPostSheetColRight}>
                      <div className={styles.jobsPostCard}>
                        <div className={styles.jobsPostCardHead}>
                          <span className={styles.jobsPostIconBadge} aria-hidden>
                            ≡
                          </span>
                          <span className={styles.jobsPostCardHeadTitle}>Дэлгэрэнгүй мэдээлэл</span>
                        </div>
                        <div className={styles.jobsPostDescBlocks}>
                          <div className={styles.jobsPostDescPair}>
                            {[0, 1].map((idx) => (
                              <div className={styles.jobsPostFieldBlock} key={STRUCTURED_JOB_SECTION_LABELS[idx]}>
                                <label className={styles.jobsPostFieldLabel} htmlFor={`job-post-sec-${idx}`}>
                                  <span className={styles.jobsPostFieldLabelGlyph} aria-hidden />
                                  {JOB_POST_SECTION_UI[idx].short}
                                </label>
                                <textarea
                                  className={styles.jobsPostTextarea}
                                  id={`job-post-sec-${idx}`}
                                  onChange={(event) =>
                                    setJobPostDescSections((prev) =>
                                      prev.map((v, i) => (i === idx ? event.target.value : v)),
                                    )
                                  }
                                  placeholder={JOB_POST_SECTION_UI[idx].hint}
                                  required
                                  rows={idx === 0 ? 5 : 4}
                                  value={jobPostDescSections[idx] ?? ""}
                                />
                              </div>
                            ))}
                          </div>
                          <div className={styles.jobsPostFieldBlock}>
                            <label className={styles.jobsPostFieldLabel} htmlFor="job-post-sec-2">
                              <span className={styles.jobsPostFieldLabelGlyph} aria-hidden />
                              {JOB_POST_SECTION_UI[2].short}
                            </label>
                            <textarea
                              className={styles.jobsPostTextarea}
                              id="job-post-sec-2"
                              onChange={(event) =>
                                setJobPostDescSections((prev) =>
                                  prev.map((v, i) => (i === 2 ? event.target.value : v)),
                                )
                              }
                              placeholder={JOB_POST_SECTION_UI[2].hint}
                              required
                              rows={4}
                              value={jobPostDescSections[2] ?? ""}
                            />
                          </div>
                          <div className={styles.jobsPostDescPair}>
                            {[3, 4].map((idx) => (
                              <div className={styles.jobsPostFieldBlock} key={STRUCTURED_JOB_SECTION_LABELS[idx]}>
                                <label className={styles.jobsPostFieldLabel} htmlFor={`job-post-sec-${idx}`}>
                                  <span className={styles.jobsPostFieldLabelGlyph} aria-hidden />
                                  {JOB_POST_SECTION_UI[idx].short}
                                </label>
                                <textarea
                                  className={styles.jobsPostTextarea}
                                  id={`job-post-sec-${idx}`}
                                  onChange={(event) =>
                                    setJobPostDescSections((prev) =>
                                      prev.map((v, i) => (i === idx ? event.target.value : v)),
                                    )
                                  }
                                  placeholder={JOB_POST_SECTION_UI[idx].hint}
                                  required
                                  rows={4}
                                  value={jobPostDescSections[idx] ?? ""}
                                />
                              </div>
                            ))}
                          </div>
                          <div className={styles.jobsPostFieldBlock}>
                            <label className={styles.jobsPostFieldLabel} htmlFor="job-post-sec-5">
                              <span className={styles.jobsPostFieldLabelGlyph} aria-hidden />
                              {JOB_POST_SECTION_UI[5].short}
                            </label>
                            <textarea
                              className={styles.jobsPostTextarea}
                              id="job-post-sec-5"
                              onChange={(event) =>
                                setJobPostDescSections((prev) =>
                                  prev.map((v, i) => (i === 5 ? event.target.value : v)),
                                )
                              }
                              placeholder={JOB_POST_SECTION_UI[5].hint}
                              required
                              rows={4}
                              value={jobPostDescSections[5] ?? ""}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <footer className={styles.jobsPostSheetFooter}>
                    <div className={styles.jobsPostFooterNote}>
                      <span aria-hidden className={styles.jobsPostFooterEye}>
                        👁
                      </span>
                      Урьдчилан харах боломжтой
                    </div>
                    <div className={styles.jobsPostFooterActions}>
                      <button className={styles.jobsPostBtnPrimary} disabled={submitting} type="submit">
                        {submitting ? "Хадгалж байна..." : "Зар нийтлэх"}
                      </button>
                    </div>
                  </footer>
                </form>
                </div>
              </>
            ) : (
              <>
                <button aria-label="Хаах" className={styles.landingSheetClose} onClick={onComposerClose} type="button">
                  <LandingSheetCloseIcon />
                </button>
                <header className={styles.freelancerPublishSheetHeader}>
                  <p className={styles.freelancerPublishSheetKicker}>C-WORK · COMPANY</p>
                  <h2 id="jobs-post-sheet-title">Зар оруулах · нийтлэх</h2>
                  <p className={styles.freelancerPublishSheetSubtitle}>
                    Ажлын зарын талбарууд profile-ын компанийн мэдээлэлтэй нийцнэ. Бөглөөд жагсаалтад нэмнэ үү.
                  </p>
                </header>
                <div className={styles.freelancerPublishSheetBody}>
                {currentUser?.role === "company" ? (
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
                ) : (
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
                </div>
              </>
            )}
          </article>
        </div>
      ) : null}

      {/* Tab bar */}
      <div className={styles.jobsTabBar}>
        <button
          className={`${styles.jobsTab} ${selectedSchedule === "all" ? styles.jobsTabActive : ""}`}
          onClick={() => {
            setSelectedSchedule("all");
            setCurrentPage(1);
          }}
          type="button"
        >
          {appliedJobsOnly
            ? "Илгээсэн өргөдлийн зарууд"
            : mineOnly
              ? "\u041c\u0438\u043d\u0438\u0439 \u0437\u0430\u0440\u0443\u0443\u0434"
              : "\u0411\u04af\u0445 \u0430\u0436\u043b\u0443\u0443\u0434"}
          <span className={styles.jobsTabCount}>{jobTabCounts.all}</span>
        </button>
        {!clientFullTimeOnly ? (
          <>
        <button
          className={`${styles.jobsTab} ${selectedSchedule === "Remote" ? styles.jobsTabActive : ""}`}
          onClick={() => {
            setSelectedSchedule("Remote");
            setCurrentPage(1);
          }}
          type="button"
        >
          {"Remote \u0430\u0436\u043b\u0443\u0443\u0434"}
          <span className={styles.jobsTabCount}>{jobTabCounts.remote}</span>
        </button>
        <button
          className={`${styles.jobsTab} ${selectedSchedule === "\u0411\u04af\u0442\u044d\u043d \u0446\u0430\u0433" ? styles.jobsTabActive : ""}`}
          onClick={() => {
            setSelectedSchedule("\u0411\u04af\u0442\u044d\u043d \u0446\u0430\u0433");
            setCurrentPage(1);
          }}
          type="button"
        >
          {"\u0411\u04af\u0442\u044d\u043d \u0446\u0430\u0433\u0438\u0439\u043d"}
          <span className={styles.jobsTabCount}>{jobTabCounts.fullTime}</span>
        </button>
        <button
          className={`${styles.jobsTab} ${selectedSchedule === "\u0425\u0430\u0433\u0430\u0441 \u0446\u0430\u0433" ? styles.jobsTabActive : ""}`}
          onClick={() => {
            setSelectedSchedule("\u0425\u0430\u0433\u0430\u0441 \u0446\u0430\u0433");
            setCurrentPage(1);
          }}
          type="button"
        >
          {"\u0426\u0430\u0433\u0438\u0439\u043d \u0430\u0436\u0438\u043b"}
          <span className={styles.jobsTabCount}>{jobTabCounts.partTime}</span>
        </button>
          </>
        ) : null}
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
          scheduleFiltersHidden={clientFullTimeOnly}
          selectedLocation={selectedLocation}
          onSelectedLocationChange={setSelectedLocation}
          accessibleOnly={accessibleOnly}
          filterKeyword={filterKeyword}
          maxSalaryFilter={maxSalaryFilter}
          manualSalaryInput={manualSalaryInput}
          minSalaryFilter={minSalaryFilter}
          onAccessibleOnlyChange={handleAccessibleOnlyChange}
          onFilterKeywordChange={setFilterKeyword}
          onManualSalaryInputChange={setManualSalaryInput}
          onMinSalaryFilterChange={setMinSalaryFilter}
          onReset={resetFilters}
          onSelectedScheduleChange={setSelectedSchedule}
          onSelectedSectorChange={setSelectedSector}
          selectedSchedule={selectedSchedule}
          selectedSector={selectedSector}
          voiceGuide={{
            enabled: voiceGuideEnabled,
            recognitionSupported: voiceSupport.recognition,
            secureContext: voiceSupport.secureContext,
            listening: voiceListening,
            speaking: voiceSpeaking,
            status: voiceStatus,
            transcript: voiceTranscript,
            commandText: voiceCommandInput,
            micHint: !voiceSupport.secureContext
              ? blockedMicHint(voiceSupport.localhostUrl)
              : !voiceSupport.recognition
                ? "Энэ browser voice command дэмжихгүй байна. Chrome эсвэл Edge ашиглаарай."
                : "Space — mic асаах/зогсоох. Esc — буцах. Chrome/Edge + localhost.",
            onCommandTextChange: setVoiceCommandInput,
            onSubmitTextCommand: submitTypedVoiceCommand,
            onToggle: toggleVoiceGuide,
            onListen: startVoiceListening,
            onStop: () => stopVoiceActivity("Уншлага болон сонсолтыг зогсоолоо."),
            onFirst: openFirstVoiceJob,
            onPrevious: openPreviousVoiceJob,
            onNext: openNextVoiceJob,
            onRepeat: repeatVoiceJob,
            onClose: closeVoiceJobDetail,
          }}
        />

        <JobsListCards
          applicationStatusByJobId={applicationStatusByJobId}
          currentUser={currentUser}
          deepLinkJobId={activeDeepLinkJobId}
          detailsCloseSignal={voiceCloseSignal}
          onDeepLinkJobConsumed={handleDeepLinkJobConsumed}
          onVoiceJobDetailClosed={handleVoiceJobDetailClosed}
          editJob={editJob}
          editingId={editingId}
          mineOnly={mineOnly}
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

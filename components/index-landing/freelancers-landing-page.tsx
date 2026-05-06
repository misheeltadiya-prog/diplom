"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import type { JobSeekerPublic } from "@/lib/job-seekers";
import { FreelancerPublishSheet } from "./freelancer-publish-sheet";
import { JobSeekerDetailModal } from "./job-seeker-detail-modal";
import { NavBar } from "./nav-bar";
import { SiteFooter } from "./site-footer";
import styles from "./index-landing.module.css";
import { formatPlatformStat, usePlatformStats } from "./use-platform-stats";

const FAVORITE_KEY = "cwork-landing-favorite-job-ids";

type ApiBody = { jobSeekers?: JobSeekerPublic[]; error?: string };
type FreelancersLandingPageProps = {
  currentUser?: SessionUser | null;
};

export function FreelancersLandingPage({ currentUser = null }: FreelancersLandingPageProps) {
  const router = useRouter();
  const stats = usePlatformStats();
  const [isScrolled, setIsScrolled] = useState(false);
  const [list, setList] = useState<JobSeekerPublic[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<JobSeekerPublic | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [nameQuery, setNameQuery] = useState("");
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement | null>(null);
  const [publishSheetOpen, setPublishSheetOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const freelancerHeroStats = [
    { value: formatPlatformStat(list.length || stats.openJobs), label: "Freelancer" },
    { value: formatPlatformStat(stats.companies), label: "Companies" },
    { value: formatPlatformStat(stats.openJobs), label: "Open Jobs" },
  ];

  const roleOptions = useMemo(() => {
    const roles = Array.from(new Set(list.map((item) => item.roleTitle))).sort((a, b) => a.localeCompare(b));
    return ["all", ...roles];
  }, [list]);

  const filteredList = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    return list.filter((item) => {
      const roleOk = selectedRole === "all" || item.roleTitle === selectedRole;
      const nameOk =
        !q ||
        item.fullName.toLowerCase().includes(q) ||
        item.roleTitle.toLowerCase().includes(q);
      return roleOk && nameOk;
    });
  }, [list, selectedRole, nameQuery]);
  useEffect(() => setPage(1), [selectedRole, nameQuery]);
  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const pagedList = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredList.slice(start, start + PAGE_SIZE);
  }, [filteredList, page]);
  const selectedRoleLabel = selectedRole === "all" ? "Бүгд" : selectedRole;

  function formatReviews(countRaw: string) {
    const n = Number(countRaw);
    if (!Number.isFinite(n) || n <= 0) return "0 reviews";
    return `${n} review${n === 1 ? "" : "s"}`;
  }

  function formatPriceLabel(raw: string) {
    const s = (raw || "").trim();
    if (!s) return "—";
    return s;
  }

  const readSaved = useCallback(() => {
    try {
      const raw = localStorage.getItem(FAVORITE_KEY);
      if (!raw) {
        setSavedCount(0);
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
        setSavedCount(parsed.length);
      }
    } catch {
      setSavedCount(0);
    }
  }, []);

  useEffect(() => {
    readSaved();
    window.addEventListener("focus", readSaved);
    return () => window.removeEventListener("focus", readSaved);
  }, [readSaved]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(target)) {
        setIsRoleOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  const loadJobSeekers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/job-seekers", { cache: "no-store" });
      const body = (await res.json()) as ApiBody;
      setList(body.jobSeekers ?? []);
      if (!res.ok) {
        setLoadError(body.error ?? `HTTP ${res.status}`);
      } else {
        setLoadError(body.error ?? null);
      }
    } catch (e) {
      setList([]);
      setLoadError(e instanceof Error ? e.message : "Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobSeekers();
  }, [loadJobSeekers]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("publish") !== "1") {
      return;
    }
    setPublishSheetOpen(true);
    params.delete("publish");
    const rest = params.toString();
    const path = `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", path);
  }, []);

  return (
    <div className={styles.page}>
      <NavBar
        currentUser={currentUser}
        favoritesViewActive={false}
        onAbout={() => {
          router.push("/#reviews");
        }}
        onCompany={() => {
          router.push("/companies");
        }}
        onFindJob={() => {
          router.push("/jobs#jobs-content");
        }}
        onFreelancer={() => {
          router.push("/freelancers");
        }}
        onSavedJobsClick={() => {
          router.push("/jobs#jobs-content");
        }}
        savedJobCount={savedCount}
        scrolled={isScrolled}
      />

      <section className={styles.freelancersPageSection} id="freelancers">
        <div className={`${styles.searchHeroStrip} ${styles.fadeUp}`} data-reveal="true">
          <div className={styles.searchHeroText}>
            <p className={styles.searchHeroKicker}>C-Work talent</p>
            <h1 className={`${styles.searchHeroTitle} ${styles.freelancersHeroTitle}`}>
              Шилдэг freelancer-ууд <span className={styles.searchHeroAccent}>нэг дор.</span>
            </h1>
            <p className={styles.searchHeroSummary}>
              Бэлэн talent pool, бодит туршлага, шууд холбогдох боломжийг танай багт ойртуулна.
            </p>
            <p className={styles.searchHeroMeta}>
              {formatPlatformStat(stats.openJobs)} нээлттэй ажлын байр • {formatPlatformStat(stats.companies)} компани •{" "}
              {formatPlatformStat(stats.cvs)} CV
            </p>
          </div>

          <div className={styles.searchHeroStats} aria-label="Freelancer statistics">
            {freelancerHeroStats.map((item) => (
              <div className={styles.searchHeroStatCard} key={item.label}>
                <span className={styles.searchHeroStatValue}>{item.value}</span>
                <span className={styles.searchHeroStatLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[min(1600px,100%)] px-4 sm:px-6" id="freelancer-filter">
          <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_rgba(0,0,0,0.05)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div className="relative min-h-[48px] min-w-0 flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 sm:left-4">
                <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
                  <path
                    d="M12 20s6-4.5 6-9a6 6 0 1 0-12 0c0 4.5 6 9 6 9Z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                  <circle cx="12" cy="11" r="2.1" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <input
                className="h-12 w-full rounded-[10px] border border-brand-200/90 bg-white pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 ease-out focus:border-brand-400 focus:ring-4 focus:ring-brand-200/35 sm:pl-11"
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder="Нэрээр хайх / Жишээ: Төмөрсүх, developer"
                type="search"
                value={nameQuery}
              />
            </div>

            <div className={`${styles.freelancerRoleDropdown} w-full min-w-[160px] sm:w-[200px]`} ref={roleDropdownRef}>
            <button
              aria-expanded={isRoleOpen}
              aria-haspopup="listbox"
              className={styles.jobsFilterDropBtn}
              onClick={() => setIsRoleOpen((open) => !open)}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-slate-600">Ангилал</span>
                <span className="truncate font-semibold text-slate-900">{selectedRoleLabel}</span>
              </span>
              <span className={`${styles.jobsFilterDropArrow} flex shrink-0 items-center`} aria-hidden>
                <svg fill="none" height="14" viewBox="0 0 24 24" width="14">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </span>
            </button>

            {isRoleOpen ? (
              <div className={`${styles.jobsCategoryList} ${styles.freelancerRoleList}`} role="listbox">
                {roleOptions.map((role) => (
                  <button
                    aria-selected={selectedRole === role}
                    className={`${styles.jobsCategoryItem} ${selectedRole === role ? styles.jobsCategoryItemActive : ""}`}
                    key={role}
                    onClick={() => {
                      setSelectedRole(role);
                      setIsRoleOpen(false);
                    }}
                    role="option"
                    type="button"
                  >
                    {role === "all" ? "Бүгд" : role}
                  </button>
                ))}
              </div>
            ) : null}
            </div>

            <div className="flex w-full shrink-0 sm:ml-auto sm:w-auto">
              {currentUser?.role === "freelancer" ? (
                <button
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#7c3aed] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.35)] transition-all duration-200 ease-out hover:bg-[#6d28d9] hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-brand-200/50 sm:w-auto"
                  onClick={() => setPublishSheetOpen(true)}
                  type="button"
                >
                  <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
                    <path
                      d="M21 21l-4.3-4.3m1.8-5.2a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2"
                    />
                  </svg>
                  ЗАР ОРУУЛАХ
                </button>
              ) : (
                <Link
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#7c3aed] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.35)] transition-all duration-200 ease-out hover:bg-[#6d28d9] hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-brand-200/50 sm:w-auto"
                  href="/register"
                >
                  <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
                    <path
                      d="M21 21l-4.3-4.3m1.8-5.2a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2"
                    />
                  </svg>
                  ЗАР ОРУУЛАХ
                </Link>
              )}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 rounded-2xl border border-slate-200/70 bg-white px-2 py-2 shadow-[0_6px_24px_rgba(0,0,0,0.04)] sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-slate-100">
            <div className="flex items-center gap-3 px-2 py-1.5 lg:px-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
                  <path d="M12 2l2.3 2.3 3.2-.4 1.4 2.9 2.9 1.4-.4 3.2L22 14l-2.3 2 .4 3.2-2.9 1.4-1.4 2.9-3.2-.4L12 22l-2.3 2.3-3.2-.4-1.4-2.9-2.9-1.4.4-3.2L2 14l2.3-2-.4-3.2 2.9-1.4 1.4-2.9 3.2.4L12 2z" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M8.8 12.3l2.1 2.1 4.5-4.7" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                </svg>
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">Шалгарсан мэргэжилтнүүд</div>
                <div className="text-xs font-normal text-slate-500">Баталгаатай, найдвартай</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 py-1.5 lg:px-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
                  <path d="M12 17.2 6.6 20l1-6-4.6-4.2 6.1-.9L12 3.5l2.9 5.4 6.1.9L16.4 14l1 6L12 17.2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
                </svg>
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">Өндөр үнэлгээтэй</div>
                <div className="text-xs font-normal text-slate-500">Шилдэг гүйцэтгэлтэй</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 py-1.5 lg:px-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
                </svg>
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">Хурдан шуурхай</div>
                <div className="text-xs font-normal text-slate-500">Түргэн хугацаанд</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 py-1.5 lg:px-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
                  <path d="M3 18v-6a9 9 0 0118 0v6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
                  <path d="M21 19a2 2 0 01-2 2H5a2 2 0 01-2-2v-1h18v1zM9 9V6a3 3 0 016 0v3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
                </svg>
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">24/7 дэмжлэг</div>
                <div className="text-xs font-normal text-slate-500">Танд туслахад бэлэн</div>
              </div>
            </div>
          </div>
        </div>

        {loadError ? (
          <p className={styles.freelancerFetchHint} style={{ textAlign: "center" }}>
            {loadError}
          </p>
        ) : null}

        {loading ? <p className={styles.freelancersPageLoading}>Ачаалж байна…</p> : null}

        <div className="mx-auto grid max-w-[min(1600px,100%)] grid-cols-1 gap-6 px-4 pb-10 sm:px-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {!loading && !loadError
            ? pagedList.map((card) => {
                const badge =
                  card.badgeLabel?.trim() ||
                  (Number(card.rating || "0") >= 4.8 ? "TOP RATED" : Number(card.reviewsCount || "0") >= 20 ? "FAST" : "");
                const badgeTone =
                  badge === "TOP RATED"
                    ? "bg-[#efe7ff] text-brand-700 ring-brand-200"
                    : "bg-[#fff4dd] text-amber-700 ring-amber-200";
                const price = formatPriceLabel(card.priceLabel || "");
                return (
                  <article
                    className="group relative flex flex-col rounded-2xl border border-slate-100 bg-white px-5 pb-5 pt-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
                    key={card.id}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]" />
                        Бэлэн ажиллах
                      </span>
                      {badge ? (
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${badgeTone}`}>{badge}</span>
                      ) : (
                        <span />
                      )}
                    </div>

                    <div className="mx-auto mb-3 grid h-24 w-24 place-items-center rounded-full bg-brand-50 shadow-sm ring-4 ring-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={card.fullName}
                        className="h-24 w-24 rounded-full object-cover shadow-sm ring-2 ring-white"
                        src={
                          card.avatarUrl?.trim()
                            ? card.avatarUrl.trim()
                            : `https://i.pravatar.cc/240?img=${(card.id % 70) + 1}`
                        }
                      />
                    </div>

                    <h3 className="text-[15px] font-bold leading-snug text-slate-900">{card.fullName}</h3>
                    <p className="mt-1 text-xs font-normal text-slate-500">{card.roleTitle}</p>

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-sm">
                      <span className="text-amber-400 tracking-tight">{card.starsLabel || "★★★★★"}</span>
                      <span className="font-semibold text-slate-900">
                        {card.rating || "5.0"}{" "}
                        <span className="text-xs font-medium text-slate-500">
                          ({formatReviews(card.reviewsCount || "0")})
                        </span>
                      </span>
                    </div>

                    <div className="mt-3 text-xl font-extrabold text-[#7c3aed]">
                      {price}
                      <span className="ml-1 text-xs font-semibold text-slate-400">/төсөл</span>
                    </div>

                    {card.skills?.length ? (
                      <div className="mt-3 flex flex-wrap justify-center gap-2">
                        {card.skills
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((skill) => (
                            <span
                              className="rounded-lg bg-[#f5f3ff] px-2.5 py-1 text-[11px] font-semibold text-[#7c3aed] ring-1 ring-violet-100"
                              key={skill}
                            >
                              {skill}
                            </span>
                          ))}
                      </div>
                    ) : (
                      <div className="mt-4 h-8" />
                    )}

                    <button
                      className="mt-4 inline-flex w-full items-center justify-center rounded-[10px] bg-[#7c3aed] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(124,58,237,0.25)] transition-all duration-200 ease-out hover:bg-[#6d28d9] hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-brand-200/50"
                      onClick={() => setActive(card)}
                      type="button"
                    >
                      View Profile {">"}
                    </button>
                  </article>
                );
              })
            : null}
          {!loading && !loadError && filteredList.length === 0 ? (
            <p className={styles.freelancersPageEmpty}>Таны шүүлтэд тохирох фрийлансер олдсонгүй.</p>
          ) : null}
        </div>
        {!loading && !loadError && filteredList.length > 0 ? (
          <div className="mx-auto flex max-w-[min(1600px,100%)] flex-wrap items-center justify-between gap-3 px-4 pb-10 sm:px-6">
            <div className="text-sm font-medium text-slate-600">
              Showing <span className="font-semibold text-slate-900">{(page - 1) * PAGE_SIZE + 1}</span>–
              <span className="font-semibold text-slate-900">{Math.min(page * PAGE_SIZE, filteredList.length)}</span>{" "}
              of <span className="font-semibold text-slate-900">{filteredList.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-brand-50 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                type="button"
              >
                Prev
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const p = Math.min(totalPages, Math.max(1, page - 2 + i));
                  const activePage = p === page;
                  return (
                    <button
                      className={`h-10 w-10 rounded-full text-sm font-semibold shadow-sm transition ${
                        activePage ? "bg-brand-600 text-white" : "border border-brand-200 bg-white text-slate-700 hover:bg-brand-50"
                      }`}
                      key={`${p}-${i}`}
                      onClick={() => setPage(p)}
                      type="button"
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                className="rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-brand-50 disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <SiteFooter />
      <JobSeekerDetailModal
        currentUser={currentUser}
        onClose={() => {
          setActive(null);
        }}
        seeker={active}
      />
      <FreelancerPublishSheet
        currentUser={currentUser}
        onClose={() => setPublishSheetOpen(false)}
        onSaved={() => void loadJobSeekers()}
        open={publishSheetOpen}
      />
    </div>
  );
}

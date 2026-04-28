"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { JobSeekerPublic } from "@/lib/job-seekers";
import { JobSeekerDetailModal } from "./job-seeker-detail-modal";
import { NavBar } from "./nav-bar";
import { SiteFooter } from "./site-footer";
import styles from "./index-landing.module.css";

const FAVORITE_KEY = "cwork-landing-favorite-job-ids";

const accentClassMap = {
  lime: styles.accentLime,
  mint: styles.accentMint,
  pink: styles.accentPink,
  gold: styles.accentGold,
} as const;

type ApiBody = { jobSeekers?: JobSeekerPublic[]; error?: string };

function contactInfo(id: number) {
  const phoneTail = String(1000 + (id % 9000)).padStart(4, "0");
  return {
    phone: `99${phoneTail}`,
    email: `freelancer${id}@cwork.local`,
  };
}

export function FreelancersLandingPage() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [list, setList] = useState<JobSeekerPublic[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<JobSeekerPublic | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState(200);

  const roleOptions = useMemo(() => {
    const roles = Array.from(new Set(list.map((item) => item.roleTitle))).sort((a, b) => a.localeCompare(b));
    return ["all", ...roles];
  }, [list]);

  const filteredList = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const parsePrice = (priceLabel: string) => {
      const digits = priceLabel.replace(/[^\d]/g, "");
      const raw = Number(digits || "0");
      if (!Number.isFinite(raw) || raw <= 0) {
        return 0;
      }
      return raw / 1000;
    };
    return list.filter((item) => {
      const keywordMatch =
        q.length === 0 ||
        item.fullName.toLowerCase().includes(q) ||
        item.roleTitle.toLowerCase().includes(q) ||
        item.shortDescription.toLowerCase().includes(q);
      const roleMatch = selectedRole === "all" || item.roleTitle === selectedRole;
      const priceMatch = parsePrice(item.priceLabel) <= maxPrice;
      return keywordMatch && roleMatch && priceMatch;
    });
  }, [keyword, list, selectedRole, maxPrice]);

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
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/job-seekers", { cache: "no-store" });
        const body = (await res.json()) as ApiBody;
        if (!cancelled) {
          setList(body.jobSeekers ?? []);
          if (!res.ok) {
            setLoadError(body.error ?? `HTTP ${res.status}`);
          } else {
            setLoadError(body.error ?? null);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setList([]);
          setLoadError(e instanceof Error ? e.message : "Алдаа гарлаа.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.page}>
      <NavBar
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
        onFreelancer={() => {}}
        onPostJob={() => {
          router.push("/jobs?post=1");
        }}
        onSavedJobsClick={() => {
          router.push("/jobs#jobs-content");
        }}
        savedJobCount={savedCount}
        scrolled={isScrolled}
      />

      <section className={styles.freelancersPageSection} id="freelancers">
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
              <h1 className={`${styles.searchHeroTitle} ${styles.freelancersHeroTitle}`}>
                Шилдэг freelancer-ийг <em>C-Work</em>-оос
              </h1>
            </div>
          </div>
        </div>

        {loadError ? (
          <p className={styles.freelancerFetchHint} style={{ textAlign: "center" }}>
            {loadError}
          </p>
        ) : null}

        {loading ? <p className={styles.freelancersPageLoading}>Ачаалж байна…</p> : null}

        <div className={styles.jobsContent}>
          <div className={styles.jobsFilterRail}>
            <aside className={styles.freelancerFilterPanel}>
              <h3 className={styles.freelancerFilterTitle}>Freelancer Filter</h3>
              <label className={styles.freelancerFilterSearch}>
                <span className={styles.freelancerFilterSearchIcon}>⌕</span>
                <input
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Нэр эсвэл мэргэжлээр хайх..."
                  value={keyword}
                />
                {keyword ? (
                  <button
                    aria-label="Хайлтыг цэвэрлэх"
                    className={styles.jobsFilterSearchClear}
                    onClick={() => setKeyword("")}
                    type="button"
                  >
                    ×
                  </button>
                ) : null}
              </label>

              <div className={styles.jobsFilterSection}>
                <p className={styles.jobsFilterSectionTitle}>Хялбар шүүлт</p>
                <select
                  className={styles.jobsFilterSelect}
                  onChange={(event) => setSelectedRole(event.target.value)}
                  value={selectedRole}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role === "all" ? "Бүгд" : role}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.jobsFilterSection}>
                <p className={styles.jobsFilterSectionTitle}>Price Range</p>
                <div className={styles.freelancerPriceScale}>
                  <span>$0</span>
                  <span>${maxPrice}/hr</span>
                </div>
                <input
                  className={styles.jobsFilterRange}
                  max={200}
                  min={20}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  step={5}
                  type="range"
                  value={maxPrice}
                />
              </div>

              <button
                className={styles.jobsFilterClear}
                onClick={() => {
                  setKeyword("");
                  setSelectedRole("all");
                  setMaxPrice(200);
                }}
                type="button"
              >
                Clear Filters
              </button>
            </aside>
          </div>

          <div className={styles.jobsLayout}>
            <div className={styles.freelancersPageGrid}>
              {!loading && !loadError
                ? filteredList.map((card) => {
                const contact = contactInfo(card.id);
                return (
                  <article className={styles.freelancerDirectoryCard} key={card.id}>
                    <div className={styles.freelancerDirectoryTop}>
                      <div className={styles.freelancerDirectoryIdentity}>
                        <div className={`${styles.freelancerDirectoryAvatar} ${accentClassMap[card.accent]}`}>
                          <img
                            alt={card.fullName}
                            className={styles.freelancerDirectoryAvatarImage}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                            src={`https://i.pravatar.cc/240?img=${(card.id % 70) + 1}`}
                          />
                        </div>
                        <div>
                          <div className={styles.freelancerDirectoryName}>{card.fullName}</div>
                          <div className={styles.freelancerDirectoryRole}>{card.roleTitle}</div>
                        </div>
                      </div>
                    </div>
                    <div className={styles.freelancerDirectoryActions}>
                      <div className={styles.freelancerDirectoryContact}>
                        <span>
                          <span className={styles.freelancerContactIcon}>☎</span> {contact.phone}
                        </span>
                        <span>
                          <span className={styles.freelancerContactIcon}>✉</span> {contact.email}
                        </span>
                      </div>
                      <button
                        className={styles.freelancerDirectoryButton}
                        onClick={() => {
                          setActive(card);
                        }}
                        type="button"
                      >
                        View Profile
                      </button>
                    </div>
                  </article>
                );
                })
              : null}
              {!loading && !loadError && filteredList.length === 0 ? (
                <p className={styles.freelancersPageEmpty}>
                  Таны шүүлтэд тохирох фрийлансер олдсонгүй. Шүүлтээ цэвэрлээд дахин оролдоно уу.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
      <JobSeekerDetailModal
        onClose={() => {
          setActive(null);
        }}
        seeker={active}
      />
    </div>
  );
}

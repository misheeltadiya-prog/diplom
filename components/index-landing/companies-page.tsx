"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { websiteToDomain } from "@/lib/website-domain";
import type { JobRecord } from "@/lib/portal-data";
import { CompanyProfileForm } from "@/app/profile/company/company-profile-form";
import { CompanyProfileReadonly } from "@/components/company/company-profile-readonly";
import {
  avatarToneClasses,
  companyInitials,
  resolveCompanyBannerSrc,
  resolveCompanyLogoSrc,
  type CompanyBase,
} from "./companies-directory";
import { NavBar } from "./nav-bar";
import styles from "./index-landing.module.css";
import { formatPlatformStat, usePlatformStats } from "./use-platform-stats";

type CompaniesPageProps = {
  currentUser?: SessionUser | null;
  directoryCompanies: CompanyBase[];
};

function companyWebsiteHref(company: CompanyBase) {
  const raw = company.websiteRaw?.trim();
  if (raw) {
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  }
  return `https://${company.domain}`;
}

type CompanyTab = "jobs" | "about" | "news";

function formatFollowers(index: number) {
  return `${320 + index * 37}`;
}

function companyNewsFromDescription(company: CompanyBase): string[] {
  const text = company.description?.trim();
  if (!text) {
    return [`${company.name} платформ дээр бүртгэлтэй компани.`];
  }
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 6);
}

type CompanyDetailModalProps = {
  company: CompanyBase | null;
  currentUser?: SessionUser | null;
  onClose: () => void;
  allCompanies: CompanyBase[];
  onCompanyUpdated?: (company: CompanyBase) => void;
};

function CompanyDetailModal({
  company,
  currentUser = null,
  onClose,
  allCompanies,
  onCompanyUpdated,
}: CompanyDetailModalProps) {
  const [activeTab, setActiveTab] = useState<CompanyTab>("about");
  const [detailCompany, setDetailCompany] = useState<CompanyBase | null>(company);
  const [profileLoading, setProfileLoading] = useState(false);
  const [dbJobs, setDbJobs] = useState<JobRecord[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    setDetailCompany(company);
  }, [company]);

  useEffect(() => {
    if (!company?.userId) {
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    fetch(`/api/companies/${company.userId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((payload: { ok?: boolean; company?: CompanyBase }) => {
        if (cancelled || !payload.ok || !payload.company) return;
        setDetailCompany(payload.company);
        onCompanyUpdated?.(payload.company);
      })
      .catch(() => {
        /* keep card snapshot */
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [company?.userId]);

  useEffect(() => {
    if (!detailCompany) {
      return;
    }

    setActiveTab("about");
    setBannerUrl(detailCompany.bannerUrl?.trim() || null);
    setLogoUrl(detailCompany.logoUrl?.trim() || null);
    const previous = document.body.style.overflow;
    document.body.classList.add("job-seeker-modal-open");
    document.body.style.overflow = "hidden";

    return () => {
      document.body.classList.remove("job-seeker-modal-open");
      document.body.style.overflow = previous;
    };
  }, [detailCompany]);

  useEffect(() => {
    if (!detailCompany?.isRegistered || !detailCompany.userId || activeTab !== "jobs") {
      return;
    }
    let cancelled = false;
    setJobsLoading(true);
    fetch("/api/jobs", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { jobs?: JobRecord[] }) => {
        if (cancelled) return;
        const uid = detailCompany.userId!;
        setDbJobs((d.jobs ?? []).filter((j) => j.createdByUserId === uid));
      })
      .catch(() => {
        if (!cancelled) setDbJobs([]);
      })
      .finally(() => {
        if (!cancelled) setJobsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [detailCompany, activeTab]);

  if (!company || !detailCompany) {
    return null;
  }

  const companyIndex = allCompanies.findIndex(
    (item) =>
      item.name === detailCompany.name &&
      item.domain === detailCompany.domain &&
      (item.userId ?? 0) === (detailCompany.userId ?? 0),
  );
  const news = companyNewsFromDescription(detailCompany);
  const followers = formatFollowers(companyIndex >= 0 ? companyIndex : 0);

  const isOwner = detailCompany.isRegistered && currentUser?.id === detailCompany.userId;

  function applyProfilePatch(patch: {
    companyName: string;
    industry: string;
    city: string;
    website: string;
    description: string;
  }) {
    if (!detailCompany) {
      return;
    }

    const current = detailCompany;
    const websiteRaw = patch.website.trim();
    const next: CompanyBase = {
      ...current,
      name: patch.companyName.trim() || current.name,
      industry: patch.industry.trim() || "Компани",
      city: patch.city.trim() || "Ulaanbaatar",
      description: patch.description.trim() || undefined,
      websiteRaw: websiteRaw || undefined,
      domain: websiteRaw ? websiteToDomain(websiteRaw) : current.domain,
    };
    setDetailCompany(next);
    onCompanyUpdated?.(next);
  }

  async function handleBannerUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !isOwner) return;

    if (!file.type.startsWith("image/")) {
      alert("Зөвхөн зураг файл сонгоно уу.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Файл хэт том (5MB хүртэл).");
      return;
    }

    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/company-profile/banner", { method: "POST", body: fd });
      const data = await res.json();
      
      if (res.ok && data.url) {
        setBannerUrl(data.url);
        alert("Banner амжилттай солигдлоо!");
      } else {
        alert(data.error || "Banner upload хийхэд алдаа гарлаа.");
      }
    } catch {
      alert("Banner upload хийхэд алдаа гарлаа.");
    } finally {
      setUploadingBanner(false);
    }
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !isOwner) return;

    if (!file.type.startsWith("image/")) {
      alert("Зөвхөн зураг файл сонгоно уу.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Файл хэт том (5MB хүртэл).");
      return;
    }

    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/company-profile/logo", { method: "POST", body: fd });
      const data = await res.json();
      
      if (res.ok && data.url) {
        setLogoUrl(data.url);
        alert("Logo амжилттай солигдлоо!");
      } else {
        alert(data.error || "Logo upload хийхэд алдаа гарлаа.");
      }
    } catch {
      alert("Logo upload хийхэд алдаа гарлаа.");
    } finally {
      setUploadingLogo(false);
    }
  }

  return (
    <div
      className={styles.companyModalOverlay}
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        aria-labelledby="company-modal-title"
        aria-modal="true"
        className={styles.companyModalPanel}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button aria-label="Хаах" className={styles.companyModalClose} onClick={onClose} type="button">
          ×
        </button>

        <div className={styles.companyModalBanner}>
          <img
            alt={`${detailCompany.name} banner`}
            className={styles.companyModalBannerImage}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            src={bannerUrl || resolveCompanyBannerSrc(detailCompany)}
          />
          <div className={styles.companyModalBannerOverlay}>
            <div className={styles.companyModalBannerCopy}>
              <span>Find Your</span>
              <strong>{detailCompany.name}</strong>
              <span>with C-Work</span>
            </div>
            {isOwner ? (
              <label className={styles.companyBannerUploadBtn}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  disabled={uploadingBanner}
                  style={{ display: "none" }}
                />
                <svg aria-hidden fill="none" viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {uploadingBanner ? "Ачаалж байна..." : "Зураг солих"}
              </label>
            ) : null}
          </div>
        </div>

        <div className={styles.companyModalTop}>
          <div className={styles.companyModalIdentity}>
            <div className={styles.companyModalLogoWrap}>
              {isOwner ? (
                <label style={{ cursor: "pointer", position: "relative", display: "block" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    style={{ display: "none" }}
                  />
                  <img
                    alt={`${detailCompany.name} logo`}
                    className={styles.companyModalLogoImage}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      const fallback = event.currentTarget.nextElementSibling as HTMLSpanElement | null;
                      if (fallback) {
                        fallback.style.display = "inline-flex";
                      }
                    }}
                    src={logoUrl || resolveCompanyLogoSrc(detailCompany)}
                    style={{ cursor: "pointer" }}
                  />
                  <span className={styles.companyModalLogoFallback} style={{ cursor: "pointer" }}>
                    {companyInitials(detailCompany.name)}
                  </span>
                  {uploadingLogo && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        background: "rgba(0,0,0,0.5)",
                        color: "#fff",
                        fontSize: "0.75rem",
                        borderRadius: "inherit",
                      }}
                    >
                      Ачаалж байна...
                    </div>
                  )}
                </label>
              ) : (
                <>
                  <img
                    alt={`${detailCompany.name} logo`}
                    className={styles.companyModalLogoImage}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      const fallback = event.currentTarget.nextElementSibling as HTMLSpanElement | null;
                      if (fallback) {
                        fallback.style.display = "inline-flex";
                      }
                    }}
                    src={resolveCompanyLogoSrc(detailCompany)}
                  />
                  <span className={styles.companyModalLogoFallback}>{companyInitials(detailCompany.name)}</span>
                </>
              )}
            </div>
            <div className={styles.companyModalHeading}>
              <h2 className={styles.companyModalTitle} id="company-modal-title">
                {detailCompany.name}
              </h2>
              <p className={styles.companyModalSubtitle}>
                {detailCompany.industry} · {detailCompany.city}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.companyModalTabs}>
          <button
            className={`${styles.companyModalTab} ${activeTab === "jobs" ? styles.companyModalTabActive : ""}`}
            onClick={() => setActiveTab("jobs")}
            type="button"
          >
            Ажлын зар
          </button>
          <button
            className={`${styles.companyModalTab} ${activeTab === "about" ? styles.companyModalTabActive : ""}`}
            onClick={() => setActiveTab("about")}
            type="button"
          >
            Компанийн тухай
          </button>
          <button
            className={`${styles.companyModalTab} ${activeTab === "news" ? styles.companyModalTabActive : ""}`}
            onClick={() => setActiveTab("news")}
            type="button"
          >
            Мэдээ мэдээлэл
          </button>
        </div>

        <div className={styles.companyModalBody}>
          {activeTab === "about" ? (
            <>
              {profileLoading ? <p className={styles.companyModalEmpty}>Мэдээлэл ачаалж байна…</p> : null}
              {isOwner ? (
                <div className={styles.companyModalEditWrap}>
                  <p className={styles.companyModalOwnerHint}>
                    Профайл дээрхтэй ижил талбарууд. Энд засаад хадгалбал жагсаалт болон modal шууд шинэчлэгдэнэ.
                  </p>
                  <CompanyProfileForm embedded onSaved={applyProfilePatch} />
                </div>
              ) : (
                <CompanyProfileReadonly company={detailCompany} />
              )}
              {!isOwner && currentUser?.role !== "company" ? (
                <p className={styles.companyModalLoginHint}>
                  Өөрийн компаниа жагсаалтад нэмэхийн тулд{" "}
                  <Link href="/register?role=company">company эрхээр бүртгүүлэх</Link> эсвэл{" "}
                  <Link href="/login?role=company">нэвтрэх</Link>.
                </p>
              ) : null}
            </>
          ) : null}

          {activeTab === "jobs" ? (
            <div className={styles.companyModalList}>
              {!detailCompany.isRegistered || !detailCompany.userId ? (
                <p className={styles.companyModalEmpty}>
                  Зөвхөн бүртгэлтэй компаниуд платформ дээр зар нэмнэ.
                </p>
              ) : jobsLoading ? (
                <p className={styles.companyModalEmpty}>Ажлын заруудыг ачаалж байна…</p>
              ) : dbJobs.length === 0 ? (
                <p className={styles.companyModalEmpty}>
                  Энэ компани одоогоор платформ дээр зар нэмээгүй байна. Үндсэн{" "}
                  <Link href="/jobs">Ажлын зар</Link> хуудаас хайна уу.
                </p>
              ) : (
                dbJobs.map((job) => (
                  <article className={styles.companyModalListCard} key={job.id}>
                    <strong>{job.title}</strong>
                    <span>
                      {job.location} · {job.salary}
                    </span>
                  </article>
                ))
              )}
            </div>
          ) : null}

          {activeTab === "news" ? (
            <div className={styles.companyModalList}>
              {news.map((item) => (
                <article className={styles.companyModalListCard} key={item}>
                  <strong>{item}</strong>
                  <span>{detailCompany.name} · Сүүлийн шинэчлэлт</span>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CompaniesPage({ currentUser = null, directoryCompanies }: CompaniesPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stats = usePlatformStats();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeCompany, setActiveCompany] = useState<CompanyBase | null>(null);
  const [companyCards, setCompanyCards] = useState<CompanyBase[]>(directoryCompanies);
  const [listedNotice, setListedNotice] = useState(false);

  const companyHeroStats = [
    { value: formatPlatformStat(stats.companies), label: "Companies" },
    { value: formatPlatformStat(stats.openJobs), label: "Open Jobs" },
    { value: formatPlatformStat(stats.cvs), label: "CVs" },
  ];

  const refreshDirectory = useCallback(async () => {
    try {
      const response = await fetch("/api/companies/directory", { cache: "no-store" });
      const payload = (await response.json()) as { ok?: boolean; companies?: CompanyBase[] };
      if (response.ok && Array.isArray(payload.companies)) {
        setCompanyCards(payload.companies);
      }
    } catch {
      /* keep last list */
    }
  }, []);

  useEffect(() => {
    setCompanyCards(directoryCompanies);
  }, [directoryCompanies]);

  useEffect(() => {
    void refreshDirectory();
    const onStatsChange = () => {
      void refreshDirectory();
    };
    window.addEventListener("cwork:platform-stats-changed", onStatsChange);
    return () => window.removeEventListener("cwork:platform-stats-changed", onStatsChange);
  }, [refreshDirectory]);

  useEffect(() => {
    if (searchParams.get("listed") === "1") {
      setListedNotice(true);
      const timer = window.setTimeout(() => setListedNotice(false), 6000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [searchParams]);

  const myCompanyCard = useMemo(() => {
    if (currentUser?.role !== "company" || typeof currentUser.id !== "number") {
      return null;
    }
    return companyCards.find((c) => c.userId === currentUser.id) ?? null;
  }, [companyCards, currentUser]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={styles.page}>
      <NavBar
        currentUser={currentUser}
        onAbout={() => {
          document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onCompany={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onFindJob={() => {
          router.push("/jobs");
        }}
        onFreelancer={() => {
          router.push("/freelancers");
        }}
        scrolled={isScrolled}
      />

      <section className={styles.companiesPageSection}>
        <div className={styles.searchHeroStrip}>
          <div className={styles.searchHeroText}>
            <p className={styles.searchHeroKicker}>C-Work companies</p>
            <h1 className={`${styles.searchHeroTitle} ${styles.companiesHeroTitle}`}>
              Шилдэг компаниудтай <span className={styles.searchHeroAccent}>хурдан.</span>
            </h1>
            <p className={`${styles.searchHeroSummary} ${styles.companiesPageCopy}`}>
              Технологи, финтек, enterprise software болон digital product чиглэлээр ажилладаг verified
              employer-уудыг нэг дороос үзээрэй.
            </p>
            <p className={styles.searchHeroMeta}>
              {formatPlatformStat(stats.companies)} компани • {formatPlatformStat(stats.openJobs)} нээлттэй ажлын байр •{" "}
              {formatPlatformStat(stats.cvs)} CV
            </p>
          </div>

          <div className={styles.searchHeroStats} aria-label="Company statistics">
            {companyHeroStats.map((item) => (
              <div className={styles.searchHeroStatCard} key={item.label}>
                <span className={styles.searchHeroStatValue}>{item.value}</span>
                <span className={styles.searchHeroStatLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {listedNotice ? (
          <p className={styles.searchHeroMeta} role="status">
            {myCompanyCard
              ? `«${myCompanyCard.name}» компани жагсаалтад нэмэгдлээ.`
              : "Профайл хадгалагдлаа. Компани жагсаалтад харагдах ёстой."}
          </p>
        ) : null}

        <div className={styles.companiesGrid} id="companies-grid">
          {companyCards.length === 0 ? (
            <p className={styles.searchHeroMeta}>
              Одоогоор бүртгэлтэй компани байхгүй. Company эрхээр нэвтэрч профайл бөглөнө үү.
            </p>
          ) : null}
          {companyCards.map((company, index) => {
            const toneClass = styles[avatarToneClasses[index % avatarToneClasses.length]];
            const cardKey = company.isRegistered ? `reg-${company.userId ?? index}` : `seed-${company.domain}-${company.name}`;

            return (
              <button
                className={styles.companyCard}
                key={cardKey}
                onClick={() => setActiveCompany(company)}
                type="button"
              >
                <div className={`${styles.companyAvatar} ${toneClass}`}>
                  <img
                    alt={`${company.name} logo`}
                    className={styles.companyAvatarImage}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      const fallback = event.currentTarget.nextElementSibling as HTMLSpanElement | null;
                      if (fallback) {
                        fallback.style.display = "inline-flex";
                      }
                    }}
                    src={resolveCompanyLogoSrc(company)}
                  />
                  <span className={styles.companyAvatarFallback}>{companyInitials(company.name)}</span>
                </div>
                <div className={styles.companyName}>{company.name}</div>
                <div className={styles.companyCardMeta}>
                  {company.industry} · {company.city}
                </div>
                {company.isRegistered ? <span className={styles.companyCardBadge}>Бүртгэлтэй</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <CompanyDetailModal
        allCompanies={companyCards}
        company={activeCompany}
        currentUser={currentUser}
        onClose={() => setActiveCompany(null)}
        onCompanyUpdated={(updated) => {
          setCompanyCards((prev) =>
            prev.map((item) => (item.userId === updated.userId ? { ...item, ...updated } : item)),
          );
          setActiveCompany((prev) => (prev?.userId === updated.userId ? { ...prev, ...updated } : prev));
        }}
      />
    </div>
  );
}

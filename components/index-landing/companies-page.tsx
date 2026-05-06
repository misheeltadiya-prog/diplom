"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import type { JobRecord } from "@/lib/portal-data";
import { avatarToneClasses, companyInitials, companyLogoUrl, type CompanyBase } from "./companies-directory";
import { NavBar } from "./nav-bar";
import { SiteFooter } from "./site-footer";
import styles from "./index-landing.module.css";
import { formatPlatformStat, usePlatformStats } from "./use-platform-stats";

const FAVORITE_KEY = "cwork-landing-favorite-job-ids";

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

function companyBannerUrl(domain: string) {
  return `https://image.thum.io/get/width/1600/crop/760/noanimate/https://${domain}`;
}

function formatFollowers(index: number) {
  return `${320 + index * 37}`;
}

function buildCompanyJobs(company: CompanyBase) {
  return [`${company.industry} Engineer`, "Product Designer", "Business Analyst"];
}

function buildCompanyNews(company: CompanyBase) {
  return [
    `${company.name} шинэ бүтээгдэхүүн хөгжүүлэлтийн багаа өргөжүүлж байна.`,
    `${company.industry} чиглэлд шинэ хамтын ажиллагаа эхлүүллээ.`,
    `${company.city} дахь оффис дээр нээлттэй ажлын ярилцлага зохион байгуулж байна.`,
  ];
}

type CompanyDetailModalProps = {
  company: CompanyBase | null;
  currentUser?: SessionUser | null;
  onClose: () => void;
  allCompanies: CompanyBase[];
};

function CompanyDetailModal({ company, currentUser = null, onClose, allCompanies }: CompanyDetailModalProps) {
  const [activeTab, setActiveTab] = useState<CompanyTab>("about");
  const [dbJobs, setDbJobs] = useState<JobRecord[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  useEffect(() => {
    if (!company) {
      return;
    }

    setActiveTab("about");
    const previous = document.body.style.overflow;
    document.body.classList.add("job-seeker-modal-open");
    document.body.style.overflow = "hidden";

    return () => {
      document.body.classList.remove("job-seeker-modal-open");
      document.body.style.overflow = previous;
    };
  }, [company]);

  useEffect(() => {
    if (!company?.isRegistered || !company.userId || activeTab !== "jobs") {
      return;
    }
    let cancelled = false;
    setJobsLoading(true);
    fetch("/api/jobs", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { jobs?: JobRecord[] }) => {
        if (cancelled) return;
        const uid = company.userId!;
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
  }, [company, activeTab]);

  if (!company) {
    return null;
  }

  const companyIndex = allCompanies.findIndex(
    (item) =>
      item.name === company.name &&
      item.domain === company.domain &&
      (item.userId ?? 0) === (company.userId ?? 0),
  );
  const jobs = buildCompanyJobs(company);
  const news = buildCompanyNews(company);
  const followers = formatFollowers(companyIndex >= 0 ? companyIndex : 0);

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
            alt={`${company.name} banner`}
            className={styles.companyModalBannerImage}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            src={companyBannerUrl(company.domain)}
          />
          <div className={styles.companyModalBannerOverlay}>
            <div className={styles.companyModalBannerCopy}>
              <span>Find Your</span>
              <strong>{company.name}</strong>
              <span>with C-Work</span>
            </div>
          </div>
        </div>

        <div className={styles.companyModalTop}>
          <div className={styles.companyModalIdentity}>
            <div className={styles.companyModalLogoWrap}>
              <img
                alt={`${company.name} logo`}
                className={styles.companyModalLogoImage}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  const fallback = event.currentTarget.nextElementSibling as HTMLSpanElement | null;
                  if (fallback) {
                    fallback.style.display = "inline-flex";
                  }
                }}
                src={companyLogoUrl(company.domain)}
              />
              <span className={styles.companyModalLogoFallback}>{companyInitials(company.name)}</span>
            </div>
            <div className={styles.companyModalHeading}>
              <h2 className={styles.companyModalTitle} id="company-modal-title">
                {company.name}
              </h2>
              <p className={styles.companyModalSubtitle}>
                {company.industry} · {company.city}
              </p>
            </div>
          </div>

          <div className={styles.companyModalActions}>
            <div className={styles.companyModalFollowStat}>{followers} дагагч</div>
            {company.isRegistered && currentUser?.id === company.userId ? (
              <Link className={styles.companyModalPortalBtn} href="/profile#company-applications" onClick={onClose}>
                Өргөдлүүд харах
              </Link>
            ) : null}
            {company.isRegistered ? (
              <Link
                className={styles.companyModalPortalBtnSecondary}
                href="/login?role=company&next=/profile/company"
                onClick={onClose}
              >
                Компаниар нэвтрэх
              </Link>
            ) : null}
            <button className={styles.companyModalFollowButton} type="button">
              Дагах
            </button>
            <div className={styles.companyModalSocials}>
              <a className={styles.companyModalSocial} href={companyWebsiteHref(company)} rel="noreferrer" target="_blank">
                web
              </a>
              <span className={styles.companyModalSocial}>f</span>
              <span className={styles.companyModalSocial}>in</span>
              <span className={styles.companyModalSocial}>yt</span>
              <span className={styles.companyModalSocial}>ig</span>
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
            <div className={styles.companyModalSectionGrid}>
              <article className={styles.companyModalInfoCard}>
                <h3 className={styles.companyModalInfoTitle}>Товч танилцуулга</h3>
                <p className={styles.companyModalInfoText}>
                  {company.description?.trim()
                    ? company.description.trim()
                    : `${company.name} нь ${company.industry.toLowerCase()} чиглэлээр ажилладаг ба дотоодын болон олон улсын хэрэглэгчдэд зориулсан бүтээгдэхүүн, платформ, үйлчилгээ хөгжүүлдэг.`}
                </p>
              </article>
              <article className={styles.companyModalInfoCard}>
                <h3 className={styles.companyModalInfoTitle}>Яагаад энэ компани вэ?</h3>
                <p className={styles.companyModalInfoText}>
                  Бүтээгдэхүүн төвтэй соёл, өсөн тэлж буй баг, орчин үеийн технологи ашигладаг ажлын орчинтой.
                </p>
              </article>
              <article className={styles.companyModalInfoCard}>
                <h3 className={styles.companyModalInfoTitle}>Холбоо барих</h3>
                <p className={styles.companyModalInfoText}>
                  Website: {company.websiteRaw?.trim() || company.domain}
                  <br />
                  Байршил: {company.city}
                  <br />
                  Чиглэл: {company.industry}
                </p>
              </article>
            </div>
          ) : null}

          {activeTab === "about" && company.isRegistered ? (
            <p className={styles.companyModalLoginHint}>
              Нэг компанийн дансаар л нэвтэрнэ — жагсаалтад байгаа өөр компанийн өмнөөс нэвтэрч болохгүй.{" "}
              <Link href="/register?role=company">Шинээр бүртгүүлэх</Link> эсвэл өөрийн компанийн и-мэйлээр{" "}
              <Link href="/login?role=company">нэвтрэх</Link>.
            </p>
          ) : null}

          {activeTab === "jobs" ? (
            <div className={styles.companyModalList}>
              {company.isRegistered && company.userId ? (
                jobsLoading ? (
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
                )
              ) : (
                jobs.map((job) => (
                  <article className={styles.companyModalListCard} key={job}>
                    <strong>{job}</strong>
                    <span>{company.name} дээр жишээ нээлттэй боломж</span>
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
                  <span>{company.name} · Сүүлийн шинэчлэлт</span>
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
  const stats = usePlatformStats();
  const [isScrolled, setIsScrolled] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [activeCompany, setActiveCompany] = useState<CompanyBase | null>(null);

  const companyHeroStats = [
    { value: formatPlatformStat(stats.companies), label: "Companies" },
    { value: formatPlatformStat(stats.openJobs), label: "Open Jobs" },
    { value: formatPlatformStat(stats.cvs), label: "CVs" },
  ];

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

  const companyCards = useMemo(() => directoryCompanies, [directoryCompanies]);

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

  return (
    <div className={styles.page}>
      <NavBar
        currentUser={currentUser}
        favoritesViewActive={false}
        onAbout={() => {
          document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onCompany={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
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

        <div className={styles.companiesGrid} id="companies-grid">
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
                    src={companyLogoUrl(company.domain)}
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

      <SiteFooter />
      <CompanyDetailModal
        allCompanies={companyCards}
        company={activeCompany}
        currentUser={currentUser}
        onClose={() => setActiveCompany(null)}
      />
    </div>
  );
}

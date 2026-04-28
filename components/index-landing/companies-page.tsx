"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { avatarToneClasses, companies, companyInitials, companyLogoUrl, type CompanyBase } from "./companies-directory";
import { NavBar } from "./nav-bar";
import { SiteFooter } from "./site-footer";
import styles from "./index-landing.module.css";

const FAVORITE_KEY = "cwork-landing-favorite-job-ids";

type CompanyTab = "jobs" | "about" | "news";

function companyBannerUrl(domain: string) {
  return `https://image.thum.io/get/width/1600/crop/760/noanimate/https://${domain}`;
}

function formatFollowers(index: number) {
  return `${320 + index * 37}`;
}

function buildCompanyJobs(company: CompanyBase) {
  return [
    `${company.industry} Engineer`,
    `Product Designer`,
    `Business Analyst`,
  ];
}

function buildCompanyNews(company: CompanyBase) {
  return [
    `${company.name} шинэ бүтээгдэхүүн хөгжүүлэлтийн багaa өргөжүүлж байна.`,
    `${company.industry} чиглэлд шинэ хамтын ажиллагаа эхлүүллээ.`,
    `${company.city} дахь оффис дээр нээлттэй ажлын ярилцлага зохион байгуулж байна.`,
  ];
}

type CompanyDetailModalProps = {
  company: CompanyBase | null;
  onClose: () => void;
};

function CompanyDetailModal({ company, onClose }: CompanyDetailModalProps) {
  const [activeTab, setActiveTab] = useState<CompanyTab>("about");

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

  if (!company) {
    return null;
  }

  const companyIndex = companies.findIndex((item) => item.name === company.name);
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
        className={styles.companyModalPanel}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-modal-title"
      >
        <button className={styles.companyModalClose} onClick={onClose} type="button" aria-label="Хаах">
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
            <button className={styles.companyModalFollowButton} type="button">
              Дагах
            </button>
            <div className={styles.companyModalSocials}>
              <a className={styles.companyModalSocial} href={`https://${company.domain}`} rel="noreferrer" target="_blank">
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
                  {company.name} нь {company.industry.toLowerCase()} чиглэлээр ажилладаг ба дотоодын болон олон улсын
                  хэрэглэгчдэд зориулсан бүтээгдэхүүн, платформ, үйлчилгээ хөгжүүлдэг.
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
                  Website: {company.domain}
                  <br />
                  Байршил: {company.city}
                  <br />
                  Чиглэл: {company.industry}
                </p>
              </article>
            </div>
          ) : null}

          {activeTab === "jobs" ? (
            <div className={styles.companyModalList}>
              {jobs.map((job) => (
                <article className={styles.companyModalListCard} key={job}>
                  <strong>{job}</strong>
                  <span>{company.name} дээр нээлттэй боломж</span>
                </article>
              ))}
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

export function CompaniesPage() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [activeCompany, setActiveCompany] = useState<CompanyBase | null>(null);

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

  const companyCards = useMemo(() => companies, []);

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
        onPostJob={() => {
          router.push("/jobs?post=1");
        }}
        onSavedJobsClick={() => {
          router.push("/jobs#jobs-content");
        }}
        savedJobCount={savedCount}
        scrolled={isScrolled}
      />

      <section className={styles.companiesPageSection}>
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
              <h1 className={`${styles.searchHeroTitle} ${styles.companiesHeroTitle}`}>
                Сайн company-г <em>C-Work</em>-оос
              </h1>
            </div>
            <p className={styles.companiesPageCopy}>
              Технологи, финтек, enterprise software болон digital product чиглэлээр ажиллаж буй компаниуд.
            </p>
          </div>
        </div>

        <div className={styles.companiesGrid}>
          {companyCards.map((company, index) => {
            const toneClass = styles[avatarToneClasses[index % avatarToneClasses.length]];

            return (
              <button
                className={styles.companyCard}
                key={company.name}
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
              </button>
            );
          })}
        </div>
      </section>

      <SiteFooter />
      <CompanyDetailModal company={activeCompany} onClose={() => setActiveCompany(null)} />
    </div>
  );
}

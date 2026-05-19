"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { resolveCompanyLogoSrc } from "./index-landing/companies-directory";

export type MarqueeCompany = {
  name: string;
  domain: string;
  userId?: number;
  logoUrl?: string;
};
import styles from "./cwork-marketing-site.module.css";

type ServiceCardName = "visibility" | "hiring" | "strategy" | "growth";

function IconWrap({ children }: { children: ReactNode }) {
  return <span className={styles.iconInline}>{children}</span>;
}

function BadgeCheckIcon() {
  return (
    <IconWrap>
      <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
        <path
          d="M12 2l2.3 2.3 3.2-.4 1.4 2.9 2.9 1.4-.4 3.2L22 14l-2.3 2 .4 3.2-2.9 1.4-1.4 2.9-3.2-.4L12 22l-2.3 2.3-3.2-.4-1.4-2.9-2.9-1.4.4-3.2L2 14l2.3-2-.4-3.2 2.9-1.4 1.4-2.9 3.2.4L12 2z"
          fill="currentColor"
          opacity="0.18"
        />
        <path d="M8.8 12.3l2.1 2.1 4.5-4.7" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    </IconWrap>
  );
}

function ArrowRightIcon() {
  return (
    <IconWrap>
      <svg aria-hidden="true" height="28" viewBox="0 0 24 24" width="28">
        <path d="M5 12h12" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path d="M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    </IconWrap>
  );
}

function SparklesIcon() {
  return (
    <IconWrap>
      <svg aria-hidden="true" height="24" viewBox="0 0 24 24" width="24">
        <path
          d="M12 2l1.8 4.8L18 8.6l-4.2 1.8L12 15l-1.8-4.6L6 8.6l4.2-1.8L12 2zm7 12l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14zM5 14l1.1 2.5L9 17.6l-2.9 1.2L5 21l-1.1-2.2L1 17.6l2.9-1.1L5 14z"
          fill="currentColor"
        />
      </svg>
    </IconWrap>
  );
}

function GlobeIcon() {
  return (
    <IconWrap>
      <svg aria-hidden="true" height="28" viewBox="0 0 24 24" width="28">
        <circle cx="12" cy="12" fill="none" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    </IconWrap>
  );
}

function CodeIcon() {
  return (
    <IconWrap>
      <svg aria-hidden="true" height="28" viewBox="0 0 24 24" width="28">
        <path d="M9 8l-4 4 4 4M15 8l4 4-4 4M13 5l-2 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    </IconWrap>
  );
}

function LayersIcon() {
  return (
    <IconWrap>
      <svg aria-hidden="true" height="28" viewBox="0 0 24 24" width="28">
        <path d="M12 3l9 5-9 5-9-5 9-5zm0 8l9 5-9 5-9-5 9-5z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    </IconWrap>
  );
}

function BrushIcon() {
  return (
    <IconWrap>
      <svg aria-hidden="true" height="28" viewBox="0 0 24 24" width="28">
        <path d="M14 4l6 6-9.5 9.5a3 3 0 01-2.1.9H5l.6-3.4a3 3 0 01.9-1.7L14 4z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    </IconWrap>
  );
}

function CheckCircleIcon() {
  return (
    <IconWrap>
      <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
        <circle cx="12" cy="12" fill="currentColor" opacity="0.18" r="10" />
        <path d="M8 12.5l2.5 2.5L16 9.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    </IconWrap>
  );
}

function MailIcon() {
  return (
    <IconWrap>
      <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
        <rect fill="none" height="14" rx="2" stroke="currentColor" strokeWidth="2" width="18" x="3" y="5" />
        <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    </IconWrap>
  );
}

function MapPinIcon() {
  return (
    <IconWrap>
      <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
        <path d="M12 21s6-5.2 6-11a6 6 0 10-12 0c0 5.8 6 11 6 11z" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="10" fill="none" r="2.5" stroke="currentColor" strokeWidth="2" />
      </svg>
    </IconWrap>
  );
}

function BriefcaseIcon() {
  return (
    <svg aria-hidden="true" height="40" viewBox="0 0 24 24" width="40" fill="none">
      <rect x="2" y="7" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 12v2m-6-2v2m12-2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SearchWorkIcon() {
  return (
    <svg aria-hidden="true" height="40" viewBox="0 0 24 24" width="40" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg aria-hidden="true" height="40" viewBox="0 0 24 24" width="40" fill="none">
      <path d="M4 20h16M6 20V8l6-4 6 4v12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 20v-5h6v5M9 11h2M13 11h2M9 14h2M13 14h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

type RoleModalProps = {
  onClose: () => void;
};

function RoleModal({ onClose }: RoleModalProps) {
  const router = useRouter();

  /** Сонгосон төрөлтэй `/login?role=…` + нэвтрэлтийн дараах шууд чиглэл (`next`). Бүртгэлийн төрөл DB-тэй таарах ёстой. */
  function choose(role: "client" | "freelancer" | "company") {
    onClose();
    const nextPath =
      role === "company"
        ? "/jobs?post=1"
        : role === "freelancer"
          ? "/freelancers?publish=1"
          : "/jobs";
    router.push(`/login?role=${role}&next=${encodeURIComponent(nextPath)}`);
  }

  return (
    <div className={styles.roleOverlay} role="dialog" aria-modal="true" aria-label="Үүргээ сонгоно уу">
      <div className={styles.rolePanel}>
        <button className={styles.roleCloseBtn} type="button" onClick={onClose} aria-label="Хаах">
          ✕
        </button>
        <div className={styles.roleHeader}>
          <span className={styles.roleEyebrow}>Get started</span>
          <h2 className={styles.roleTitle}>Та хэн бэ?</h2>
          <p className={styles.roleSubtitle}>
            Картаас сонгоно уу — тухайн төрлийн нэвтрэх хуудас нээгдэнэ. И-мэйлийн бүртгэл яг энэ төрөлтэй байвал зөв чиглэл рүү орно.
          </p>
        </div>
        <div className={styles.roleCards}>
          <button
            className={styles.roleCard}
            type="button"
            onClick={() => choose("client")}
          >
            <span className={styles.roleCardIcon}>
              <BriefcaseIcon />
            </span>
            <strong className={styles.roleCardTitle}>I'm a client</strong>
            <span className={styles.roleCardDesc}>Hiring for a project</span>
          </button>
          <button
            className={styles.roleCard}
            type="button"
            onClick={() => choose("freelancer")}
          >
            <span className={styles.roleCardIcon}>
              <SearchWorkIcon />
            </span>
            <strong className={styles.roleCardTitle}>I'm a freelancer</strong>
            <span className={styles.roleCardDesc}>Looking for work</span>
          </button>
          <button
            className={styles.roleCard}
            type="button"
            onClick={() => choose("company")}
          >
            <span className={styles.roleCardIcon}>
              <BuildingIcon />
            </span>
            <strong className={styles.roleCardTitle}>I'm a company</strong>
            <span className={styles.roleCardDesc}>Post jobs &amp; hire talent</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Navbar() {
  const [showRoleModal, setShowRoleModal] = useState(false);

  return (
    <>
      <div className={styles.navWrap}>
        <div className={styles.container}>
          <nav className={styles.navBar}>
            <Link className={styles.brand} href="/">
              <span className={styles.brandMark}>
                <Image alt="C-Work logo" height={24} src="/c-work-logo.svg" width={24} />
              </span>
              <span>C-Work</span>
            </Link>

            <button
              className={styles.navButton}
              type="button"
              onClick={() => setShowRoleModal(true)}
            >
              Get started
            </button>
          </nav>
        </div>
      </div>
      {showRoleModal ? <RoleModal onClose={() => setShowRoleModal(false)} /> : null}
    </>
  );
}

function HomePage({ marqueeCompanies }: { marqueeCompanies: MarqueeCompany[] }) {
  const [activeService, setActiveService] = useState<ServiceCardName>("hiring");

  return (
    <>
      <div className={`${styles.container} ${styles.hero}`}>
        <div className={styles.heroCopy}>
          <div className={styles.badge}>
            <BadgeCheckIcon />
            <span>Available for new projects</span>
          </div>
          <h1 className={`${styles.heroTitle} ${styles.heroLeadTitle}`}>
            Elevating Your <span className={styles.heroTitleAccent}>Freelance Presence</span>
          </h1>
          <p className={`${styles.bodyText} ${styles.heroLeadText}`}>
            C-Work is a focused platform where freelancers and employers meet around real projects, clean profiles,
            and fast hiring momentum. Discover opportunities, showcase your strengths, and move from interest to work.
          </p>
          <div className={styles.clientRow}>
            <div className={styles.avatarStack}>
              <img alt="Freelancer avatar" className={styles.avatar} src="https://api.dicebear.com/7.x/avataaars/svg?seed=101" />
              <img alt="Employer avatar" className={styles.avatar} src="https://api.dicebear.com/7.x/avataaars/svg?seed=202" />
              <img alt="Creative avatar" className={styles.avatar} src="https://api.dicebear.com/7.x/avataaars/svg?seed=303" />
            </div>
            <div className={styles.statCopy}>
              <strong>50+ active profiles and project flows</strong>
              <span>Design, development, marketing and more</span>
            </div>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.heroFrameBack}>
            <img
              alt="Creative planning board"
              className={styles.heroImage}
              src="https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&q=80&w=1200"
            />
          </div>
          <div className={styles.heroFrame}>
            <img
              alt="Creative workspace"
              className={styles.heroImage}
              src="https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&q=80&w=1200"
            />
          </div>
          <div className={styles.floatingCard}>
            <span className={styles.floatingIcon}>
              <SparklesIcon />
            </span>
            <div className={styles.floatingText}>
              <strong>Premium UI</strong>
              <span>Expert craft for job discovery</span>
            </div>
          </div>
        </div>
      </div>

      {marqueeCompanies.length > 0 ? (
        <div className={`${styles.container} ${styles.companyMarquee}`}>
          <div className={styles.marqueeViewport}>
            <div className={styles.marqueeTrack}>
              {[...marqueeCompanies, ...marqueeCompanies].map((company, index) => (
                <div className={styles.marqueeItem} key={`${company.domain}-${index}`}>
                  <img
                    alt={`${company.name} logo`}
                    className={styles.marqueeLogo}
                    src={resolveCompanyLogoSrc(company)}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <span className={styles.marqueeName}>{company.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.contentBlock}>
        <div className={styles.container}>
          <div className={styles.blockHead}>
            <h2 className={styles.blockTitle}>Precision Services</h2>
          </div>

          <div className={styles.serviceGrid}>
            <button
              aria-pressed={activeService === "visibility"}
              className={`${styles.serviceCard} ${styles.serviceCardButton} ${activeService === "visibility" ? styles.serviceCardFeatured : ""}`}
              type="button"
              onClick={() => setActiveService("visibility")}
            >
              <span className={styles.serviceIcon}>
                <GlobeIcon />
              </span>
              <h3 className={styles.serviceTitle}>Freelancer Visibility</h3>
              <p className={styles.serviceText}>
                Stronger profile storytelling, better positioning, and cleaner presentation so your skill set gets noticed.
              </p>
              <div className={styles.chipRow}>
                <span className={styles.serviceChip}>Profiles</span>
                <span className={styles.serviceChip}>Discovery</span>
              </div>
            </button>

            <button
              aria-pressed={activeService === "hiring"}
              className={`${styles.serviceCard} ${styles.serviceCardButton} ${activeService === "hiring" ? styles.serviceCardFeatured : ""}`}
              type="button"
              onClick={() => setActiveService("hiring")}
            >
              <span className={styles.serviceIcon}>
                <CodeIcon />
              </span>
              <h3 className={styles.serviceTitle}>Hiring Flow</h3>
              <p className={styles.serviceText}>
                Structured job posting, fast candidate discovery, and a workflow that helps companies move with confidence.
              </p>
              <div className={styles.chipRow}>
                <span className={styles.serviceChip}>Recruitment</span>
                <span className={styles.serviceChip}>Posting</span>
              </div>
            </button>

            <button
              aria-pressed={activeService === "strategy"}
              className={`${styles.serviceCard} ${styles.serviceCardButton} ${activeService === "strategy" ? styles.serviceCardFeatured : ""}`}
              type="button"
              onClick={() => setActiveService("strategy")}
            >
              <span className={styles.serviceIcon}>
                <LayersIcon />
              </span>
              <h3 className={styles.serviceTitle}>Platform Strategy</h3>
              <p className={styles.serviceText}>
                Organize categories, sharpen the user journey, and create a digital footprint that supports long-term growth.
              </p>
              <div className={styles.chipRow}>
                <span className={styles.serviceChip}>Branding</span>
                <span className={styles.serviceChip}>Research</span>
              </div>
            </button>

            <button
              aria-pressed={activeService === "growth"}
              className={`${styles.serviceCard} ${styles.serviceCardButton} ${activeService === "growth" ? styles.serviceCardFeatured : ""}`}
              type="button"
              onClick={() => setActiveService("growth")}
            >
              <span className={styles.serviceIcon}>
                <BrushIcon />
              </span>
              <h3 className={styles.serviceTitle}>Profile Growth</h3>
              <p className={styles.serviceText}>
                Sharper portfolio structure, stronger personal branding, and a profile flow that turns visits into leads.
              </p>
              <div className={styles.chipRow}>
                <span className={styles.serviceChip}>Portfolio</span>
                <span className={styles.serviceChip}>Personal Brand</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className={`${styles.container} ${styles.ctaBlock}`}>
        <div className={styles.contactPanel}>
          <div className={styles.contactInfo}>
            <span className={styles.blockEyebrow}>Collaboration</span>
            <h2 className={styles.contactTitle}>Let's work together.</h2>
            <p className={styles.contactText}>
              C-Work is ready for new freelancers, active employers, and teams that want a cleaner way to connect skill
              with opportunity.
            </p>
            <div className={styles.contactMeta}>
              <div className={styles.metaRow}>
                <MailIcon />
                <span>hello@cwork.mn</span>
              </div>
              <div className={styles.metaRow}>
                <MapPinIcon />
                <span>Remote / Ulaanbaatar, Mongolia</span>
              </div>
            </div>
          </div>

          <div className={styles.contactFormCard}>
            <form className={styles.form}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Name</span>
                <input className={styles.fieldInput} placeholder="Your name" />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Email</span>
                <input className={styles.fieldInput} placeholder="name@example.com" type="email" />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Project Details</span>
                <textarea className={styles.fieldTextarea} placeholder="Tell us about your hiring or freelance goal..." />
              </label>
              <button className={styles.ctaButton} type="button">
                Send Inquiry
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export function CWorkMarketingSite({ marqueeCompanies = [] }: { marqueeCompanies?: MarqueeCompany[] }) {
  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <HomePage marqueeCompanies={marqueeCompanies} />
      </main>
    </div>
  );
}

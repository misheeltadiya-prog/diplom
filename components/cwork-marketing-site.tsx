"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import styles from "./cwork-marketing-site.module.css";

type PageName = "home" | "services" | "contact";

type SiteProps = {
  page: PageName;
};

type NavProps = {
  page: PageName;
};

type ServiceCardName = "visibility" | "hiring" | "strategy";

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

function Navbar({ page }: NavProps) {
  return (
    <div className={styles.navWrap}>
      <div className={styles.container}>
        <nav className={styles.navBar}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark}>
              <Image alt="C-Work logo" height={24} src="/c-work-logo.svg" width={24} />
            </span>
            <span>C-Work</span>
          </Link>

          <div className={styles.navLinks}>
            <Link className={`${styles.navLink} ${page === "home" ? styles.navLinkActive : ""}`} href="/">
              Work
            </Link>
            <Link className={`${styles.navLink} ${page === "services" ? styles.navLinkActive : ""}`} href="/services">
              Services
            </Link>
            <Link className={`${styles.navLink} ${page === "contact" ? styles.navLinkActive : ""}`} href="/contact">
              Contact
            </Link>
          </div>

          <Link className={styles.navButton} href="/register">
            Get started
          </Link>
        </nav>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerInner}`}>
        <div className={styles.brand}>C-Work</div>
        <div className={styles.footerLinks}>
          <Link href="/jobs">Jobs</Link>
          <Link href="/services">Services</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div className={styles.footerMeta}>(c) 2026 C-WORK. BUILT FOR FREELANCERS AND MODERN TEAMS.</div>
      </div>
    </footer>
  );
}

function HomePage() {
  const [activeService, setActiveService] = useState<ServiceCardName>("hiring");

  return (
    <>
      <div className={`${styles.container} ${styles.hero}`}>
        <div className={styles.heroCopy}>
          <div className={styles.badge}>
            <BadgeCheckIcon />
            <span>Available for new projects</span>
          </div>
          <h1 className={styles.heroTitle}>
            Elevating Your <span className={styles.heroTitleAccent}>Freelance Presence</span>
          </h1>
          <p className={styles.heroText}>
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

      <div className={styles.contentBlock}>
        <div className={styles.container}>
          <div className={styles.blockHead}>
            <h2 className={styles.blockTitle}>Precision Services</h2>
            <p className={styles.blockSubtitle}>
              Focused on quality over noise, C-Work helps ambitious freelancers and growing teams move faster with
              better digital presentation and clearer opportunity flow.
            </p>
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

function ServicesPage() {
  return (
    <>
      <header className={`${styles.container} ${styles.servicesHero}`}>
        <div className={styles.servicesHeroInner}>
          <span className={styles.pill}>Capabilities</span>
          <h1 className={styles.heroTitle}>Specialized in elevating freelance experiences.</h1>
          <p className={styles.heroText}>
            C-Work helps brands, teams, and independent professionals stand out through clear positioning, polished UI,
            and a practical workflow built around real hiring needs.
          </p>
        </div>
      </header>

      <div className={`${styles.container} ${styles.servicesGrid}`}>
        <article className={`${styles.serviceCard} ${styles.serviceWide}`}>
          <span className={styles.serviceIcon}>
            <BrushIcon />
          </span>
          <h3 className={styles.serviceTitle}>Freelancer Experience Design</h3>
          <p className={styles.serviceText}>
            Clear profile structures, visible strengths, and thoughtful presentation that help skilled people convert
            profile views into meaningful work opportunities.
          </p>
          <div className={styles.chipRow}>
            <span className={styles.serviceChip}>Research</span>
            <span className={styles.serviceChip}>Profiles</span>
            <span className={styles.serviceChip}>Positioning</span>
          </div>
        </article>

        <article className={`${styles.serviceCard} ${styles.serviceNarrow}`}>
          <span className={styles.serviceIcon}>
            <CodeIcon />
          </span>
          <h3 className={styles.serviceTitle}>Job Discovery</h3>
          <p className={styles.serviceText}>
            Responsive listings, smooth filtering, and clean browsing patterns built for fast decision-making.
          </p>
          <ul className={styles.serviceList}>
            <li>
              <CheckCircleIcon />
              Responsive layouts
            </li>
            <li>
              <CheckCircleIcon />
              Fast search flow
            </li>
            <li>
              <CheckCircleIcon />
              Better visibility
            </li>
          </ul>
        </article>

        <article className={`${styles.serviceCard} ${styles.serviceNarrow}`}>
          <span className={styles.serviceIcon}>
            <SparklesIcon />
          </span>
          <h3 className={styles.serviceTitle}>Employer Presence</h3>
          <p className={styles.serviceText}>
            Company cards, trust signals, and hiring clarity that make roles feel credible and easier to respond to.
          </p>
          <div className={styles.visualBox}>
            <img
              alt="Employer presence"
              className={styles.contactImage}
              src="https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=900"
            />
          </div>
        </article>

        <article className={styles.serviceSplit}>
          <div className={styles.serviceSplitText}>
            <h3 className={styles.serviceTitle}>Strategy and consulting</h3>
            <p>
              Beyond surface-level visuals, C-Work can be positioned as a hiring-focused product that supports digital
              growth, recruitment confidence, and long-term platform credibility.
            </p>
            <Link className={styles.panelButton} href="/contact">
              Schedule a consultation
            </Link>
          </div>
          <div className={styles.visualBox}>
            <img
              alt="Strategy workspace"
              className={styles.contactImage}
              src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=900"
            />
          </div>
        </article>
      </div>

      <div className={styles.processArea}>
        <div className={styles.container}>
          <div className={styles.blockHead}>
            <h2 className={styles.blockTitle}>The Creative Process</h2>
            <p className={styles.blockSubtitle}>A systematic approach to shaping strong digital hiring experiences.</p>
          </div>
          <div className={styles.processGrid}>
            {[
              { id: "01", title: "Discovery", desc: "Understand the audience, goals, and friction points." },
              { id: "02", title: "Ideation", desc: "Map concepts and define the best journey for users." },
              { id: "03", title: "Design", desc: "Turn strategy into refined visual systems and flows." },
              { id: "04", title: "Launch", desc: "Ship, test, and improve based on how people actually use it." },
            ].map((step) => (
              <article className={styles.processCard} key={step.id}>
                <div className={styles.processStep}>{step.id}</div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function ContactPage() {
  return (
    <div className={`${styles.container} ${styles.contactPage}`}>
      <div className={styles.blockHead}>
        <span className={styles.blockEyebrow}>Collaboration</span>
        <h1 className={styles.heroTitle}>Let's work together.</h1>
        <p className={styles.heroText}>
          Whether you are hiring freelancers, building a stronger public-facing platform, or refining user flow, C-Work
          can help make the experience feel clear and premium.
        </p>
      </div>

      <div className={styles.quoteGrid}>
        <article className={styles.quoteCard}>
          <p className={styles.quoteText}>"C-Work helped make our hiring flow feel far more intentional and usable."</p>
          <strong className={styles.quoteRole}>Employer team</strong>
        </article>
        <article className={styles.quoteCard}>
          <p className={styles.quoteText}>"The platform feels cleaner, more premium, and easier to trust."</p>
          <strong className={styles.quoteRole}>Freelancer user</strong>
        </article>
      </div>

      <div className={styles.contactTwoCol}>
        <div className={styles.contactFormCard}>
          <form className={styles.form}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Name</span>
              <input className={styles.fieldInput} placeholder="John Doe" />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Email</span>
              <input className={styles.fieldInput} placeholder="john@example.com" type="email" />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Project Details</span>
              <textarea className={styles.fieldTextarea} placeholder="Tell me about your project..." />
            </label>
            <button className={styles.ctaButton} type="button">
              Send Inquiry
            </button>
          </form>
        </div>

        <aside className={styles.contactAside}>
          <div className={styles.miniCard}>
            <h3>Direct contact</h3>
            <p>hello@cwork.mn</p>
          </div>
          <div className={styles.miniCard}>
            <h3>Location</h3>
            <p>Remote / Ulaanbaatar, Mongolia</p>
          </div>
          <div className={styles.miniCard}>
            <h3>Best for</h3>
            <p>Freelancer growth, employer discovery, and premium landing experiences.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function CWorkMarketingSite({ page }: SiteProps) {
  return (
    <div className={styles.page}>
      <Navbar page={page} />
      <main className={styles.main}>
        {page === "home" ? <HomePage /> : null}
        {page === "services" ? <ServicesPage /> : null}
        {page === "contact" ? <ContactPage /> : null}
      </main>
      <Footer />
    </div>
  );
}

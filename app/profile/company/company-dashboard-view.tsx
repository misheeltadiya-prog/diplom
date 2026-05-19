import { CompanyProfileForm } from "./company-profile-form";
import { CompanyJobsPanel } from "./company-jobs-panel";
import styles from "../profile.module.css";

function IconFeed() {
  return (
    <svg aria-hidden fill="none" viewBox="0 0 24 24" width="20" height="20">
      <path
        d="M4 11a9 9 0 0 1 9 9M4 5a15 15 0 0 1 15 15M6 19h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPeople() {
  return (
    <svg aria-hidden fill="none" viewBox="0 0 24 24" width="22" height="22">
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 10v-2a4 4 0 0 0-3-3.87M17 11a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type CompanyDashboardViewProps = {
  userId: number;
};

export function CompanyDashboardView({ userId }: CompanyDashboardViewProps) {
  return (
    <div className={styles.companyDashboard}>
      <div className={styles.companyDashboardMain}>
        <section className={`${styles.sectionCard} ${styles.companyOnboardingCard}`} id="company-general">
          <div className={styles.companyOnboardingHero}>
            <h1 className={styles.companyOnboardingPageTitle}>Компанийн танилцуулга</h1>
          </div>
          <h2 className={styles.companyOnboardingFormHeading}>Ерөнхий мэдээлэл</h2>
          <CompanyProfileForm />
        </section>

        <div className={styles.companyDashboardRow2}>
          <CompanyJobsPanel userId={userId} />

          <section className={styles.companyCulturePanel} id="company-culture" aria-labelledby="company-culture-heading">
            <div className={styles.companyPanelHead}>
              <h3 id="company-culture-heading" className={styles.companyPanelTitle}>
                <span className={styles.companyPanelTitleIcon} aria-hidden>
                  <IconPeople />
                </span>
                Соёл &amp; эрхэм зорилго
              </h3>
            </div>
            <p className={styles.companyCultureBody}>
              Бид инновац, ил тод харилцаа, багийн амжилтыг эрхэмлэдэг. Зорилго: Монголын дижитал ажил мэргэжлийн
              талбарт тогтвортой үнэ цэнийг бий болгох.
            </p>
          </section>
        </div>

        <section className={styles.companyNewsSection} id="company-news" aria-labelledby="company-news-heading">
          <div className={styles.companyNewsHead}>
            <h3 id="company-news-heading" className={styles.companyNewsTitle}>
              <span className={styles.companyPanelTitleIcon} aria-hidden>
                <IconFeed />
              </span>
              Мэдээ мэдээлэл
            </h3>
          </div>
          <div className={styles.companyNewsGrid}>
            <article className={styles.companyNewsCard}>
              <div className={`${styles.companyNewsThumb} ${styles.companyNewsThumbA}`} />
              <span className={styles.companyNewsTag}>Технологи</span>
              <h4 className={styles.companyNewsCardTitle}>Дижитал төлбөрийн шинэ боломжууд</h4>
              <time className={styles.companyNewsDate} dateTime="2026-05-01">
                2026.05.01
              </time>
            </article>
            <article className={styles.companyNewsCard}>
              <div className={`${styles.companyNewsThumb} ${styles.companyNewsThumbB}`} />
              <span className={styles.companyNewsTag}>Эвент</span>
              <h4 className={styles.companyNewsCardTitle}>C-Work Meetup 2026</h4>
              <time className={styles.companyNewsDate} dateTime="2026-04-18">
                2026.04.18
              </time>
            </article>
            <article className={styles.companyNewsCard}>
              <div className={`${styles.companyNewsThumb} ${styles.companyNewsThumbC}`} />
              <span className={styles.companyNewsTag}>Судалгаа</span>
              <h4 className={styles.companyNewsCardTitle}>Freelance зах зээлийн тойм</h4>
              <time className={styles.companyNewsDate} dateTime="2026-04-02">
                2026.04.02
              </time>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}

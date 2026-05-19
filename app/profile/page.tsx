import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyApplicationDashboardStats } from "@/lib/company-application-stats";
import { getOfferDashboardStats } from "@/lib/job-offers-stats";
import { calculateCvCompletion, getCvProfileOrDefault } from "@/lib/profile-cv";
import { getJobPosts } from "@/lib/portal-data";
import { OffersPanel } from "./offers-panel";
import styles from "./profile.module.css";

function firstName(fullName: string) {
  return fullName.split(/\s+/).filter(Boolean)[0] ?? fullName;
}

function formatTimeAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} минутын өмнө`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs} цагийн өмнө`;
  const days = Math.floor(hrs / 24);
  return `${days} өдрийн өмнө`;
}

function jobTagPills(job: { employmentType: string; location: string }) {
  const tags = [job.employmentType].filter(Boolean);
  if (/remote|алсаас|remote/i.test(job.location)) {
    tags.push("REMOTE");
  }
  return tags;
}

export default async function ProfileIndexPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <section className={styles.sectionCard}>
        <h1 className={styles.sectionTitle}>Sign in to view your profile overview</h1>
      </section>
    );
  }

  const profile = await getCvProfileOrDefault(currentUser);
  const jobs = (await getJobPosts()).slice(0, 5);
  const offerStats = await getOfferDashboardStats(currentUser);
  const applicationStats =
    currentUser.role === "company" ? await getCompanyApplicationDashboardStats(currentUser) : null;
  const cvCompletion = calculateCvCompletion(profile);
  const todayLabel = new Intl.DateTimeFormat("mn-MN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const dashName = profile.fullName || currentUser.fullName || "Хэрэглэгч";

  return (
    <>
      <div className={styles.dashboardGreeting}>
        <div>
          <h1 className={styles.dashboardGreetingTitle}>Сайн байна уу, {firstName(dashName)}!</h1>
          <p className={styles.dashboardGreetingDate}>{todayLabel}</p>
        </div>
        <div className={styles.dashboardGreetingActions}>
          <Link href="/profile/cv/view" className={styles.dashboardBtnGhost}>
            CV харах
          </Link>
          <Link href="/profile/cv" className={styles.dashboardBtnPrimary}>
            CV шинэчлэх
          </Link>
        </div>
      </div>

      <section
        className={styles.dashboardStatRow}
        aria-label={
          currentUser.role === "company" ? "Ирсэн өргөдлийн статистик" : "Ажлын саналын статистик"
        }
      >
        {currentUser.role === "company" && applicationStats ? (
          <>
            <article className={styles.dashboardStatCard}>
              <div className={styles.dashboardStatCardTop}>
                <span className={styles.dashboardStatLabel}>Бүх өргөдөл</span>
                <span className={`${styles.dashboardStatIcon} ${styles.dashboardStatIconViolet}`} aria-hidden>
                  ◆
                </span>
              </div>
              <span className={styles.dashboardStatValue}>{applicationStats.total}</span>
              <span className={styles.dashboardStatMeta}>Нийт ирсэн өргөдөл</span>
            </article>
            <article className={styles.dashboardStatCard}>
              <div className={styles.dashboardStatCardTop}>
                <span className={styles.dashboardStatLabel}>Хүлээгдэж буй</span>
                <span className={`${styles.dashboardStatIcon} ${styles.dashboardStatIconAmber}`} aria-hidden>
                  ◆
                </span>
              </div>
              <span className={styles.dashboardStatValue}>{applicationStats.pending}</span>
              <span className={styles.dashboardStatMeta}>Шийдвэр хүлээж байна</span>
            </article>
            <article className={styles.dashboardStatCard}>
              <div className={styles.dashboardStatCardTop}>
                <span className={styles.dashboardStatLabel}>Хүлээн авсан</span>
                <span className={`${styles.dashboardStatIcon} ${styles.dashboardStatIconGreen}`} aria-hidden>
                  ◆
                </span>
              </div>
              <span className={styles.dashboardStatValue}>{applicationStats.accepted}</span>
              <span className={styles.dashboardStatMeta}>Баталгаажсан</span>
            </article>
            <article className={styles.dashboardStatCard}>
              <div className={styles.dashboardStatCardTop}>
                <span className={styles.dashboardStatLabel}>Татгалзсан</span>
                <span className={`${styles.dashboardStatIcon} ${styles.dashboardStatIconRose}`} aria-hidden>
                  ◆
                </span>
              </div>
              <span className={styles.dashboardStatValue}>{applicationStats.rejected}</span>
              <span className={styles.dashboardStatMeta}>Татгалзсан өргөдөл</span>
            </article>
          </>
        ) : (
          <>
            <article className={styles.dashboardStatCard}>
              <div className={styles.dashboardStatCardTop}>
                <span className={styles.dashboardStatLabel}>Бүх санал</span>
                <span className={`${styles.dashboardStatIcon} ${styles.dashboardStatIconViolet}`} aria-hidden>
                  ◆
                </span>
              </div>
              <span className={styles.dashboardStatValue}>{offerStats.total}</span>
              <span className={styles.dashboardStatMeta}>
                {currentUser.role === "freelancer" ? "Танд ирсэн санал" : "Саналын нийт тоо"}
              </span>
            </article>
            <article className={styles.dashboardStatCard}>
              <div className={styles.dashboardStatCardTop}>
                <span className={styles.dashboardStatLabel}>Хүлээн авсан</span>
                <span className={`${styles.dashboardStatIcon} ${styles.dashboardStatIconGreen}`} aria-hidden>
                  ◆
                </span>
              </div>
              <span className={styles.dashboardStatValue}>{offerStats.accepted}</span>
              <span className={styles.dashboardStatMeta}>Зөвшөөрсөн</span>
            </article>
            <article className={styles.dashboardStatCard}>
              <div className={styles.dashboardStatCardTop}>
                <span className={styles.dashboardStatLabel}>Дууссан</span>
                <span className={`${styles.dashboardStatIcon} ${styles.dashboardStatIconRose}`} aria-hidden>
                  ◆
                </span>
              </div>
              <span className={styles.dashboardStatValue}>{offerStats.rejectedOrCancelled}</span>
              <span className={styles.dashboardStatMeta}>Татгалзсан / цуцалсан</span>
            </article>
            <article className={styles.dashboardStatCard}>
              <div className={styles.dashboardStatCardTop}>
                <span className={styles.dashboardStatLabel}>Профайл бөглөлт</span>
                <span className={`${styles.dashboardStatIcon} ${styles.dashboardStatIconAmber}`} aria-hidden>
                  ◆
                </span>
              </div>
              <span className={styles.dashboardStatValue}>{cvCompletion}%</span>
              <span className={styles.dashboardStatMeta}>CV-ийн бөглөлтийн хувь</span>
            </article>
          </>
        )}
      </section>

      <div className={styles.dashboardBody}>
        <div className={styles.dashboardBodyMain}>
          {currentUser.role === "freelancer" || currentUser.role === "company" ? (
            <section className={styles.dashboardPanel} id="offers-panel">
              <div className={styles.dashboardPanelHead}>
                <h2 className={styles.dashboardPanelTitle}>
                  {currentUser.role === "freelancer" ? "Ирсэн ажлын санал" : "Илгээсэн санал"}
                </h2>
              </div>
              <OffersPanel mode={currentUser.role === "freelancer" ? "freelancer" : "company"} />
            </section>
          ) : null}

          <section className={styles.dashboardPanel}>
            <div className={styles.dashboardPanelHead}>
              <h2 className={styles.dashboardPanelTitle}>Сүүлийн боломжууд</h2>
              <Link href="/jobs" className={styles.dashboardViewAll}>
                Бүгдийг харах
              </Link>
            </div>

            <div className={styles.dashboardJobList}>
              {jobs.length > 0 ? (
                jobs.map((job) => {
                  const logoLetter = (job.companyName || "?").trim().charAt(0).toUpperCase();
                  const tags = jobTagPills(job);
                  return (
                    <article className={styles.dashboardJobRow} key={job.id}>
                      <div className={styles.dashboardJobLogo} aria-hidden>
                        {logoLetter}
                      </div>
                      <div className={styles.dashboardJobMain}>
                        <strong className={styles.dashboardJobTitle}>{job.title}</strong>
                        <span className={styles.dashboardJobMeta}>
                          {job.companyName} · {job.location}
                        </span>
                        <div className={styles.dashboardJobTags}>
                          {tags.map((t) => (
                            <span className={styles.dashboardJobTag} key={t}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={styles.dashboardJobAside}>
                        <span className={styles.dashboardJobSalary}>{job.salary}</span>
                        <span className={styles.dashboardJobAgo}>{formatTimeAgo(job.createdAt)}</span>
                        <Link href="/jobs" className={styles.dashboardJobCta}>
                          Дэлгэрэнгүй
                        </Link>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className={styles.dashboardEmpty}>Одоогоор санал болгож чадахгүй байна.</div>
              )}
            </div>
          </section>
        </div>

        <aside className={styles.dashboardRail} aria-label="Профайл тойм">
          {currentUser.role === "freelancer" ? (
            <section className={styles.dashboardRailCard}>
              <div className={styles.dashboardRailCardHead}>
                <h3 className={styles.dashboardRailTitle}>CV-ийн төлөв</h3>
                <Link href="/profile/cv" className={styles.dashboardRailEdit} aria-label="CV засах">
                  ✎
                </Link>
              </div>
              <p className={styles.dashboardRailHeadline}>
                <span className={styles.dashboardRailKicker}>HEADLINE</span>
                {profile.headline?.trim() || "—"}
              </p>
              <span
                className={`${styles.dashboardStatusPill} ${
                  profile.availability?.trim() ? styles.dashboardStatusPillOk : ""
                }`}
              >
                {profile.availability?.trim() || "Төлөв нэмээгүй"}
              </span>
              <div className={styles.dashboardRailProgressLabel}>Профайл бөглөлт</div>
              <div className={styles.dashboardRailProgressBar}>
                <div className={styles.dashboardRailProgressValue} style={{ width: `${cvCompletion}%` }} />
              </div>
              <div className={styles.dashboardRailProgressPct}>{cvCompletion}%</div>
            </section>
          ) : currentUser.role === "company" ? (
            <section className={styles.dashboardRailCard}>
              <div className={styles.dashboardRailCardHead}>
                <h3 className={styles.dashboardRailTitle}>Компани</h3>
                <Link href="/profile/company" className={styles.dashboardRailEdit} aria-label="Засах">
                  ✎
                </Link>
              </div>
              <p className={styles.dashboardRailHeadline}>
                <span className={styles.dashboardRailKicker}>Профайл</span>
                {dashName}
              </p>
              <span className={styles.dashboardStatusPill}>
                Хүлээгдэж буй өргөдөл: {applicationStats?.pending ?? 0}
              </span>
              <Link href="/profile/analytics" className={styles.dashboardViewAll} style={{ marginTop: 12, display: "inline-block" }}>
                Analytics → өргөдөл харах
              </Link>
            </section>
          ) : (
            <section className={styles.dashboardRailCard}>
              <div className={styles.dashboardRailCardHead}>
                <h3 className={styles.dashboardRailTitle}>Профайл</h3>
                <Link href="/profile/settings" className={styles.dashboardRailEdit} aria-label="Тохиргоо">
                  ✎
                </Link>
              </div>
              <p className={styles.muted} style={{ margin: 0 }}>
                Тохиргоо, зураг өөрчлөх
              </p>
            </section>
          )}

          <section className={styles.dashboardRailCard}>
            <h3 className={styles.dashboardRailTitle}>Байршил</h3>
            <div className={styles.dashboardMapPlaceholder}>
              <span className={styles.dashboardMapPin} aria-hidden>
                📍
              </span>
              <span>{profile.location?.trim() || "Улаанбаатар (тохируулаагүй)"}</span>
            </div>
          </section>

          <section className={`${styles.dashboardRailCard} ${styles.dashboardRailOffers}`}>
            <h3 className={styles.dashboardRailTitle}>Шинэ санал</h3>
            {currentUser.role === "freelancer" && offerStats.total === 0 ? (
              <div className={styles.dashboardOffersEmpty}>
                <span className={styles.dashboardOffersEmptyIcon} aria-hidden>
                  📄
                </span>
                <p>Шинэ санал ирээгүй байна.</p>
              </div>
            ) : (
              <p className={styles.dashboardOffersHint}>
                {currentUser.role === "freelancer"
                  ? `Нийт ирсэн санал: ${offerStats.total}. Дэлгэрэнгүйг зүүн талын хэсгээс үзнэ үү.`
                  : "Саналын жагсаалтыг гол хэсгээс харна уу."}
              </p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

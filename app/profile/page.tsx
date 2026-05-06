import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyApplicationDashboardStats } from "@/lib/company-application-stats";
import { getOfferDashboardStats } from "@/lib/job-offers-stats";
import { getCvProfileOrDefault } from "@/lib/profile-cv";
import { getJobPosts } from "@/lib/portal-data";
import { BackButton } from "./back-button";
import { CompanyApplicationsPanel } from "./company-applications-panel";
import { OffersPanel } from "./offers-panel";
import styles from "./profile.module.css";

function formatDateLabel(value: string | null) {
  if (!value) {
    return "Not updated yet";
  }

  return new Intl.DateTimeFormat("mn-MN", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
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
  const initials = getInitials(profile.fullName || "CW");
  const avatarUrl = currentUser.avatarUrl?.trim();

  return (
    <div className={styles.overviewPage}>
      <section className={styles.overviewTopbar}>
        <div>
          <span className={styles.heroEyebrow}>Profile</span>
          <h1 className={styles.overviewTitle}>
            {currentUser.role === "company" ? "Компанийн профайл" : "Миний профайл"}
          </h1>
        </div>

        <div className={styles.overviewTopActions}>
          <BackButton />
        </div>
      </section>

      <section className={styles.overviewShell}>
        <article className={styles.overviewProfileCard}>
          <div className={styles.overviewProfileAvatar}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className={styles.overviewProfileAvatarImg}
                height={112}
                src={avatarUrl}
                width={112}
              />
            ) : (
              initials
            )}
          </div>
          <h2 className={styles.overviewProfileName}>{profile.fullName}</h2>
          <span className={styles.overviewProfileChip}>
            <span className={styles.overviewRoleSlug}>{currentUser.role}</span>
            {profile.preferredRole?.trim() ? ` · ${profile.preferredRole.trim()}` : ""}
          </span>

          <div className={styles.overviewQuickLinks}>
            <Link className={styles.chip} href="/profile/settings">
              Зураг &amp; тохиргоо
            </Link>
            <Link className={styles.chip} href="/profile/upgrade">
              Upgrade / Subscription
            </Link>
            {currentUser.role === "company" ? (
              <Link className={styles.chip} href="/profile/company">
                Компанийн мэдээлэл
              </Link>
            ) : null}
            {currentUser.role === "company" ? (
              <Link className={styles.chip} href="/profile#company-applications">
                Ирсэн өргөдлүүд
                {applicationStats && applicationStats.pending > 0 ? (
                  <span className={styles.chipPendingDot} title="Шийдвэр хүлээж буй өргөдөл">
                    {applicationStats.pending > 99 ? "99+" : applicationStats.pending}
                  </span>
                ) : null}
              </Link>
            ) : null}
            {currentUser.role === "freelancer" ? (
              <Link className={styles.chip} href="/profile/publish">
                Portfolio &amp; жагсаалт
              </Link>
            ) : null}
          </div>

          <div className={styles.overviewInfoStack}>
            <div className={styles.overviewInfoItem}>
              <span>Эрх (role)</span>
              <strong className={styles.overviewRoleValue}>{currentUser.role}</strong>
            </div>
            <div className={styles.overviewInfoItem}>
              <span>Email</span>
              <strong>{profile.email}</strong>
            </div>
            <div className={styles.overviewInfoItem}>
              <span>Phone</span>
              <strong>{profile.phone || "Not added"}</strong>
            </div>
            <div className={styles.overviewInfoItem}>
              <span>Location</span>
              <strong>{profile.location || "Not added"}</strong>
            </div>
          </div>
        </article>

        <div className={styles.overviewContentStack}>
          {currentUser.role === "company" ? <CompanyApplicationsPanel /> : null}

          {currentUser.role === "freelancer" || currentUser.role === "company" ? (
            <section className={styles.overviewPanel} id="offers-panel">
              <div className={styles.overviewPanelHead}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    {currentUser.role === "freelancer" ? "Ирсэн ажлын санал" : "Илгээсэн санал"}
                  </h2>
                </div>
              </div>
              <OffersPanel mode={currentUser.role === "freelancer" ? "freelancer" : "company"} />
            </section>
          ) : null}

          <section
            className={styles.overviewBookingGrid}
            aria-label={
              currentUser.role === "company" ? "Ирсэн өргөдлийн статистик" : "Ажлын саналын статистик"
            }
          >
            {currentUser.role === "company" && applicationStats ? (
              <>
                <article className={styles.overviewStatCard}>
                  <span className={styles.overviewStatValue}>{applicationStats.total}</span>
                  <span className={styles.overviewStatLabel}>Бүх өргөдөл</span>
                  <span className={styles.overviewStatMeta}>
                    Таны бүх ажлын зар дээр ирсэн өргөдлийн нийт тоо (хүлээгдэж буй, хүлээн авсан, татгалзсан).
                  </span>
                </article>
                <article className={styles.overviewStatCard}>
                  <span className={styles.overviewStatValue}>{applicationStats.accepted}</span>
                  <span className={styles.overviewStatLabel}>Хүлээн авсан</span>
                  <span className={styles.overviewStatMeta}>
                    Та &quot;Хүлээн авах&quot; товчоор баталгаажуулсан өргөдлүүд — бүх заруудаас нэгтгэн тоологдоно.
                  </span>
                </article>
                <article className={styles.overviewStatCard}>
                  <span className={styles.overviewStatValue}>{applicationStats.rejected}</span>
                  <span className={styles.overviewStatLabel}>Татгалзсан</span>
                  <span className={styles.overviewStatMeta}>
                    &quot;Татгалзах&quot; сонгосон өргөдлүүд. Хүлээгдэж буй: {applicationStats.pending}.
                  </span>
                </article>
              </>
            ) : (
              <>
                <article className={styles.overviewStatCard}>
                  <span className={styles.overviewStatValue}>{offerStats.total}</span>
                  <span className={styles.overviewStatLabel}>Бүх санал</span>
                  <span className={styles.overviewStatMeta}>
                    {currentUser.role === "freelancer"
                      ? "Танд ирсэн бүх ажлын санал (өгөгдлийн санд хадгалагдсан)."
                      : "Freelancer эсвэл company эрхтэйд л санал тоологдоно."}
                  </span>
                </article>
                <article className={styles.overviewStatCard}>
                  <span className={styles.overviewStatValue}>{offerStats.accepted}</span>
                  <span className={styles.overviewStatLabel}>Хүлээн авсан</span>
                  <span className={styles.overviewStatMeta}>
                    Фрилансер саналыг зөвшөөрсөн (accepted) — DB-д шинэчлэгдсэн.
                  </span>
                </article>
                <article className={styles.overviewStatCard}>
                  <span className={styles.overviewStatValue}>{offerStats.rejectedOrCancelled}</span>
                  <span className={styles.overviewStatLabel}>Татгалзсан / цуцласан</span>
                  <span className={styles.overviewStatMeta}>
                    Татгалзсан (rejected) эсвэл компани цуцалсан (cancelled) — DB-д хадгалагдсан.
                  </span>
                </article>
              </>
            )}
          </section>

          <section className={styles.overviewPanel}>
            <div className={styles.overviewPanelHead}>
              <div>
                <h2 className={styles.sectionTitle}>CV Snapshot</h2>
              </div>
              <Link className={styles.chip} href="/profile/cv">
                Edit CV
              </Link>
            </div>

            <div className={styles.overviewSnapshotGrid}>
              <div className={styles.overviewSnapshotCard}>
                <span>Headline</span>
                <strong>{profile.headline || "Not added"}</strong>
              </div>
              <div className={styles.overviewSnapshotCard}>
                <span>Availability</span>
                <strong>{profile.availability || "Not added"}</strong>
              </div>
              <div className={styles.overviewSnapshotCard}>
                <span>Portfolio</span>
                <strong>{profile.portfolioUrl || "Not added"}</strong>
              </div>
              <div className={styles.overviewSnapshotCard}>
                <span>Updated</span>
                <strong>{formatDateLabel(profile.updatedAt)}</strong>
              </div>
            </div>
          </section>

          <section className={styles.overviewPanel}>
            <div className={styles.overviewPanelHead}>
              <div>
                <h2 className={styles.sectionTitle}>Recent Opportunities</h2>
              </div>
            </div>

            <div className={styles.overviewList}>
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <article className={styles.overviewListRow} key={job.id}>
                    <div className={styles.overviewListDate}>{new Date(job.createdAt).toLocaleDateString("en-CA")}</div>
                    <div className={styles.overviewListMeta}>
                      <strong>{job.title}</strong>
                      <span>
                        {job.companyName} | {job.location}
                      </span>
                    </div>
                    <div className={styles.overviewListStatus}>{job.employmentType}</div>
                    <div className={styles.overviewListValue}>{job.salary}</div>
                  </article>
                ))
              ) : (
                <div className={styles.emptyCard}>No suggested opportunities right now.</div>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

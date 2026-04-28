"use client";

import Image from "next/image";
import { landingCategories, type LandingCategory } from "./data";
import { type DisplayJob, type JobBoardStat, type JobBoardTab, type JobForm } from "./jobs-types";
import { avatarToneClasses, companyLogoUrl, findCompanyByName } from "./companies-directory";
import styles from "./index-landing.module.css";

const categoryMap = new Map(landingCategories.map((category) => [category.key, category]));

type JobCardProps = {
  job: DisplayJob;
  isEditing: boolean;
  favoriteJobIds: string[];
  editJob: JobForm;
  submitting: boolean;
  onToggleFavorite: (jobId: string) => void;
  onEditFieldChange: (update: JobForm) => void;
  onSaveEdit: (jobId: string) => void;
  onCancelEdit: () => void;
  onApplyClick: (job: DisplayJob) => void;
};

const tabLabels: Array<{ key: JobBoardTab; label: string; fallback: string }> = [
  { key: "all", label: "Бүх ажлууд", fallback: "500+" },
  { key: "remote", label: "Remote ажлууд", fallback: "200+" },
  { key: "full-time", label: "Бүтэн цагийн", fallback: "300+" },
  { key: "part-time", label: "Цагийн ажил", fallback: "120+" },
];

function BriefcaseIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M9 7V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 7h14v11.5H5V7Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M5 11.5h14" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function OfficeIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M7 20V5.5h10V20" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M10 9h1.5M10 12.5h1.5M10 16h1.5M14 9h1.5M14 12.5h1.5M14 16h1.5M5 20h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M9.5 11.2a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6ZM3.8 19.4c.5-3.2 2.7-5.1 5.7-5.1s5.2 1.9 5.7 5.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M16.1 11.5a2.7 2.7 0 1 0 0-5.4M16.8 14.4c2 .5 3.1 2.1 3.4 4.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function ScheduleIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8.25v4.5l3 1.75" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 20s6-4.5 6-9a6 6 0 1 0-12 0c0 4.5 6 9 6 9Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="11" r="2.1" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Шинэ";

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 2) return "Дөнгөж нийтлэгдсэн";
  if (diffMins < 60) return `${diffMins} мин өмнө`;
  if (diffHours < 24) return `${diffHours} цаг өмнө`;
  if (diffDays < 7) return `${diffDays} өдөр өмнө`;
  return new Intl.DateTimeFormat("mn-MN", { month: "short", day: "numeric" }).format(date);
}

function isNewJob(source: string, createdAt: string) {
  if (source !== "database") return false;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() < 6 * 60 * 60 * 1000;
}

function getEmploymentTypeBadgeClass(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("remote")) return styles.badgeRemote;
  if (normalized.includes("бүтэн") || normalized.includes("full")) return styles.badgeFullTime;
  if (normalized.includes("цагийн") || normalized.includes("part")) return styles.badgePartTime;
  if (normalized.includes("гэрээ") || normalized.includes("contract")) return styles.badgeContract;
  return styles.badgeDefault;
}

function formatEmploymentTypeLabel(value: string) {
  const normalized = value.toLowerCase();

  if (normalized.includes("remote")) {
    return "Remote";
  }

  if (normalized.includes("бүтэн") || normalized.includes("full")) {
    return "Бүтэн цагийн";
  }

  if (normalized.includes("цагийн") || normalized.includes("part") || normalized.includes("хагас")) {
    return "Цагийн ажил";
  }

  if (normalized.includes("гэрээ") || normalized.includes("contract")) {
    return "Гэрээт";
  }

  return value;
}

function getAccentClassName(category: LandingCategory) {
  return `${category.accent[0].toUpperCase()}${category.accent.slice(1)}`;
}

function SkeletonCard() {
  return (
    <div className={styles.jobCard}>
      <div className={styles.jobCardInner}>
        <div className={styles.jobCardHead}>
          <div className={styles.jobCardCompany}>
            <div className={`${styles.skeleton} ${styles.skeletonAvatar}`} />
            <div>
              <div className={`${styles.skeleton} ${styles.skeletonSubtitle}`} style={{ marginBottom: 7 }} />
              <div className={`${styles.skeleton} ${styles.skeletonBadge}`} />
            </div>
          </div>
        </div>
        <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
        <div className={styles.jobMetaRow}>
          <div className={`${styles.skeleton} ${styles.skeletonPill}`} />
          <div className={`${styles.skeleton} ${styles.skeletonPill}`} />
        </div>
        <div className={`${styles.skeleton} ${styles.skeletonDesc}`} />
      </div>
    </div>
  );
}

function TabButton({
  active,
  count,
  fallback,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  fallback: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={`${styles.cleanJobTab} ${active ? styles.cleanJobTabActive : ""}`} onClick={onClick} type="button">
      <span>{label}</span>
      <b>{count > 0 ? count : fallback}</b>
    </button>
  );
}

export function JobCard({
  job,
  isEditing,
  favoriteJobIds,
  editJob,
  submitting,
  onToggleFavorite,
  onEditFieldChange,
  onSaveEdit,
  onCancelEdit,
  onApplyClick,
}: JobCardProps) {
  const category = categoryMap.get(job.categoryKey) ?? landingCategories[0];
  const accent = getAccentClassName(category);
  const company = findCompanyByName(job.companyName);
  const toneKey = avatarToneClasses[(Math.abs(job.companyName.length) + job.id.length) % avatarToneClasses.length];
  const toneClass = styles[toneKey];

  return (
    <article className={`${styles.jobCard} ${styles[`jobCard${accent}`]}`}>
      {isEditing ? (
        <div className={styles.jobsEditWrap}>
          <div className={styles.jobsFormRow}>
            <input
              onChange={(event) => onEditFieldChange({ ...editJob, title: event.target.value })}
              required
              value={editJob.title}
            />
            <input
              onChange={(event) => onEditFieldChange({ ...editJob, companyName: event.target.value })}
              required
              value={editJob.companyName}
            />
          </div>
          <div className={styles.jobsFormRow}>
            <input
              onChange={(event) => onEditFieldChange({ ...editJob, location: event.target.value })}
              required
              value={editJob.location}
            />
            <input
              onChange={(event) => onEditFieldChange({ ...editJob, salary: event.target.value })}
              required
              value={editJob.salary}
            />
          </div>
          <div className={styles.jobsFormRow}>
            <select
              onChange={(event) => onEditFieldChange({ ...editJob, employmentType: event.target.value })}
              value={editJob.employmentType}
            >
              <option>Бүтэн цаг</option>
              <option>Цагийн ажил</option>
              <option>Гэрээт</option>
              <option>Remote</option>
            </select>
            <div className={styles.jobActions}>
              <button disabled={submitting} onClick={() => void onSaveEdit(job.id)} type="button">
                Хадгалах
              </button>
              <button disabled={submitting} onClick={onCancelEdit} type="button">
                Болих
              </button>
            </div>
          </div>
          <textarea
            onChange={(event) => onEditFieldChange({ ...editJob, description: event.target.value })}
            required
            rows={4}
            value={editJob.description}
          />
        </div>
      ) : (
        <div className={styles.jobCardInner}>
          <div className={styles.jobCardHead}>
            <div className={styles.jobCardCompany}>
              <span className={`${styles.jobCompanyAvatar} ${toneClass || ""}`}>
                {company ? (
                  <img
                    alt={`${job.companyName} logo`}
                    className={styles.jobCompanyAvatarImage}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    src={companyLogoUrl(company.domain)}
                  />
                ) : (
                  <span>{job.companyName.slice(0, 1).toUpperCase()}</span>
                )}
              </span>
              <div className={styles.jobCardCompanyInfo}>
                <p className={styles.jobCompanyName}>{job.companyName}</p>
                <div className={styles.jobBadgeRow}>
                  <span className={`${styles.jobEmploymentBadge} ${getEmploymentTypeBadgeClass(job.employmentType)}`}>
                    {formatEmploymentTypeLabel(job.employmentType)}
                  </span>
                  {job.level !== "Mid" ? <span className={styles.jobLevelBadge}>{job.level}</span> : null}
                  {isNewJob(job.source, job.createdAt) ? <span className={styles.jobNewBadge}>Шинэ</span> : null}
                </div>
              </div>
            </div>
            <button
              aria-label="Save job"
              aria-pressed={favoriteJobIds.includes(job.id)}
              className={`${styles.jobFavorite} ${favoriteJobIds.includes(job.id) ? styles.jobFavoriteOn : ""}`}
              onClick={() => onToggleFavorite(job.id)}
              type="button"
            >
              <Image
                alt=""
                aria-hidden
                className={styles.jobFavoriteIcon}
                height={48}
                src={favoriteJobIds.includes(job.id) ? "/heart-favorite-on.svg" : "/heart-favorite.svg"}
                width={48}
              />
            </button>
          </div>

          <h3 className={styles.jobCardTitle}>{job.title}</h3>

          <div className={styles.jobMetaRow}>
            <div className={styles.jobMetaLocation}>
              <span className={styles.jobMetaIcon}><LocationIcon /></span>
              {job.location}
            </div>
            <div className={styles.jobMetaSchedule}>
              <span className={styles.jobMetaIcon}><ScheduleIcon /></span>
              {formatEmploymentTypeLabel(job.employmentType)}
            </div>
          </div>

          <p className={styles.jobDescription}>{job.description}</p>

          <div className={styles.jobCardFoot}>
            <div className={styles.marketSkillRow}>
              {job.tags.map((tag) => (
                <span className={styles.marketSkill} key={tag}>{tag}</span>
              ))}
            </div>
            <div className={styles.jobCardActions}>
              <span className={styles.jobSalaryPill}>{job.salary}</span>
              <span className={styles.jobApplicantCount}>
                <UsersIcon />
                {job.applicantCount} анкет
              </span>
              <button className={styles.jobApplyButton} onClick={() => onApplyClick(job)} type="button">
                Дэлгэрэнгүй
              </button>
            </div>
          </div>
          <div className={styles.jobPostedTime}>{formatRelativeTime(job.createdAt)}</div>
        </div>
      )}
    </article>
  );
}

type JobsListCardsProps = {
  activeTab: JobBoardTab;
  loading: boolean;
  filteredJobs: DisplayJob[];
  paginatedJobs: DisplayJob[];
  currentPage: number;
  totalPages: number;
  jobBoardStats: JobBoardStat[];
  tabCounts: Record<JobBoardTab, number>;
  favoriteJobIds: string[];
  editingId: string | null;
  editJob: JobForm;
  submitting: boolean;
  onToggleFavorite: (jobId: string) => void;
  onTabChange: (tab: JobBoardTab) => void;
  onPageChange: (page: number) => void;
  onEditFieldChange: (update: JobForm) => void;
  onSaveEdit: (jobId: string) => void;
  onCancelEdit: () => void;
  onApplyClick: (job: DisplayJob) => void;
};

export function JobsListCards({
  activeTab,
  loading,
  filteredJobs,
  paginatedJobs,
  currentPage,
  totalPages,
  jobBoardStats: _jobBoardStats,
  tabCounts,
  favoriteJobIds,
  editingId,
  editJob,
  submitting,
  onToggleFavorite,
  onTabChange,
  onPageChange,
  onEditFieldChange,
  onSaveEdit,
  onCancelEdit,
  onApplyClick,
}: JobsListCardsProps) {
  return (
    <div className={styles.jobsLayout}>
      <div className={styles.cleanJobsToolbar}>
        <div className={styles.cleanJobTabs} role="tablist" aria-label="Job filters">
          {tabLabels.map((tab) => (
            <TabButton
              active={activeTab === tab.key}
              count={tabCounts[tab.key]}
              fallback={tab.fallback}
              key={tab.key}
              label={tab.label}
              onClick={() => onTabChange(tab.key)}
            />
          ))}
        </div>
        <label className={styles.cleanJobsSort}>
          <select defaultValue="new">
            <option value="new">Шинэ эхэлсэн</option>
            <option value="salary">Цалин өндөр</option>
          </select>
        </label>
      </div>

      <div className={styles.jobsFeed}>
        <div className={styles.jobsList}>
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : null}

          {!loading && filteredJobs.length === 0 ? (
            <div className={styles.jobsEmptyState}>
              <div className={styles.jobsEmptyIcon}>
                <BriefcaseIcon />
              </div>
              <h3>Ажлын санал олдсонгүй</h3>
              <p>Шүүлтүүрт тохирох ажлын санал байхгүй байна. Хайлтаа өөрчилж дахин үзээрэй.</p>
            </div>
          ) : null}

          {paginatedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isEditing={editingId === job.id}
              favoriteJobIds={favoriteJobIds}
              editJob={editJob}
              submitting={submitting}
              onToggleFavorite={onToggleFavorite}
              onEditFieldChange={onEditFieldChange}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onApplyClick={onApplyClick}
            />
          ))}
        </div>

        {!loading && filteredJobs.length > 10 ? (
          <div className={styles.jobsPagination}>
            <button
              className={styles.jobsPaginationButton}
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              type="button"
            >
              Өмнөх
            </button>

            <div className={styles.jobsPaginationPages}>
              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    className={`${styles.jobsPaginationPage} ${page === currentPage ? styles.jobsPaginationPageActive : ""}`}
                    onClick={() => onPageChange(page)}
                    type="button"
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              className={styles.jobsPaginationButton}
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              type="button"
            >
              Дараах
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

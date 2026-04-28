"use client";

import Image from "next/image";
import { landingCategories, type LandingCategory, type LandingCategoryKey } from "./data";
import { type DisplayJob, type JobForm } from "./jobs-types";
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

function formatPostedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Шинэ";
  }

  return new Intl.DateTimeFormat("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatEmploymentTypeLabel(value: string) {
  const normalized = value.toLowerCase().replace(/\s+/g, " ").trim();

  if (normalized === "бүтэн цаг") {
    return "Бүтэн цагийн";
  }

  return value;
}

function getAccentClassName(category: LandingCategory) {
  return `${category.accent[0].toUpperCase()}${category.accent.slice(1)}`;
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
              <option>Хагас цаг</option>
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
        <>
          <div className={styles.jobCardTop}>
            <div className={styles.jobCardTopMain}>
              <div className={styles.jobCompanyWrap}>
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
                  ) : null}
                </span>
              </div>
              <div className={styles.jobTitleWrap}>
                <h3>{job.title}</h3>
                <p className={styles.jobCompanyName}>{job.companyName}</p>
              </div>
            </div>
            <button
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

          <div className={styles.jobMetaRow}>
            <div className={styles.jobSalaryPill}>{job.salary}</div>
            <div className={styles.jobMetaSchedule}>
              <span className={styles.jobMetaIcon}>
                <ScheduleIcon />
              </span>
              {formatEmploymentTypeLabel(job.employmentType)}
            </div>
            <div className={styles.jobMetaLocation}>
              <span className={styles.jobMetaIcon}>
                <LocationIcon />
              </span>
              {job.location}
            </div>
          </div>

          <div className={styles.jobFooter}>
            <div className={styles.jobPostedTime}>{formatPostedDate(job.createdAt)}</div>
            <div className={styles.jobFooterActions}>
              <button
                className={styles.jobApplyButton}
                onClick={() => onApplyClick(job)}
                type="button"
              >
                CV илгээх
              </button>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

type JobsListCardsProps = {
  loading: boolean;
  filteredJobs: DisplayJob[];
  paginatedJobs: DisplayJob[];
  currentPage: number;
  totalPages: number;
  favoriteJobIds: string[];
  editingId: string | null;
  editJob: JobForm;
  submitting: boolean;
  onToggleFavorite: (jobId: string) => void;
  onPageChange: (page: number) => void;
  onEditFieldChange: (update: JobForm) => void;
  onSaveEdit: (jobId: string) => void;
  onCancelEdit: () => void;
  onApplyClick: (job: DisplayJob) => void;
};

export function JobsListCards({
  loading,
  filteredJobs,
  paginatedJobs,
  currentPage,
  totalPages,
  favoriteJobIds,
  editingId,
  editJob,
  submitting,
  onToggleFavorite,
  onPageChange,
  onEditFieldChange,
  onSaveEdit,
  onCancelEdit,
  onApplyClick,
}: JobsListCardsProps) {
  return (
    <div className={styles.jobsLayout}>
      <div className={styles.jobsFeed}>
        <div className={styles.jobsList}>
          {loading ? <div className={styles.jobsEmpty}>Ажлын мэдээллүүдийг ачаалж байна...</div> : null}

          {!loading && filteredJobs.length === 0 ? (
            <div className={styles.jobsEmpty}>Энэ шүүлтүүрт тохирсон ажлын санал олдсонгүй.</div>
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

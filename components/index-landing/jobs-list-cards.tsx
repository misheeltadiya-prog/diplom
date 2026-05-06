"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { landingCategories } from "./data";
import { type DisplayJob, type JobForm, type JobRecord } from "./jobs-types";
import { avatarToneClasses, companyInitials, companyLogoUrl, findCompanyByName } from "./companies-directory";
import styles from "./index-landing.module.css";

const categoryMap = new Map(landingCategories.map((c) => [c.key, c]));

type ApplyModalProps = {
  job: DisplayJob;
  currentUser?: SessionUser | null;
  onClose: () => void;
  onSuccess: () => void;
};

function ApplyModal({ job, currentUser = null, onClose, onSuccess }: ApplyModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName ?? "");
      setEmail(currentUser.email ?? "");
      setPhone(currentUser.phone?.trim() ?? "");
    } else {
      setFullName("");
      setEmail("");
      setPhone("");
    }
    setCoverNote("");
    setCvFile(null);
    setError(null);
  }, [job.id, currentUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let cvFilePath = "";
      if (cvFile) {
        const fd = new FormData();
        fd.append("file", cvFile);
        const up = await fetch("/api/uploads/cv", { method: "POST", body: fd });
        const upJson = (await up.json()) as { ok?: boolean; cvFilePath?: string; error?: string };
        if (!up.ok || !upJson.cvFilePath) {
          setError(upJson.error ?? "CV upload amjiltgui.");
          setLoading(false);
          return;
        }
        cvFilePath = upJson.cvFilePath;
      }

      const res = await fetch(`/api/jobs/${job.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, coverNote, cvFilePath }),
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        setError(json.error ?? "Aldaa garlaa.");
        setLoading(false);
        return;
      }

      onSuccess();
    } catch {
      setError("Servertei holbogdohod aldaa garlaa.");
      setLoading(false);
    }
  }

  return (
    <div className={styles.applyOverlay} role="dialog" aria-modal="true">
      <div className={styles.applyPanel}>
        <button aria-label="Хаах" className={styles.applyCloseBtn} onClick={onClose} type="button">
          ×
        </button>

        <div className={styles.applyHeader}>
          <span className={styles.applyEyebrow}>Өргөдөл гаргах</span>
          <h2 className={styles.applyTitle}>{job.title}</h2>
          <p className={styles.applyCompany}>
            {job.companyName} · {job.location}
          </p>
          <p className={styles.applyHint}>
            Илгээсний дараа зар оруулсан компанид мэдэгдэл очно. Та профайлын &quot;Мэдэгдэл&quot;-ээс шалгана уу.
          </p>
        </div>

        <form className={styles.applyForm} noValidate onSubmit={handleSubmit}>
          <label className={styles.applyField}>
            <span className={styles.applyFieldLabel}>Бүтэн нэр</span>
            <input
              autoComplete="name"
              className={styles.applyInput}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Овог Нэр"
              required
              type="text"
              value={fullName}
            />
          </label>

          <label className={styles.applyField}>
            <span className={styles.applyFieldLabel}>И-мэйл</span>
            <input
              autoComplete="email"
              className={styles.applyInput}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              type="email"
              value={email}
            />
          </label>

          <label className={styles.applyField}>
            <span className={styles.applyFieldLabel}>Утасны дугаар</span>
            <input
              autoComplete="tel"
              className={styles.applyInput}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="99001122"
              required
              type="tel"
              value={phone}
            />
          </label>

          <label className={styles.applyField}>
            <span className={styles.applyFieldLabel}>Товч танилцуулга</span>
            <textarea
              className={styles.applyTextarea}
              onChange={(e) => setCoverNote(e.target.value)}
              placeholder="Яагаад энэ ажилд тохирохоо бичнэ үү..."
              rows={4}
              value={coverNote}
            />
          </label>

          <label className={styles.applyField}>
            <span className={styles.applyFieldLabel}>CV файл</span>
            <input
              accept=".pdf,.doc,.docx,application/pdf"
              className={styles.applyInput}
              onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
              type="file"
            />
          </label>

          {error ? (
            <p className={styles.applyError} role="alert">
              {error}
            </p>
          ) : null}

          <button className={styles.applySubmitBtn} disabled={loading} type="submit">
            {loading ? "Илгээж байна..." : "Өргөдөл илгээх"}
          </button>
        </form>
      </div>
    </div>
  );
}

type JobDetailModalProps = {
  canManage: boolean;
  job: DisplayJob;
  applied: boolean;
  applicationStatus?: "pending" | "accepted" | "rejected";
  onApplyClick: () => void;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
};

function statusLabel(status: "pending" | "accepted" | "rejected") {
  if (status === "accepted") return "Хүлээн авсан";
  if (status === "rejected") return "Татгалзсан";
  return "Хүлээгдэж буй";
}

function JobDetailModal({
  canManage,
  job,
  applied,
  applicationStatus,
  onApplyClick,
  onClose,
  onDelete,
  onEdit,
}: JobDetailModalProps) {
  const category = categoryMap.get(job.categoryKey);

  return (
    <div className={styles.applyOverlay} role="dialog" aria-modal="true">
      <div className={`${styles.applyPanel} ${styles.jobDetailPanel}`}>
        <button aria-label="Хаах" className={styles.applyCloseBtn} onClick={onClose} type="button">
          ×
        </button>

        <div className={styles.applyHeader}>
          <span className={styles.applyEyebrow}>Ажлын дэлгэрэнгүй</span>
          <h2 className={styles.applyTitle}>{job.title}</h2>
          <p className={styles.applyCompany}>
            {job.companyName} · {job.location}
          </p>
        </div>

        <div className={styles.jobDetailMetaGrid}>
          <article className={styles.jobDetailMetaCard}>
            <span className={styles.jobDetailMetaLabel}>Цалин</span>
            <strong className={styles.jobDetailMetaValue}>{job.salary}</strong>
          </article>
          <article className={styles.jobDetailMetaCard}>
            <span className={styles.jobDetailMetaLabel}>Төрөл</span>
            <strong className={styles.jobDetailMetaValue}>{job.employmentType}</strong>
          </article>
          <article className={styles.jobDetailMetaCard}>
            <span className={styles.jobDetailMetaLabel}>Ангилал</span>
            <strong className={styles.jobDetailMetaValue}>{category?.name ?? job.categoryKey}</strong>
          </article>
          <article className={styles.jobDetailMetaCard}>
            <span className={styles.jobDetailMetaLabel}>Нийтэлсэн</span>
            <strong className={styles.jobDetailMetaValue}>{job.createdByName || job.companyName}</strong>
          </article>
        </div>

        <section className={styles.jobDetailSection}>
          <h3 className={styles.jobDetailSectionTitle}>Ажлын тайлбар</h3>
          <p className={styles.jobDetailDescription}>{job.description}</p>
        </section>

        <section className={styles.jobDetailSection}>
          <h3 className={styles.jobDetailSectionTitle}>Чиглэл ба ур чадвар</h3>
          <div className={styles.jobDetailTagList}>
            {job.tags.map((tag) => (
              <span className={styles.jobCardNewTag} key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </section>

        <div className={styles.jobDetailActions}>
          {canManage ? (
            <>
              <button className={styles.jobDetailSecondaryBtn} onClick={onEdit} type="button">
                Засах
              </button>
              <button className={styles.jobDetailDangerBtn} onClick={onDelete} type="button">
                Устгах
              </button>
            </>
          ) : (
            <button className={styles.jobDetailSecondaryBtn} onClick={onClose} type="button">
              Хаах
            </button>
          )}
          <button className={styles.applySubmitBtn} disabled={job.source !== "database"} onClick={onApplyClick} type="button">
            {applied ? "Өргөдөл илгээсэн ✓" : "Өргөдөл илгээх"}
          </button>
          {applicationStatus ? (
            <p className={styles.applyHint} style={{ marginTop: "0.75rem", textAlign: "center" }}>
              Таны өргөдлийн төлөв: <strong>{statusLabel(applicationStatus)}</strong>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type JobCardProps = {
  currentUser?: SessionUser | null;
  job: DisplayJob;
  isEditing: boolean;
  favoriteJobIds: string[];
  editJob: JobForm;
  submitting: boolean;
  applicationStatus?: "pending" | "accepted" | "rejected";
  onDeleteJob: (jobId: string) => void;
  onToggleFavorite: (jobId: string) => void;
  onEditFieldChange: (update: JobForm) => void;
  onSaveEdit: (jobId: string) => void;
  onStartEdit: (job: JobRecord) => void;
  onCancelEdit: () => void;
  onToast: (msg: string) => void;
};

function LocationIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
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

function isNew(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 3 * 24 * 60 * 60 * 1000;
}

export function JobCard({
  currentUser = null,
  job,
  isEditing,
  favoriteJobIds,
  editJob,
  submitting,
  applicationStatus,
  onDeleteJob,
  onToggleFavorite,
  onEditFieldChange,
  onSaveEdit,
  onStartEdit,
  onCancelEdit,
  onToast,
}: JobCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [localApplied, setLocalApplied] = useState(false);
  const applied = applicationStatus !== undefined || localApplied;

  const company = findCompanyByName(job.companyName);
  const toneKey = avatarToneClasses[(Math.abs(job.companyName.length) + job.id.length) % avatarToneClasses.length];
  const toneClass = styles[toneKey];
  const jobIsNew = isNew(job.createdAt);
  const canManage =
    job.source === "database" &&
    (currentUser?.role === "admin" ||
      (typeof currentUser?.id === "number" && job.createdByUserId === currentUser.id));

  if (isEditing) {
    return (
      <article className={styles.jobCardNew}>
        <div className={styles.jobsEditWrap}>
          <div className={styles.jobsFormRow}>
            <input onChange={(e) => onEditFieldChange({ ...editJob, title: e.target.value })} required value={editJob.title} />
            <input
              onChange={(e) => onEditFieldChange({ ...editJob, companyName: e.target.value })}
              required
              value={editJob.companyName}
            />
          </div>
          <div className={styles.jobsFormRow}>
            <input
              onChange={(e) => onEditFieldChange({ ...editJob, location: e.target.value })}
              required
              value={editJob.location}
            />
            <input onChange={(e) => onEditFieldChange({ ...editJob, salary: e.target.value })} required value={editJob.salary} />
          </div>
          <div className={styles.jobsFormRow}>
            <select onChange={(e) => onEditFieldChange({ ...editJob, employmentType: e.target.value })} value={editJob.employmentType}>
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
          <textarea onChange={(e) => onEditFieldChange({ ...editJob, description: e.target.value })} required rows={4} value={editJob.description} />
        </div>
      </article>
    );
  }

  return (
    <>
      <article className={styles.jobCardNew}>
        <div className={styles.jobCardNewTop}>
          <div className={styles.jobCardNewLogoWrap}>
            <span className={`${styles.jobCompanyAvatar} ${toneClass || ""}`}>
              {company ? (
                <img
                  alt={`${job.companyName} logo`}
                  className={styles.jobCompanyAvatarImage}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  src={companyLogoUrl(company.domain)}
                />
              ) : (
                <span className={styles.jobCompanyAvatarInitials}>{companyInitials(job.companyName)}</span>
              )}
            </span>
            <div className={styles.jobCardNewCompanyInfo}>
              <span className={styles.jobCardNewCompanyName}>{job.companyName}</span>
              <div className={styles.jobCardNewBadges}>
                <span className={styles.jobCardNewBadgeType}>{job.employmentType}</span>
                {jobIsNew ? <span className={styles.jobCardNewBadgeNew}>ШИНЭ</span> : null}
              </div>
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

        <h3 className={styles.jobCardNewTitle}>{job.title}</h3>

        <div className={styles.jobCardNewLocation}>
          <LocationIcon />
          <span>{job.location}</span>
          {job.location.toLowerCase() !== "remote" ? (
            <>
              <span className={styles.jobCardNewLocationDot}>·</span>
              <span>Remote</span>
            </>
          ) : null}
        </div>

        <p className={styles.jobCardNewDesc}>{job.description}</p>

        <div className={styles.jobCardNewFooter}>
          <div className={styles.jobCardNewSalary}>{job.salary}</div>
          <div className={styles.jobCardNewApplicants}>
            <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
              <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
            </svg>
            <span>{job.applicantCount} анкет</span>
          </div>
          <button className={styles.jobCardNewApplyBtn} onClick={() => setShowDetails(true)} type="button">
            Дэлгэрэнгүй
          </button>
        </div>
      </article>

      {showDetails ? (
        <JobDetailModal
          applied={applied}
          applicationStatus={applicationStatus}
          canManage={canManage}
          job={job}
          onApplyClick={() => {
            if (job.source !== "database") {
              onToast("Demo Ð·Ð°Ñ€ Ð´ÑÑÑ€ ÑˆÑƒÑƒÐ´ Ó©Ñ€Ð³Ó©Ð´Ó©Ð» Ð¸Ð»Ð³ÑÑÑ…Ð³Ò¯Ð¹. Database Ð·Ð°Ñ€Ñ‹Ð³ ÑÐ¾Ð½Ð³Ð¾Ð½Ð¾ ÑƒÑƒ.");
              return;
            }
            setShowDetails(false);
            setShowApply(true);
          }}
          onClose={() => setShowDetails(false)}
          onDelete={() => {
            setShowDetails(false);
            onDeleteJob(job.id);
          }}
          onEdit={() => {
            setShowDetails(false);
            onStartEdit(job);
          }}
        />
      ) : null}

      {showApply && job.source === "database" ? (
        <ApplyModal
          currentUser={currentUser}
          job={job}
          onClose={() => setShowApply(false)}
          onSuccess={() => {
            setShowApply(false);
            setLocalApplied(true);
            onToast(
              `"${job.title}" ажилд өргөдөл илгээгдлээ. ${job.companyName} компанид мэдэгдэл очсон. Хариу ирэхэд мэдэгдэл хүлээнэ үү.`,
            );
          }}
        />
      ) : null}
    </>
  );
}

type JobsListCardsProps = {
  currentUser?: SessionUser | null;
  loading: boolean;
  filteredJobs: DisplayJob[];
  paginatedJobs: DisplayJob[];
  currentPage: number;
  totalPages: number;
  favoriteJobIds: string[];
  editingId: string | null;
  editJob: JobForm;
  submitting: boolean;
  applicationStatusByJobId?: Record<string, "pending" | "accepted" | "rejected">;
  emptyHint?: string;
  onDeleteJob: (jobId: string) => void;
  onToggleFavorite: (jobId: string) => void;
  onPageChange: (page: number) => void;
  onEditFieldChange: (update: JobForm) => void;
  onSaveEdit: (jobId: string) => void;
  onStartEdit: (job: JobRecord) => void;
  onCancelEdit: () => void;
  onToast: (msg: string) => void;
};

export function JobsListCards({
  currentUser = null,
  loading,
  filteredJobs,
  paginatedJobs,
  currentPage,
  totalPages,
  favoriteJobIds,
  editingId,
  editJob,
  submitting,
  applicationStatusByJobId,
  emptyHint,
  onDeleteJob,
  onToggleFavorite,
  onPageChange,
  onEditFieldChange,
  onSaveEdit,
  onStartEdit,
  onCancelEdit,
  onToast,
}: JobsListCardsProps) {
  return (
    <div className={styles.jobsLayout}>
      <div className={styles.jobsFeed}>
        <div className={styles.jobsList}>
          {loading ? <div className={styles.jobsEmpty}>Ажлын мэдээллүүдийг ачаалж байна...</div> : null}
          {!loading && filteredJobs.length === 0 ? (
            <div className={styles.jobsEmpty}>{emptyHint ?? "Энэ шүүлтүүрт тохирсон ажлын санал олдсонгүй."}</div>
          ) : null}
          {paginatedJobs.map((job) => (
            <JobCard
              key={job.id}
              applicationStatus={applicationStatusByJobId?.[job.id]}
              currentUser={currentUser}
              editJob={editJob}
              favoriteJobIds={favoriteJobIds}
              isEditing={editingId === job.id}
              job={job}
              onCancelEdit={onCancelEdit}
              onDeleteJob={onDeleteJob}
              onEditFieldChange={onEditFieldChange}
              onSaveEdit={onSaveEdit}
              onStartEdit={onStartEdit}
              onToast={onToast}
              onToggleFavorite={onToggleFavorite}
              submitting={submitting}
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
              {Array.from({ length: totalPages }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    className={`${styles.jobsPaginationPage} ${page === currentPage ? styles.jobsPaginationPageActive : ""}`}
                    key={page}
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

"use client";

import { FormEvent, useEffect, useState } from "react";
import type { JobForm } from "@/components/index-landing/jobs-types";
import {
  STRUCTURED_JOB_SECTION_LABELS,
  buildStructuredJobDescription,
} from "@/lib/job-description-sections";
import styles from "@/components/index-landing/index-landing.module.css";
import { emptyJobForm, JOB_POST_SECTION_UI, JOB_POST_TIPS } from "./job-post-sheet-constants";

function SheetCloseIcon() {
  return (
    <svg aria-hidden className={styles.landingSheetCloseIcon} height="18" viewBox="0 0 24 24" width="18">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.25" />
    </svg>
  );
}

type CompanyJobPostSheetProps = {
  open: boolean;
  onClose: () => void;
  onPosted: () => void;
  onError?: (message: string) => void;
};

export function CompanyJobPostSheet({ open, onClose, onPosted, onError }: CompanyJobPostSheetProps) {
  const [newJob, setNewJob] = useState<JobForm>(emptyJobForm);
  const [jobPostDescSections, setJobPostDescSections] = useState<string[]>(() =>
    Array.from({ length: 6 }, () => ""),
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setNewJob(emptyJobForm);
    setJobPostDescSections(Array.from({ length: 6 }, () => ""));

    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/company-profile", { cache: "no-store", credentials: "same-origin" });
        const j = (await r.json()) as { ok?: boolean; profile?: { company_name?: string } };
        if (cancelled || !r.ok || j.ok === false || !j.profile?.company_name?.trim()) {
          return;
        }
        setNewJob((prev) => ({
          ...prev,
          companyName: j.profile!.company_name!.trim(),
        }));
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const description = buildStructuredJobDescription(jobPostDescSections);
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...newJob, description }),
      });

      const payload = (await response.json()) as { error?: string; needSubscription?: boolean };

      if (!response.ok) {
        throw new Error(payload.error ?? "Ажлын зар нэмэхэд алдаа гарлаа.");
      }

      window.dispatchEvent(new Event("cwork:platform-stats-changed"));
      window.dispatchEvent(new Event("cwork:company-jobs-changed"));
      onPosted();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ажлын зар нэмэхэд алдаа гарлаа.";
      onError?.(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.landingSheetOverlay} onClick={onClose} role="presentation">
      <article
        aria-labelledby="company-job-post-sheet-title"
        className={`${styles.freelancerPublishSheet} ${styles.jobsPostPublishSheetWide}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button aria-label="Хаах" className={styles.landingSheetClose} onClick={onClose} type="button">
          <SheetCloseIcon />
        </button>
        <header className={styles.freelancerPublishSheetHeader}>
          <p className={styles.freelancerPublishSheetKicker}>C-WORK · COMPANY</p>
          <h2 id="company-job-post-sheet-title">Зар оруулах · нийтлэх</h2>
          <p className={styles.freelancerPublishSheetSubtitle}>
            Жагсаалтад гарсан зар таны компанийн нэр, байршилтай нийцнэ. Доорх хэсгүүдийг бөглөж ажлын саналаа нэмнэ үү.
          </p>
        </header>
        <div className={styles.freelancerPublishSheetBody}>
          <form className={styles.jobsPostForm} onSubmit={handleCreate}>
            <div className={styles.jobsPostSheetGrid}>
              <aside className={styles.jobsPostSheetColLeft}>
                <div className={styles.jobsPostCard}>
                  <div className={styles.jobsPostCardHead}>
                    <span className={styles.jobsPostIconBadge} aria-hidden>
                      i
                    </span>
                    <span className={styles.jobsPostCardHeadTitle}>Үндсэн мэдээлэл</span>
                  </div>
                  <div className={styles.jobsPostStack}>
                    <input
                      className={styles.jobsPostInput}
                      onChange={(event) => setNewJob({ ...newJob, title: event.target.value })}
                      placeholder="ж.нь: Ахлах график дизайнер"
                      required
                      value={newJob.title}
                    />
                    <div className={styles.jobsPostFieldRow}>
                      <input
                        className={styles.jobsPostInput}
                        onChange={(event) => setNewJob({ ...newJob, companyName: event.target.value })}
                        placeholder="Компани"
                        required
                        value={newJob.companyName}
                      />
                      <input
                        className={styles.jobsPostInput}
                        onChange={(event) => setNewJob({ ...newJob, location: event.target.value })}
                        placeholder="Байршил"
                        required
                        value={newJob.location}
                      />
                    </div>
                    <div className={styles.jobsPostFieldRow}>
                      <input
                        className={styles.jobsPostInput}
                        onChange={(event) => setNewJob({ ...newJob, salary: event.target.value })}
                        placeholder="Цалин"
                        required
                        value={newJob.salary}
                      />
                      <select
                        className={styles.jobsPostSelect}
                        onChange={(event) => setNewJob({ ...newJob, employmentType: event.target.value })}
                        value={newJob.employmentType}
                      >
                        <option>Бүтэн цаг</option>
                        <option>Хагас цаг</option>
                        <option>Гэрээт</option>
                        <option>Remote</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={`${styles.jobsPostCard} ${styles.jobsPostCardTips}`}>
                  <div className={styles.jobsPostCardHead}>
                    <span className={styles.jobsPostIconBadge} aria-hidden>
                      💡
                    </span>
                    <span className={styles.jobsPostCardHeadTitle}>Зар оруулах зөвлөмж</span>
                  </div>
                  <ul className={styles.jobsPostTipsList}>
                    {JOB_POST_TIPS.map((tip) => (
                      <li className={styles.jobsPostTipRow} key={tip.title}>
                        <span className={styles.jobsPostTipMark}>{tip.mark}</span>
                        <div>
                          <strong className={styles.jobsPostTipTitle}>{tip.title}</strong>
                          <p className={styles.jobsPostTipDesc}>{tip.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>

              <div className={styles.jobsPostSheetColRight}>
                <div className={styles.jobsPostCard}>
                  <div className={styles.jobsPostCardHead}>
                    <span className={styles.jobsPostIconBadge} aria-hidden>
                      ≡
                    </span>
                    <span className={styles.jobsPostCardHeadTitle}>Дэлгэрэнгүй мэдээлэл</span>
                  </div>
                  <div className={styles.jobsPostDescBlocks}>
                    <div className={styles.jobsPostDescPair}>
                      {[0, 1].map((idx) => (
                        <div className={styles.jobsPostFieldBlock} key={STRUCTURED_JOB_SECTION_LABELS[idx]}>
                          <label className={styles.jobsPostFieldLabel} htmlFor={`profile-job-post-sec-${idx}`}>
                            <span className={styles.jobsPostFieldLabelGlyph} aria-hidden />
                            {JOB_POST_SECTION_UI[idx].short}
                          </label>
                          <textarea
                            className={styles.jobsPostTextarea}
                            id={`profile-job-post-sec-${idx}`}
                            onChange={(event) =>
                              setJobPostDescSections((prev) =>
                                prev.map((v, i) => (i === idx ? event.target.value : v)),
                              )
                            }
                            placeholder={JOB_POST_SECTION_UI[idx].hint}
                            required
                            rows={idx === 0 ? 5 : 4}
                            value={jobPostDescSections[idx] ?? ""}
                          />
                        </div>
                      ))}
                    </div>
                    <div className={styles.jobsPostFieldBlock}>
                      <label className={styles.jobsPostFieldLabel} htmlFor="profile-job-post-sec-2">
                        <span className={styles.jobsPostFieldLabelGlyph} aria-hidden />
                        {JOB_POST_SECTION_UI[2].short}
                      </label>
                      <textarea
                        className={styles.jobsPostTextarea}
                        id="profile-job-post-sec-2"
                        onChange={(event) =>
                          setJobPostDescSections((prev) => prev.map((v, i) => (i === 2 ? event.target.value : v)))
                        }
                        placeholder={JOB_POST_SECTION_UI[2].hint}
                        required
                        rows={4}
                        value={jobPostDescSections[2] ?? ""}
                      />
                    </div>
                    <div className={styles.jobsPostDescPair}>
                      {[3, 4].map((idx) => (
                        <div className={styles.jobsPostFieldBlock} key={STRUCTURED_JOB_SECTION_LABELS[idx]}>
                          <label className={styles.jobsPostFieldLabel} htmlFor={`profile-job-post-sec-${idx}`}>
                            <span className={styles.jobsPostFieldLabelGlyph} aria-hidden />
                            {JOB_POST_SECTION_UI[idx].short}
                          </label>
                          <textarea
                            className={styles.jobsPostTextarea}
                            id={`profile-job-post-sec-${idx}`}
                            onChange={(event) =>
                              setJobPostDescSections((prev) =>
                                prev.map((v, i) => (i === idx ? event.target.value : v)),
                              )
                            }
                            placeholder={JOB_POST_SECTION_UI[idx].hint}
                            required
                            rows={4}
                            value={jobPostDescSections[idx] ?? ""}
                          />
                        </div>
                      ))}
                    </div>
                    <div className={styles.jobsPostFieldBlock}>
                      <label className={styles.jobsPostFieldLabel} htmlFor="profile-job-post-sec-5">
                        <span className={styles.jobsPostFieldLabelGlyph} aria-hidden />
                        {JOB_POST_SECTION_UI[5].short}
                      </label>
                      <textarea
                        className={styles.jobsPostTextarea}
                        id="profile-job-post-sec-5"
                        onChange={(event) =>
                          setJobPostDescSections((prev) => prev.map((v, i) => (i === 5 ? event.target.value : v)))
                        }
                        placeholder={JOB_POST_SECTION_UI[5].hint}
                        required
                        rows={4}
                        value={jobPostDescSections[5] ?? ""}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <footer className={styles.jobsPostSheetFooter}>
              <div className={styles.jobsPostFooterNote}>
                <span aria-hidden className={styles.jobsPostFooterEye}>
                  👁
                </span>
                Нийтлэгдсний дараа /jobs жагсаалтад харагдана
              </div>
              <div className={styles.jobsPostFooterActions}>
                <button className={styles.jobsPostBtnPrimary} disabled={submitting} type="submit">
                  {submitting ? "Хадгалж байна..." : "Зар нийтлэх"}
                </button>
              </div>
            </footer>
          </form>
        </div>
      </article>
    </div>
  );
}

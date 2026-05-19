"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { JobRecord } from "@/components/index-landing/jobs-types";
import { CompanyJobPostSheet } from "@/components/company/company-job-post-sheet";
import styles from "../profile.module.css";

function IconPlus() {
  return (
    <svg aria-hidden fill="none" viewBox="0 0 24 24" width="20" height="20">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

type CompanyJobsPanelProps = {
  userId: number;
};

export function CompanyJobsPanel({ userId }: CompanyJobsPanelProps) {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/jobs", { cache: "no-store", credentials: "same-origin" });
      const data = (await response.json()) as { jobs?: JobRecord[] };
      if (!response.ok) {
        setJobs([]);
        return;
      }
      setJobs((data.jobs ?? []).filter((job) => Number(job.createdByUserId) === userId));
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    const onRefresh = () => {
      void loadJobs();
    };
    window.addEventListener("cwork:company-jobs-changed", onRefresh);
    return () => window.removeEventListener("cwork:company-jobs-changed", onRefresh);
  }, [loadJobs]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <>
      <section className={styles.companyJobsPanel} aria-labelledby="company-jobs-heading">
        <div className={styles.companyPanelHead}>
          <h3 id="company-jobs-heading" className={styles.companyPanelTitle}>
            <span className={styles.companyPanelTitleIcon} aria-hidden>
              <svg fill="none" viewBox="0 0 24 24" width="20" height="20">
                <path
                  d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M4 12h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8Z"
                  stroke="currentColor"
                  strokeWidth="1.65"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Ажлын байр
          </h3>
          <button
            type="button"
            className={styles.companyPanelPlus}
            aria-label="Шинэ зар нэмэх"
            onClick={() => setSheetOpen(true)}
          >
            <IconPlus />
          </button>
        </div>

        {toast ? (
          <p className={styles.companyJobsToast} role="status">
            {toast}
          </p>
        ) : null}

        {loading ? (
          <p className={styles.companyPanelHint}>Ачааллаж байна…</p>
        ) : jobs.length === 0 ? (
          <p className={styles.companyPanelHint}>
            Одоогоор зар байхгүй. <strong>+</strong> товчоор шинэ зар нэмнэ үү.
          </p>
        ) : (
          <ul className={styles.companyJobList}>
            {jobs.map((job) => (
              <li className={styles.companyJobItem} key={job.id}>
                <Link className={styles.companyJobItemLink} href={`/jobs?job=${encodeURIComponent(job.id)}`}>
                  <strong>{job.title}</strong>
                  <span>
                    {job.employmentType} · {job.location}
                    {job.salary ? ` · ${job.salary}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CompanyJobPostSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onPosted={() => {
          setToast("Ажлын зар нэмэгдлээ.");
          void loadJobs();
        }}
        onError={(message) => setToast(message)}
      />
    </>
  );
}

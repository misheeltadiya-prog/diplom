"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FAVORITES_CHANGED_EVENT,
  readFavoriteJobIdsFromStorage,
  toggleFavoriteJobIdInStorage,
} from "@/lib/landing-favorites";
import type { JobRecord } from "./jobs-types";
import styles from "./index-landing.module.css";

export function NavSavedJobsButton() {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const syncFavorites = useCallback(() => {
    setFavoriteIds(readFavoriteJobIdsFromStorage());
  }, []);

  useEffect(() => {
    syncFavorites();
    const onChange = () => syncFavorites();
    window.addEventListener(FAVORITES_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [syncFavorites]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/jobs", { cache: "no-store", credentials: "same-origin" });
      const payload = (await response.json()) as { jobs?: JobRecord[] };
      if (response.ok && Array.isArray(payload.jobs)) {
        setJobs(payload.jobs);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadJobs();
  }, [open, loadJobs]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: globalThis.MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const savedJobs = jobs.filter((job) => favoriteIds.includes(job.id));
  const missingCount = favoriteIds.length - savedJobs.length;
  const count = favoriteIds.length;
  const hasFavorites = count > 0;

  function openJob(jobId: string) {
    setOpen(false);
    router.push(`/jobs?job=${encodeURIComponent(jobId)}`);
  }

  function removeFavorite(jobId: string, e: ReactMouseEvent) {
    e.stopPropagation();
    toggleFavoriteJobIdInStorage(jobId);
  }

  return (
    <div ref={wrapRef} className={styles.navFavoritesWrap}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Хадгалсан зарууд"
        className={styles.navFavoritesButton}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <Image
          alt=""
          aria-hidden
          className={styles.navFavoritesIcon}
          height={22}
          src={hasFavorites ? "/heart-favorite-on.svg" : "/heart-favorite.svg"}
          width={22}
        />
        {count > 0 ? (
          <span className={styles.navFavoritesBadge}>{count > 99 ? "99+" : count}</span>
        ) : null}
      </button>

      {open ? (
        <section className={styles.navFavoritesPanel} role="listbox">
          <header className={styles.navFavoritesPanelHead}>
            <strong>Хадгалсан зарууд</strong>
            <button
              aria-label="Хаах"
              className={styles.navFavoritesPanelClose}
              onClick={() => setOpen(false)}
              type="button"
            >
              ×
            </button>
          </header>

          <div className={styles.navFavoritesList}>
            {loading ? <p className={styles.navFavoritesHint}>Ачаалж байна…</p> : null}
            {!loading && count === 0 ? (
              <p className={styles.navFavoritesHint}>
                Одоогоор хадгалсан зар байхгүй. Ажлын жагсаалтаас зүрх дарж хадгална уу.
              </p>
            ) : null}
            {!loading && savedJobs.length === 0 && count > 0 ? (
              <p className={styles.navFavoritesHint}>Хадгалсан зарууд олдсонгүй (устсан эсвэл хугацаа дууссан байж болно).</p>
            ) : null}
            {!loading
              ? savedJobs.map((job) => (
                  <div className={styles.navFavoritesItem} key={job.id} role="option">
                    <button
                      className={styles.navFavoritesItemMain}
                      onClick={() => openJob(job.id)}
                      type="button"
                    >
                      <strong>{job.title}</strong>
                      <span>
                        {job.companyName}
                        {job.location ? ` · ${job.location}` : ""}
                      </span>
                    </button>
                    <button
                      aria-label="Хадгалалтаас хасах"
                      className={styles.navFavoritesItemRemove}
                      onClick={(e) => removeFavorite(job.id, e)}
                      type="button"
                    >
                      <Image alt="" aria-hidden height={18} src="/heart-favorite-on.svg" width={18} />
                    </button>
                  </div>
                ))
              : null}
            {!loading && missingCount > 0 ? (
              <p className={styles.navFavoritesHintMuted}>
                {missingCount} хадгалсан зар одоогоор жагсаалтад байхгүй байна.
              </p>
            ) : null}
          </div>

          {count > 0 ? (
            <footer className={styles.navFavoritesFooter}>
              <button
                className={styles.navFavoritesViewAll}
                onClick={() => {
                  setOpen(false);
                  router.push("/jobs");
                }}
                type="button"
              >
                Бүх ажлын зар руу
              </button>
            </footer>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

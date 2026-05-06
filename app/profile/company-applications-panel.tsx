"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { dispatchCompanyPendingApplicationsChanged } from "@/lib/company-applications-events";
import styles from "./profile.module.css";

type ApplicationItem = {
  id: number;
  jobId: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string;
  coverNote: string;
  cvFilePath: string;
  applicantUserId: number | null;
  status: string;
  createdAt: string;
};

function statusBadgeClass(status: string) {
  if (status === "accepted") return styles.applicationBadgeOk;
  if (status === "rejected") return styles.applicationBadgeNo;
  return styles.applicationBadgePending;
}

function statusLabel(status: string) {
  if (status === "accepted") return "Хүлээн авсан";
  if (status === "rejected") return "Татгалзсан";
  return "Хүлээгдэж буй";
}

export function CompanyApplicationsPanel() {
  const router = useRouter();
  const [items, setItems] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ApplicationItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/company/applications", { cache: "no-store" });
      const data = (await res.json()) as {
        ok?: boolean;
        applications?: ApplicationItem[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Алдаа гарлаа.");
        setItems([]);
        return;
      }
      const list = data.applications ?? [];
      setItems(
        list.map((a) => ({
          ...a,
          cvFilePath: a.cvFilePath ?? "",
          applicantUserId: a.applicantUserId ?? null,
        })),
      );
    } catch {
      setError("Сервертэй холбогдоход алдаа.");
      setItems([]);
    } finally {
      setLoading(false);
      dispatchCompanyPendingApplicationsChanged();
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading) return;
    if (typeof window === "undefined" || window.location.hash !== "#company-applications") return;
    const id = window.requestAnimationFrame(() => {
      document.getElementById("company-applications")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [loading]);

  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetail(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail]);

  async function setStatus(applicationId: number, jobId: string, status: "accepted" | "rejected") {
    setBusyId(applicationId);
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/applications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Шинэчлэхэд алдаа.");
        return;
      }
      setItems((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
      setDetail((prev) => (prev && prev.id === applicationId ? { ...prev, status } : prev));
      router.refresh();
      dispatchCompanyPendingApplicationsChanged();
    } catch {
      setError("Сервертэй холбогдоход алдаа.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className={styles.emptyCard} id="company-applications">
        Өргөдлүүдийг ачаалж байна…
      </div>
    );
  }

  return (
    <section className={styles.overviewPanel} id="company-applications">
      <div className={styles.overviewPanelHead}>
        <div>
          <h2 className={styles.sectionTitle}>Ирсэн өргөдлүүд</h2>
          <p style={{ margin: "6px 0 0", fontSize: "0.88rem", color: "#6b6578" }}>
            Карт дээр дарж өргөдөл гаргагчийн бүх мэдээллийг нээнэ. Хүлээн авах / татгалзах төлөв профайлын
            статистикт шууд тусгагдана.
          </p>
        </div>
        <button className={styles.chip} onClick={() => void load()} type="button">
          Сэргээх
        </button>
      </div>

      {error ? (
        <p className={styles.errorInline} role="alert">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className={styles.emptyCard}>Одоогоор өргөдөл ирээгүй байна.</div>
      ) : (
        <ul className={styles.applicationList}>
          {items.map((a) => (
            <li className={`${styles.applicationCard} ${styles.applicationCardInteractive}`} key={`${a.jobId}-${a.id}`}>
              <button
                className={styles.applicationCardHit}
                onClick={() => setDetail(a)}
                type="button"
              >
                <div className={styles.applicationHead}>
                  <div className={styles.applicationCardLead}>
                    <span className={styles.applicationCardAvatar} aria-hidden>
                      {a.fullName.trim().slice(0, 1).toUpperCase() || "?"}
                    </span>
                    <div>
                      <strong className={styles.applicationName}>{a.fullName}</strong>
                      <span className={styles.applicationJob}>{a.jobTitle}</span>
                    </div>
                  </div>
                  <span className={statusBadgeClass(a.status)}>{statusLabel(a.status)}</span>
                </div>
                <div className={styles.applicationMeta}>
                  <span>{a.email}</span>
                  <span>{a.phone}</span>
                  <span>
                    {new Date(a.createdAt).toLocaleString("mn-MN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <p className={styles.applicationCardHint}>Дэлгэрэнгүй харах — дарна уу</p>
              </button>
              {a.status === "pending" ? (
                <div className={styles.applicationActions}>
                  <button
                    className={styles.applicationBtnOk}
                    disabled={busyId === a.id}
                    onClick={() => void setStatus(a.id, a.jobId, "accepted")}
                    type="button"
                  >
                    Хүлээн авах
                  </button>
                  <button
                    className={styles.applicationBtnNo}
                    disabled={busyId === a.id}
                    onClick={() => void setStatus(a.id, a.jobId, "rejected")}
                    type="button"
                  >
                    Татгалзах
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {detail ? (
        <div
          className={styles.applicationDetailOverlay}
          onClick={() => setDetail(null)}
          onKeyDown={(e) => e.key === "Escape" && setDetail(null)}
          role="presentation"
        >
          <article
            className={styles.applicationDetailPanel}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-detail-title"
          >
            <button
              aria-label="Хаах"
              className={styles.applicationDetailClose}
              onClick={() => setDetail(null)}
              type="button"
            >
              ×
            </button>
            <header className={styles.applicationDetailHead}>
              <span className={styles.applicationDetailEyebrow}>Өргөдөл гаргагч</span>
              <h2 className={styles.applicationDetailTitle} id="application-detail-title">
                {detail.fullName}
              </h2>
              <p className={styles.applicationDetailJob}>{detail.jobTitle}</p>
              <span className={statusBadgeClass(detail.status)}>{statusLabel(detail.status)}</span>
            </header>

            <dl className={styles.applicationDetailGrid}>
              <div>
                <dt>И-мэйл</dt>
                <dd>
                  <a href={`mailto:${detail.email}`}>{detail.email}</a>
                </dd>
              </div>
              <div>
                <dt>Утас</dt>
                <dd>
                  <a href={`tel:${detail.phone.replace(/\s/g, "")}`}>{detail.phone}</a>
                </dd>
              </div>
              <div>
                <dt>Илгээсэн</dt>
                <dd>
                  {new Date(detail.createdAt).toLocaleString("mn-MN", {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </dd>
              </div>
              {detail.applicantUserId != null ? (
                <div>
                  <dt>Платформ хэрэглэгчийн ID</dt>
                  <dd>{detail.applicantUserId}</dd>
                </div>
              ) : null}
              <div>
                <dt>Ажлын зарын ID</dt>
                <dd className={styles.applicationDetailMono}>{detail.jobId}</dd>
              </div>
            </dl>

            {detail.coverNote?.trim() ? (
              <section className={styles.applicationDetailSection}>
                <h3 className={styles.applicationDetailSectionTitle}>Дагалдах бичиг / товч танилцуулга</h3>
                <p className={styles.applicationNote}>{detail.coverNote.trim()}</p>
              </section>
            ) : (
              <p className={styles.applicationDetailMuted}>Дагалдах бичиг оруулаагүй.</p>
            )}

            {detail.cvFilePath ? (
              <p className={styles.applicationDetailCv}>
                <a className={styles.chip} href={detail.cvFilePath} rel="noopener noreferrer" target="_blank">
                  CV файл татах / нээх
                </a>
              </p>
            ) : (
              <p className={styles.applicationDetailMuted}>CV файл хавсаргаагүй.</p>
            )}

            {detail.status === "pending" ? (
              <div className={styles.applicationDetailActions}>
                <button
                  className={styles.applicationBtnOk}
                  disabled={busyId === detail.id}
                  onClick={() => void setStatus(detail.id, detail.jobId, "accepted")}
                  type="button"
                >
                  Хүлээн авах
                </button>
                <button
                  className={styles.applicationBtnNo}
                  disabled={busyId === detail.id}
                  onClick={() => void setStatus(detail.id, detail.jobId, "rejected")}
                  type="button"
                >
                  Татгалзах
                </button>
              </div>
            ) : null}
          </article>
        </div>
      ) : null}
    </section>
  );
}

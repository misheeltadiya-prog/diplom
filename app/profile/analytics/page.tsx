"use client";

import { useEffect, useState } from "react";
import { CompanyApplicationsPanel } from "../company-applications-panel";
import styles from "../profile.module.css";

type Stats = {
  jobPosts: number;
  applications: number;
  offersSent: number;
  offersPending: number;
};

export default function CompanyAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/company")
      .then((r) => r.json())
      .then((d: { ok?: boolean; stats?: Stats; error?: string }) => {
        if (!d.ok) {
          setError(d.error ?? "Ачаалахад алдаа.");
          return;
        }
        setStats(d.stats ?? null);
      })
      .catch(() => setError("Сүлжээний алдаа."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className={styles.profileDashEmptyHint}>Analytics ачаалж байна…</p>;
  }

  if (error) {
    return (
      <div className={styles.dashboardCard}>
        <p className={styles.profileDashEmptyHint}>{error}</p>
      </div>
    );
  }

  const statItems = [
    { label: "Ажлын зар", value: stats?.jobPosts ?? 0, accent: "violet" as const },
    { label: "Өргөдөл", value: stats?.applications ?? 0, accent: "violet" as const },
    { label: "Санал илгээсэн", value: stats?.offersSent ?? 0, accent: "muted" as const },
    { label: "Хүлээгдэж буй санал", value: stats?.offersPending ?? 0, accent: "muted" as const },
  ];

  return (
    <>
      <header className={styles.profilePageHeader}>
        <h1 className={styles.profilePageTitle}>Analytics</h1>
      </header>

      <section className={styles.dashboardStatRow} aria-label="Товч статистик">
        {statItems.map((item) => (
          <article
            className={`${styles.dashboardStatCard} ${
              item.accent === "violet" ? styles.dashboardStatCardAccentViolet : styles.dashboardStatCardAccentMuted
            }`}
            key={item.label}
          >
            <span className={styles.dashboardStatValue}>{item.value}</span>
            <span className={styles.dashboardStatMeta}>{item.label}</span>
          </article>
        ))}
      </section>

      <CompanyApplicationsPanel />
    </>
  );
}

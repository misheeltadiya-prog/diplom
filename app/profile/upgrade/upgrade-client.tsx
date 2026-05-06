"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "../profile.module.css";

type PlanKey = "free" | "pro" | "business";

export function UpgradeClient() {
  const [plan, setPlan] = useState<PlanKey>("free");
  const [status, setStatus] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/subscription", { cache: "no-store" });
      const j = (await r.json()) as {
        ok?: boolean;
        plan?: string;
        status?: string;
        expiresAt?: string | null;
        error?: string;
      };
      if (!r.ok || !j.ok) {
        setErr(j.error ?? "Алдаа");
        return;
      }
      const p = j.plan === "pro" || j.plan === "business" ? j.plan : "free";
      setPlan(p);
      setStatus(j.status ?? "");
      setExpiresAt(j.expiresAt ?? null);
    } catch {
      setErr("Сүлжээний алдаа");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function choose(next: PlanKey) {
    setSaving(next);
    setErr(null);
    try {
      const r = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey: next }),
      });
      const j = (await r.json()) as { ok?: boolean; plan?: string; error?: string };
      if (!r.ok || !j.ok) {
        setErr(j.error ?? "Хадгалахад алдаа");
        return;
      }
      setPlan((j.plan as PlanKey) ?? next);
      await load();
    } catch {
      setErr("Сүлжээний алдаа");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return <p className={styles.muted}>Ачаалж байна…</p>;
  }
  if (err) {
    return <p className={styles.errorMsg}>{err}</p>;
  }

  const plans: { key: PlanKey; title: string; blurb: string }[] = [
    { key: "free", title: "Free", blurb: "Үндсэн хэрэглээ." },
    { key: "pro", title: "Pro", blurb: "Илүү олон боломж (төлбөр холбогдохоор идэвхжинэ)." },
    { key: "business", title: "Business", blurb: "Баг, олон зар (төлбөр холбогдохоор идэвхжинэ)." },
  ];

  return (
    <div style={{ display: "grid", gap: 20, marginTop: 16 }}>
      <p className={styles.muted}>
        Одоогийн төлөвлөгөө: <strong>{plan}</strong>
        {status ? ` · ${status}` : ""}
        {expiresAt ? ` · дуусах: ${new Date(expiresAt).toLocaleString("mn-MN")}` : ""}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        {plans.map((p) => (
          <article
            key={p.key}
            style={{
              border: plan === p.key ? "2px solid var(--profile-accent-strong, #6d28d9)" : "1px solid rgba(21,32,51,0.12)",
              borderRadius: 16,
              padding: 18,
              background: plan === p.key ? "rgba(243,232,255,0.5)" : "#fff",
            }}
          >
            <h2 style={{ margin: "0 0 8px", fontSize: "1.1rem" }}>{p.title}</h2>
            <p className={styles.muted} style={{ margin: 0 }}>
              {p.blurb}
            </p>
            <button
              disabled={saving !== null || plan === p.key}
              onClick={() => choose(p.key)}
              style={{ marginTop: 14 }}
              type="button"
            >
              {saving === p.key ? "Хадгалж…" : plan === p.key ? "Идэвхтэй" : "Сонгох"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

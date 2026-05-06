"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "../profile.module.css";

type ProfileRow = Record<string, unknown>;

function parsePortfolio(row: ProfileRow | null): string[] {
  if (!row) return [];
  const raw = row.portfolio_json;
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const j = JSON.parse(raw) as unknown;
    if (!Array.isArray(j)) return [];
    return j
      .filter((x): x is string => typeof x === "string" && x.trim() !== "")
      .slice(0, 20);
  } catch {
    return [];
  }
}

function parseListed(row: ProfileRow | null): boolean {
  if (!row) return false;
  const v = row.listed_on_directory;
  return v === 1 || v === true;
}

function parseSkills(row: ProfileRow | null): string {
  if (!row) return "";
  const raw = row.skills_json;
  if (typeof raw !== "string" || !raw.trim()) return "";
  try {
    const j = JSON.parse(raw) as unknown;
    if (!Array.isArray(j)) return "";
    return j.filter((x): x is string => typeof x === "string").join(", ");
  } catch {
    return "";
  }
}

type PublishFreelancerFormProps = {
  /** Хадгалсны дараа (жишээ нь sheet хаах, жагсаалт шинэчлэх) */
  onSaved?: () => void;
};

export function PublishFreelancerForm({ onSaved }: PublishFreelancerFormProps) {
  const [roleTitle, setRoleTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [detailDescription, setDetailDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [priceLabel, setPriceLabel] = useState("");
  const [portfolioText, setPortfolioText] = useState("");
  const [listedOnDirectory, setListedOnDirectory] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/freelancer-profile", { cache: "no-store", credentials: "same-origin" });
      const j = (await r.json()) as { ok?: boolean; profile?: ProfileRow | null; error?: string };
      if (!r.ok || !j.ok) {
        setErr(j.error ?? "Алдаа");
        return;
      }
      const p = j.profile;
      if (p) {
        setRoleTitle(String(p.role_title ?? ""));
        setShortDescription(String(p.short_description ?? ""));
        setDetailDescription(String(p.detail_description ?? ""));
        setSkills(parseSkills(p));
        setPriceLabel(String(p.price_label ?? ""));
        setPortfolioText(parsePortfolio(p).join("\n"));
        setListedOnDirectory(parseListed(p));
      }
    } catch {
      setErr("Сүлжээний алдаа");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);
    const portfolio = portfolioText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const skillsArr = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const r = await fetch("/api/freelancer-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          roleTitle,
          shortDescription,
          detailDescription,
          skills: skillsArr,
          priceLabel,
          portfolio,
          listedOnDirectory,
        }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !j.ok) {
        setErr(j.error ?? "Хадгалахад алдаа");
        return;
      }
      setMsg("Хадгалагдлаа.");
      onSaved?.();
    } catch {
      setErr("Сүлжээний алдаа");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className={styles.muted}>Ачаалж байна…</p>;
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 14, maxWidth: 560, marginTop: 16 }}>
      {err ? <p className={styles.errorMsg}>{err}</p> : null}
      {msg ? <p className={styles.muted}>{msg}</p> : null}
      <label style={{ display: "grid", gap: 6 }}>
        <span className={styles.muted}>Мэргэжил / гарчиг *</span>
        <input
          onChange={(e) => setRoleTitle(e.target.value)}
          placeholder="Жишээ: UX Designer"
          required
          value={roleTitle}
        />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        <span className={styles.muted}>Товч тайлбар</span>
        <input onChange={(e) => setShortDescription(e.target.value)} value={shortDescription} />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        <span className={styles.muted}>Дэлгэрэнгүй</span>
        <textarea onChange={(e) => setDetailDescription(e.target.value)} rows={4} value={detailDescription} />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        <span className={styles.muted}>Ур чадвар (таслалаар)</span>
        <input onChange={(e) => setSkills(e.target.value)} value={skills} />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        <span className={styles.muted}>Үнэ / хугацаа (жишээ нь &quot;50k₮/цаг&quot;)</span>
        <input onChange={(e) => setPriceLabel(e.target.value)} value={priceLabel} />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        <span className={styles.muted}>Portfolio (мөр бүрт нэг линк эсвэл товч тайлбар)</span>
        <textarea onChange={(e) => setPortfolioText(e.target.value)} rows={5} value={portfolioText} />
      </label>
      <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          checked={listedOnDirectory}
          onChange={(e) => setListedOnDirectory(e.target.checked)}
          type="checkbox"
        />
        <span className={styles.muted}>Freelancers жагсаалтад харуулах</span>
      </label>
      <button disabled={saving} type="submit">
        {saving ? "Хадгалж…" : "Хадгалах"}
      </button>
    </form>
  );
}

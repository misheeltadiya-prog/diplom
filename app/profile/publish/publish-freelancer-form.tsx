"use client";

import { useCallback, useEffect, useId, useState } from "react";
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
  const formId = useId();
  const id = (name: string) => `${formId}-${name}`;

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
      setMsg("Амжилттай хадгалагдлаа.");
      onSaved?.();
    } catch {
      setErr("Сүлжээний алдаа");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className={styles.publishFormLoading}>Мэдээллийг ачаалж байна…</p>;
  }

  return (
    <form className={styles.publishForm} onSubmit={onSubmit}>
      {err ? <p className={`${styles.publishFormAlert} ${styles.publishFormAlertError}`}>{err}</p> : null}
      {msg ? <p className={`${styles.publishFormAlert} ${styles.publishFormAlertOk}`}>{msg}</p> : null}

      <div className={styles.publishFormSection}>
        <h3 className={styles.publishFormSectionTitle}>Үндсэн мэдээлэл</h3>
        <div className={styles.field}>
          <label htmlFor={id("roleTitle")}>Мэргэжил, албан тушаалын гарчиг *</label>
          <input
            id={id("roleTitle")}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="Жишээ: Full-stack developer · UI/UX designer"
            required
            value={roleTitle}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={id("shortDescription")}>Товч танилцуулга</label>
          <input
            id={id("shortDescription")}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="1–2 өгүүлбэрээр өөрийгөө товч тодорхойлно уу"
            value={shortDescription}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={id("detailDescription")}>Дэлгэрэнгүй тайлбар</label>
          <textarea
            id={id("detailDescription")}
            onChange={(e) => setDetailDescription(e.target.value)}
            placeholder="Туршлага, ажлын арга барил, ямар төрлийн төсөлд тохиромжтойг бичнэ үү"
            rows={5}
            value={detailDescription}
          />
        </div>
      </div>

      <div className={styles.publishFormSection}>
        <h3 className={styles.publishFormSectionTitle}>Ур чадвар ба үнэ</h3>
        <div className={styles.field}>
          <label htmlFor={id("skills")}>Ур чадвар</label>
          <input
            id={id("skills")}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Таслалаар тусгаарлана: React, TypeScript, Figma"
            value={skills}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={id("priceLabel")}>Үнэ / хугацааны нөхцөл</label>
          <input
            id={id("priceLabel")}
            onChange={(e) => setPriceLabel(e.target.value)}
            placeholder="Жишээ: 80 000₮/цаг эсвэл төсөлд тохирсон"
            value={priceLabel}
          />
        </div>
      </div>

      <div className={styles.publishFormSection}>
        <h3 className={styles.publishFormSectionTitle}>Портфолио</h3>
        <div className={styles.field}>
          <label htmlFor={id("portfolio")}>Линк, төслийн нэр</label>
          <textarea
            id={id("portfolio")}
            onChange={(e) => setPortfolioText(e.target.value)}
            placeholder={"https://…\nhttps://…"}
            rows={5}
            value={portfolioText}
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <button className={styles.primaryButton} disabled={saving} type="submit">
          {saving ? "Хадгалж байна…" : "Хадгалах"}
        </button>
      </div>
    </form>
  );
}

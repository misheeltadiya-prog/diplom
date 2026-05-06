"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "../profile.module.css";

export function CompanyProfileForm() {
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("Ulaanbaatar");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/company-profile", { cache: "no-store", credentials: "same-origin" });
      const j = (await r.json()) as {
        ok?: boolean;
        profile?: {
          company_name?: string;
          industry?: string;
          website?: string;
          description?: string;
          city?: string;
        } | null;
        error?: string;
      };
      if (!r.ok || j.ok === false) {
        setErr(j.error ?? "Алдаа");
        return;
      }
      const p = j.profile;
      if (p) {
        setCompanyName(p.company_name ?? "");
        setIndustry(p.industry ?? "");
        setWebsite(p.website ?? "");
        setDescription(p.description ?? "");
        if (p.city?.trim()) {
          setCity(p.city);
        }
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
    try {
      const r = await fetch("/api/company-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          companyName,
          industry,
          city,
          website,
          description,
        }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || j.ok === false) {
        setErr(j.error ?? "Хадгалахад алдаа");
        return;
      }
      setMsg("Хадгалагдлаа. Companies хуудсанд харагдана.");
      try {
        window.dispatchEvent(new Event("cwork:platform-stats-changed"));
      } catch {
        /* ignore */
      }
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
    <form className={styles.companyForm} onSubmit={onSubmit}>
      {err ? <p className={styles.errorMsg}>{err}</p> : null}
      {msg ? <p className={styles.companyFormSuccess}>{msg}</p> : null}

      <div className={styles.companyFormGrid}>
        <label className={styles.companyFormField}>
          <span className={styles.companyFormLabel}>Компанийн нэр *</span>
          <input
            className={styles.companyFormInput}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Жишээ: C-Work LLC"
            required
            value={companyName}
          />
        </label>
        <label className={styles.companyFormField}>
          <span className={styles.companyFormLabel}>Салбар</span>
          <input
            className={styles.companyFormInput}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Fintech, IT services…"
            value={industry}
          />
        </label>
        <label className={styles.companyFormField}>
          <span className={styles.companyFormLabel}>Байршил (хот)</span>
          <input
            className={styles.companyFormInput}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ulaanbaatar"
            value={city}
          />
        </label>
        <label className={`${styles.companyFormField} ${styles.companyFormFieldWide}`}>
          <span className={styles.companyFormLabel}>Вэбсайт</span>
          <input
            className={styles.companyFormInput}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://company.mn"
            value={website}
          />
        </label>
        <label className={`${styles.companyFormField} ${styles.companyFormFieldFull}`}>
          <span className={styles.companyFormLabel}>Танилцуулга</span>
          <textarea
            className={styles.companyFormTextarea}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Компанийн тухай товч мэдээлэл — Companies хуудас болон модалд харагдана."
            rows={5}
            value={description}
          />
        </label>
      </div>

      <div className={styles.companyFormActions}>
        <button className={styles.companyFormSubmit} disabled={saving} type="submit">
          {saving ? "Хадгалж байна…" : "Хадгалах · жагсаалтад нэмэх"}
        </button>
      </div>
    </form>
  );
}

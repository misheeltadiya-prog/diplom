"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "../profile.module.css";

function MediaEditIcon() {
  return (
    <svg aria-hidden fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

type CompanyProfileFormProps = {
  /** Modal дотор — хадгалсны дараа /companies руу шилжихгүй */
  embedded?: boolean;
  onSaved?: (profile: {
    companyName: string;
    industry: string;
    city: string;
    website: string;
    description: string;
  }) => void;
};

export function CompanyProfileForm({ embedded = false, onSaved }: CompanyProfileFormProps) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("Ulaanbaatar");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

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
          banner_url?: string;
          logo_url?: string;
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
        setBannerUrl(p.banner_url ?? "");
        setLogoUrl(p.logo_url ?? "");
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

  async function handleBannerUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Зөвхөн зураг файл сонгоно уу.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Файл хэт том (5MB хүртэл).");
      return;
    }

    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/company-profile/banner", { method: "POST", body: fd });
      const data = await res.json();

      if (res.ok && data.url) {
        setBannerUrl(data.url);
        setMsg("Banner амжилттай солигдлоо!");
        setTimeout(() => setMsg(null), 3000);
      } else {
        setErr(data.error || "Banner upload хийхэд алдаа гарлаа.");
      }
    } catch {
      setErr("Banner upload хийхэд алдаа гарлаа.");
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) {
        bannerInputRef.current.value = "";
      }
    }
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Зөвхөн зураг файл сонгоно уу.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Файл хэт том (5MB хүртэл).");
      return;
    }

    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/company-profile/logo", { method: "POST", body: fd });
      const data = await res.json();

      if (res.ok && data.url) {
        setLogoUrl(data.url);
        setMsg("Logo амжилттай солигдлоо!");
        setTimeout(() => setMsg(null), 3000);
      } else {
        setErr(data.error || "Logo upload хийхэд алдаа гарлаа.");
      }
    } catch {
      setErr("Logo upload хийхэд алдаа гарлаа.");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  }

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
      try {
        window.dispatchEvent(new Event("cwork:platform-stats-changed"));
      } catch {
        /* ignore */
      }
      onSaved?.({
        companyName,
        industry,
        city,
        website,
        description,
      });
      if (embedded) {
        setMsg("Хадгалагдлаа.");
        setTimeout(() => setMsg(null), 3000);
        return;
      }
      setMsg("Хадгалагдлаа. Одоо /companies жагсаалт руу шилжинэ…");
      router.push("/companies?listed=1");
      router.refresh();
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

      <div className={styles.companyFormSection}>
        <h3 className={styles.companyFormSectionTitle}>Banner ба Logo</h3>
        <div className={styles.companyBrandMediaRow}>
          <div className={styles.companyBrandMediaLogo}>
            <span className={styles.companyBrandMediaLabel}>Logo</span>
            <label
              className={`${styles.companyMediaUploadTile} ${uploadingLogo ? styles.companyMediaUploadTileBusy : ""}`}
              aria-label={logoUrl ? "Logo солих" : "Logo оруулах"}
            >
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
              />
              <div className={styles.companyLogoPreview}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className={styles.companyMediaPreviewImg}
                  onError={() => setLogoUrl("")}
                />
              ) : (
                <div className={styles.companyLogoPlaceholder}>
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" aria-hidden>
                    <path
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
                <span className={styles.companyMediaEditBadge}>
                  <MediaEditIcon />
                </span>
                {uploadingLogo ? <span className={styles.companyMediaUploadOverlay}>Ачаалж байна…</span> : null}
              </div>
            </label>
          </div>

          <div className={styles.companyBrandMediaBanner}>
            <span className={styles.companyBrandMediaLabel}>Banner</span>
            <label
              className={`${styles.companyMediaUploadTile} ${uploadingBanner ? styles.companyMediaUploadTileBusy : ""}`}
              aria-label={bannerUrl ? "Banner солих" : "Banner оруулах"}
            >
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                disabled={uploadingBanner}
              />
              <div className={styles.companyBannerPreview}>
              {bannerUrl ? (
                <img src={bannerUrl} alt="" className={styles.companyMediaPreviewImg} />
              ) : (
                <div className={styles.companyBannerPlaceholder}>
                  <svg width="48" height="48" fill="none" viewBox="0 0 24 24" aria-hidden>
                    <path
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Banner зураг оруулна уу</span>
                </div>
              )}
                <span className={styles.companyMediaEditBadge}>
                  <MediaEditIcon />
                </span>
                {uploadingBanner ? <span className={styles.companyMediaUploadOverlay}>Ачаалж байна…</span> : null}
              </div>
            </label>
          </div>
        </div>
      </div>

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
        <label className={styles.companyFormField}>
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
          {saving ? "Хадгалж байна…" : "Хадгалах"}
        </button>
      </div>
    </form>
  );
}

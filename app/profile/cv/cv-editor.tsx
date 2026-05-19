"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CvProfile } from "@/lib/profile-cv";
import { CvPreviewDocument } from "@/components/cv/cv-preview-document";
import { BackButton } from "../back-button";
import styles from "../profile.module.css";

type CvEditorProps = {
  backHref: string;
  initialProfile: CvProfile;
  initialCompletion: number;
};

type SaveResponse = {
  ok?: boolean;
  error?: string;
  completion?: number;
};

const fieldConfig: Array<{
  key: keyof Omit<CvProfile, "userId" | "updatedAt">;
  label: string;
  type?: "text" | "email" | "url";
  rows?: number;
}> = [
  { key: "fullName", label: "Нэр" },
  { key: "email", label: "Имэйл", type: "email" },
  { key: "phone", label: "Утасны дугаар" },
  { key: "headline", label: "Headline" },
  { key: "preferredRole", label: "Сонирхож буй албан тушаал" },
  { key: "location", label: "Байршил" },
  { key: "availability", label: "Ажиллах боломж" },
  { key: "salaryExpectation", label: "Цалингийн хүлээлт" },
  { key: "professionalSummary", label: "Товч танилцуулга", rows: 5 },
  { key: "coreSkills", label: "Ур чадвар", rows: 4 },
  { key: "workExperience", label: "Ажлын туршлага", rows: 6 },
  { key: "education", label: "Боловсрол", rows: 5 },
  { key: "certifications", label: "Сертификат, сургалт", rows: 4 },
  { key: "languages", label: "Хэлний мэдлэг", rows: 4 },
  { key: "achievements", label: "Онцлох амжилтууд", rows: 4 },
  { key: "portfolioUrl", label: "Portfolio линк", type: "url" },
  { key: "linkedinUrl", label: "LinkedIn линк", type: "url" },
  { key: "githubUrl", label: "GitHub линк", type: "url" },
];

export function CvEditor({ backHref, initialProfile, initialCompletion }: CvEditorProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [completion, setCompletion] = useState(initialCompletion);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField(key: keyof Omit<CvProfile, "userId" | "updatedAt">, value: string) {
    setProfile((current) => ({
      ...current,
      [key]: value,
    }));
    setMessage("");
    setError("");
  }

  async function handleSave() {
    setPending(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/profile/cv", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      const payload = (await response.json()) as SaveResponse;

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "CV хадгалах үед алдаа гарлаа.");
        setPending(false);
        return;
      }

      setCompletion(payload.completion ?? completion);
      setMessage("CV мэдээлэл MySQL дээр амжилттай хадгалагдлаа.");
      window.dispatchEvent(new Event("cwork:platform-stats-changed"));
      router.refresh();
    } catch {
      setError("Сервертэй холбогдох үед алдаа гарлаа.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.cvEditorGrid}>
      <section className={styles.settingsPanel}>
        <div className={styles.sectionHead}>
          <div>
            <h2 className={styles.sectionTitle}>CV засварлах</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className={styles.chip}>{completion}% complete</span>
            <BackButton href={backHref} />
          </div>
        </div>

        <div className={styles.formGrid}>
          {fieldConfig.map((field) => {
            const value = profile[field.key] as string;

            return (
              <div className={styles.field} key={field.key}>
                <label htmlFor={`cv-${field.key}`}>{field.label}</label>
                {field.rows ? (
                  <textarea
                    id={`cv-${field.key}`}
                    onChange={(event) => updateField(field.key, event.target.value)}
                    rows={field.rows}
                    value={value}
                  />
                ) : (
                  <input
                    id={`cv-${field.key}`}
                    onChange={(event) => updateField(field.key, event.target.value)}
                    type={field.type ?? "text"}
                    value={value}
                  />
                )}
              </div>
            );
          })}

          <div className={styles.formActions}>
            <button className={styles.primaryButton} disabled={pending} onClick={handleSave} type="button">
              {pending ? "Хадгалж байна..." : "CV хадгалах"}
            </button>
            {message ? <span className={styles.formMessage}>{message}</span> : null}
            {error ? <span className={styles.formError}>{error}</span> : null}
          </div>
        </div>
      </section>

      <section className={styles.settingsPanel}>
        <div className={styles.cvPreviewCard}>
          {/* Header */}
          <div className={styles.cvPreviewHeader}>
            <div className={styles.cvPreviewAvatar}>
              {(profile.fullName || "?")[0]?.toUpperCase()}
            </div>
            <div>
              <h3 className={styles.cvPreviewName}>{profile.fullName || "Таны нэр"}</h3>
              <div className={styles.cvPreviewHeadline}>{profile.headline || "Таны headline"}</div>
              {profile.location ? (
                <div className={styles.cvPreviewLocation}>📍 {profile.location}</div>
              ) : null}
            </div>
          </div>

          {/* Completion bar */}
          <div className={styles.cvPreviewProgress}>
            <div className={styles.cvPreviewProgressBar}>
              <div className={styles.cvPreviewProgressFill} style={{ width: `${completion}%` }} />
            </div>
            <span className={styles.cvPreviewProgressLabel}>{completion}% бүрэн</span>
          </div>

          {/* Summary */}
          {profile.professionalSummary ? (
            <div className={styles.cvPreviewBlock}>
              <div className={styles.cvPreviewBlockTitle}>Товч танилцуулга</div>
              <p className={styles.cvPreviewText}>{profile.professionalSummary}</p>
            </div>
          ) : null}

          {/* Contact */}
          <div className={styles.cvPreviewBlock}>
            <div className={styles.cvPreviewBlockTitle}>Холбоо барих</div>
            <div className={styles.cvPreviewContactGrid}>
              {profile.email ? <span>✉ {profile.email}</span> : null}
              {profile.phone ? <span>☎ {profile.phone}</span> : null}
              {profile.location ? <span>📍 {profile.location}</span> : null}
              {profile.availability ? <span>🕐 {profile.availability}</span> : null}
            </div>
          </div>

          {/* Skills */}
          {profile.coreSkills ? (
            <div className={styles.cvPreviewBlock}>
              <div className={styles.cvPreviewBlockTitle}>Ур чадвар</div>
              <div className={styles.cvPreviewTags}>
                {profile.coreSkills.split(/[,\n]/).filter(Boolean).map((skill, i) => (
                  <span className={styles.cvPreviewTag} key={i}>{skill.trim()}</span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Experience */}
          {profile.workExperience ? (
            <div className={styles.cvPreviewBlock}>
              <div className={styles.cvPreviewBlockTitle}>Ажлын туршлага</div>
              <p className={styles.cvPreviewText}>{profile.workExperience}</p>
            </div>
          ) : null}

          {/* Education */}
          {profile.education ? (
            <div className={styles.cvPreviewBlock}>
              <div className={styles.cvPreviewBlockTitle}>Боловсрол</div>
              <p className={styles.cvPreviewText}>{profile.education}</p>
            </div>
          ) : null}

          {/* Achievements */}
          {profile.achievements ? (
            <div className={styles.cvPreviewBlock}>
              <div className={styles.cvPreviewBlockTitle}>Амжилтууд</div>
              <p className={styles.cvPreviewText}>{profile.achievements}</p>
            </div>
          ) : null}

          {/* Links */}
          {(profile.portfolioUrl || profile.linkedinUrl || profile.githubUrl) ? (
            <div className={styles.cvPreviewBlock}>
              <div className={styles.cvPreviewBlockTitle}>Холбоосууд</div>
              <div className={styles.cvPreviewLinks}>
                {profile.portfolioUrl ? (
                  <a className={styles.cvPreviewLink} href={profile.portfolioUrl} rel="noreferrer" target="_blank">🌐 Portfolio</a>
                ) : null}
                {profile.linkedinUrl ? (
                  <a className={styles.cvPreviewLink} href={profile.linkedinUrl} rel="noreferrer" target="_blank">💼 LinkedIn</a>
                ) : null}
                {profile.githubUrl ? (
                  <a className={styles.cvPreviewLink} href={profile.githubUrl} rel="noreferrer" target="_blank">🐙 GitHub</a>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

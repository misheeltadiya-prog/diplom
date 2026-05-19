import type { CvProfile } from "@/lib/profile-cv";
import styles from "@/app/profile/profile.module.css";

type CvPreviewDocumentProps = {
  profile: CvProfile;
  completion?: number;
  showProgress?: boolean;
};

export function CvPreviewDocument({
  profile,
  completion = 0,
  showProgress = true,
}: CvPreviewDocumentProps) {
  return (
    <div className={styles.cvPreviewCard}>
      <div className={styles.cvPreviewHeader}>
        <div className={styles.cvPreviewAvatar}>{(profile.fullName || "?")[0]?.toUpperCase()}</div>
        <div>
          <h3 className={styles.cvPreviewName}>{profile.fullName || "Таны нэр"}</h3>
          <div className={styles.cvPreviewHeadline}>{profile.headline || profile.preferredRole || ""}</div>
          {profile.location ? <div className={styles.cvPreviewLocation}>📍 {profile.location}</div> : null}
        </div>
      </div>

      {showProgress ? (
        <div className={styles.cvPreviewProgress}>
          <div className={styles.cvPreviewProgressBar}>
            <div className={styles.cvPreviewProgressFill} style={{ width: `${completion}%` }} />
          </div>
          <span className={styles.cvPreviewProgressLabel}>{completion}% бүрэн</span>
        </div>
      ) : null}

      {profile.professionalSummary ? (
        <div className={styles.cvPreviewBlock}>
          <div className={styles.cvPreviewBlockTitle}>Товч танилцуулга</div>
          <p className={styles.cvPreviewText}>{profile.professionalSummary}</p>
        </div>
      ) : null}

      <div className={styles.cvPreviewBlock}>
        <div className={styles.cvPreviewBlockTitle}>Холбоо барих</div>
        <div className={styles.cvPreviewContactGrid}>
          {profile.email ? <span>✉ {profile.email}</span> : null}
          {profile.phone ? <span>☎ {profile.phone}</span> : null}
          {profile.location ? <span>📍 {profile.location}</span> : null}
          {profile.availability ? <span>🕐 {profile.availability}</span> : null}
          {profile.salaryExpectation ? <span>💰 {profile.salaryExpectation}</span> : null}
        </div>
      </div>

      {profile.coreSkills ? (
        <div className={styles.cvPreviewBlock}>
          <div className={styles.cvPreviewBlockTitle}>Ур чадвар</div>
          <div className={styles.cvPreviewTags}>
            {profile.coreSkills.split(/[,\n]/).filter(Boolean).map((skill, i) => (
              <span className={styles.cvPreviewTag} key={i}>
                {skill.trim()}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {profile.workExperience ? (
        <div className={styles.cvPreviewBlock}>
          <div className={styles.cvPreviewBlockTitle}>Ажлын туршлага</div>
          <p className={styles.cvPreviewText} style={{ whiteSpace: "pre-wrap" }}>
            {profile.workExperience}
          </p>
        </div>
      ) : null}

      {profile.education ? (
        <div className={styles.cvPreviewBlock}>
          <div className={styles.cvPreviewBlockTitle}>Боловсрол</div>
          <p className={styles.cvPreviewText} style={{ whiteSpace: "pre-wrap" }}>
            {profile.education}
          </p>
        </div>
      ) : null}

      {profile.certifications ? (
        <div className={styles.cvPreviewBlock}>
          <div className={styles.cvPreviewBlockTitle}>Сертификат</div>
          <p className={styles.cvPreviewText} style={{ whiteSpace: "pre-wrap" }}>
            {profile.certifications}
          </p>
        </div>
      ) : null}

      {profile.languages ? (
        <div className={styles.cvPreviewBlock}>
          <div className={styles.cvPreviewBlockTitle}>Хэл</div>
          <p className={styles.cvPreviewText} style={{ whiteSpace: "pre-wrap" }}>
            {profile.languages}
          </p>
        </div>
      ) : null}

      {profile.achievements ? (
        <div className={styles.cvPreviewBlock}>
          <div className={styles.cvPreviewBlockTitle}>Амжилтууд</div>
          <p className={styles.cvPreviewText} style={{ whiteSpace: "pre-wrap" }}>
            {profile.achievements}
          </p>
        </div>
      ) : null}

      {profile.portfolioUrl || profile.linkedinUrl || profile.githubUrl ? (
        <div className={styles.cvPreviewBlock}>
          <div className={styles.cvPreviewBlockTitle}>Холбоосууд</div>
          <div className={styles.cvPreviewLinks}>
            {profile.portfolioUrl ? (
              <a className={styles.cvPreviewLink} href={profile.portfolioUrl} rel="noreferrer" target="_blank">
                Portfolio
              </a>
            ) : null}
            {profile.linkedinUrl ? (
              <a className={styles.cvPreviewLink} href={profile.linkedinUrl} rel="noreferrer" target="_blank">
                LinkedIn
              </a>
            ) : null}
            {profile.githubUrl ? (
              <a className={styles.cvPreviewLink} href={profile.githubUrl} rel="noreferrer" target="_blank">
                GitHub
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
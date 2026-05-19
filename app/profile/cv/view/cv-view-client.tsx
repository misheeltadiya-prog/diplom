"use client";

import Link from "next/link";
import type { CvProfile } from "@/lib/profile-cv";
import { CvPreviewDocument } from "@/components/cv/cv-preview-document";
import { BackButton } from "../../back-button";
import styles from "../../profile.module.css";

type CvViewClientProps = {
  profile: CvProfile;
  completion: number;
  backHref: string;
};

export function CvViewClient({ profile, completion, backHref }: CvViewClientProps) {
  function downloadPdf() {
    const prev = document.title;
    document.title = `${profile.fullName || "CV"} — C-Work`;
    window.print();
    document.title = prev;
  }

  return (
    <div className={styles.cvViewPage}>
      <div className={styles.cvViewToolbar}>
        <BackButton href={backHref} />
        <div className={styles.cvViewToolbarActions}>
          <button className={styles.dashboardBtnGhost} onClick={downloadPdf} type="button">
            CV PDF татах
          </button>
          <Link href="/profile/cv" className={styles.dashboardBtnPrimary}>
            CV засах
          </Link>
        </div>
      </div>

      <section className={`${styles.settingsPanel} ${styles.cvPrintArea}`}>
        <CvPreviewDocument profile={profile} completion={completion} showProgress={false} />
      </section>
    </div>
  );
}

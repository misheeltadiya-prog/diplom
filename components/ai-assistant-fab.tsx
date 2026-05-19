"use client";

import Link from "next/link";
import styles from "./ai-assistant-fab.module.css";

function SparklesIcon() {
  return (
    <svg aria-hidden className={styles.fabIcon} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3v2M12 19v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M3 12h2M19 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
      <path
        d="M12 8.5c-1.2 2.2-2.3 3.3-4.5 4.5 2.2 1.2 3.3 2.3 4.5 4.5 1.2-2.2 2.3-3.3 4.5-4.5-2.2-1.2-3.3-2.3-4.5-4.5Z"
        fill="currentColor"
        opacity="0.92"
      />
    </svg>
  );
}

export function AiAssistantFab() {
  return (
    <Link aria-label="AI туслах — чат нээх" className={styles.fab} href="/ai-job-match">
      <SparklesIcon />
    </Link>
  );
}

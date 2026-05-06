"use client";

import { useRouter } from "next/navigation";
import styles from "./profile.module.css";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      aria-label="Буцах"
      className={styles.overviewBackButton}
      onClick={() => router.back()}
      type="button"
    >
      <span className={styles.overviewBackIcon}>{"\u2190"}</span>
      <span>Буцах</span>
    </button>
  );
}

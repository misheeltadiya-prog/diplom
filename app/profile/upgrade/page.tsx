import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { BackButton } from "../back-button";
import { UpgradeClient } from "./upgrade-client";
import styles from "../profile.module.css";

export default async function ProfileUpgradePage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <section className={styles.sectionCard}>
        <h1 className={styles.sectionTitle}>Нэвтэрч subscription удирдах</h1>
        <Link className={styles.chip} href="/login">
          Нэвтрэх
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHead}>
        <div>
          <h1 className={styles.sectionTitle}>Upgrade &amp; Subscription</h1>
          <p className={styles.muted}>Төлбөрийн холболт placeholder — одоогоор төлөвлөгөө сонгох л болно.</p>
        </div>
        <BackButton />
      </div>
      <UpgradeClient />
    </section>
  );
}

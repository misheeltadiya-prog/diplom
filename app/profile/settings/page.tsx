import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import styles from "../profile.module.css";
import { SettingsForm } from "./settings-form";
import { AvatarUpload } from "./avatar-upload";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRegisteredDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Тодорхойгүй";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export default async function ProfileSettingsPage() {
  const currentUser = await getCurrentUser();
  const initials = getInitials(currentUser?.fullName ?? "C W");

  return (
    <div className={styles.settingsPage}>
      <header className={styles.settingsTopBar}>
        <div className={styles.settingsTopBarLeft}>
          <h1 className={styles.settingsTopTitle}>Хувийн мэдээлэл засах</h1>
        </div>
        <div className={styles.settingsTopBarRight}>
          <Link href="/profile/help" className={styles.settingsHelpLink}>
            Тусламж
          </Link>
        </div>
      </header>

      <div className={styles.settingsLayoutGrid}>
        <section className={styles.settingsEditorCard}>
          <AvatarUpload initials={initials} initialUrl={currentUser?.avatarUrl} userId={currentUser?.id} />
          <SettingsForm
            initialEmail={currentUser?.email ?? ""}
            initialFullName={currentUser?.fullName ?? ""}
            initialPhone={currentUser?.phone ?? ""}
          />
        </section>

        <div className={styles.settingsRailStack}>
          <section className={styles.settingsInfoCard}>
            <div className={styles.settingsCardHead}>
              <span className={styles.settingsCardHeadIcon} aria-hidden>
                ℹ
              </span>
              <h2 className={styles.settingsCardTitle}>Одоогийн мэдээлэл</h2>
            </div>
            <div className={styles.metaList}>
              <div className={styles.metaRow}>
                <strong>Нэр</strong>
                <span>{currentUser?.fullName ?? "Зочин хэрэглэгч"}</span>
              </div>
              <div className={styles.metaRow}>
                <strong>Имэйл</strong>
                <span>{currentUser?.email ?? "Нэвтрээгүй байна"}</span>
              </div>
              <div className={styles.metaRow}>
                <strong>Утас</strong>
                <span>{currentUser?.phone ?? "Мэдээлэл байхгүй"}</span>
              </div>
            </div>
            <p className={styles.settingsMetaRegistered}>
              Бүртгүүлсэн {currentUser?.createdAt ? formatRegisteredDate(currentUser.createdAt) : "—"}
            </p>
          </section>

          <section className={styles.settingsSecurityCard}>
            <h2 className={styles.settingsSecurityTitle}>Аюулгүй байдал</h2>
            <Link href="/forgot-password" className={styles.settingsSecurityLink}>
              <span>Нууц үг шинэчлэх</span>
              <span className={styles.settingsSecurityLinkChevron}>›</span>
            </Link>
          </section>

          <section className={styles.settingsVerifyCard}>
            <h2 className={styles.settingsVerifyTitle}>Бүртгэл баталгаажсан</h2>
            <p className={styles.settingsVerifyText}>
              Таны бүртгэл бүрэн идэвхтэй. Платформын бүх үндсэн боломжуудыг ашиглах боломжтой.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

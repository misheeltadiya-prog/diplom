import { getCurrentUser } from "@/lib/auth";
import styles from "../profile.module.css";
import { BackButton } from "../back-button";
import { SettingsForm } from "./settings-form";
import { AvatarUpload } from "./avatar-upload";

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export default async function ProfileSettingsPage() {
  const currentUser = await getCurrentUser();
  const initials = getInitials(currentUser?.fullName ?? "C W");

  return (
    <>
      <section className={styles.sectionCard}>
        <div className={styles.sectionHead}>
          <div>
            <h2 className={styles.sectionTitle}>Хувийн мэдээлэл засах</h2>
          </div>
          <BackButton />
        </div>

        <div className={styles.settingsGrid}>
          <div className={styles.settingsPanel}>
            {/* Avatar upload */}
            <AvatarUpload initials={initials} initialUrl={currentUser?.avatarUrl} />
            <SettingsForm
              initialEmail={currentUser?.email ?? ""}
              initialFullName={currentUser?.fullName ?? ""}
              initialPhone={currentUser?.phone ?? ""}
            />
          </div>

          <div className={styles.settingsPanel}>
            <div className={styles.settingsPanelCornerBtn}>
              <BackButton />
            </div>
            <div className={styles.metaList}>
              <div className={styles.metaRow}>
                <strong>Одоогийн нэр</strong>
                <span>{currentUser?.fullName ?? "Зочин хэрэглэгч"}</span>
              </div>
              <div className={styles.metaRow}>
                <strong>Одоогийн имэйл</strong>
                <span>{currentUser?.email ?? "Нэвтрээгүй байна"}</span>
              </div>
              <div className={styles.metaRow}>
                <strong>Одоогийн утас</strong>
                <span>{currentUser?.phone ?? "Мэдээлэл байхгүй"}</span>
              </div>
              <div className={styles.metaRow}>
                <strong>Бүртгүүлсэн огноо</strong>
                <span>{currentUser?.createdAt ? formatDateLabel(currentUser.createdAt) : "Тодорхойгүй"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

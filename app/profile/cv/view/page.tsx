import { getCurrentUser } from "@/lib/auth";
import { getPortalHomeHref } from "@/lib/profile-portal-home";
import { calculateCvCompletion, getCvProfileOrDefault } from "@/lib/profile-cv";
import { CvViewClient } from "./cv-view-client";
import styles from "../../profile.module.css";

export default async function ProfileCvViewPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <section className={styles.sectionCard}>
        <h1 className={styles.sectionTitle}>CV харахын тулд эхлээд нэвтэрнэ үү</h1>
      </section>
    );
  }

  const profile = await getCvProfileOrDefault(currentUser);
  const completion = calculateCvCompletion(profile);

  return (
    <CvViewClient
      profile={profile}
      completion={completion}
      backHref={getPortalHomeHref(currentUser.role)}
    />
  );
}

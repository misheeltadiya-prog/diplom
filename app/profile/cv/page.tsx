import { getCurrentUser } from "@/lib/auth";
import { getPortalHomeHref } from "@/lib/profile-portal-home";
import {
  calculateCvCompletion,
  getCvProfileOrDefault,
} from "@/lib/profile-cv";
import { CvEditor } from "./cv-editor";
import styles from "../profile.module.css";

export default async function ProfileCvPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <section className={styles.sectionCard}>
        <h1 className={styles.sectionTitle}>CV засахын тулд эхлээд нэвтэрнэ үү</h1>
      </section>
    );
  }

  const profile = await getCvProfileOrDefault(currentUser);
  const completion = calculateCvCompletion(profile);

  return (
    <>
      <CvEditor
        backHref={getPortalHomeHref(currentUser.role)}
        initialCompletion={completion}
        initialProfile={profile}
      />
    </>
  );
}

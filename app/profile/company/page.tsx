import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { BackButton } from "../back-button";
import { CompanyProfileForm } from "./company-profile-form";
import styles from "../profile.module.css";

export default async function ProfileCompanyPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <section className={styles.sectionCard}>
        <h1 className={styles.sectionTitle}>Нэвтэрнэ үү</h1>
        <Link className={styles.chip} href="/login">
          Нэвтрэх
        </Link>
      </section>
    );
  }
  if (user.role === "freelancer") {
    redirect("/freelancers?publish=1");
  }
  if (user.role === "client") {
    redirect("/jobs");
  }
  if (user.role !== "company") {
    return (
      <section className={styles.sectionCard}>
        <h1 className={styles.sectionTitle}>Company эрх шаардлагатай</h1>
        <p className={styles.muted}>
          Таны одоогийн эрх: <strong>{user.role}</strong>. Компанийн мэдээлэл оруулахын тулд{" "}
          <strong>company</strong> төрлөөр бүртгүүлсэн дансаар нэвтэрнэ үү. Хэрэв та client/freelancer-ээр
          бүртгүүлсэн бол шинэ и-мэйлээр <code>/register?role=company</code> сонгоно уу.
        </p>
        <p className={styles.muted}>
          Өгөгдлийн санд <code>users.role</code> дээр <code>company</code> ENUM болон{" "}
          <code>company_profiles</code> хүснэгт байгаа эсэхийг migration-аар шалгана уу.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
          <Link className={styles.chip} href="/register?role=company">
            Компаниээр бүртгүүлэх
          </Link>
          <Link className={styles.chip} href="/login?role=company">
            Нэвтрэх (company)
          </Link>
          <BackButton />
        </div>
      </section>
    );
  }

  return (
    <div className={styles.companyOnboarding}>
      <section className={`${styles.sectionCard} ${styles.companyOnboardingCard}`}>
        <div className={styles.companyOnboardingHero}>
          <span className={styles.companyOnboardingEyebrow}>Company profile</span>
          <div className={styles.sectionHead}>
            <div>
              <h1 className={styles.sectionTitle}>Компанийн мэдээлэл</h1>
              <p className={styles.muted}>
                Нэр, салбар, байршил, вэб болон танилцуулгаа бөглөснөөр та <strong>/companies</strong> хуудсын жагсаалтад
                нэмэгдэнэ.
              </p>
            </div>
            <BackButton />
          </div>
        </div>
        <CompanyProfileForm />
      </section>
    </div>
  );
}

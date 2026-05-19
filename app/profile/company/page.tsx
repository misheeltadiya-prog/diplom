import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { BackButton } from "../back-button";
import { CompanyDashboardView } from "./company-dashboard-view";
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
          <BackButton role={user.role} />
        </div>
      </section>
    );
  }

  return <CompanyDashboardView userId={user.id} />;
}

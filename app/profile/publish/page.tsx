import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { BackButton } from "../back-button";
import { PublishFreelancerForm } from "./publish-freelancer-form";
import styles from "../profile.module.css";

export default async function ProfilePublishPage() {
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
  if (user.role === "company") {
    redirect("/jobs?post=1");
  }
  if (user.role === "client") {
    redirect("/jobs");
  }
  if (user.role !== "freelancer") {
    return (
      <section className={styles.sectionCard}>
        <h1 className={styles.sectionTitle}>Зар оруулах (freelancer)</h1>
        <p className={styles.muted}>
          Таны одоогийн эрх: <strong>{user.role}</strong>. Зар / portfolio оруулахын тулд{" "}
          <strong>freelancer</strong> төрлийн дансаар нэвтэрнэ эсвэл шинээр бүртгүүлнэ үү. Get started → I&apos;m a
          freelancer → нэвтрэхдээ хуучин client дансаар орсон бол энэ мэдэгдэл гарна.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
          <Link className={styles.chip} href="/register?role=freelancer">
            Шинэ freelancer бүртгэл
          </Link>
          <Link
            className={styles.chip}
            href={`/login?role=freelancer&next=${encodeURIComponent("/freelancers?publish=1")}`}
          >
            Freelancer-ээр нэвтрэх
          </Link>
          <BackButton role={user.role} />
        </div>
      </section>
    );
  }

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHead}>
        <div>
          <h1 className={styles.sectionTitle}>Зар оруулах · засах</h1>
          <p className={styles.muted}>
            Энд зассан мэдээлэл Freelancers жагсаалтын карт дээр шууд тусгагдана. Профайл CV-аас (мэргэжил, ур чадвар,
            цалингийн хүлээлт) хадгалбал зарын талбаруудтай автоматаар синклэгдэнэ. Зураг — Тохиргоо хэсгээс.
          </p>
        </div>
        <BackButton role={user.role} />
      </div>
      <PublishFreelancerForm />
    </section>
  );
}

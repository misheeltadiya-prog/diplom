import Link from "next/link";
import { LoginForm } from "./login-form";
import styles from "./login.module.css";

type Props = {
  searchParams: Promise<{ role?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { role, next } = await searchParams;
  const isClient = role === "client";
  const isFreelancer = role === "freelancer";
  const isCompany = role === "company";

  const roleLabel = isClient
    ? "Client · Hiring for a project"
    : isFreelancer
      ? "Freelancer · Looking for work"
      : isCompany
        ? "Company · Hiring & job posts"
        : null;

  return (
    <main className={styles.shell}>
      <div className={styles.card}>
        <Link className={styles.brand} href="/">
          C-Work
        </Link>

        {roleLabel ? (
          <span className={styles.roleBadge}>{roleLabel}</span>
        ) : null}

        <h1 className={styles.title}>Нэвтрэх</h1>
        <p className={styles.subtitle}>
          {isClient
            ? "Ажилтан хайж, төсөл нийтлэхийн тулд нэвтэрнэ үү."
            : isFreelancer
              ? "Ажлын байр хайж, профайлаа харуулахын тулд нэвтэрнэ үү."
              : isCompany
                ? "Компанийн мэдээлэл, зар, freelancer-д санал илгээхийн тулд нэвтэрнэ үү."
                : "Үргэлжлүүлэхийн тулд нэвтэрнэ үү."}
        </p>
        {isCompany ? (
          <p className={styles.subtitle} style={{ marginTop: "-6px", fontSize: "0.9rem", opacity: 0.92 }}>
            <strong>Анхаар:</strong> «Company»-ээр нэвтрэхэд и-мэйл таны бүртгэл дээрх төрөлтэй таарна. Ажлын зар оруулахын тулд{" "}
            <Link className={styles.footerLink} href="/register?role=company">
              company төрлөөр шинээр бүртгүүлсэн
            </Link>{" "}
            дансаар орох хэрэгтэй — зөвхөн /login?role=company гэж ирэх нь төрлийг өөрчилдөггүй.
          </p>
        ) : null}

        <LoginForm next={next} role={role} />

        <div className={styles.footer}>
          <span>Бүртгэл байхгүй юу?</span>
          <Link
            className={styles.footerLink}
            href={role ? `/register?role=${role}` : "/register"}
          >
            Бүртгүүлэх
          </Link>
        </div>

        <div className={styles.backRow}>
          <Link className={styles.backLink} href="/">
            ← Нүүр хуудас руу буцах
          </Link>
        </div>
      </div>
    </main>
  );
}

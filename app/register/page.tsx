import Link from "next/link";
import { RegisterForm } from "./register-form";
import styles from "./register.module.css";

type Props = {
  searchParams: Promise<{ role?: string }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const { role } = await searchParams;
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

        <h1 className={styles.title}>Бүртгүүлэх</h1>
        <p className={styles.subtitle}>
          {isClient
            ? "Ажилтан хайж, төсөл нийтлэхийн тулд бүртгүүлнэ үү."
            : isFreelancer
              ? "Ажлын байр хайж, профайлаа харуулахын тулд бүртгүүлнэ үү."
              : isCompany
                ? "Компанийн профайл, зар, freelancer-тэй ажиллахын тулд бүртгүүлнэ үү."
                : "Шинэ бүртгэл үүсгэнэ үү."}
        </p>

        <RegisterForm role={role} />

        <div className={styles.footer}>
          <span>Бүртгэл байгаа юу?</span>
          <Link
            className={styles.footerLink}
            href={role ? `/login?role=${role}` : "/login"}
          >
            Нэвтрэх
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

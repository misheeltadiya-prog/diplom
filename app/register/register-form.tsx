"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./register.module.css";

type Props = {
  role?: string | string[];
};

function pickRole(raw: string | string[] | undefined): string | undefined {
  if (typeof raw === "string") {
    return raw.trim() || undefined;
  }
  if (Array.isArray(raw) && typeof raw[0] === "string") {
    return raw[0].trim() || undefined;
  }
  return undefined;
}

export function RegisterForm({ role: roleProp }: Props) {
  const role = pickRole(roleProp);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const data = {
      fullName: (form.elements.namedItem("fullName") as HTMLInputElement).value.trim(),
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem("email") as HTMLInputElement).value.trim(),
      password: (form.elements.namedItem("password") as HTMLInputElement).value,
      confirmPassword: (form.elements.namedItem("confirmPassword") as HTMLInputElement).value,
    };

    if (data.password !== data.confirmPassword) {
      setError("Нууц үг таарахгүй байна.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          password: data.password,
          role: role === "freelancer" || role === "company" ? role : (role ?? "client"),
        }),
      });

      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        devVerifyEmailUrl?: string;
        role?: string;
      };

      if (!res.ok || !json.ok) {
        setError(json.error ?? "Бүртгэх үед алдаа гарлаа.");
        setLoading(false);
        return;
      }

      if (json.devVerifyEmailUrl) {
        // development only — и-мэйл сервергүй үед баталгаажуулах холбоос
        try {
          sessionStorage.setItem("cwork-dev-verify-email", json.devVerifyEmailUrl);
        } catch { /* ignore */ }
      }

      const saved =
        json.role === "company" || json.role === "freelancer" || json.role === "client"
          ? json.role
          : role === "company" || role === "freelancer"
            ? role
            : "client";
      const dest =
        saved === "company"
          ? "/jobs?post=1"
          : saved === "freelancer"
            ? "/freelancers?publish=1"
            : "/jobs";
      router.push(dest);
      router.refresh();
    } catch {
      setError("Сервертэй холбогдоход алдаа гарлаа.");
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {role ? <input type="hidden" name="role" value={role} /> : null}

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Бүтэн нэр</span>
        <input
          className={styles.fieldInput}
          type="text"
          name="fullName"
          placeholder="Овог Нэр"
          required
          autoComplete="name"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Утасны дугаар</span>
        <input
          className={styles.fieldInput}
          type="tel"
          name="phone"
          placeholder="99001122"
          required
          autoComplete="tel"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>И-мэйл</span>
        <input
          className={styles.fieldInput}
          type="email"
          name="email"
          placeholder="name@example.com"
          required
          autoComplete="email"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Нууц үг</span>
        <input
          className={styles.fieldInput}
          type="password"
          name="password"
          placeholder="Хамгийн багадаа 6 тэмдэгт"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Нууц үг давтах</span>
        <input
          className={styles.fieldInput}
          type="password"
          name="confirmPassword"
          placeholder="Нууц үгээ дахин оруулна уу"
          required
          autoComplete="new-password"
        />
      </label>

      {error ? <p className={styles.errorMsg} role="alert">{error}</p> : null}

      <button className={styles.submitBtn} type="submit" disabled={loading}>
        {loading ? "Бүртгэж байна…" : "Бүртгүүлэх"}
      </button>
    </form>
  );
}

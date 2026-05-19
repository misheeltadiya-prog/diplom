"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import styles from "./forgot-password.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setResetUrl(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        devResetUrl?: string;
        message?: string;
        emailSent?: boolean;
      };
      if (!res.ok) {
        setErr(json.error ?? "Алдаа");
        return;
      }
      if (json.devResetUrl) {
        setResetUrl(json.devResetUrl);
        setMsg(
          json.message ??
            "Доорх холбоосоор шинэ нууц үг тохируулна уу (1 цагийн дотор):",
        );
        return;
      }
      setMsg(
        json.message ??
          (json.emailSent
            ? "И-мэйл илгээлээ. Хайрцгаа шалгаад холбоосоор нууц үгээ шинэчилнэ үү."
            : "Хэрэв и-мэйл бүртгэлтэй бол заавар илгээгдэнэ."),
      );
    } catch {
      setErr("Сүлжээний алдаа.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-label="Нууц үг сэргээх">
        <div className={styles.card}>
          <div className={styles.iconBubble} aria-hidden>
            <svg fill="none" height="26" viewBox="0 0 24 24" width="26">
              <path
                d="M9 11.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 0v7m0-3h4m-4 0H6"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
              <path
                d="M13.5 7.2A6 6 0 1 1 12 18.7"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
            </svg>
          </div>

          <h1>Нууц үг сэргээх</h1>
          <p className={styles.subtitle}>Бүртгэлтэй и-мэйл хаягаа оруулна уу.</p>

          <form className={styles.form} onSubmit={submit}>
            <label className={styles.field}>
              <span>И-мэйл хаяг</span>
              <span className={styles.inputWrap}>
                <svg aria-hidden fill="none" height="17" viewBox="0 0 24 24" width="17">
                  <path
                    d="M4 6.5h16v11H4v-11Zm1.4 1.2 6.6 5.2 6.6-5.2"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.6"
                  />
                </svg>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </span>
            </label>

            {err ? <p className={styles.errorMsg}>{err}</p> : null}
            {msg ? <p className={styles.successMsg}>{msg}</p> : null}
            {resetUrl ? (
              <p className={styles.resetLinkWrap}>
                <a className={styles.resetLink} href={resetUrl}>
                  Нууц үг шинэчлэх холбоос
                </a>
              </p>
            ) : null}

            <button className={styles.submitButton} disabled={loading} type="submit">
              <span>{loading ? "Илгээж байна..." : "Илгээх"}</span>
              <span aria-hidden>→</span>
            </button>
          </form>

          <Link className={styles.backLink} href="/login">
            ← Нэвтрэх хэсэг рүү буцах
          </Link>
        </div>

        <div className={styles.infoGrid}>
          <article className={styles.infoCard}>
            <span className={styles.infoIcon} aria-hidden>
              ♜
            </span>
            <div>
              <strong>Аюулгүй байдал</strong>
              <p>Таны мэдээлэл өндөр нууцлалтай хадгалагдана.</p>
            </div>
          </article>
          <article className={styles.infoCard}>
            <span className={styles.infoIcon} aria-hidden>
              ?
            </span>
            <div>
              <strong>Тусламж хэрэгтэй юу?</strong>
              <p>Манай тусламжийн багтай холбогдоно уу.</p>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../profile.module.css";

type SettingsFormProps = {
  initialFullName: string;
  initialEmail: string;
  initialPhone: string;
};

function UserFieldIcon() {
  return (
    <svg aria-hidden fill="none" viewBox="0 0 24 24" width="18" height="18">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 9a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MailFieldIcon() {
  return (
    <svg aria-hidden fill="none" viewBox="0 0 24 24" width="18" height="18">
      <path
        d="M4 6h16v12H4V6Zm0 0 8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneFieldIcon() {
  return (
    <svg aria-hidden fill="none" viewBox="0 0 24 24" width="18" height="18">
      <path
        d="M6.5 3h3l1.5 4.5-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2L21 14.5v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SettingsForm({
  initialFullName,
  initialEmail,
  initialPhone,
}: SettingsFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName, email, phone }),
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Мэдээлэл хадгалах үед алдаа гарлаа.");
        setPending(false);
        return;
      }

      setMessage("Мэдээлэл амжилттай шинэчлэгдлээ.");
      router.refresh();
    } catch {
      setError("Сервертэй холбогдох үед алдаа гарлаа.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className={styles.formGrid} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="settings-full-name">Бүтэн нэр</label>
        <div className={styles.fpInputWrap}>
          <span className={styles.fpInputIcon}>
            <UserFieldIcon />
          </span>
          <input
            id="settings-full-name"
            className={styles.fpInput}
            name="fullName"
            onChange={(event) => setFullName(event.target.value)}
            value={fullName}
          />
        </div>
      </div>

      <div className={styles.settingsFormRow2}>
        <div className={styles.field}>
          <label htmlFor="settings-email">Gmail / Имэйл</label>
          <div className={styles.fpInputWrap}>
            <span className={styles.fpInputIcon}>
              <MailFieldIcon />
            </span>
            <input
              id="settings-email"
              className={styles.fpInput}
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="settings-phone">Утасны дугаар</label>
          <div className={styles.fpInputWrap}>
            <span className={styles.fpInputIcon}>
              <PhoneFieldIcon />
            </span>
            <input
              id="settings-phone"
              className={styles.fpInput}
              name="phone"
              onChange={(event) => setPhone(event.target.value)}
              value={phone}
            />
          </div>
        </div>
      </div>

      {message ? <span className={styles.formMessage}>{message}</span> : null}
      {error ? <span className={styles.formError}>{error}</span> : null}

      <div className={styles.settingsFormActionsRight}>
        <button className={styles.primaryButton} disabled={pending} type="submit">
          {pending ? "Хадгалж байна..." : "Өөрчлөлтийг хадгалах"}
        </button>
      </div>
    </form>
  );
}

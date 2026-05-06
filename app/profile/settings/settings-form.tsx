"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../profile.module.css";

type SettingsFormProps = {
  initialFullName: string;
  initialEmail: string;
  initialPhone: string;
};

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

      setMessage("Profile мэдээлэл амжилттай шинэчлэгдлээ.");
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
        <label htmlFor="settings-full-name">Нэр</label>
        <input
          id="settings-full-name"
          name="fullName"
          onChange={(event) => setFullName(event.target.value)}
          value={fullName}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="settings-email">Gmail / Имэйл</label>
        <input
          id="settings-email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          value={email}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="settings-phone">Утасны дугаар</label>
        <input
          id="settings-phone"
          name="phone"
          onChange={(event) => setPhone(event.target.value)}
          value={phone}
        />
      </div>

      <div className={styles.formActions}>
        <button className={styles.primaryButton} disabled={pending} type="submit">
          {pending ? "Хадгалж байна..." : "Өөрчлөлтийг хадгалах"}
        </button>
        {message ? <span className={styles.formMessage}>{message}</span> : null}
        {error ? <span className={styles.formError}>{error}</span> : null}
      </div>
    </form>
  );
}

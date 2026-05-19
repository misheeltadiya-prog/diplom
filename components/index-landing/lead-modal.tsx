"use client";

import { useState } from "react";
import styles from "./index-landing.module.css";

export type LeadFormPayload = {
  kind: "hire" | "join";
  fullName: string;
  phone: string;
  email: string;
  jobType: string;
  message: string;
  budget: string;
  duration: string;
};

type LeadModalProps = {
  mode: "hire" | "join" | null;
  submitted: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: LeadFormPayload) => void;
};

export function LeadModal({ mode, submitted, submitting, error, onClose, onSubmit }: LeadModalProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [jobType, setJobType] = useState("Вэб хөгжүүлэлт");
  const [message, setMessage] = useState("");
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("1 долоо хоног");

  if (!mode) {
    return null;
  }

  const isJoin = mode === "join";

  function handleSubmit() {
    if (!mode) return;
    onSubmit({
      kind: mode,
      fullName,
      phone,
      email,
      jobType: isJoin ? "" : jobType,
      message,
      budget: isJoin ? "" : budget,
      duration: isJoin ? "" : duration,
    });
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        {submitted ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <div className={styles.successTitle}>Амжилттай илгээгдлээ!</div>
            <div className={styles.successSub}>
              Таны мэдээлэл хүлээн авлаа. Ажлын өдрүүдэд 24 цагийн дотор холбогдоно.
            </div>
            <button className={styles.primaryButton} type="button" onClick={onClose}>
              Хаах
            </button>
          </div>
        ) : (
          <>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle}>{isJoin ? "Freelancer болох" : "Захиалга өгөх"}</div>
                <div className={styles.modalSub}>
                  {isJoin
                    ? "Профайлаа бүртгүүлж ажил эхлэцгээе"
                    : "Мэдээллээ бөглөнө үү, бид тантай холбогдоно"}
                </div>
              </div>
              <button className={styles.closeButton} type="button" onClick={onClose}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Нэр</label>
                <input
                  className={styles.formInput}
                  placeholder="Таны нэр"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Утас</label>
                  <input
                    className={styles.formInput}
                    placeholder="99001234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>И-мэйл</label>
                  <input
                    className={styles.formInput}
                    type="email"
                    placeholder="ta@example.mn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {!isJoin ? (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Ажлын төрөл</label>
                  <select
                    className={styles.formInput}
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                  >
                    <option>Вэб хөгжүүлэлт</option>
                    <option>UI/UX Дизайн</option>
                    <option>Мобайл апп</option>
                    <option>Контент бичих</option>
                    <option>Маркетинг & SEO</option>
                    <option>Өгөгдлийн шинжилгээ</option>
                    <option>Бусад</option>
                  </select>
                </div>
              ) : null}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{isJoin ? "Чадвар & Туршлага" : "Ажлын тайлбар"}</label>
                <textarea
                  className={styles.formInput}
                  rows={5}
                  placeholder={
                    isJoin ? "Та ямар ажил хийж чадах вэ..." : "Хэрэгтэй зүйлээ дэлгэрэнгүй тайлбарлана уу..."
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {!isJoin ? (
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Төсөв (₮)</label>
                    <input
                      className={styles.formInput}
                      placeholder="500,000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Хугацаа</label>
                    <select
                      className={styles.formInput}
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    >
                      <option>1 долоо хоног</option>
                      <option>2 долоо хоног</option>
                      <option>1 сар</option>
                      <option>1 сараас дээш</option>
                    </select>
                  </div>
                </div>
              ) : null}

              {error ? <p className={styles.modalSub} style={{ color: "#f87171" }}>{error}</p> : null}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.ghostButton} type="button" onClick={onClose} disabled={submitting}>
                Болих
              </button>
              <button className={styles.primaryButton} type="button" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Илгээж байна…" : "Илгээх →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

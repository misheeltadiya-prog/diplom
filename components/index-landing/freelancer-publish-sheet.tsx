"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { SessionUser } from "@/lib/auth";
import { PublishFreelancerForm } from "@/app/profile/publish/publish-freelancer-form";
import styles from "./index-landing.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  currentUser: SessionUser | null;
  onSaved: () => void;
};

export function FreelancerPublishSheet({ open, onClose, currentUser, onSaved }: Props) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const isFreelancer = currentUser?.role === "freelancer";

  return (
    <div
      aria-modal="true"
      className={styles.landingSheetOverlay}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      role="presentation"
    >
      <article
        className={`${styles.freelancerGridCard} ${styles.landingSheetPanel}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <button aria-label="Хаах" className={styles.landingSheetClose} onClick={onClose} type="button">
          ×
        </button>
        <h2 className={styles.landingSheetTitle}>Зар оруулах</h2>
        <p className={styles.landingSheetSubtitle}>Freelancers жагсаалтад гаргах мэдээлэл (profile-тай ижил)</p>

        {!currentUser ? (
          <div className={styles.landingSheetGate}>
            <p className={styles.landingSheetGateText}>Эхлээд freelancer дансаар бүртгүүлнэ үү.</p>
            <Link className={styles.freelancerPostProfileBtn} href="/register?role=freelancer" onClick={onClose}>
              Бүртгүүлэх
            </Link>
          </div>
        ) : !isFreelancer ? (
          <div className={styles.landingSheetGate}>
            <p className={styles.landingSheetGateText}>
              Таны эрх: <strong>{currentUser.role}</strong>. Зар оруулахын тулд freelancer данс шаардлагатай.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              <Link className={styles.freelancerPostProfileBtn} href="/register?role=freelancer" onClick={onClose}>
                Шинэ freelancer
              </Link>
              <Link
                className={styles.freelancerPostProfileBtn}
                href={`/login?role=freelancer&next=${encodeURIComponent("/freelancers?publish=1")}`}
                onClick={onClose}
                style={{ background: "#fff", color: "#5b21b6", border: "2px solid rgba(109,40,217,0.35)" }}
              >
                Freelancer-ээр нэвтрэх
              </Link>
            </div>
          </div>
        ) : (
          <PublishFreelancerForm
            onSaved={() => {
              onSaved();
              onClose();
            }}
          />
        )}
      </article>
    </div>
  );
}

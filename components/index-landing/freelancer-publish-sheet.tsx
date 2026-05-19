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
      <article className={styles.freelancerPublishSheet} onClick={(e) => e.stopPropagation()} role="dialog">
        <button aria-label="Хаах" className={styles.landingSheetClose} onClick={onClose} type="button">
          <svg aria-hidden className={styles.landingSheetCloseIcon} height="18" viewBox="0 0 24 24" width="18">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.25" />
          </svg>
        </button>
        <header className={styles.freelancerPublishSheetHeader}>
          <p className={styles.freelancerPublishSheetKicker}>C-WORK · FREELANCER</p>
          <h2>Зар оруулах · засах</h2>
          <p className={styles.freelancerPublishSheetSubtitle}>
            Жагсаалтын карт, дэлгэрэнгүй хуудас таны профайлын зураг, нэртэй нийцнэ. CV хадгалахад доорх талбарууд
            автоматаар шинэчлэгдэнэ.
          </p>
        </header>

        <div className={styles.freelancerPublishSheetBody}>
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
              <div className={styles.freelancerPublishSheetGateActions}>
                <Link className={styles.freelancerPostProfileBtn} href="/register?role=freelancer" onClick={onClose}>
                  Шинэ freelancer
                </Link>
                <Link
                  className={`${styles.freelancerPostProfileBtn} ${styles.freelancerPublishSheetGhostBtn}`}
                  href={`/login?role=freelancer&next=${encodeURIComponent("/freelancers?publish=1")}`}
                  onClick={onClose}
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
        </div>
      </article>
    </div>
  );
}

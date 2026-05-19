"use client";

import { useCallback, useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import styles from "@/components/index-landing/index-landing.module.css";

type ReviewItem = {
  id: number;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type Props = {
  freelancerUserId: number;
  currentUser?: SessionUser | null;
};

export function FreelancerReviewsPanel({ freelancerUserId, currentUser = null }: Props) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [avgRating, setAvgRating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?freelancerId=${freelancerUserId}`, { cache: "no-store" });
      const data = (await res.json()) as { reviews?: ReviewItem[]; avgRating?: string | null };
      setReviews(data.reviews ?? []);
      setAvgRating(data.avgRating ?? null);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [freelancerUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  const canReview =
    Boolean(currentUser) &&
    currentUser!.id !== freelancerUserId &&
    (currentUser!.role === "company" || currentUser!.role === "client" || currentUser!.role === "admin");

  async function submitReview() {
    if (!canReview) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freelancerId: freelancerUserId, rating, comment }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setNote(data.error ?? "Үнэлгээ хадгалахад алдаа.");
        return;
      }
      setComment("");
      setNote("Үнэлгээ хадгалагдлаа.");
      await load();
    } catch {
      setNote("Сүлжээний алдаа.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.profileDashCard} style={{ marginTop: 12 }}>
      <div className={styles.profileDashCardHead}>
        <span className={styles.profileDashCardTitle}>
          Сэтгэгдэл {avgRating ? `· ${avgRating} ★` : ""}
        </span>
      </div>
      {loading ? (
        <p className={styles.profileDashEmptyHint}>Ачаалж байна…</p>
      ) : reviews.length === 0 ? (
        <p className={styles.profileDashEmptyHint}>Одоогоор сэтгэгдэл байхгүй.</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {reviews.map((r) => (
            <li
              key={r.id}
              className={styles.profileDashEmptyHint}
              style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <strong>{r.reviewerName}</strong> · {"★".repeat(r.rating)}
              {r.comment ? <div style={{ marginTop: 4 }}>{r.comment}</div> : null}
            </li>
          ))}
        </ul>
      )}

      {canReview ? (
        <div style={{ marginTop: 12 }}>
          <label className={styles.profileDashEmptyHint} style={{ display: "block", marginBottom: 6 }}>
            Оноо (1–5)
            <select
              className={styles.profileDashChatInput}
              style={{ width: "100%", marginTop: 4 }}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.profileDashEmptyHint} style={{ display: "block", marginBottom: 8 }}>
            Сэтгэгдэл
            <textarea
              className={styles.profileDashChatInput}
              style={{ width: "100%", marginTop: 4, minHeight: 64, resize: "vertical" }}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Туршлагаа хуваалцана уу…"
            />
          </label>
          {note ? <p className={styles.profileDashEmptyHint}>{note}</p> : null}
          <button
            type="button"
            className={`${styles.profileDashChatSend} ${styles.profileDashChatSendWide}`}
            disabled={busy}
            onClick={() => void submitReview()}
          >
            {busy ? "Илгээж байна…" : "Үнэлгээ илгээх"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

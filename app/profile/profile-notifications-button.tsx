"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./profile.module.css";

type OfferItem = {
  id: number;
  title: string;
  message?: string;
  status: string;
  createdAt: string;
  respondedAt?: string | null;
  companyName?: string;
  freelancerName?: string;
};

type NotifItem = {
  id: number;
  type: string;
  title: string;
  body: string;
  createdAt: string;
};

type NotificationsGetResponse = {
  ok?: boolean;
  notifications?: NotifItem[];
  unreadCount?: number;
  error?: string;
};

type OffersResponse = {
  ok?: boolean;
  offers?: OfferItem[];
};

function statusLabel(status: string) {
  switch (status) {
    case "accepted":
      return "Хүлээн авсан";
    case "rejected":
      return "Татгалзсан";
    case "cancelled":
      return "Цуцалсан";
    default:
      return "Хүлээгдэж байна";
  }
}

function offerTitle(offer: OfferItem) {
  if (offer.companyName) return "Санал ирсэн";
  if (offer.status === "accepted") return "Таны санал хүлээн авагдлаа";
  if (offer.status === "rejected") return "Таны санал татгалзлаа";
  if (offer.status === "cancelled") return "Санал цуцлагдсан";
  return "Илгээсэн санал";
}

function offerMeta(offer: OfferItem) {
  const person = offer.companyName ?? offer.freelancerName ?? "";
  const dateValue = offer.respondedAt ?? offer.createdAt;
  const date = dateValue ? new Date(dateValue).toLocaleString("mn-MN") : "";
  return [person, statusLabel(offer.status), date].filter(Boolean).join(" · ");
}

export function ProfileNotificationsButton({ className }: { className?: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [clearingNotifs, setClearingNotifs] = useState(false);

  const refreshUnread = useCallback(() => {
    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: NotificationsGetResponse) => {
        if (typeof data.unreadCount === "number") {
          setUnreadCount(data.unreadCount);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshUnread();
    const intervalId = window.setInterval(refreshUnread, 45_000);
    return () => window.clearInterval(intervalId);
  }, [refreshUnread]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        const [notifRes, offersRes] = await Promise.all([
          fetch("/api/notifications", { cache: "no-store" }),
          fetch("/api/offers", { cache: "no-store" }),
        ]);
        const notifJson = (await notifRes.json()) as NotificationsGetResponse;
        const offersJson = (await offersRes.json()) as OffersResponse;

        if (cancelled) return;

        setNotifications(Array.isArray(notifJson.notifications) ? notifJson.notifications : []);
        if (typeof notifJson.unreadCount === "number") {
          setUnreadCount(notifJson.unreadCount);
        }

        setOffers(
          (offersJson.offers ?? [])
            .filter((offer) => offer.companyName || offer.status === "accepted" || offer.status === "rejected")
            .slice(0, 10),
        );
      } catch {
        if (!cancelled) {
          setNotifications([]);
          setOffers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }

      fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
      if (!cancelled) setUnreadCount(0);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [open]);

  async function clearAllNotifications() {
    if (notifications.length === 0) return;
    if (!window.confirm("Бүх мэдэгдлийг устгах уу?")) return;
    setClearingNotifs(true);
    try {
      const r = await fetch("/api/notifications", { method: "DELETE" });
      if (r.ok) {
        setNotifications([]);
        setUnreadCount(0);
      } else {
        const j = (await r.json()) as { error?: string };
        alert(j.error ?? "Алдаа");
      }
    } finally {
      setClearingNotifs(false);
    }
  }

  const hasRows = notifications.length > 0 || offers.length > 0;

  return (
    <div className={styles.shellNotificationWrap}>
      <button
        aria-expanded={open}
        aria-label="Мэдэгдэл"
        className={className ?? styles.shellActionButton}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <svg aria-hidden fill="none" viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0 }}>
          <path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Мэдэгдэл</span>
        {unreadCount > 0 ? (
          <span className={styles.shellActionBadge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        ) : null}
      </button>

      {open ? (
        <div className={styles.shellNotificationPanel}>
          <div className={styles.shellNotificationHeader}>
            <div>
              <strong>Мэдэгдэл</strong>
              <span>Системийн мэдэгдэл болон саналын түүх</span>
            </div>
            <button
              aria-label="Мэдэгдэл хаах"
              className={styles.shellNotificationClose}
              onClick={() => setOpen(false)}
              type="button"
            >
              ×
            </button>
          </div>

          <div className={styles.shellNotificationToolbar}>
            <button
              className={styles.shellNotificationClearAll}
              disabled={clearingNotifs || notifications.length === 0}
              onClick={() => void clearAllNotifications()}
              type="button"
            >
              {clearingNotifs ? "Устгаж байна…" : "Бүх мэдэгдэл устгах"}
            </button>
          </div>

          <div className={styles.shellNotificationList}>
            {loading ? <p className={styles.shellNotificationHint}>Ачаалж байна...</p> : null}
            {!loading && !hasRows ? (
              <p className={styles.shellNotificationHint}>Одоогоор мэдэгдэл, саналын мэдээлэл алга.</p>
            ) : null}

            {!loading && notifications.length > 0 ? (
              <div className={styles.shellNotificationSection} aria-label="Системийн мэдэгдэл">
                {notifications.map((n) => (
                  <article className={styles.shellNotificationItem} key={`n-${n.id}`}>
                    <strong>{n.title}</strong>
                    {n.body ? <span>{n.body}</span> : null}
                    <span>{new Date(n.createdAt).toLocaleString("mn-MN")}</span>
                  </article>
                ))}
              </div>
            ) : null}

            {!loading && offers.length > 0 ? (
              <div className={styles.shellNotificationSection} aria-label="Санал">
                {notifications.length > 0 ? (
                  <p className={styles.shellNotificationSectionLabel}>Санал</p>
                ) : null}
                {offers.map((offer) => (
                  <article className={styles.shellNotificationItem} key={`o-${offer.id}`}>
                    <strong>{offerTitle(offer)}</strong>
                    <span>{offer.title}</span>
                    <span>{offerMeta(offer)}</span>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

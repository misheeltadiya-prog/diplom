"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./profile.module.css";

type Incoming = {
  id: number;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  companyName: string;
  details?: {
    projectType?: string;
    budget?: string;
    duration?: string;
    startDate?: string;
    location?: string;
    requirements?: string;
  } | null;
};

type Outgoing = {
  id: number;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  freelancerName: string;
};

type Props = {
  mode: "freelancer" | "company";
};

export function OffersPanel({ mode }: Props) {
  const [incoming, setIncoming] = useState<Incoming[]>([]);
  const [outgoing, setOutgoing] = useState<Outgoing[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeIncoming, setActiveIncoming] = useState<Incoming | null>(null);
  const [busyOfferId, setBusyOfferId] = useState<number | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    if (!silent) {
      setLoading(true);
    }
    setErr(null);
    try {
      const r = await fetch("/api/offers", { cache: "no-store" });
      const j = (await r.json()) as {
        ok?: boolean;
        offers?: (Incoming & Outgoing)[];
        error?: string;
      };
      if (!r.ok || !j.ok) {
        setErr(j.error ?? "Алдаа");
        return;
      }
      const list = j.offers ?? [];
      if (mode === "freelancer") {
        setIncoming(
          list.map((o) => ({
            id: o.id,
            title: o.title,
            message: o.message,
            status: o.status,
            createdAt: o.createdAt,
            companyName: (o as Incoming).companyName ?? "",
          })),
        );
      } else {
        setOutgoing(
          list.map((o) => ({
            id: o.id,
            title: o.title,
            message: o.message,
            status: o.status,
            createdAt: o.createdAt,
            freelancerName: (o as Outgoing).freelancerName ?? "",
          })),
        );
      }
    } catch {
      setErr("Сүлжээний алдаа");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [mode]);

  useEffect(() => {
    load();
  }, [load]);

  async function respond(id: number, status: "accepted" | "rejected") {
    setBusyOfferId(id);
    try {
      const r = await fetch(`/api/offers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (r.ok) {
        setActiveIncoming((cur) => (cur?.id === id ? null : cur));
        void load({ silent: true });
      } else {
        const j = (await r.json()) as { error?: string };
        alert(j.error ?? "Алдаа");
      }
    } finally {
      setBusyOfferId(null);
    }
  }

  async function deleteOffer(id: number, status: string) {
    const msg =
      status === "pending"
        ? "Саналыг устгах уу? Компанид татгалзсан тухай мэдэгдэнэ."
        : "Энэ саналыг жагсаалтаас бүрэн устгах уу? Дахин сэргээх боломжгүй.";
    if (!window.confirm(msg)) {
      return;
    }
    setBusyOfferId(id);
    try {
      const r = await fetch(`/api/offers/${id}`, { method: "DELETE" });
      if (r.ok) {
        setActiveIncoming((cur) => (cur?.id === id ? null : cur));
        void load({ silent: true });
      } else {
        const j = (await r.json()) as { error?: string };
        alert(j.error ?? "Алдаа");
      }
    } finally {
      setBusyOfferId(null);
    }
  }

  async function deleteOutgoingOffer(id: number, status: string) {
    const msg =
      status === "pending"
        ? "Саналыг цуцлах уу? Freelancer-д мэдэгдэнэ."
        : "Энэ саналыг жагсаалтаас бүрэн устгах уу?";
    if (!window.confirm(msg)) {
      return;
    }
    setBusyOfferId(id);
    try {
      const r = await fetch(`/api/offers/${id}`, { method: "DELETE" });
      if (r.ok) {
        void load({ silent: true });
      } else {
        const j = (await r.json()) as { error?: string };
        alert(j.error ?? "Алдаа");
      }
    } finally {
      setBusyOfferId(null);
    }
  }

  if (loading) {
    return <p className={styles.muted}>Ачаалж байна…</p>;
  }
  if (err) {
    return <p className={styles.errorMsg}>{err}</p>;
  }

  if (mode === "freelancer") {
    if (incoming.length === 0) {
      return <p className={styles.muted}>Ирсэн ажлын санал байхгүй.</p>;
    }
    return (
      <>
        <div className={styles.offersPanelGrid}>
          {incoming.map((o) => (
            <article className={styles.offersPanelCard} key={o.id}>
              <div className={styles.offersPanelCardTop}>
                <div className={styles.dashboardJobMain}>
                  <h3 className={styles.offersPanelCardTitle}>{o.title}</h3>
                  <div className={styles.offersPanelCardCompany}>{o.companyName}</div>
                </div>
                <div className={styles.offersPanelStatusRow}>
                  <span className={styles.chip} style={{ minHeight: 30 }}>
                    {o.status}
                  </span>
                  <button
                    aria-label="Санал устгах"
                    className={styles.offersPanelIconDelete}
                    disabled={busyOfferId === o.id}
                    onClick={() => void deleteOffer(o.id, o.status)}
                    type="button"
                  >
                    <svg aria-hidden fill="none" height="20" viewBox="0 0 24 24" width="20">
                      <path
                        d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.75"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <p className={styles.offersPanelMessage}>{o.message}</p>
              <div className={styles.offersPanelDate}>{new Date(o.createdAt).toLocaleString("mn-MN")}</div>
              <div className={styles.offersPanelActions}>
                <button disabled={busyOfferId === o.id} type="button" onClick={() => setActiveIncoming(o)}>
                  Дэлгэрэнгүй
                </button>
                {o.status === "pending" ? (
                  <>
                    <button disabled={busyOfferId === o.id} type="button" onClick={() => void respond(o.id, "accepted")}>
                      Хүлээн авах
                    </button>
                    <button disabled={busyOfferId === o.id} type="button" onClick={() => void respond(o.id, "rejected")}>
                      Татгалзах
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        {activeIncoming ? (
          <div
            onClick={() => setActiveIncoming(null)}
            role="presentation"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 80,
              padding: 16,
            }}
          >
            <article
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              style={{
                width: "min(640px,100%)",
                maxHeight: "85vh",
                overflowY: "auto",
                background: "#fff",
                borderRadius: 18,
                padding: 18,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{activeIncoming.title}</h3>
                  <div className={styles.muted}>{activeIncoming.companyName}</div>
                </div>
                <div className={styles.offersPanelStatusRow}>
                  <span className={styles.chip} style={{ minHeight: 30 }}>
                    {activeIncoming.status}
                  </span>
                  <button
                    aria-label="Санал устгах"
                    className={styles.offersPanelIconDelete}
                    disabled={busyOfferId === activeIncoming.id}
                    onClick={() => void deleteOffer(activeIncoming.id, activeIncoming.status)}
                    type="button"
                  >
                    <svg aria-hidden fill="none" height="20" viewBox="0 0 24 24" width="20">
                      <path
                        d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.75"
                      />
                    </svg>
                  </button>
                  <button type="button" onClick={() => setActiveIncoming(null)}>
                    Хаах
                  </button>
                </div>
              </div>
              <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{activeIncoming.message}</p>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {activeIncoming.details?.projectType ? <div><strong>Төслийн төрөл:</strong> {activeIncoming.details.projectType}</div> : null}
                {activeIncoming.details?.budget ? <div><strong>Төсөв/цалин:</strong> {activeIncoming.details.budget}</div> : null}
                {activeIncoming.details?.duration ? <div><strong>Хугацаа:</strong> {activeIncoming.details.duration}</div> : null}
                {activeIncoming.details?.startDate ? <div><strong>Эхлэх огноо:</strong> {activeIncoming.details.startDate}</div> : null}
                {activeIncoming.details?.location ? <div><strong>Байршил:</strong> {activeIncoming.details.location}</div> : null}
                {activeIncoming.details?.requirements ? (
                  <div>
                    <strong>Шаардлага:</strong>
                    <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{activeIncoming.details.requirements}</p>
                  </div>
                ) : null}
              </div>
              {activeIncoming.status === "pending" ? (
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button
                    disabled={busyOfferId === activeIncoming.id}
                    type="button"
                    onClick={() => void respond(activeIncoming.id, "accepted")}
                  >
                    Хүлээн авах
                  </button>
                  <button
                    disabled={busyOfferId === activeIncoming.id}
                    type="button"
                    onClick={() => void respond(activeIncoming.id, "rejected")}
                  >
                    Татгалзах
                  </button>
                </div>
              ) : null}
            </article>
          </div>
        ) : null}
      </>
    );
  }

  if (outgoing.length === 0) {
    return <p className={styles.muted}>Илгээсэн санал байхгүй. Freelancers хуудаас профайл нээнэ үү.</p>;
  }
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {outgoing.map((o) => (
        <li
          key={o.id}
          style={{
            borderBottom: "1px solid rgba(26,20,35,0.08)",
            padding: "14px 0",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <strong>{o.title}</strong>
              <span className={styles.muted}> → {o.freelancerName}</span>
              <div className={styles.muted} style={{ marginTop: 6 }}>
                Төлөв: <strong>{o.status}</strong>
              </div>
            </div>
            <button
              aria-label="Санал устгах"
              className={styles.offersPanelIconDelete}
              disabled={busyOfferId === o.id}
              onClick={() => void deleteOutgoingOffer(o.id, o.status)}
              type="button"
            >
              <svg aria-hidden fill="none" height="20" viewBox="0 0 24 24" width="20">
                <path
                  d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                />
              </svg>
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

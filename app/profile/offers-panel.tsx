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

  const load = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    load();
  }, [load]);

  async function respond(id: number, status: "accepted" | "rejected") {
    const r = await fetch(`/api/offers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) load();
    else {
      const j = (await r.json()) as { error?: string };
      alert(j.error ?? "Алдаа");
    }
  }

  async function cancelOffer(id: number) {
    const r = await fetch(`/api/offers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (r.ok) load();
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
        <div style={{ display: "grid", gap: 12 }}>
          {incoming.map((o) => (
            <article
              key={o.id}
              style={{
                border: "1px solid rgba(26,20,35,0.1)",
                borderRadius: 16,
                padding: 14,
                background: "#fff",
                boxShadow: "0 8px 20px rgba(15,23,42,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <strong>{o.title}</strong>
                  <div className={styles.muted}>{o.companyName}</div>
                </div>
                <span className={styles.chip} style={{ minHeight: 30 }}>
                  {o.status}
                </span>
              </div>
              <p className={styles.muted} style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                {o.message}
              </p>
              <div className={styles.muted} style={{ marginTop: 6 }}>
                {new Date(o.createdAt).toLocaleString("mn-MN")}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button type="button" onClick={() => setActiveIncoming(o)}>
                  Дэлгэрэнгүй
                </button>
                {o.status === "pending" ? (
                  <>
                    <button type="button" onClick={() => respond(o.id, "accepted")}>
                      Хүлээн авах
                    </button>
                    <button type="button" onClick={() => respond(o.id, "rejected")}>
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
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <h3 style={{ margin: 0 }}>{activeIncoming.title}</h3>
                  <div className={styles.muted}>{activeIncoming.companyName}</div>
                </div>
                <button type="button" onClick={() => setActiveIncoming(null)}>
                  Хаах
                </button>
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
                  <button type="button" onClick={() => void respond(activeIncoming.id, "accepted")}>
                    Хүлээн авах
                  </button>
                  <button type="button" onClick={() => void respond(activeIncoming.id, "rejected")}>
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
          <strong>{o.title}</strong>
          <span className={styles.muted}> → {o.freelancerName}</span>
          <div className={styles.muted} style={{ marginTop: 6 }}>
            Төлөв: <strong>{o.status}</strong>
          </div>
          {o.status === "pending" ? (
            <button style={{ marginTop: 8 }} type="button" onClick={() => cancelOffer(o.id)}>
              Цуцлах
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SessionUser } from "@/lib/auth";
import styles from "./profile.module.css";

type Thread = {
  conversationId: string;
  otherUser: { id: number; fullName: string; role: string; avatarUrl: string | null } | null;
  lastMessage: { id: number; text: string; at: string; fromMe: boolean } | null;
};

type ChatMsg = {
  id: number;
  sender: "me" | "other";
  text: string;
  time: string;
};

export function ChatHistoryButton({
  currentUser,
  triggerClassName,
  triggerLabel,
}: {
  currentUser: SessionUser;
  triggerClassName?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  const activeThread = useMemo(
    () => threads.find((t) => t.conversationId === activeId) ?? null,
    [threads, activeId],
  );

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/chat/inbox", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { threads?: Thread[] }) => setThreads(data.threads ?? []))
      .catch(() => setThreads([]))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open || !activeId) {
      sseRef.current?.close();
      sseRef.current = null;
      return;
    }

    setMsgLoading(true);
    fetch(`/api/chat/thread/${encodeURIComponent(activeId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { messages?: Array<{ id: number; sender: string; message: string; time: string }> }) => {
        setMessages(
          (data.messages ?? []).map((m) => ({
            id: m.id,
            sender: m.sender as "me" | "other",
            text: m.message,
            time: m.time,
          })),
        );
      })
      .catch(() => setMessages([]))
      .finally(() => setMsgLoading(false));

    const es = new EventSource(`/api/chat/thread/${encodeURIComponent(activeId)}/stream`);
    sseRef.current = es;
    es.addEventListener("message", (e) => {
      try {
        const msg = JSON.parse(e.data) as { id: number; sender: string; message: string; time: string };
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, { id: msg.id, sender: msg.sender as "me" | "other", text: msg.message, time: msg.time }];
        });
      } catch {
        /* ignore */
      }
    });

    return () => {
      es.close();
      sseRef.current = null;
    };
  }, [open, activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function send() {
    const body = text.trim();
    if (!activeId || !body || sending) return;
    setSending(true);
    setText("");
    fetch(`/api/chat/thread/${encodeURIComponent(activeId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: body }),
    })
      .then((r) => r.json())
      .then((data: { ok?: boolean; message?: { id: number; sender: string; message: string; time: string } }) => {
        const m = data.message;
        if (data.ok && m) {
          setMessages((prev) => [...prev, { id: m.id, sender: "me", text: m.message, time: m.time }]);
        }
      })
      .catch(() => {})
      .finally(() => setSending(false));
  }

  return (
    <>
      <button
        className={triggerClassName ?? styles.overviewBackButton}
        onClick={() => setOpen(true)}
        type="button"
        aria-label="Мессежийн түүх"
      >
        <svg aria-hidden fill="none" viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0 }}>
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{triggerLabel ?? "Мессеж"}</span>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div className={styles.chatHistoryOverlay} role="presentation" onClick={() => setOpen(false)}>
              <div
                className={styles.chatHistoryModal}
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.chatHistoryHeader}>
                  <div>
                    <strong>Мессежийн түүх</strong>
                    <div className={styles.chatHistorySub}>Нэвтэрсэн хэрэглэгч: {currentUser.fullName}</div>
                  </div>
                  <button
                    className={styles.chatHistoryClose}
                    onClick={() => setOpen(false)}
                    type="button"
                    aria-label="Хаах"
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.chatHistoryBody}>
                  <aside className={styles.chatHistoryThreads}>
                    {loading ? <div className={styles.chatHistoryHint}>Ачаалж байна...</div> : null}
                    {!loading && threads.length === 0 ? (
                      <div className={styles.chatHistoryHint}>Одоогоор мессежийн түүх алга.</div>
                    ) : null}
                    {threads.map((t) => (
                      <button
                        key={t.conversationId}
                        type="button"
                        className={`${styles.chatHistoryThreadRow} ${
                          t.conversationId === activeId ? styles.chatHistoryThreadRowActive : ""
                        }`}
                        onClick={() => setActiveId(t.conversationId)}
                      >
                        <div className={styles.chatHistoryAvatar}>
                          {t.otherUser?.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img alt="" src={t.otherUser.avatarUrl} />
                          ) : (
                            (t.otherUser?.fullName?.[0] ?? "?").toUpperCase()
                          )}
                        </div>
                        <div className={styles.chatHistoryThreadMeta}>
                          <div className={styles.chatHistoryThreadTop}>
                            <strong>{t.otherUser?.fullName ?? "Unknown"}</strong>
                            <span>{t.otherUser?.role ?? ""}</span>
                          </div>
                          <div className={styles.chatHistoryThreadBottom}>
                            <span className={styles.chatHistoryThreadPreview}>
                              {t.lastMessage?.text?.slice(0, 42) ?? ""}
                            </span>
                            <span className={styles.chatHistoryThreadTime}>
                              {t.lastMessage ? new Date(t.lastMessage.at).toLocaleDateString("en-CA") : ""}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </aside>

                  <section className={styles.chatHistoryChat}>
                    {!activeThread ? (
                      <div className={styles.chatHistoryEmpty}>
                        <strong>Thread сонгоно уу</strong>
                        <span>Зүүн талаас хүнээ сонгоод мессежийн түүхээ харна.</span>
                      </div>
                    ) : (
                      <>
                        <div className={styles.chatHistoryChatTop}>
                          <div>
                            <strong>{activeThread.otherUser?.fullName ?? "Хэрэглэгч"}</strong>
                            <span>{activeThread.otherUser?.role ?? ""}</span>
                          </div>
                        </div>

                        <div className={styles.chatHistoryMessages}>
                          {msgLoading ? <div className={styles.chatHistoryHint}>Түүх ачаалж байна...</div> : null}
                          {messages.map((m) => (
                            <div
                              key={m.id}
                              className={`${styles.chatHistoryMsg} ${
                                m.sender === "me" ? styles.chatHistoryMsgMe : styles.chatHistoryMsgOther
                              }`}
                            >
                              <div className={styles.chatHistoryBubble}>{m.text}</div>
                              <div className={styles.chatHistoryMsgTime}>{m.time}</div>
                            </div>
                          ))}
                          <div ref={bottomRef} />
                        </div>

                        <div className={styles.chatHistoryComposer}>
                          <input
                            className={styles.chatHistoryInput}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Мессеж бичих..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter") send();
                            }}
                          />
                          <button
                            type="button"
                            className={styles.chatHistoryComposerSend}
                            aria-label="Илгээх"
                            disabled={sending || !text.trim()}
                            onClick={send}
                          >
                            <svg aria-hidden fill="none" height="18" viewBox="0 0 24 24" width="18">
                              <path
                                d="m22 2-7 20-4-9-9-4Zm0 0L11 13"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                              />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </section>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}


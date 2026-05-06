"use client";

import { useEffect, useRef, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import type { JobSeekerPublic } from "@/lib/job-seekers";
import type { CvProfile } from "@/lib/profile-cv";
import styles from "./index-landing.module.css";

type JobSeekerDetailModalProps = {
  seeker: JobSeekerPublic | null;
  onClose: () => void;
  currentUser?: SessionUser | null;
};

type ChatMsg = {
  id: number;
  senderId?: number;
  receiverId?: number;
  senderName?: string;
  message?: string;
  sender: "me" | "other";
  text: string;
  time: string;
};

const locationPool = ["Улаанбаатар", "Улаанбаатар / Hybrid", "Remote", "Remote / UB", "Дархан", "Эрдэнэт"];

function buildContact(seeker: JobSeekerPublic) {
  const tail = String(1000 + (seeker.id % 9000)).padStart(4, "0");
  return {
    phone: `+976 99${tail}`,
    email: `freelancer${seeker.id}@cwork.local`,
    location: locationPool[seeker.id % locationPool.length],
    id: `CW-${String(seeker.id).padStart(4, "0")}`,
  };
}

function parseWorkExperience(raw: string) {
  if (!raw.trim()) return [];
  return raw.split(/\n+/).filter(Boolean).slice(0, 4).map((line) => {
    const parts = line.split(/[|,–-]/).map((p) => p.trim());
    return { company: parts[0] ?? line, role: parts[1] ?? "", duration: parts[2] ?? "" };
  });
}

function parseSkills(raw: string) {
  if (!raw.trim()) return [];
  return raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 8);
}

function chartBars(seeker: JobSeekerPublic) {
  const heights = [45, 55, 60, 82, 50, 65, 70, 75];
  return heights.map((h, i) => ({ height: h + ((seeker.id + i * 3) % 18), active: i === 3 }));
}

const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

const KNOWN_LANGUAGES = [
  "Монгол", "Англи", "Орос", "Хятад", "Япон", "Солонгос",
  "Герман", "Франц", "Испани", "Арабын", "Турк", "Итали",
];

function nowTime() {
  return new Date().toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" });
}

export function JobSeekerDetailModal({ seeker, onClose, currentUser = null }: JobSeekerDetailModalProps) {
  const [cv, setCv] = useState<CvProfile | null>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [offerTitle, setOfferTitle] = useState("");
  const [offerMsg, setOfferMsg] = useState("");
  const [offerBudget, setOfferBudget] = useState("");
  const [offerDuration, setOfferDuration] = useState("");
  const [offerStartDate, setOfferStartDate] = useState("");
  const [offerLocation, setOfferLocation] = useState("");
  const [offerProjectType, setOfferProjectType] = useState("");
  const [offerRequirements, setOfferRequirements] = useState("");
  const [offerBusy, setOfferBusy] = useState(false);
  const [offerNote, setOfferNote] = useState<string | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  const cvUserId = seeker?.linkedUserId ?? seeker?.id;
  /** job_seeker_profiles.id — API /api/chat/[seekerId] */
  const chatSeekerId = seeker?.id ?? null;
  /** Өөрийн картыг нээсэн freelancer өөртөө чат илгээхгүй; бусад нэвтэрсэн хэрэглэгчид чатлаж болно. */
  const showChat = Boolean(
    seeker && currentUser && seeker.linkedUserId !== currentUser.id,
  );
  const showCompanyOffer =
    Boolean(currentUser?.role === "company");
  const canSendCompanyOffer = Boolean(seeker?.linkedUserId);

  useEffect(() => {
    if (!seeker) { setCv(null); setChatOpen(false); return; }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setCvLoading(true);
    if (!cvUserId) {
      setCv(null);
      setCvLoading(false);
      return;
    }
    fetch(`/api/profile/cv/user/${cvUserId}`)
      .then((r) => r.json())
      .then((data: { profile?: CvProfile }) => setCv(data.profile ?? null))
      .catch(() => setCv(null))
      .finally(() => setCvLoading(false));
    return () => { document.body.style.overflow = prev; };
  }, [seeker, cvUserId]);

  // Load history + open SSE stream when chat opens
  useEffect(() => {
    if (!chatOpen || !seeker || !chatSeekerId) {
      sseRef.current?.close();
      sseRef.current = null;
      return;
    }

    // Load history
    setChatLoading(true);
    fetch(`/api/chat/${chatSeekerId}`)
      .then((r) => r.json())
      .then((data: { messages?: Array<{ id: number; sender: string; message: string; time: string }> }) => {
        setChatMsgs((data.messages ?? []).map((m) => ({
          id: m.id, sender: m.sender as "me" | "other", text: m.message, time: m.time,
        })));
      })
      .catch(() => {})
      .finally(() => setChatLoading(false));

    // Open SSE stream for real-time updates
    const es = new EventSource(`/api/chat/${chatSeekerId}/stream`);
    sseRef.current = es;

    es.addEventListener("message", (e) => {
      try {
        const msg = JSON.parse(e.data) as { id: number; sender: string; message: string; time: string };
        setChatMsgs((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, { id: msg.id, sender: msg.sender as "me" | "other", text: msg.message, time: msg.time }];
        });
      } catch { /* ignore */ }
    });

    return () => {
      es.close();
      sseRef.current = null;
    };
  }, [chatOpen, seeker, chatSeekerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs.length]);

  if (!seeker) return null;

  const contact = buildContact(seeker);
  const chart = chartBars(seeker);
  const peakVal = Math.max(...chart.map((b) => b.height));
  const workItems = cv?.workExperience
    ? parseWorkExperience(cv.workExperience)
    : [{ company: seeker.roleTitle, role: "Freelancer", duration: `${2 + (seeker.id % 7)}+ жил` }];
  const skillList = cv?.coreSkills ? parseSkills(cv.coreSkills) : seeker.skills.slice(0, 8);
  const barItems = skillList.slice(0, 5).map((skill, i) => ({
    label: skill,
    left: 25 + ((seeker.id + i * 7) % 40),
    right: 30 + ((seeker.id + i * 11) % 45),
  }));

  function sendOffer() {
    if (!seeker?.linkedUserId || !offerTitle.trim() || !offerMsg.trim() || offerBusy) return;
    setOfferBusy(true);
    setOfferNote(null);
    fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        freelancerUserId: seeker.linkedUserId,
        title: offerTitle.trim(),
        message: offerMsg.trim(),
        details: {
          budget: offerBudget.trim(),
          duration: offerDuration.trim(),
          startDate: offerStartDate.trim(),
          location: offerLocation.trim(),
          projectType: offerProjectType.trim(),
          requirements: offerRequirements.trim(),
        },
      }),
    })
      .then(async (r) => {
        const j = (await r.json()) as { ok?: boolean; error?: string };
        if (!r.ok) throw new Error(j.error ?? "Алдаа");
        setOfferNote("Санал амжилттай илгээгдлээ.");
        setOfferTitle("");
        setOfferMsg("");
        setOfferBudget("");
        setOfferDuration("");
        setOfferStartDate("");
        setOfferLocation("");
        setOfferProjectType("");
        setOfferRequirements("");
      })
      .catch((e: Error) => {
        const message =
          e.message.includes("403") || e.message.includes("Зөвхөн company")
            ? "Энэ хүсэлтийг зөвхөн company эрхтэй хэрэглэгч явуулна."
            : e.message;
        setOfferNote(message);
      })
      .finally(() => setOfferBusy(false));
  }

  function sendChat() {
    const text = chatInput.trim();
    if (!text || !seeker || !chatSeekerId || chatSending) return;
    setChatSending(true);
    setChatInput("");

    fetch(`/api/chat/${chatSeekerId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    })
      .then((r) => r.json())
      .then((data: { ok?: boolean; message?: { id: number; sender: string; message: string; time: string } }) => {
        if (data.ok && data.message) {
          setChatMsgs((prev) => [...prev, {
            id: data.message!.id,
            sender: "me",
            text: data.message!.message,
            time: data.message!.time,
          }]);
        }
      })
      .catch(() => {})
      .finally(() => setChatSending(false));
  }

  return (
    <div className={styles.profileDashOverlay} onClick={onClose} role="presentation">
      <div className={styles.profileDashPanel} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className={styles.profileDashClose} onClick={onClose} type="button" aria-label="Хаах">✕</button>

        {/* ── Header ── */}
        <div className={styles.profileDashHeader}>
          <img alt={seeker.fullName} className={styles.profileDashAvatar}
            src={`https://i.pravatar.cc/240?img=${(seeker.id % 70) + 1}`} />
          <div className={styles.profileDashHeaderInfo}>
            <div className={styles.profileDashHeaderTop}>
              <div>
                <h2 className={styles.profileDashName}>{seeker.fullName}</h2>
                <p className={styles.profileDashId}>{contact.id}</p>
              </div>
              <div className={styles.profileDashHeaderActions}>
                {showChat ? (
                  <button
                    className={`${styles.profileDashEditBtn} ${chatOpen ? styles.profileDashEditBtnActive : ""}`}
                    onClick={() => setChatOpen((o) => !o)}
                    type="button"
                  >
                    <svg fill="none" height="14" viewBox="0 0 24 24" width="14">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                        stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    </svg>
                    Chat
                  </button>
                ) : seeker.linkedUserId === currentUser?.id ? (
                  <span className={styles.profileDashEmptyHint} style={{ fontSize: "0.78rem" }}>
                    Өөрийн профайл — чат харагдахгүй
                  </span>
                ) : !currentUser ? (
                  <span className={styles.profileDashEmptyHint} style={{ fontSize: "0.78rem" }}>
                    Чатлахын тулд нэвтэрнэ үү
                  </span>
                ) : null}
                {showCompanyOffer ? (
                  <button
                    className={styles.profileDashEditBtn}
                    onClick={() => {
                      setOfferNote(canSendCompanyOffer ? null : "Энэ профайл demo тул шууд хүсэлт явуулах боломжгүй.");
                      setOfferModalOpen(true);
                    }}
                    type="button"
                  >
                    Хүсэлт явуулах
                  </button>
                ) : null}
              </div>
            </div>
            <div className={styles.profileDashHeaderMeta}>
              <div className={styles.profileDashMetaItem}>
                <span className={styles.profileDashMetaLabel}>Мэргэжил</span>
                <span className={styles.profileDashMetaValue}>{seeker.roleTitle}</span>
              </div>
              <div className={styles.profileDashMetaItem}>
                <span className={styles.profileDashMetaLabel}>Байршил</span>
                <span className={styles.profileDashMetaValue}>{cv?.location || contact.location}</span>
              </div>
              <div className={styles.profileDashMetaItem}>
                <span className={styles.profileDashMetaLabel}>Холбоо барих</span>
                <span className={styles.profileDashMetaValue}>{contact.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {showCompanyOffer && offerModalOpen ? (
          <div
            className={styles.profileDashOverlay}
            onClick={() => setOfferModalOpen(false)}
            role="presentation"
            style={{ zIndex: 95, background: "rgba(13, 13, 15, 0.6)" }}
          >
            <div
              className={styles.profileDashPanel}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              style={{ maxWidth: 760, maxHeight: "88vh", overflowY: "auto", padding: 20 }}
            >
              <button className={styles.profileDashClose} onClick={() => setOfferModalOpen(false)} type="button" aria-label="Хаах">✕</button>
              <div className={styles.profileDashCardHead}>
                <span className={styles.profileDashCardTitle}>Ажлын санал илгээх (компани)</span>
              </div>
              <label className={styles.profileDashEmptyHint} style={{ display: "block", marginBottom: 8 }}>
                Гарчиг
                <input
                  className={styles.profileDashChatInput}
                  style={{ width: "100%", marginTop: 4 }}
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  placeholder="Жишээ: React төсөл — 2 сар"
                />
              </label>
              <label className={styles.profileDashEmptyHint} style={{ display: "block", marginBottom: 8 }}>
                Саналын агуулга
                <textarea
                  className={styles.profileDashChatInput}
                  style={{ width: "100%", marginTop: 4, minHeight: 80, resize: "vertical" }}
                  value={offerMsg}
                  onChange={(e) => setOfferMsg(e.target.value)}
                  placeholder="Төслийн товч тайлбар, цалин, хугацаа..."
                />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginBottom: 8 }}>
                <label className={styles.profileDashEmptyHint} style={{ display: "block" }}>
                  Төслийн төрөл
                  <input
                    className={styles.profileDashChatInput}
                    style={{ width: "100%", marginTop: 4 }}
                    value={offerProjectType}
                    onChange={(e) => setOfferProjectType(e.target.value)}
                    placeholder="Remote / Contract"
                  />
                </label>
                <label className={styles.profileDashEmptyHint} style={{ display: "block" }}>
                  Төсөв / цалин
                  <input
                    className={styles.profileDashChatInput}
                    style={{ width: "100%", marginTop: 4 }}
                    value={offerBudget}
                    onChange={(e) => setOfferBudget(e.target.value)}
                    placeholder="3.5 сая ₮ / сар"
                  />
                </label>
                <label className={styles.profileDashEmptyHint} style={{ display: "block" }}>
                  Хугацаа
                  <input
                    className={styles.profileDashChatInput}
                    style={{ width: "100%", marginTop: 4 }}
                    value={offerDuration}
                    onChange={(e) => setOfferDuration(e.target.value)}
                    placeholder="3 сар"
                  />
                </label>
                <label className={styles.profileDashEmptyHint} style={{ display: "block" }}>
                  Эхлэх огноо
                  <input
                    className={styles.profileDashChatInput}
                    style={{ width: "100%", marginTop: 4 }}
                    value={offerStartDate}
                    onChange={(e) => setOfferStartDate(e.target.value)}
                    placeholder="2026-06-01"
                  />
                </label>
              </div>
              <label className={styles.profileDashEmptyHint} style={{ display: "block", marginBottom: 8 }}>
                Байршил
                <input
                  className={styles.profileDashChatInput}
                  style={{ width: "100%", marginTop: 4 }}
                  value={offerLocation}
                  onChange={(e) => setOfferLocation(e.target.value)}
                  placeholder="Ulaanbaatar / Remote"
                />
              </label>
              <label className={styles.profileDashEmptyHint} style={{ display: "block", marginBottom: 8 }}>
                Шаардлага
                <textarea
                  className={styles.profileDashChatInput}
                  style={{ width: "100%", marginTop: 4, minHeight: 74, resize: "vertical" }}
                  value={offerRequirements}
                  onChange={(e) => setOfferRequirements(e.target.value)}
                  placeholder="React 3+ жил, API integration, Git workflow..."
                />
              </label>
              {offerNote ? <p className={styles.profileDashEmptyHint}>{offerNote}</p> : null}
              <button
                className={styles.profileDashChatSend}
                disabled={offerBusy || !canSendCompanyOffer}
                onClick={sendOffer}
                type="button"
                style={{ width: "100%", justifyContent: "center" }}
              >
                {offerBusy ? "Илгээж байна…" : canSendCompanyOffer ? "Санал илгээх" : "Илгээх боломжгүй"}
              </button>
            </div>
          </div>
        ) : null}

        {seeker.portfolioItems && seeker.portfolioItems.length > 0 ? (
          <div className={styles.profileDashCard} style={{ marginTop: 12 }}>
            <div className={styles.profileDashCardHead}>
              <span className={styles.profileDashCardTitle}>Portfolio</span>
            </div>
            <ul className={styles.profileDashEmptyHint} style={{ margin: 0, paddingLeft: 18 }}>
              {seeker.portfolioItems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* ── Inline Chat ── */}
        {chatOpen && showChat ? (
          <div className={styles.profileDashChatBox}>
            <div className={styles.profileDashChatHeader}>
              <img alt={seeker.fullName} className={styles.profileDashChatAvatar}
                src={`https://i.pravatar.cc/240?img=${(seeker.id % 70) + 1}`} />
              <div>
                <span className={styles.profileDashChatName}>{seeker.fullName}</span>
                <span className={styles.profileDashChatOnline}>● Онлайн</span>
              </div>
            </div>
            <div className={styles.profileDashChatMessages}>
              {chatLoading ? (
                <p className={styles.profileDashEmptyHint} style={{ textAlign: "center", padding: "12px" }}>Ачаалж байна…</p>
              ) : chatMsgs.length === 0 ? (
                <p className={styles.profileDashEmptyHint} style={{ textAlign: "center", padding: "12px" }}>Мессеж байхгүй байна. Эхлэн бичнэ үү!</p>
              ) : chatMsgs.map((msg) => (
                <div key={msg.id}
                  className={`${styles.profileDashChatBubbleWrap} ${msg.sender === "me" ? styles.profileDashChatBubbleWrapMe : ""}`}>
                  <div className={`${styles.profileDashChatBubble} ${msg.sender === "me" ? styles.profileDashChatBubbleMe : styles.profileDashChatBubbleOther}`}>
                    {msg.text}
                  </div>
                  <span className={styles.profileDashChatTime}>{msg.time}</span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className={styles.profileDashChatInputRow}>
              <input
                className={styles.profileDashChatInput}
                placeholder="Мессеж бичих..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
                disabled={chatSending}
              />
              <button className={styles.profileDashChatSend} onClick={sendChat} type="button" disabled={chatSending}>
                <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor"
                    strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                </svg>
              </button>
            </div>
          </div>
        ) : null}

        {/* ── Row 2 ── */}
        <div className={styles.profileDashRow2}>
          <div className={styles.profileDashCard}>
            <div className={styles.profileDashCardHead}>
              <span className={styles.profileDashCardTitle}>Үнэлгээний явц</span>
            </div>
            <div className={styles.profileDashChart}>
              {chart.map((bar, i) => (
                <div className={styles.profileDashChartCol} key={i}>
                  {bar.active ? <span className={styles.profileDashChartLabel}>{bar.height}%</span> : null}
                  <div className={`${styles.profileDashChartBar} ${bar.active ? styles.profileDashChartBarActive : ""}`}
                    style={{ height: `${(bar.height / peakVal) * 100}%` }} />
                  <span className={styles.profileDashChartMonth}>{months[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.profileDashCard}>
            <div className={styles.profileDashCardHead}>
              <span className={styles.profileDashCardTitle}>Ажлын туршлага</span>
            </div>
            <div className={styles.profileDashSessionList}>
              {workItems.length > 0 ? workItems.map((item, i) => (
                <div className={styles.profileDashSession} key={i}>
                  <span className={styles.profileDashSessionTag}>{item.role || seeker.roleTitle}</span>
                  <div className={styles.profileDashSessionTitle}>{item.company}</div>
                  {item.duration ? <div className={styles.profileDashSessionMeta}>{item.duration}</div> : null}
                </div>
              )) : <p className={styles.profileDashEmptyHint}>CV дээр ажлын туршлага оруулаагүй байна.</p>}
            </div>
          </div>

          <div className={styles.profileDashCard}>
            <div className={styles.profileDashCardHead}>
              <span className={styles.profileDashCardTitle}>Ур чадвар</span>
            </div>
            <div className={styles.profileDashSkillTags}>
              {skillList.length > 0 ? skillList.map((skill) => (
                <span className={styles.profileDashSkillTag} key={skill}>{skill}</span>
              )) : <p className={styles.profileDashEmptyHint}>CV дээр ур чадвар оруулаагүй байна.</p>}
            </div>
          </div>
        </div>

        {/* ── Row 3 ── */}
        <div className={styles.profileDashRow3}>
          <div className={styles.profileDashCard}>
            <div className={styles.profileDashCardHead}>
              <span className={styles.profileDashCardTitle}>Чадварын түвшин</span>
            </div>
            <div className={styles.profileDashBarList}>
              {barItems.map((item) => (
                <div className={styles.profileDashBarItem} key={item.label}>
                  <span className={styles.profileDashBarLabel}>{item.label}</span>
                  <div className={styles.profileDashBarTrack}>
                    <div className={styles.profileDashBarFillLeft} style={{ width: `${item.left}%` }} />
                    <div className={styles.profileDashBarFillRight} style={{ width: `${item.right}%` }} />
                  </div>
                  <span className={styles.profileDashBarPct}>{item.right}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.profileDashCard}>
            <div className={styles.profileDashCardHead}>
              <span className={styles.profileDashCardTitle}>Хэл мэдлэг</span>
            </div>
            <div className={styles.profileDashLangList}>
              {cvLoading ? (
                <p className={styles.profileDashEmptyHint}>Ачаалж байна…</p>
              ) : cv?.languages && cv.languages.trim() ? (
                cv.languages.split(/[,\n]/).map((l) => l.trim()).filter(Boolean).map((lang) => (
                  <div className={styles.profileDashLangItem} key={lang}>
                    <span className={styles.profileDashLangDot} />
                    <span className={styles.profileDashLangLabel}>{lang}</span>
                  </div>
                ))
              ) : (
                KNOWN_LANGUAGES.slice(0, 5).map((lang) => (
                  <div className={styles.profileDashLangItem} key={lang}>
                    <span className={styles.profileDashLangDot} />
                    <span className={styles.profileDashLangLabel}>{lang}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.profileDashCard}>
            <div className={styles.profileDashCardHead}>
              <span className={styles.profileDashCardTitle}>Амжилт & Сертификат</span>
            </div>
            <div className={styles.profileDashReportList}>
              {(cv?.achievements || cv?.certifications)
                ? (cv.achievements || cv.certifications || "").split(/\n+/).filter(Boolean).slice(0, 3).map((item) => (
                    <div className={styles.profileDashReportItem} key={item}>
                      <div className={styles.profileDashReportIcon}>🏆</div>
                      <span className={styles.profileDashReportLabel}>{item}</span>
                    </div>
                  ))
                : seeker.skills.slice(0, 3).map((skill) => (
                    <div className={styles.profileDashReportItem} key={skill}>
                      <div className={styles.profileDashReportIcon}>📄</div>
                      <span className={styles.profileDashReportLabel}>{skill} Certificate</span>
                    </div>
                  ))}
            </div>
          </div>

          <div className={styles.profileDashCard}>
            <div className={styles.profileDashCardHead}>
              <span className={styles.profileDashCardTitle}>Холбоо барих</span>
            </div>
            <div className={styles.profileDashContactList}>
              {[
                { label: "Цалин", value: seeker.priceLabel },
                { label: "Үнэлгээ", value: `${seeker.starsLabel} ${seeker.rating}` },
                { label: "Байршил", value: cv?.location || contact.location },
                { label: "И-мэйл", value: cv?.email || contact.email },
                { label: "Утас", value: cv?.phone || contact.phone },
              ].map((item) => (
                <div className={styles.profileDashContactItem} key={item.label}>
                  <span className={styles.profileDashContactLabel}>{item.label}</span>
                  <span className={styles.profileDashContactValue}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

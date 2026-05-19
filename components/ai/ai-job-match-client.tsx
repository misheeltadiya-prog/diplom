"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Sparkles, SquarePen, Trash2, Wand2 } from "lucide-react";
import { BackButton } from "@/app/profile/back-button";
import profileStyles from "@/app/profile/profile.module.css";
import type { AiPromptAnalysis, AiSearchTarget, JobMatchScore } from "@/lib/ai/types";
import { SUGGESTED_PROMPTS } from "@/lib/ai/suggested-prompts";
import { AiMatchedJobCard } from "@/components/jobs/ai-matched-job-card";
import { AiMatchedFreelancerCard } from "@/components/ai/ai-matched-freelancer-card";
import type { ChatSession, ChatTurn, StoredFreelancerRow, StoredJobRow } from "@/lib/ai/chat-sessions";
import {
  AI_MATCH_MAX_SESSIONS,
  createEmptySession,
  loadActiveSessionId,
  loadSessions,
  saveActiveSessionId,
  saveSessions,
  upsertSessionTurn,
} from "@/lib/ai/chat-sessions";
import styles from "./ai-job-match.module.css";

type ApiJobRow = {
  job: {
    id: string;
    title: string;
    description: string;
    companyName: string;
    location: string;
    employmentType: string;
    salary: string;
    createdAt: string | null;
  };
  derived: { category: string; level: string; workType: string };
  match: JobMatchScore;
  confidenceLabel: string;
};

type ApiFreelancerRow = {
  freelancer: StoredFreelancerRow["freelancer"];
  match: StoredFreelancerRow["match"];
  confidenceLabel: string;
};

type ApiOk = {
  success: true;
  aiAnalysis: AiPromptAnalysis;
  searchTarget: AiSearchTarget;
  jobs: ApiJobRow[];
  freelancers: ApiFreelancerRow[];
  message?: string;
};

type ApiErr = { success: false; error: string };

function AnalysisChips({ analysis }: { analysis: AiPromptAnalysis }) {
  const items: { key: string; label: string; kind: "skill" | "meta" }[] = [
    ...analysis.skills.slice(0, 8).map((s, i) => ({ key: `s-${i}-${s}`, label: s, kind: "skill" as const })),
    ...(analysis.category ? [{ key: `c-${analysis.category}`, label: `Ангилал: ${analysis.category}`, kind: "meta" as const }] : []),
    ...(analysis.level ? [{ key: `l-${analysis.level}`, label: `Түвшин: ${analysis.level}`, kind: "meta" as const }] : []),
    ...(analysis.workType ? [{ key: `w-${analysis.workType}`, label: `Ажиллах: ${analysis.workType}`, kind: "meta" as const }] : []),
  ];
  return (
    <div className={styles.analysisChipsPanel}>
      <motion.div
        className={styles.analysisChipsFlow}
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.045 } },
        }}
      >
        {items.map((it) => (
          <motion.span
            key={it.key}
            variants={{ hidden: { opacity: 0, y: 5, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1 } }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className={`${styles.analysisChip} ${it.kind === "skill" ? styles.analysisChipSkill : styles.analysisChipMeta}`}
            whileHover={{ y: -1 }}
          >
            <span className="min-w-0 truncate">{it.label}</span>
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}

export function AiJobMatchClient() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [searchTarget, setSearchTarget] = useState<AiSearchTarget>("both");

  const activeSessionIdRef = useRef<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    let list = loadSessions();
    let active = loadActiveSessionId();
    if (list.length === 0) {
      const s = createEmptySession();
      list = [s];
      active = s.id;
      saveSessions(list);
      saveActiveSessionId(active);
    } else if (!active || !list.some((x) => x.id === active)) {
      active = list[0]!.id;
      saveActiveSessionId(active);
    }
    setSessions(list);
    setActiveSessionId(active);
    setHydrated(true);
  }, []);

  const activeSession = useMemo(
    () => (activeSessionId ? sessions.find((s) => s.id === activeSessionId) ?? null : null),
    [sessions, activeSessionId],
  );

  const sidebarSessions = useMemo(() => {
    return [...sessions].filter((s) => s.turns.length > 0).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [sessions]);

  const appendTurnToStorage = useCallback((sessionId: string, turn: ChatTurn) => {
    setSessions((prev) => {
      const next = upsertSessionTurn(prev, sessionId, turn);
      saveSessions(next);
      return next;
    });
  }, []);

  const startNewChat = useCallback(() => {
    const newS = createEmptySession();
    setSessions((prev) => {
      const kept = prev.filter((s) => s.turns.length > 0);
      const next = [newS, ...kept].slice(0, AI_MATCH_MAX_SESSIONS);
      saveSessions(next);
      return next;
    });
    setActiveSessionId(newS.id);
    saveActiveSessionId(newS.id);
    setPrompt("");
    setPendingPrompt(null);
    window.setTimeout(() => promptRef.current?.focus(), 0);
  }, []);

  const selectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    saveActiveSessionId(id);
    setPrompt("");
    setPendingPrompt(null);
    window.setTimeout(() => promptRef.current?.focus(), 0);
  }, []);

  const deleteSession = useCallback((id: string) => {
    if (!window.confirm("Энэ чатын түүхийг устгах уу?")) return;
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      const out = next.length === 0 ? [createEmptySession()] : next;
      saveSessions(out);
      const cur = activeSessionIdRef.current;
      if (cur === id) {
        const pick = (out.find((s) => s.turns.length > 0) ?? out[0])!;
        setActiveSessionId(pick.id);
        saveActiveSessionId(pick.id);
      }
      return out;
    });
  }, []);

  const clearAllHistory = useCallback(() => {
    if (!window.confirm("Бүх чатын түүхийг устгах уу?")) return;
    const newS = createEmptySession();
    setSessions([newS]);
    saveSessions([newS]);
    setActiveSessionId(newS.id);
    saveActiveSessionId(newS.id);
    setPrompt("");
    setPendingPrompt(null);
    window.setTimeout(() => promptRef.current?.focus(), 0);
  }, []);

  const runMatch = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const sid = activeSessionIdRef.current;
      if (!sid) return;

      setLoading(true);
      setPendingPrompt(trimmed);
      setPrompt("");

      const finishLoading = () => {
        setLoading(false);
        setPendingPrompt(null);
      };

      try {
        const res = await fetch("/api/ai-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed, target: searchTarget }),
        });
        const json = (await res.json()) as ApiOk | ApiErr | (ApiErr & { detail?: string });
        if (!res.ok || !json.success) {
          const base = "error" in json ? json.error : "Алдаа гарлаа.";
          const devDetail = "detail" in json && json.detail ? ` (${json.detail})` : "";
          const extra502 =
            res.status === 502
              ? " — Загвар эсвэл түлхүүр шалгана уу (.env.local: GEMINI_MODEL, GEMINI_API_KEY)."
              : "";
          appendTurnToStorage(sid, {
            prompt: trimmed,
            analysis: null,
            jobs: [],
            freelancers: [],
            searchTarget,
            error: `${base}${extra502}${devDetail}`,
            info: null,
          });
          finishLoading();
          return;
        }
        appendTurnToStorage(sid, {
          prompt: trimmed,
          analysis: json.aiAnalysis,
          jobs: json.jobs as StoredJobRow[],
          freelancers: json.freelancers as StoredFreelancerRow[],
          searchTarget: json.searchTarget,
          error: null,
          info:
            json.message ??
            (json.jobs.length === 0 && json.freelancers.length === 0 ? "Тохирох үр дүн олдсонгүй." : null),
        });
      } catch {
        appendTurnToStorage(sid, {
          prompt: trimmed,
          analysis: null,
          jobs: [],
          freelancers: [],
          searchTarget,
          error: "Сүлжээний алдаа.",
          info: null,
        });
      } finally {
        finishLoading();
      }
    },
    [appendTurnToStorage, searchTarget],
  );

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeSession?.turns.length, pendingPrompt, activeSessionId]);

  const onPromptKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;
    if (e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (!loading) void runMatch(prompt);
  };

  const pageClass = `${styles.page} ${styles.layout}`;

  if (!hydrated || !activeSessionId) {
    return (
      <div className={`${styles.page} ${styles.layout}`}>
        <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-zinc-500">Ачааллаж байна…</div>
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <button type="button" className={styles.newChatBtn} onClick={startNewChat}>
            <SquarePen className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
            Шинэ чат
          </button>
          <nav className={styles.navMini}>
            <Link href="/jobs">Ажлын зар</Link>
            <Link href="/freelancers">Freelancer</Link>
          </nav>
          <div className={styles.recentsLabel}>Сүүлийн</div>
        </div>
        <div className={styles.sidebarScroll}>
          <ul className="m-0 list-none p-0">
            {sidebarSessions.length === 0 ? (
              <li className="px-2 py-1 text-xs text-zinc-500">Одоогоор хоосон</li>
            ) : (
              sidebarSessions.map((s) => (
                <li key={s.id} className={styles.sessionRow}>
                  <button
                    type="button"
                    className={`${styles.sessionBtn} ${styles.sessionBtnInRow} ${s.id === activeSessionId ? styles.sessionBtnActive : ""}`}
                    onClick={() => selectSession(s.id)}
                  >
                    {s.title}
                  </button>
                  <button
                    type="button"
                    className={styles.sessionDelete}
                    aria-label="Чат устгах"
                    onClick={() => deleteSession(s.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </li>
              ))
            )}
          </ul>
          {sidebarSessions.length > 0 ? (
            <button type="button" className={styles.clearHistoryBtn} onClick={clearAllHistory}>
              Бүх түүхийг устгах
            </button>
          ) : null}
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topBar}>
          <span className={styles.topBarTitle}>
            <Sparkles className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
            AI хайлт
          </span>
          <BackButton variant="portal" />
        </header>

        <div className={styles.searchTargetRow} role="tablist" aria-label="Хайлтын төрөл">
          {(
            [
              ["both", "Ажил + Freelancer"],
              ["jobs", "Зөвхөн ажил"],
              ["freelancers", "Зөвхөн freelancer"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={searchTarget === value}
              className={`${styles.searchTargetBtn} ${searchTarget === value ? styles.searchTargetBtnActive : ""}`}
              onClick={() => setSearchTarget(value)}
              disabled={loading}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.thread}>
          {activeSession && activeSession.turns.length === 0 && !pendingPrompt ? (
            <div className={styles.emptyHero}>
              <p>
                Ажлын нэрээр хайж болно (жишээ: «багшийн туслах»). Эсвэл өөрийн ур чадвараа бич — тохирох ажил олно (жишээ: «React,
                TypeScript мэддэг»).
              </p>
            </div>
          ) : null}

          {activeSession?.turns.map((turn, turnIdx) => (
            <div key={`t-${activeSession.id}-${turnIdx}`} className="mb-10">
              <div className={styles.userBubble} style={{ overflowWrap: "anywhere" }}>
                {turn.prompt}
              </div>

              {turn.error ? (
                <p
                  role="alert"
                  className={`mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900 ${styles.errorBox}`}
                >
                  {turn.error}
                </p>
              ) : null}

              {!turn.error && turn.info ? (
                <p className={styles.matchInfoNotice} role="status">
                  {turn.info}
                </p>
              ) : null}

              {!turn.error && turn.analysis ? (
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                    Задлан шинжилгээ
                  </p>
                  <AnalysisChips analysis={turn.analysis} />
                </div>
              ) : null}

              {!turn.error && turn.jobs.length > 0 ? (
                <>
                  <p className={styles.resultSectionLabel}>Ажлын зар ({turn.jobs.length})</p>
                  <motion.div className={`${styles.jobStack} aiMatchCardOverride`}>
                    {turn.jobs.map((r, i) => (
                      <AiMatchedJobCard
                        key={`${turnIdx}-${r.job.id}`}
                        confidenceLabel={r.confidenceLabel}
                        derived={r.derived}
                        index={i}
                        job={r.job}
                        match={r.match}
                        detailHref={`/jobs?job=${encodeURIComponent(r.job.id)}#jobs`}
                      />
                    ))}
                  </motion.div>
                </>
              ) : null}

              {!turn.error && (turn.freelancers?.length ?? 0) > 0 ? (
                <>
                  <p className={styles.resultSectionLabel}>
                    Freelancer ({turn.freelancers!.length})
                  </p>
                  <motion.div className={`${styles.jobStack} aiMatchCardOverride`}>
                    {turn.freelancers!.map((r, i) => (
                      <AiMatchedFreelancerCard
                        key={`${turnIdx}-f-${r.freelancer.id}`}
                        confidenceLabel={r.confidenceLabel}
                        freelancer={r.freelancer}
                        index={i}
                        match={r.match}
                        detailHref="/freelancers#freelancer-board"
                      />
                    ))}
                  </motion.div>
                </>
              ) : null}
            </div>
          ))}

          <AnimatePresence>
            {pendingPrompt ? (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6"
              >
                <div className={styles.userBubble} style={{ overflowWrap: "anywhere" }}>
                  {pendingPrompt}
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-950">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                  AI уншиж байна…
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          <div ref={threadEndRef} />
        </div>

        <div className={styles.composerWrap}>
          <div className={styles.pillRow}>
            <textarea
              ref={promptRef}
              className={styles.pillTextarea}
              placeholder="Ажлын нэр эсвэл өөрийн skill бичнэ үү…"
              rows={1}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={onPromptKeyDown}
              disabled={loading}
            />
            <button
              type="button"
              className={styles.sendBtn}
              disabled={loading || !prompt.trim()}
              onClick={() => void runMatch(prompt)}
              aria-label="Илгээх"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
            </button>
          </div>
          <div className={styles.quickRow}>
            {SUGGESTED_PROMPTS.slice(0, 3).map((p) => (
              <button key={p} type="button" className={styles.quickChip} onClick={() => void runMatch(p)}>
                <Sparkles className="h-3.5 w-3.5 text-violet-600" aria-hidden />
                <span className="max-w-[200px] truncate">{p.slice(0, 36)}{p.length > 36 ? "…" : ""}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-[11px] text-zinc-500">
            <a className="font-semibold text-violet-600 underline underline-offset-2"
              href="https://aistudio.google.com/apikey"
              rel="noopener noreferrer"
              target="_blank"
            >
              API түлхүүр
            </a>
            {" "}→ .env.local <span className="font-mono">GEMINI_API_KEY</span>
          </p>
        </div>
      </div>
    </div>
  );
}

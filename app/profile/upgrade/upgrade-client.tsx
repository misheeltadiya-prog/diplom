"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "../profile.module.css";
import ui from "./upgrade.module.css";

type PlanKey = "free" | "pro" | "business";

function toneToBadgeClass(tone: "orange" | "green" | "yellow") {
  if (tone === "green") return ui.badgeGreen;
  if (tone === "yellow") return ui.badgeYellow;
  return ui.badgeOrange;
}

function toneToBoxClass(tone: "orange" | "green" | "yellow") {
  if (tone === "green") return ui.boxGreen;
  if (tone === "yellow") return ui.boxYellow;
  return ui.boxOrange;
}

export function UpgradeClient() {
  const [plan, setPlan] = useState<PlanKey>("free");
  const [status, setStatus] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/subscription", { cache: "no-store" });
      const j = (await r.json()) as {
        ok?: boolean;
        plan?: string;
        status?: string;
        expiresAt?: string | null;
        error?: string;
      };
      if (!r.ok || !j.ok) {
        setErr(j.error ?? "Алдаа");
        return;
      }
      const p = j.plan === "pro" || j.plan === "business" ? j.plan : "free";
      setPlan(p);
      setStatus(j.status ?? "");
      setExpiresAt(j.expiresAt ?? null);
    } catch {
      setErr("Сүлжээний алдаа");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function choose(next: PlanKey) {
    setSaving(next);
    setErr(null);
    try {
      const r = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey: next }),
      });
      const j = (await r.json()) as { ok?: boolean; plan?: string; error?: string };
      if (!r.ok || !j.ok) {
        setErr(j.error ?? "Хадгалахад алдаа");
        return;
      }
      setPlan((j.plan as PlanKey) ?? next);
      await load();
    } catch {
      setErr("Сүлжээний алдаа");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return <p className={styles.muted}>Ачаалж байна…</p>;
  }
  if (err) {
    return <p className={styles.errorMsg}>{err}</p>;
  }

  const plans: Array<{
    key: PlanKey;
    title: string;
    subtitle: string;
    price: string;
    tone: "orange" | "green" | "yellow";
    isFeatured?: boolean;
    features: Array<{ label: string; enabled: boolean }>;
  }> = [
    {
      key: "free",
      title: "BASIC",
      subtitle: "Эхлэхэд тохиромжтой",
      price: "$0.00",
      tone: "orange",
      features: [
        { label: "Профайл, CV үүсгэх/засах", enabled: true },
        { label: "Freelancer & ажил хайх", enabled: true },
        { label: "Санал/өргөдлийн түүх харах", enabled: true },
        { label: "Priority дэмжлэг", enabled: false },
        { label: "Илүү олон санал илгээх лимит", enabled: false },
        { label: "Team боломжууд", enabled: false },
        { label: "Бизнес тайлан/статистик", enabled: false },
      ],
    },
    {
      key: "pro",
      title: "PREMIUM",
      subtitle: "Илүү боломж, илүү хурдан",
      price: "$100.00",
      tone: "green",
      isFeatured: true,
      features: [
        { label: "BASIC бүх боломж", enabled: true },
        { label: "Илүү олон санал/өргөдөл илгээх", enabled: true },
        { label: "Priority дэмжлэг", enabled: true },
        { label: "Профайл илүү онцлох", enabled: true },
        { label: "Нэмэлт тохиргоонууд", enabled: true },
        { label: "Аюулгүй байдлын нэмэлт хамгаалалт", enabled: true },
        { label: "Илүү өндөр хязгаарууд", enabled: true },
      ],
    },
    {
      key: "business",
      title: "STANDARD",
      subtitle: "Бага зардлаар нэмэлт дэмжлэг",
      price: "$20.00",
      tone: "yellow",
      features: [
        { label: "BASIC бүх боломж", enabled: true },
        { label: "Дунд түвшний лимит нэмэгдэнэ", enabled: true },
        { label: "Стандарт дэмжлэг", enabled: true },
        { label: "Санал/өргөдөл удирдах нэмэлт", enabled: true },
        { label: "Priority дэмжлэг", enabled: false },
        { label: "Team боломжууд", enabled: false },
        { label: "Бизнес тайлан/статистик", enabled: false },
      ],
    },
  ];

  return (
    <div className={ui.upgradeWrap}>
      <div className={ui.header}>
        <div className={ui.title}>
          SUBSCRIPTION PLANS <span>TEMPLATE</span>
        </div>
        <div className={ui.divider} />
      </div>

      <div className={ui.cardsScroll}>
        <div className={ui.cardsGrid}>
        {plans.map((p) => {
          const active = plan === p.key;
          const isBusy = saving !== null;
          const isThisSaving = saving === p.key;
          const badgeTone = toneToBadgeClass(p.tone);
          const boxTone = toneToBoxClass(p.tone);
          const canPick = !active && !isBusy;

          return (
            <div className={ui.cell} key={p.key}>
              <article
                className={[
                  ui.card,
                  active ? ui.cardActive : "",
                ].join(" ")}
              >
                <div className={[ui.priceBadge, badgeTone].join(" ")}>{p.price}</div>

                <div className={ui.planHead}>
                  <div className={ui.planTitle}>{p.title}</div>
                  <div className={ui.planSubtitle}>{p.subtitle}</div>
                </div>

                <div className={ui.rule} />

                <ul className={ui.featureList}>
                  {p.features.map((f) => (
                    <li className={ui.featureRow} key={f.label}>
                      {f.enabled ? (
                        <span className={[ui.boxOn, boxTone].join(" ")}>
                          <svg aria-hidden="true" className={ui.checkSvg} fill="none" viewBox="0 0 24 24">
                            <path
                              d="M20 6 9 17l-5-5"
                              stroke="white"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                            />
                          </svg>
                        </span>
                      ) : (
                        <span className={ui.boxOff} />
                      )}
                      <span className={f.enabled ? ui.featureTextOn : ui.featureTextOff}>{f.label}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={[ui.cta, active ? ui.ctaActive : ui.ctaChoose, isBusy ? "opacity-80" : ""].join(" ")}
                  disabled={isBusy || active}
                  onClick={(e) => {
                    e.stopPropagation();
                    void choose(p.key);
                  }}
                  type="button"
                >
                  {isThisSaving ? "Хадгалж байна…" : active ? "Идэвхтэй" : "Сонгох"}
                </button>
              </article>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

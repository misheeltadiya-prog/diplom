"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../profile.module.css";
import ui from "./upgrade.module.css";

type PlanKey = "basic" | "standard" | "premium";

function normalizePlanFromApi(s: string | undefined): PlanKey {
  if (!s) return "basic";
  if (s === "premium" || s === "pro") return "premium";
  if (s === "standard" || s === "business") return "standard";
  if (s === "basic" || s === "free") return "basic";
  return "basic";
}

type UpgradeClientProps = {
  checkoutFlash?: string;
  /** Stripe success_url-ийн {CHECKOUT_SESSION_ID} — verify-session API-д дамжина */
  checkoutSessionId?: string;
};

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

function planTitleMn(key: PlanKey) {
  if (key === "premium") return "PREMIUM";
  if (key === "standard") return "STANDARD";
  return "BASIC (Үнэгүй)";
}

function formatExpires(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function daysRemaining(iso: string | null) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
}

export function UpgradeClient({ checkoutFlash, checkoutSessionId }: UpgradeClientProps) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanKey>("basic");
  const [status, setStatus] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [savingStripe, setSavingStripe] = useState<"standard" | "premium" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
      setPlan(normalizePlanFromApi(j.plan));
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

  useEffect(() => {
    if (!checkoutFlash) return;
    if (checkoutFlash === "cancel") {
      setToast("Төлбөрийн цонх хаагдлаа.");
      router.replace("/profile/upgrade");
      return;
    }
    if (checkoutFlash !== "success") return;

    let cancelled = false;

    if (typeof window !== "undefined") {
      router.replace("/profile/upgrade");
    }

    void (async () => {
      try {
        sessionStorage.setItem("stripe_checkout_poll", "1");
      } catch {
        /* */
      }
      setToast("Төлбөр амжилттай. Эрх бүртгэж байна…");

      if (checkoutSessionId?.startsWith("cs_")) {
        try {
          const r = await fetch("/api/stripe/verify-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: checkoutSessionId }),
          });
          const j = (await r.json()) as {
            ok?: boolean;
            plan?: string;
            status?: string;
            expiresAt?: string | null;
            error?: string;
          };
          if (r.ok && j.ok && normalizePlanFromApi(j.plan) !== "basic") {
            try {
              sessionStorage.removeItem("stripe_checkout_poll");
            } catch {
              /* */
            }
            const resolved = normalizePlanFromApi(j.plan);
            setPlan(resolved);
            setExpiresAt(j.expiresAt ?? null);
            setStatus(j.status ?? "active");
            setToast("Сонгосон төлөвлөгөө идэвхтэй боллоо.");
          } else if (!r.ok && j.error) {
            setToast(j.error);
          }
        } catch {
          /* polling fallback */
        }
      }

      if (cancelled) return;
      await new Promise((resolve) => setTimeout(resolve, 1200));
      if (cancelled) return;

      await load();
      router.refresh();
      router.replace("/profile/upgrade");
    })();

    return () => {
      cancelled = true;
    };
  }, [checkoutFlash, checkoutSessionId, load, router]);

  /** verify-session амжилтгүй бол webhook/polling-оор DB шинэчлэгдэх хүртэл */
  useEffect(() => {
    let cancelled = false;
    let ticks = 0;
    const maxTicks = 35;
    let id: ReturnType<typeof setInterval> | null = null;

    const tick = async (): Promise<boolean> => {
      if (cancelled) return true;
      let poll = false;
      try {
        poll = sessionStorage.getItem("stripe_checkout_poll") === "1";
      } catch {
        poll = false;
      }
      if (!poll) return true;

      ticks++;
      try {
        const r = await fetch("/api/subscription", { cache: "no-store" });
        const j = (await r.json()) as {
          ok?: boolean;
          plan?: string;
          expiresAt?: string | null;
        };
        const paid = j.ok && normalizePlanFromApi(j.plan) !== "basic";
        if (paid) {
          try {
            sessionStorage.removeItem("stripe_checkout_poll");
          } catch {
            /* */
          }
          const p = normalizePlanFromApi(j.plan);
          setPlan(p);
          setExpiresAt(j.expiresAt ?? null);
          setToast("Төлбөр баталгаажлаа — сонгосон төлөвлөгөө идэвхтэй. Sidebar шинэчлэгдэнэ.");
          await load();
          router.refresh();
          return true;
        }
      } catch {
        /* */
      }

      if (ticks >= maxTicks) {
        try {
          sessionStorage.removeItem("stripe_checkout_poll");
        } catch {
          /* */
        }
        setToast("Эрх хараахан шинэчлэгдээгүй. stripe listen / webhook эсвэл verify-session алдааг шалгана уу.");
        return true;
      }
      return false;
    };

    const run = async () => {
      const stop = await tick();
      if (stop && id !== null) {
        clearInterval(id);
        id = null;
      }
    };

    id = setInterval(() => {
      void run();
    }, 2000);
    void run();

    return () => {
      cancelled = true;
      if (id !== null) clearInterval(id);
    };
  }, [load, router]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [toast]);

  const expireLabel = useMemo(() => formatExpires(expiresAt), [expiresAt]);
  const remain = useMemo(() => daysRemaining(expiresAt), [expiresAt]);

  async function chooseFree() {
    setSaving("basic");
    setErr(null);
    try {
      const r = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey: "basic" }),
      });
      const j = (await r.json()) as {
        ok?: boolean;
        plan?: string;
        expiresAt?: string | null;
        error?: string;
      };
      if (!r.ok || !j.ok) {
        setErr(j.error ?? "Хадгалахад алдаа");
        return;
      }
      setPlan("basic");
      setExpiresAt(j.expiresAt ?? null);
      setToast("Үнэгүй төлөвлөгөө рүү шилжлээ.");
      router.refresh();
      await load();
    } catch {
      setErr("Сүлжээний алдаа");
    } finally {
      setSaving(null);
    }
  }

  async function startStripeCheckout(next: "standard" | "premium") {
    setSavingStripe(next);
    setErr(null);
    try {
      const r = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey: next }),
      });
      const j = (await r.json()) as {
        ok?: boolean;
        url?: string;
        error?: string;
        detail?: string;
        hint?: string;
        alreadyActive?: boolean;
      };
      if (!r.ok || !j.ok) {
        if (j.alreadyActive) {
          setToast(j.error ?? "Энэ төлөвлөгөө аль хэдийн идэвхтэй.");
          await load();
          router.refresh();
          return;
        }
        const parts = [j.error ?? "Stripe алдаа", j.detail, j.hint].filter(Boolean);
        setErr(parts.join(" — "));
        return;
      }
      if (j.url) {
        window.location.replace(j.url);
        return;
      }
      setErr("Checkout URL олдсонгүй.");
    } catch {
      setErr("Сүлжээний алдаа");
    } finally {
      setSavingStripe(null);
    }
  }

  if (loading) {
    return <p className={styles.muted}>Ачаалж байна…</p>;
  }

  if (err) {
    return (
      <div className={ui.errorBox}>
        <p className={styles.errorMsg}>{err}</p>
        <button className={ui.retryButton} onClick={() => void load()} type="button">
          Дахин ачаалах
        </button>
      </div>
    );
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
      key: "basic",
      title: "BASIC",
      subtitle: "Эхлэхэд тохиромжтой",
      price: "$0.00",
      tone: "orange",
      features: [
        { label: "Профайл, CV үүсгэх/засах", enabled: true },
        { label: "Portfolio хүртэл 3 зүйл", enabled: true },
        { label: "Өдөрт 3 өргөдөл", enabled: true },
        { label: "Идэвхтэй зар: компани 3", enabled: true },
        { label: "AI job match (хязгаартай)", enabled: false },
        { label: "Analytics dashboard", enabled: true },
        { label: "Priority / boosted зар", enabled: false },
      ],
    },
    {
      key: "standard",
      title: "STANDARD",
      subtitle: "Бага зардлаар нэмэлт дэмжлэг",
      price: "$20.00",
      tone: "yellow",
      features: [
        { label: "BASIC бүх боломж", enabled: true },
        { label: "Portfolio хязгааргүй (50 хүртэл)", enabled: true },
        { label: "Өдөрт 10 өргөдөл", enabled: true },
        { label: "Идэвхтэй зар: компани 10", enabled: true },
        { label: "AI job matching + chat assistant", enabled: true },
        { label: "Analytics dashboard", enabled: true },
        { label: "Priority / boosted зар", enabled: false },
      ],
    },
    {
      key: "premium",
      title: "PREMIUM",
      subtitle: "Илүү боломж, илүү хурдан",
      price: "$100.00",
      tone: "green",
      isFeatured: true,
      features: [
        { label: "STANDARD бүх боломж", enabled: true },
        { label: "Өргөдөл хязгааргүй, зар хязгааргүй", enabled: true },
        { label: "Зар search-д эрэмбэ өндөр", enabled: true },
        { label: "AI CV screening + interview tools", enabled: true },
        { label: "Featured badge", enabled: true },
        { label: "Priority дэмжлэг", enabled: true },
        { label: "Бүрэн AI suite", enabled: true },
      ],
    },
  ];

  return (
    <div className={ui.upgradeWrap}>
      {toast ? <p className={ui.toastOk}>{toast}</p> : null}

      {/* Current plan banner */}
      <section className={ui.currentPlanBanner} aria-label="Одоогийн subscription">
        <div className={ui.currentPlanIcon}>⚡</div>
        <div className={ui.currentPlanInfo}>
          <p className={ui.currentPlanLabel}>Идэвхтэй төлөвлөгөө</p>
          <h2 className={ui.currentPlanTitle}>{planTitleMn(plan)}</h2>
        </div>
        <div className={ui.currentPlanStatus}>
          <span className={ui.currentPlanStatusDot} />
          <span className={ui.currentPlanStatusText}>Active</span>
        </div>
      </section>

      <div className={ui.cardsScroll}>
        <div className={ui.cardsGrid}>
          {plans.map((p) => {
            const active = plan === p.key;
            const isBusy = saving !== null || savingStripe !== null;
            const isSavingFree = saving === "basic" && p.key === "basic";
            const isThisStripe = savingStripe === p.key && (p.key === "standard" || p.key === "premium");

            return (
              <div className={ui.cell} key={p.key}>
                <article
                  className={[
                    ui.card,
                    active ? ui.cardActive : "",
                    p.isFeatured ? ui.cardFeatured : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {p.isFeatured ? <div className={ui.mostPopularBadge}>MOST POPULAR</div> : null}

                  <div className={ui.planHead}>
                    <h3 className={ui.planTitle}>{p.title}</h3>
                    <div
                      className={[
                        ui.planPrice,
                        p.tone === "orange" ? ui.planPriceOrange : "",
                        p.tone === "yellow" ? ui.planPriceYellow : "",
                        p.tone === "green" ? ui.planPriceGreen : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {p.price}
                    </div>
                    <p className={ui.planSubtitle}>{p.subtitle}</p>
                  </div>

                  <ul className={ui.featureList}>
                    {p.features.map((f) => (
                      <li className={ui.featureRow} key={f.label}>
                        <span className={f.enabled ? ui.checkIcon : [ui.checkIcon, ui.checkIconOff].join(" ")}>
                          {f.enabled ? (
                            <svg aria-hidden="true" className={ui.checkSvg} fill="none" viewBox="0 0 24 24">
                              <path
                                d="M20 6 9 17l-5-5"
                                stroke="white"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                              />
                            </svg>
                          ) : null}
                        </span>
                        <span className={f.enabled ? ui.featureTextOn : ui.featureTextOff}>{f.label}</span>
                      </li>
                    ))}
                  </ul>

                  <div className={ui.ctaPair}>
                    {p.key === "basic" ? (
                      <button
                        className={[ui.cta, active ? ui.ctaActive : ui.ctaChoose].filter(Boolean).join(" ")}
                        disabled={active || isBusy}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (active || isBusy) return;
                          void chooseFree();
                        }}
                        type="button"
                      >
                        {isSavingFree ? "Хадгалж байна…" : active ? "Идэвхтэй" : "Идэвхжүүлэх"}
                      </button>
                    ) : (
                      <button
                        className={[ui.cta, active ? ui.ctaActive : ui.ctaChoose].filter(Boolean).join(" ")}
                        disabled={active || isBusy}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (active || isBusy) return;
                          const paid = p.key;
                          if (paid === "standard" || paid === "premium") void startStripeCheckout(paid);
                        }}
                        type="button"
                      >
                        {isThisStripe ? "Stripe руу…" : active ? "Идэвхтэй" : "Stripe Checkout"}
                      </button>
                    )}
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA section */}
      <section className={ui.bottomCta}>
        <h2 className={ui.bottomCtaTitle}>Байгууллагын тусгай хэрэгцээнд зориулсан</h2>
        <p className={ui.bottomCtaText}>
          Хэрэв таны байгууллага 50-аас дээш ажилчинтай эсвэл тусгай нөхцөл шаардлагатай бол бидэнтэй холбогдоорой
        </p>
        <button className={ui.bottomCtaButton} type="button">
          Холбоо барих
        </button>
      </section>
    </div>
  );
}

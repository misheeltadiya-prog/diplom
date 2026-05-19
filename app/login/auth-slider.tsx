"use client";

import Image from "next/image";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import styles from "./auth-slider.module.css";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});

function safeInternalNext(raw: string | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.includes("://")) return null;
  return t;
}

type DemoUser = { id: number; fullName: string; email: string; role: string };

type RoleIntentBlock = { intent: "company" | "freelancer"; detail: string };

export type AuthSliderProps = {
  initialSignup?: boolean;
  role?: string;
  next?: string;
};

function GoogleIcon() {
  return (
    <svg aria-hidden height="18" viewBox="0 0 24 24" width="18">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GoogleOAuthButton({
  variant,
  onClick,
}: {
  variant: "signin" | "signup";
  onClick: () => void;
}) {
  const action = variant === "signup" ? "бүртгүүлэх" : "нэвтрэх";
  return (
    <div className={styles.oauthStack}>
      <button type="button" className={styles.oauthBtn} onClick={onClick}>
        <GoogleIcon /> Google-ээр {action}
      </button>
    </div>
  );
}

export function AuthSlider({ initialSignup = false, role, next }: AuthSliderProps) {
  const router = useRouter();
  const [signupMode, setSignupMode] = useState(initialSignup);

  useEffect(() => {
    setSignupMode(initialSignup);
  }, [initialSignup]);

  const panel = signupMode ? "signup" : "signin";

  const roleBlockRef = useRef<HTMLDivElement | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [roleIntentBlock, setRoleIntentBlock] = useState<RoleIntentBlock | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [demoSelected, setDemoSelected] = useState<number | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [oauthHint, setOauthHint] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const err = params.get("oauth_error");
    if (!err) return;

    const onRegister =
      window.location.pathname === "/register" || initialSignup || signupMode;

    const messages: Record<string, string> = {
      not_configured: "Google OAuth тохируулаагүй байна (.env.local).",
      cancelled: onRegister ? "Google бүртгэлийг цуцаллаа." : "Google нэвтрэлтийг цуцаллаа.",
      google_denied: "Google зөвшөөрөл өгөөгүй.",
      invalid_state: "Хүсэлт хугацаа дууссан. Дахин оролдоно уу.",
      role_mismatch:
        role === "company"
          ? onRegister
            ? "Энэ Google и-мэйлээр бүртгэлтэй данс company төрөл биш. /login?role=company-оор нэвтэрнэ үү."
            : "Энэ Google данс company бүртгэл биш."
          : role === "freelancer"
            ? onRegister
              ? "Энэ Google и-мэйлээр бүртгэлтэй данс freelancer төрөл биш. /login?role=freelancer-оор нэвтэрнэ үү."
              : "Энэ Google данс freelancer бүртгэл биш."
            : "Google данс энэ төрөлтэй таарахгүй байна.",
      migration_required: "Өгөгдлийн санд migration шаардлагатай: npm run db:migrate",
      server_error: onRegister ? "Google-ээр бүртгэх үед серверийн алдаа гарлаа." : "Google нэвтрэх үед серверийн алдаа гарлаа.",
      invalid_callback: "Google буцах холбоос буруу байна.",
      email_required: "Google данснаас и-мэйл авч чадсангүй.",
    };

    setOauthHint(messages[err] ?? "Google-тай холбогдоход алдаа гарлаа.");
    if (onRegister) setRegError(null);

    params.delete("oauth_error");
    const qs = params.toString();
    const clean = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    window.history.replaceState({}, "", clean);
  }, [role, initialSignup, signupMode]);

  const demoRoleQuery = useMemo(() => {
    if (role === "company" || role === "freelancer") return role;
    return "";
  }, [role]);

  useEffect(() => {
    let cancelled = false;
    setDemoLoading(true);
    fetch(`/api/auth/demo-users${demoRoleQuery ? `?role=${encodeURIComponent(demoRoleQuery)}` : ""}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("off"))))
      .then((d: { users?: DemoUser[] }) => {
        if (cancelled) return;
        const list = d.users ?? [];
        setDemoUsers(list);
        setDemoSelected(list[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setDemoUsers([]);
      })
      .finally(() => {
        if (!cancelled) setDemoLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [demoRoleQuery]);

  useLayoutEffect(() => {
    if (!roleIntentBlock || !roleBlockRef.current) return;
    roleBlockRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [roleIntentBlock]);

  async function onLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError(null);
    setRoleIntentBlock(null);
    setLoginLoading(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("login-email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("login-password") as HTMLInputElement).value;
    try {
      const intentRole = role === "company" || role === "freelancer" ? role : undefined;
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, intentRole }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; role?: string; code?: string };
      if (!res.ok || !json.ok) {
        if (
          res.status === 403 &&
          json.code === "ROLE_INTENT_MISMATCH" &&
          (role === "company" || role === "freelancer")
        ) {
          setRoleIntentBlock({
            intent: role,
            detail: json.error ?? "Энэ нэвтрэх хуудасны төрөлтэй таны данс таарахгүй байна.",
          });
          return;
        }
        setLoginError(json.error ?? "Нэвтрэх үед алдаа гарлаа.");
        return;
      }
      const nextPath = safeInternalNext(next);
      if (nextPath) {
        router.push(nextPath);
        router.refresh();
        return;
      }
      if (json.role === "company") router.push("/jobs?post=1");
      else if (json.role === "freelancer") router.push("/freelancers?publish=1");
      else router.push("/jobs");
      router.refresh();
    } catch {
      setLoginError("Сервертэй холбогдоход алдаа гарлаа.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleDemoLogin() {
    if (!demoSelected || loginLoading || demoLoading) return;
    setLoginError(null);
    setRoleIntentBlock(null);
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: demoSelected }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; role?: string };
      if (!res.ok || !json.ok) {
        setLoginError(json.error ?? "Demo нэвтрэх үед алдаа гарлаа.");
        return;
      }
      const nextPath = safeInternalNext(next);
      if (nextPath) router.push(nextPath);
      else if (json.role === "company") router.push("/jobs");
      else if (json.role === "freelancer") router.push("/freelancers");
      else router.push("/jobs");
      router.refresh();
    } catch {
      setLoginError("Demo нэвтрэх үед сүлжээний алдаа гарлаа.");
    } finally {
      setLoginLoading(false);
    }
  }

  function startGoogleOAuth() {
    const params = new URLSearchParams();
    if (signupMode || initialSignup) params.set("signup", "1");
    if (role === "company" || role === "freelancer") params.set("role", role);
    const nextPath = safeInternalNext(next);
    if (nextPath) params.set("next", nextPath);
    const qs = params.toString();
    window.location.href = `/api/auth/google${qs ? `?${qs}` : ""}`;
  }

  async function onRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRegError(null);
    setRegLoading(true);
    const form = e.currentTarget;
    const fullName = (form.elements.namedItem("reg-fullName") as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem("reg-phone") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("reg-email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("reg-password") as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem("reg-confirm") as HTMLInputElement).value;
    if (password !== confirmPassword) {
      setRegError("Нууц үг таарахгүй байна.");
      setRegLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          password,
          role: role === "freelancer" || role === "company" ? role : (role ?? "client"),
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        devVerifyEmailUrl?: string;
        role?: string;
      };
      if (!res.ok || !json.ok) {
        setRegError(json.error ?? "Бүртгэх үед алдаа гарлаа.");
        setRegLoading(false);
        return;
      }
      if (json.devVerifyEmailUrl) {
        try {
          sessionStorage.setItem("cwork-dev-verify-email", json.devVerifyEmailUrl);
        } catch {
          /* ignore */
        }
      }
      const saved =
        json.role === "company" || json.role === "freelancer" || json.role === "client"
          ? json.role
          : role === "company" || role === "freelancer"
            ? role
            : "client";
      const dest =
        saved === "company" ? "/jobs?post=1" : saved === "freelancer" ? "/freelancers?publish=1" : "/jobs";
      router.push(dest);
      router.refresh();
    } catch {
      setRegError("Сервертэй холбогдоход алдаа гарлаа.");
      setRegLoading(false);
    }
  }

  return (
    <div className={`${montserrat.className} ${styles.page}`}>
      <Link className={styles.topBrand} href="/">
        <Image 
          src="/c-work-logo.svg" 
          alt="C-Work logo" 
          width={40} 
          height={40}
          className={styles.topBrandLogo}
        />
        C-Work
      </Link>

      <div className={styles.container} data-panel={panel}>
        <div className={styles.mobileToggle}>
          <button type="button" className={styles.ghost} onClick={() => setSignupMode(false)}>
            Нэвтрэх
          </button>
          <button type="button" className={styles.ghost} onClick={() => setSignupMode(true)}>
            Бүртгүүлэх
          </button>
        </div>

        <div className={`${styles.formContainer} ${styles.signUpContainer}`}>
          <form className={styles.formInner} onSubmit={onRegisterSubmit} noValidate>
            {role ? <input type="hidden" name="role" value={role} /> : null}
            <h1>Бүртгүүлэх</h1>
            <span className={styles.sub}>эсвэл и-мэйлээр бүртгүүлнэ үү</span>
            <input className={styles.field} name="reg-fullName" placeholder="Бүтэн нэр" required autoComplete="name" />
            <input className={styles.field} name="reg-phone" placeholder="Утас" required autoComplete="tel" />
            <input className={styles.field} name="reg-email" type="email" placeholder="И-мэйл" required autoComplete="email" />
            <input
              className={styles.field}
              name="reg-password"
              type="password"
              placeholder="Нууц үг (6+)"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <input
              className={styles.field}
              name="reg-confirm"
              type="password"
              placeholder="Нууц давтах"
              required
              autoComplete="new-password"
            />
            {regError ? <p className={styles.errorMsg}>{regError}</p> : null}
            <button className={styles.btnSolid} type="submit" disabled={regLoading}>
              {regLoading ? "Бүртгэж байна…" : "Бүртгүүлэх"}
            </button>
            <GoogleOAuthButton variant="signup" onClick={startGoogleOAuth} />
            {oauthHint && (signupMode || initialSignup) ? (
              <p className={styles.oauthHint}>{oauthHint}</p>
            ) : null}
          </form>
        </div>

        <div className={`${styles.formContainer} ${styles.signInContainer}`}>
          <form className={styles.formInner} onSubmit={onLoginSubmit} noValidate>
            {role ? <input type="hidden" name="role" value={role} /> : null}
            <h1>Нэвтрэх</h1>
            <span className={styles.sub}>Өөрийн бүртгэлээр нэвтрэх</span>
            {roleIntentBlock ? (
              <div ref={roleBlockRef} className={styles.roleIntentCallout} role="alert">
                <p className={styles.roleIntentCalloutTitle}>Данс энэ төрөлтэй таарахгүй</p>
                <p className={styles.roleIntentCalloutBody}>{roleIntentBlock.detail}</p>
                <div className={styles.roleIntentActions}>
                  <Link className={styles.roleIntentPrimary} href={`/register?role=${roleIntentBlock.intent}`}>
                    {roleIntentBlock.intent === "company" ? "Company бүртгэл" : "Freelancer бүртгэл"}
                  </Link>
                  <Link className={styles.roleIntentSecondary} href="/login">
                    Төрөлгүй нэвтрэх
                  </Link>
                </div>
              </div>
            ) : null}
            <input className={styles.field} id="login-email" name="login-email" type="email" placeholder="И-мэйл" required autoComplete="email" />
            <input
              className={styles.field}
              id="login-password"
              name="login-password"
              type="password"
              placeholder="Нууц үг"
              required
              autoComplete="current-password"
            />
            <Link className={styles.linkForgot} href="/forgot-password">
              Нууц үг мартсан уу?
            </Link>
            {loginError ? <p className={styles.errorMsg}>{loginError}</p> : null}
            <button className={styles.btnSolid} type="submit" disabled={loginLoading}>
              {loginLoading ? "Нэвтэрч байна…" : "Нэвтрэх"}
            </button>
            <GoogleOAuthButton variant="signin" onClick={startGoogleOAuth} />
            {oauthHint && !signupMode && !initialSignup ? (
              <p className={styles.oauthHint}>{oauthHint}</p>
            ) : null}
            {demoUsers.length > 0 ? (
              <div className={styles.demoBox}>
                <span className={styles.demoTitle}>Demo</span>
                <select
                  className={styles.demoSelect}
                  disabled={loginLoading || demoLoading}
                  onChange={(e) => setDemoSelected(Number(e.target.value))}
                  value={demoSelected ?? ""}
                >
                  {demoUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.role})
                    </option>
                  ))}
                </select>
                <button
                  className={styles.demoBtn}
                  type="button"
                  disabled={loginLoading || demoLoading || !demoSelected}
                  onClick={handleDemoLogin}
                >
                  {demoLoading ? "Ачаалж байна…" : "Demo-оор нэвтрэх"}
                </button>
              </div>
            ) : null}
          </form>
        </div>

        <div className={styles.overlayContainer}>
          <div className={styles.overlay}>
            <div className={`${styles.overlayPanel} ${styles.overlayLeft}`}>
              <Image 
                src="/c-work-logo.svg" 
                alt="C-Work logo" 
                width={60} 
                height={60}
                className={styles.overlayLogo}
              />
              <h1>Дахин тавтай морил!</h1>
              <p>Өмнөх бүртгэлээрээ нэвтэрч, төслөө үргэлжлүүлээрэй.</p>
              <button type="button" className={styles.ghost} onClick={() => setSignupMode(false)}>
                Нэвтрэх
              </button>
            </div>
            <div className={`${styles.overlayPanel} ${styles.overlayRight}`}>
              <Image 
                src="/c-work-logo.svg" 
                alt="C-Work logo" 
                width={60} 
                height={60}
                className={styles.overlayLogo}
              />
              <h1>Сайн байна уу!</h1>
              <p>Шинэ бүртгэл үүсгээд C-Work дээр ажил, freelancer-уудыг олно уу.</p>
              <button type="button" className={styles.ghost} onClick={() => setSignupMode(true)}>
                Бүртгүүлэх
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

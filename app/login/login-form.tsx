"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./login.module.css";

function safeInternalNext(raw: string | undefined): string | null {
  if (!raw || typeof raw !== "string") {
    return null;
  }
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.includes("://")) {
    return null;
  }
  return t;
}

type Props = {
  role?: string;
  next?: string;
};

type DemoUser = {
  id: number;
  fullName: string;
  email: string;
  role: string;
};

export function LoginForm({ role, next }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [demoSelected, setDemoSelected] = useState<number | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = (await res.json()) as { ok?: boolean; error?: string; role?: string };

      if (!res.ok || !json.ok) {
        setError(json.error ?? "Нэвтрэх үед алдаа гарлаа.");
        return;
      }

      const wantsCompany = role === "company";
      const isCompanyAccount = json.role === "company" || json.role === "admin";
      if (wantsCompany && !isCompanyAccount) {
        router.push("/jobs?loginRoleMismatch=company");
        router.refresh();
        return;
      }

      const wantsFreelancer = role === "freelancer";
      const isFreelancerAccount = json.role === "freelancer" || json.role === "admin";
      if (wantsFreelancer && !isFreelancerAccount) {
        router.push("/jobs?loginRoleMismatch=freelancer");
        router.refresh();
        return;
      }

      const nextPath = safeInternalNext(next);
      if (nextPath) {
        router.push(nextPath);
        router.refresh();
        return;
      }

      if (json.role === "company") {
        router.push("/jobs?post=1");
      } else if (json.role === "freelancer") {
        router.push("/freelancers?publish=1");
      } else {
        router.push("/jobs");
      }
      router.refresh();
    } catch {
      setError("Сервертэй холбогдоход алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    if (!demoSelected || loading || demoLoading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: demoSelected }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; role?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Demo нэвтрэх үед алдаа гарлаа.");
        return;
      }
      const nextPath = safeInternalNext(next);
      if (nextPath) {
        router.push(nextPath);
      } else if (json.role === "company") {
        router.push("/jobs");
      } else if (json.role === "freelancer") {
        router.push("/freelancers");
      } else {
        router.push("/jobs");
      }
      router.refresh();
    } catch {
      setError("Demo нэвтрэх үед сүлжээний алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {role ? <input type="hidden" name="role" value={role} /> : null}

      <label className={styles.field}>
        <span className={styles.fieldLabel}>И-мэйл</span>
        <input
          className={styles.fieldInput}
          type="email"
          name="email"
          placeholder="name@example.com"
          required
          autoComplete="email"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Нууц үг</span>
        <input
          className={styles.fieldInput}
          type="password"
          name="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </label>

      {error ? <p className={styles.errorMsg} role="alert">{error}</p> : null}

      <p style={{ margin: "0 0 12px", fontSize: "0.88rem" }}>
        <a href="/forgot-password" style={{ color: "#6d28d9", fontWeight: 600 }}>
          Нууц үг мартсан уу?
        </a>
      </p>

      <button className={styles.submitBtn} type="submit" disabled={loading}>
        {loading ? "Нэвтэрч байна…" : "Нэвтрэх"}
      </button>

      {demoUsers.length > 0 ? (
        <div className={styles.demoBox}>
          <span className={styles.demoTitle}>Demo account-оор нэвтрэх</span>
          <select
            className={styles.fieldInput}
            disabled={loading || demoLoading}
            onChange={(e) => setDemoSelected(Number(e.target.value))}
            value={demoSelected ?? ""}
          >
            {demoUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName} ({u.role}) - {u.email}
              </option>
            ))}
          </select>
          <button
            className={styles.demoBtn}
            disabled={loading || demoLoading || !demoSelected}
            onClick={handleDemoLogin}
            type="button"
          >
            {demoLoading ? "Demo жагсаалт ачаалж байна…" : "Сонгосон demo account-оор нэвтрэх"}
          </button>
        </div>
      ) : null}
    </form>
  );
}

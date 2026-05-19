"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!token) {
      setErr("Холбоос дутуу байна.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setErr(json.error ?? "Алдаа");
        return;
      }
      router.push("/profile");
    } catch {
      setErr("Сүлжээний алдаа.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ fontSize: "1.35rem", marginBottom: 8 }}>Шинэ нууц үг</h1>
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Шинэ нууц үг (6+)"
            style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" }}
          />
          {err ? <p style={{ color: "#b91c1c", margin: 0 }}>{err}</p> : null}
          <button disabled={loading} type="submit" style={{ padding: "10px 14px", fontWeight: 700 }}>
            {loading ? "Хадгалж байна…" : "Хадгалах"}
          </button>
        </form>
        <p style={{ marginTop: 16 }}>
          <Link href="/profile" style={{ color: "#6d28d9" }}>
            ← Профайл руу
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}>Ачаалж байна…</main>}>
      <ResetPasswordInner />
    </Suspense>
  );
}

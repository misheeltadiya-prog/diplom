"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; devResetUrl?: string };
      if (!res.ok) {
        setErr(json.error ?? "Алдаа");
        return;
      }
      setMsg(
        json.devResetUrl
          ? `Хөгжүүлэлтийн горим: нууц үг шинэчлэх холбоос — ${json.devResetUrl}`
          : "Хэрэв и-мэйл бүртгэлтэй бол заавар илгээгдэнэ (SMTP тохируулаагүй бол зөвхөн сервер лог).",
      );
    } catch {
      setErr("Сүлжээний алдаа.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ fontSize: "1.35rem", marginBottom: 8 }}>Нууц үг сэргээх</h1>
        <p style={{ color: "#5c5566", fontSize: "0.92rem", marginBottom: 20 }}>
          Бүртгэлтэй и-мэйл хаягаа оруулна уу.
        </p>
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" }}
          />
          {err ? <p style={{ color: "#b91c1c", margin: 0 }}>{err}</p> : null}
          {msg ? <p style={{ color: "#15803d", margin: 0, fontSize: "0.85rem" }}>{msg}</p> : null}
          <button disabled={loading} type="submit" style={{ padding: "10px 14px", fontWeight: 700 }}>
            {loading ? "Илгээж байна…" : "Илгээх"}
          </button>
        </form>
        <p style={{ marginTop: 16 }}>
          <Link href="/login" style={{ color: "#6d28d9" }}>
            ← Нэвтрэх
          </Link>
        </p>
      </div>
    </main>
  );
}

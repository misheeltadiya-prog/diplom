"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("err");
      setMessage("Token байхгүй.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (cancelled) return;
        if (res.ok && json.ok) {
          setStatus("ok");
          setMessage("И-мэйл амжилттай баталгаажлаа.");
        } else {
          setStatus("err");
          setMessage(json.error ?? "Алдаа");
        }
      } catch {
        if (!cancelled) {
          setStatus("err");
          setMessage("Сүлжээний алдаа.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <h1 style={{ fontSize: "1.35rem", marginBottom: 12 }}>И-мэйл баталгаажуулалт</h1>
        <p style={{ color: status === "ok" ? "#15803d" : "#5c5566" }}>{message || "Түр хүлээнэ үү…"}</p>
        <p style={{ marginTop: 20 }}>
          <Link href="/freelancers" style={{ color: "#6d28d9", fontWeight: 700 }}>
            Freelancers руу
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}>Ачаалж байна…</main>}>
      <VerifyEmailInner />
    </Suspense>
  );
}

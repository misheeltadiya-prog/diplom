"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ minHeight: "50vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", marginBottom: 8 }}>Алдаа гарлаа</h1>
        <p style={{ color: "#5c5566", marginBottom: 16 }}>{error.message || "Тодорхойгүй алдаа."}</p>
        <button onClick={() => reset()} type="button" style={{ marginRight: 12, padding: "8px 16px" }}>
          Дахин оролдох
        </button>
        <Link href="/" style={{ color: "#6d28d9", fontWeight: 700 }}>
          Нүүр
        </Link>
      </div>
    </div>
  );
}

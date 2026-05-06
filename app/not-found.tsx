import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
      <div>
        <h1 style={{ fontSize: "2rem", marginBottom: 8 }}>404</h1>
        <p style={{ color: "#5c5566", marginBottom: 20 }}>Хуудас олдсонгүй.</p>
        <Link href="/" style={{ color: "#6d28d9", fontWeight: 700 }}>
          Нүүр хуудас
        </Link>
      </div>
    </div>
  );
}
